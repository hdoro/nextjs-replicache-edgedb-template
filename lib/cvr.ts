import type { ReplicacheObject } from "@/dbschema/interfaces";
import type {
  ClientViewRecord,
  ReplicacheId,
  RowVersion,
} from "./replicache.types";

export const DEFAULT_CVR: ClientViewRecord = {};
export const DEFAULT_CVR_VERSION = 0;

export function build_CVR(
  objects_metadata: Pick<
    ReplicacheObject,
    "replicache_id" | "replicache_version"
  >[],
): ClientViewRecord {
  const r: ClientViewRecord = {};
  for (const row of objects_metadata) {
    r[row.replicache_id as ReplicacheId] = (row.replicache_version ??
      0) as RowVersion;
  }
  return r;
}

export type CVRDiff = {
  puts: ReplicacheId[];
  dels: ReplicacheId[];
};

export function diff_CVR(
  prev: ClientViewRecord,
  next: ClientViewRecord,
): CVRDiff {
  return {
    // To *put* into the client:
    puts: Object.keys(next).filter(
      (id) =>
        // New ones not in prev
        prev[id as ReplicacheId] === undefined ||
        // And those with newer row versions
        (prev[id as ReplicacheId] ?? 0) < (next[id as ReplicacheId] ?? 0),
    ) as ReplicacheId[],

    // To *delete* from the client: those that are not in the next CVR (deleted or access policies changed)
    dels: Object.keys(prev).filter(
      (id) => next[id as ReplicacheId] === undefined,
    ) as ReplicacheId[],
  };
}

export function is_empty_CVR_diff(diff: CVRDiff): boolean {
  return diff.puts.length === 0 && diff.dels.length === 0;
}
