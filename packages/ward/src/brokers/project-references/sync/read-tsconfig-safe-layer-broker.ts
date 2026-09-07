/**
 * PURPOSE: Reads a tsconfig.json on behalf of a caller that may go on to WRITE it. Reach for this
 * over a plain read whenever the answer decides a write: a file that is absent and a file that is
 * present but unreadable call for opposite actions, and a reader that cannot tell them apart
 * overwrites a config it never understood.
 *
 * USAGE:
 * readTsconfigSafeLayerBroker({ tsconfigPath: filePathContract.parse('/repo/tsconfig.json') });
 * // { status: 'parsed', data }  — read, and the contract accepted it
 * // { status: 'unparseable' }   — JSONC comments, malformed JSON, or a shape the contract rejects
 * // { status: 'missing' }       — could not be read at all
 */

import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

import {
  tsconfigJsonWritableContract,
  type TsconfigJsonWritable,
} from '../../../contracts/tsconfig-json-writable/tsconfig-json-writable-contract';
import { fsReadJsonSyncAdapter } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter';

export const readTsconfigSafeLayerBroker = ({
  tsconfigPath,
}: {
  tsconfigPath: FilePath;
}):
  | { status: 'parsed'; data: TsconfigJsonWritable }
  | { status: 'unparseable' }
  | { status: 'missing' } => {
  try {
    const raw = fsReadJsonSyncAdapter({ filePath: filePathContract.parse(String(tsconfigPath)) });
    const parsed = tsconfigJsonWritableContract.safeParse(raw);

    return parsed.success ? { status: 'parsed', data: parsed.data } : { status: 'unparseable' };
  } catch (error) {
    // `JSON.parse` is the only thing on this path that throws SyntaxError, so that error IS the
    // JSONC case — and JSONC is what `tsc --init` writes, which makes it the common one rather
    // than the exotic one. Every other read failure reports as missing, which refuses the write
    // just as firmly; the two differ only in whether the caller says anything out loud.
    return error instanceof SyntaxError ? { status: 'unparseable' } : { status: 'missing' };
  }
};
