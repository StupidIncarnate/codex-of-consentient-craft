/**
 * PURPOSE: Appends a batch of `BufferEntry` lines — one flush's worth of console, network or
 * websocket activity — to the matching per-instance buffer file as a SINGLE `fsAppendFileAdapter`
 * call, one JSON line per entry. Writes nothing and still answers success for an empty array, since a
 * step with no console/network/websocket activity is the common case and must not cost a write
 * (chunk-03-read-path-and-perception.md §3.A). Reach for this over `runTranscriptAppendBroker` when
 * the caller holds a WINDOW of buffer entries rather than one step's own `StepReading` — the
 * transcript broker appends exactly one reading per call, this one appends zero or more.
 *
 * USAGE:
 * await bufferAppendBroker({
 *   bufferPath: AbsoluteFilePathStub({ value: '/repo/.siegelense/.../console.jsonl' }),
 *   entries: [BufferEntryStub(), BufferEntryStub()],
 * });
 * // Appends two newline-terminated JSON lines in one write, then returns { success: true }
 */

import { adapterResultContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import type { BufferEntry } from '../../../contracts/buffer-entry/buffer-entry-contract';

export const bufferAppendBroker = async ({
  bufferPath,
  entries,
}: {
  bufferPath: AbsoluteFilePath;
  entries: readonly BufferEntry[];
}): Promise<AdapterResult> => {
  if (entries.length === 0) {
    return adapterResultContract.parse({ success: true });
  }

  const contents = entries.map((entry) => `${JSON.stringify(entry)}\n`).join('');

  return fsAppendFileAdapter({
    filePath: bufferPath,
    contents: fileContentsContract.parse(contents),
  });
};
