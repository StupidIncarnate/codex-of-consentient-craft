/**
 * PURPOSE: A complete, real value matching what `spawnStreamJson` hands back — a real `ChildProcess`
 * (via `#gateway/node/child_process`'s own `ChildProcessStub`, built without spawning a real
 * process) plus its non-null `stdout`, so a caller staging this subpath's real return shape never
 * hand-types or casts a fake process.
 *
 * USAGE:
 * const { process, stdout } = SpawnStreamJsonResultStub();
 * stdout.push(Buffer.from('{"type":"assistant"}\n'));
 */
import { ChildProcessStub } from '#gateway/node/child_process/child-process/child-process.stub';

import type { spawnStreamJson } from './spawn-stream-json';

export const SpawnStreamJsonResultStub = (): ReturnType<typeof spawnStreamJson> => {
  const child = ChildProcessStub();
  const { stdout } = child;

  if (stdout === null) {
    throw new Error('SpawnStreamJsonResultStub: ChildProcessStub produced no stdout');
  }

  return { process: child, stdout };
};
