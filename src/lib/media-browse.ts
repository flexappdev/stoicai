// Server-side media listing for /images, /audio, /videos.
// Lists com27/stoicai/<kind>/ via authenticated ListObjectsV2 (the bucket
// policy public-read for the prefix isn't required for owner-side listing).
// Cross-references item_id with WISDOM data to pull text + author + ref.

import { listPrefix, type S3Listing } from "./s3";
import { WISDOM, type Wisdom } from "./wisdom-data";

export type MediaKind = "images" | "audio" | "videos";

export interface MediaEntry {
  kind: MediaKind;
  item_id: string;
  url: string;
  bytes: number;
  modified: string;
  wisdom: Wisdom | null;
}

const WISDOM_BY_ID = new Map(WISDOM.map((w) => [w.id, w]));

export async function listMedia(kind: MediaKind, max = 100): Promise<MediaEntry[]> {
  try {
    const items: S3Listing[] = await listPrefix(`${kind}/`, max);
    return items
      .filter((i) => i.bytes > 0) // hide zero-byte folder markers
      .map((i) => ({
        kind,
        item_id: i.item_id,
        url: i.url,
        bytes: i.bytes,
        modified: i.modified,
        wisdom: WISDOM_BY_ID.get(i.item_id) ?? null,
      }))
      .sort((a, b) => (b.modified > a.modified ? 1 : -1));
  } catch {
    return [];
  }
}

export function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
