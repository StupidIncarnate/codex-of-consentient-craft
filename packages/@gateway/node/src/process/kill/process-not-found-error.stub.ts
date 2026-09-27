/**
 * PURPOSE: A real ESRCH error, captured from an actual `process.kill` call against a pid that is
 * guaranteed not to exist — spawns a real, trivial child process, waits for it to exit (reaping
 * its pid), then signals that now-dead pid for real, so the fields on the resulting error always
 * match whatever Node/OS is actually installed.
 *
 * USAGE:
 * const error = await ProcessNotFoundErrorStub();
 * // Returns a real NodeJS.ErrnoException: { code: 'ESRCH', syscall: 'kill' }
 */
import { spawn } from 'child_process';

export const ProcessNotFoundErrorStub = async (): Promise<NodeJS.ErrnoException> => {
  const child = spawn(process.execPath, ['-e', '']);
  const deadPid = child.pid;

  if (deadPid === undefined) {
    throw new Error('ProcessNotFoundErrorStub: spawned child never received a pid');
  }

  await new Promise<void>((resolve) => {
    child.once('exit', () => {
      resolve();
    });
  });

  try {
    process.kill(deadPid, 0);
  } catch (error) {
    return error as NodeJS.ErrnoException;
  }

  throw new Error(`ProcessNotFoundErrorStub: pid ${deadPid} is still alive`);
};
