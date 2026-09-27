/**
 * PURPOSE: A real `ChildProcess` instance, built without spawning a real process, for code that
 * receives a `ChildProcess` and needs to write to `stdin` or read from `stdout`/`stderr` with no
 * live subprocess behind it. `new ChildProcess()` leaves those three streams `null` until a real
 * spawn wires them up, so this attaches real `PassThrough` streams (Node's own `stream` module —
 * the gateway may import a Node builtin unwrapped, since it IS the wrapper) in their place, so a
 * caller can write/read against them exactly as it would against a spawned process's own streams.
 * Built THROUGH `childProcessSchema.parse` (BR C9): a stub for a type with a schema returns the
 * branded value, so a test can hand this straight to a contract field typed through that schema
 * with no separate parse step, and a partial fake (`{pid: 5}`) fails to compile instead of slipping
 * past a bare `z.custom<ChildProcess>()`.
 *
 * USAGE:
 * const child = ChildProcessStub();
 * child.stdout?.on('data', (chunk) => { ... });
 * child.stdin?.write('input');
 * // Returns a real ChildProcess (branded '#GatewayChildProcess') with working
 * // stdout/stderr/stdin PassThrough streams
 */
import { ChildProcess } from 'child_process';
import { PassThrough } from 'stream';
import { childProcessSchema } from './child-process-schema';

export const ChildProcessStub = (): ReturnType<typeof childProcessSchema.parse> => {
  const child = new ChildProcess();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = new PassThrough();
  return childProcessSchema.parse(child);
};
