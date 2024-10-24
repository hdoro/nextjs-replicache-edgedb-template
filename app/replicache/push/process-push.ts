import { client as edgedb_client } from '@/lib/edgedb'
import {
  create_client_group_mutation,
  modify_clients_mutation,
} from '@/lib/edgedb.mutations'
import { fetch_client_group_query } from '@/lib/edgedb.queries'
import { Mutation } from '@/lib/mutation.types'
import { MUTATORS_DB } from '@/lib/mutators.db'
import {
  DEFAULT_LAST_MUTATION_ID,
  type ClientPushInfo,
  type CustomPushRequest,
} from '@/lib/replicache.types'
import type { PushResponse } from 'replicache'
import { z } from 'zod'

export async function process_push({
  clientGroupID: client_group_id,
  mutations,
}: z.infer<typeof CustomPushRequest>): Promise<
  PushResponse | { success: true }
> {
  const clientWithGlobals = edgedb_client.withGlobals({
    current_group_id: client_group_id,
  })

  await clientWithGlobals.transaction(async (tx) => {
    /** #1 fetch the client group */
    const client_group = await fetch_client_group_query.run(tx, {
      client_group_id,
    })

    /** #2 create the group in the DB if it doesn't yet exist */
    if (!client_group.in_db) {
      console.debug('[process-push] creating client group', {
        client_group_id: client_group.client_group_id,
      })
      await create_client_group_mutation.run(tx, {
        client_group_id: client_group.client_group_id,
      })
    }

    /** #3 parse all clients and their last mutation ids, divided by whether they are new or already in the db */
    const clients_with_last_mutation_ids = parse_clients({
      mutations,
      client_group,
    })

    const all_clients = [
      ...clients_with_last_mutation_ids.new,
      ...clients_with_last_mutation_ids.in_db,
    ]

    /** #5 process & perform mutations */
    for (const [index, rawMutation] of mutations.entries()) {
      const client = all_clients.find(
        (c) => c.client_id === rawMutation.clientID,
      )
      if (!client) continue

      const parsedMutation = Mutation.safeParse(rawMutation)

      /** #5.1 Skip invalid mutations
       * Even if the mutation is invalid, we treat it as completed
       * to avoid the client from retrying it indefinitely.
       * See: https://doc.replicache.dev/reference/server-push#error-handling
       */
      if (!parsedMutation.success) {
        console.debug(
          `[process-push] mutation ${rawMutation.id} has incorrect schema`,
          {
            rawMutation,
            error: JSON.stringify(parsedMutation.error.issues, null, 2),
          },
        )
        return
      }

      const mutation = parsedMutation.data

      const last_mutation_id_in_db = client.last_mutation_id_in_db ?? -1
      // How many mutations from the same client have been processed before this one
      const mutation_index_in_same_client = mutations
        .slice(0, index)
        .filter((m) => m.clientID === client.client_id).length
      const last_mutation_id_for_mutation =
        last_mutation_id_in_db + mutation_index_in_same_client
      const next_mutation_id = last_mutation_id_for_mutation + 1

      /** #5.2 Skip already processed mutations */
      if (mutation.id < next_mutation_id) {
        console.debug(
          `[process-push] mutation ${mutation.id} has already been processed - skipping`,
          {
            mutation,
            client,
            last_mutation_id_in_db,
            next_mutation_id,
            index,
            mutation_index_in_same_client,
          },
        )
        continue
      }

      /** #5.3 Rollback and error if from future */
      if (mutation.id > next_mutation_id) {
        throw new Error(
          `[process-push] mutation ${mutation.id} is from the future - aborting. Next mutation id is ${next_mutation_id}`,
        )
      }

      const handler = MUTATORS_DB[mutation.name]
      /** #5.4 If no handler for the mutation, rollback and error
       * It's an implementation error: a known schema (it's passed the zod parsing), but the handler is missing.
       * Better to crash and have the developer fix it, than to silently skip the mutation.
       */
      if (!handler) {
        throw new Error(
          `[process-push] skipping unknown mutation "${mutation.name}". Add a handler for it in MUTATION_HANDLERS if you want to process it.`,
        )
      }

      console.debug(
        `[process-push] performing "${mutation.name}" mutation`,
        mutation,
      )
      await handler({
        tx,
        client_group,
        client,
        // @ts-expect-error Too complex to typecheck - zod's already done the runtime work
        mutation,
      })
    }

    /** #6 update the clients' `last_mutation_id`s in the db to the latest corresponding mutation ids in the request
     * - Clients not yet in the DB will be created
     * - If the transaction fails, `last_mutation_id`s will be rolled back to their previous values
     */
    await modify_clients_mutation.run(tx, {
      client_group_id,
      ...clients_with_last_mutation_ids,
    })
  })

  return {
    success: true,
  }
}

function parse_clients({
  mutations,
  client_group,
}: {
  mutations: z.infer<typeof CustomPushRequest>['mutations']
  client_group: Awaited<ReturnType<typeof fetch_client_group_query.run>>
}) {
  const clients_with_ids = {
    new: [] as ClientPushInfo[],
    in_db: [] as ClientPushInfo[],
  }

  for (const mutation of mutations) {
    const client_in_db = client_group.clients.find(
      (c) => c.client_id === mutation.clientID,
    )

    if (!client_in_db) {
      const existing = clients_with_ids.new.find(
        (c) => c.client_id === mutation.clientID,
      )
      if (!existing) {
        // For clients that don't yet exist in the DB, create a default
        clients_with_ids.new.push({
          client_id: mutation.clientID,
          last_mutation_id_in_request: mutation.id,
          last_mutation_id_in_db: DEFAULT_LAST_MUTATION_ID,
        })
      } else {
        existing.last_mutation_id_in_request = Math.max(
          existing.last_mutation_id_in_request,
          mutation.id,
        )
      }

      continue
    }

    const existing = clients_with_ids.in_db.find(
      (c) => c.client_id === mutation.clientID,
    )
    if (!existing) {
      clients_with_ids.in_db.push({
        client_id: mutation.clientID,
        last_mutation_id_in_request: mutation.id,
        last_mutation_id_in_db: client_in_db.last_mutation_id,
      })
    } else {
      existing.last_mutation_id_in_request = Math.max(
        existing.last_mutation_id_in_request,
        mutation.id,
      )
    }
  }

  return clients_with_ids
}
