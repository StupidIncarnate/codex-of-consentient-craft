/**
 * PURPOSE: Appends a batch of `BufferEntry` lines — one flush's worth of console, network or
 * websocket activity — to the matching per-instance buffer file as a SINGLE `appendFile` call, one
 * JSON line per entry. Writes nothing for an empty array, since a step with no console/network/
 * websocket activity is the common case and must not cost a write
 * (chunk-03-read-path-and-perception.md §3.A). Reach for this over `runTranscriptAppendBroker` when
 * the caller holds a WINDOW of buffer entries rather than one step's own `StepReading` — the
 * transcript broker appends exactly one reading per call, this one appends zero or more.
 *
 * USAGE:
 * await bufferAppendBroker({
 *   bufferPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/.../console.jsonl' }),
 *   entries: [BufferEntryStub(), BufferEntryStub()],
 * });
 * // Appends two newline-terminated JSON lines in one write
 */

import { appendFile } from '#gateway/node/fs__promises';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { BufferEntry } from '../../../contracts/buffer-entry/buffer-entry-contract';

export const bufferAppendBroker = async ({
  bufferPath,
  entries,
}: {
  bufferPath: AbsoluteFilePath;
  entries: readonly BufferEntry[];
}): Promise<void> => {
  if (entries.length === 0) {
    return;
  }

  const contents = entries.map((entry) => `${JSON.stringify(entry)}\n`).join('');

  await appendFile(bufferPath, contents);
};
