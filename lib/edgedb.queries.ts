import e from '@/dbschema/edgeql'
import type { $str } from '@/dbschema/edgeql/modules/std'
import type { $expr_Param } from '@/dbschema/edgeql/params'
import type { scalarTypeWithConstructor } from '@/dbschema/edgeql/reflection'

function select_client_group(
  client_group_id: $expr_Param<
    'client_group_id',
    scalarTypeWithConstructor<$str, never>,
    false
  >,
  include_cvr = false,
) {
  const stored_client_group = e.select(e.ReplicacheClientGroup, (rg) => ({
    filter_single: e.op(rg.client_group_id, '=', client_group_id),

    client_group_id: true,
    client_view_record: include_cvr,
    cvr_version: true,
    in_db: e.bool(true),
  }))

  // In case the client group doesn't exist, create a default with current timestamp and no clients
  const base_select = {
    client_group_id: e.op(
      stored_client_group.client_group_id,
      '??',
      client_group_id,
    ),
    cvr_version: e.op(stored_client_group.cvr_version, '??', e.int64(0)),
    clients: e.select(e.ReplicacheClient, (c) => ({
      filter: e.op(c.client_group, '=', stored_client_group),

      client_id: true,
      last_mutation_id: true,
    })),
    in_db: e.op(stored_client_group.in_db, '??', e.bool(false)),
  } as const

  const cvr_select = {
    client_view_record: e.op(
      stored_client_group.client_view_record,
      '??',
      e.json({}),
    ),
  } as const
  const client_group = e.select({
    ...base_select,
    ...(include_cvr ? cvr_select : ({} as typeof cvr_select)),
  })

  return client_group
}

export const fetch_client_group_query = e.params(
  {
    client_group_id: e.str,
  },
  (params) => {
    return select_client_group(params.client_group_id, false)
  },
)

export const pull_metadata_query = e.params(
  {
    client_group_id: e.str,
  },
  (params) => {
    const client_group = select_client_group(params.client_group_id, true)

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

      // For now just fetching all fields for TODOs
      // ...e.is(e.Todo, { ...e.Todo. }),
    }))
  },
)
