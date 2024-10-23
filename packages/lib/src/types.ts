import type { Todo } from '@repo/db/schema'

export const isTodo = (obj: object): obj is Todo => {
  return 'replicache_id' in obj && 'content' in obj && 'complete' in obj
}
