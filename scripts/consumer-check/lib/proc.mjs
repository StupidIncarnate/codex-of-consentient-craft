/**
 * Promise-wrapped `child_process.spawn`, shared by every phase that shells out (npm pack, npm
 * install, `dungeonmaster init`, the consumer's own build/typecheck/lint/test/ward). Captures
 * stdout/stderr as text and resolves with the exit code rather than rejecting on a non-zero one —
 * callers decide what a failing exit code MEANS (some assertions expect one), so throwing here
 * would force every caller into a try/catch just to read the code back out.
 */

import { spawn } from 'node:child_process';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export const run = ({ command, args = [], cwd, env, timeoutMs = DEFAULT_TIMEOUT_MS, input }) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ?? process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        code: code ?? -1,
        signal,
        stdout,
        stderr,
        timedOut,
        command: [command, ...args].join(' '),
      });
    });

    if (input !== undefined) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });

// Spawns a long-lived process (the MCP server) and hands the caller send()/close() rather than a
// single resolved result — `run` above is for a process that exits on its own.
export const spawnLongLived = ({ command, args = [], cwd, env }) => {
  const child = spawn(command, args, {
    cwd,
    env: env ?? process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stdoutBuffer = '';
  const stderrChunks = [];
  const pendingLineWaiters = [];

  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    let newlineIndex = stdoutBuffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = stdoutBuffer.slice(0, newlineIndex);
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
      const waiter = pendingLineWaiters.shift();
      if (waiter && line.trim().length > 0) {
        waiter.resolve(line);
      } else if (line.trim().length > 0) {
        // No waiter yet — stash is not needed for this suite's request/response pattern, since
        // every request is followed immediately by awaiting its one response line.
      }
      newlineIndex = stdoutBuffer.indexOf('\n');
    }
  });
  child.stderr.on('data', (chunk) => {
    stderrChunks.push(chunk.toString());
  });

  return {
    sendRequest: ({ request, timeoutMs = 15_000 }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`MCP server did not respond within ${String(timeoutMs)}ms`));
        }, timeoutMs);
        pendingLineWaiters.push({
          resolve: (line) => {
            clearTimeout(timer);
            try {
              resolve(JSON.parse(line));
            } catch (error) {
              reject(new Error(`Could not parse MCP response line: ${line} (${String(error)})`));
            }
          },
        });
        child.stdin.write(`${JSON.stringify(request)}\n`);
      }),
    // A JSON-RPC notification carries no `id` and gets no response line — `initialized` is the one
    // an MCP client sends right after `initialize` resolves, before its first real request.
    sendNotification: ({ notification }) => {
      child.stdin.write(`${JSON.stringify(notification)}\n`);
    },
    readStderr: () => stderrChunks.join(''),
    close: () => {
      child.kill('SIGKILL');
    },
  };
};
