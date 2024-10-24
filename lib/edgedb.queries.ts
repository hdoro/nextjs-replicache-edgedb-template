import e from '@/dbschema/edgeql'
import { DEFAULT_CVR_VERSION } from './cvr'
import { DEFAULT_LAST_MUTATION_ID } from './replicache.types'

export const fetch_client_and_group_query = e.params(
  {
    client_group_id: e.str,
    client_id: e.str,
  },
  (params) => {
    const stored_client_group = e.select(e.ReplicacheClientGroup, (rg) => ({
      filter_single: e.op(rg.client_group_id, '=', params.client_group_id),

      client_group_id: true,
      cvr_version: true,
      in_db: e.bool(true),
    }))

    // In case the client group doesn't exist, return a default
    const client_group = e.select({
      client_group_id: e.op(
        stored_client_group.client_group_id,
        '??',
        params.client_group_id,
      ),
      cvr_version: e.op(
        stored_client_group.cvr_version,
        '??',
        e.int64(DEFAULT_CVR_VERSION),
      ),
      in_db: e.op(stored_client_group.in_db, '??', e.bool(false)),
    })

    const stored_client = e.select(e.ReplicacheClient, (c) => ({
      filter_single: e.op(
        e.op(c.client_group, '=', stored_client_group),
        'and',
        e.op(c.client_id, '=', params.client_id),
      ),

      client_id: true,
      last_mutation_id: true,
      in_db: e.bool(true),
    }))

    // In case the client doesn't exist, return a default
    const client = e.select({
      client_id: e.op(stored_client.client_id, '??', params.client_id),
      last_mutation_id: e.op(
        stored_client.last_mutation_id,
        '??',
        e.int64(DEFAULT_LAST_MUTATION_ID),
      ),
      in_db: e.op(stored_client.in_db, '??', e.bool(false)),
    })

    return e.select({
      client_group,
      client,
    })
  },
)

export const pull_metadata_query = e.params(
  {
    client_group_id: e.str,
  },
  (params) => {
    const stored_client_group = e.select(e.ReplicacheClientGroup, (rg) => ({
      filter_single: e.op(rg.client_group_id, '=', params.client_group_id),

      client_group_id: true,
      client_view_record: true,
      cvr_version: true,
      in_db: e.bool(true),
    }))

    // In case the client group doesn't exist, return a default
    const client_group = e.select({
      client_group_id: e.op(
        stored_client_group.client_group_id,
        '??',
        params.client_group_id,
      ),
      cvr_version: e.op(stored_client_group.cvr_version, '??', e.int64(0)),
      clients: e.select(e.ReplicacheClient, (c) => ({
        filter: e.op(c.client_group, '=', stored_client_group),

        client_id: true,
        last_mutation_id: true,
      })),
      in_db: e.op(stored_client_group.in_db, '??', e.bool(false)),
      client_view_record: e.op(
        stored_client_group.client_view_record,
        '??',
        e.json({}),
      ),
    })

    // Due to access policies in EdgeDB, only those objects that are visible to the current user are returned
    const replicache_objects_metadata = e.select(e.ReplicacheObject, () => ({
      replicache_id: true,
      replicache_version: true,
    }))

    return e.select({
      client_group,
      replicache_objects_metadata,
    })
  },
)

type BaseReplicacheSelector = {
  replicache_id: true
  id: true
  replicache_version: true
  updated_at: true
  created_at: true
}

function remove_replicache_fields<T extends BaseReplicacheSelector>({
  replicache_id: _1,
  id: _2,
  replicache_version: _3,
  updated_at: _4,
  created_at: _5,
  ...object_specific_fields
}: T) {
  return object_specific_fields
}

export const pull_objects_query = e.params(
  {
    replicache_ids: e.array(e.str),
  },
  (params) => {
    return e.select(e.ReplicacheObject, (o) => ({
      filter: e.op(
        o.replicache_id,
        'in',
        e.array_unpack(params.replicache_ids),
      ),

      replicache_id: true,
      created_at: true,
      updated_at: true,

      // For now just fetching all fields for TODOs
      ...e.is(e.Todo, { ...remove_replicache_fields(e.Todo['*']) }),
    }))
  },
)
