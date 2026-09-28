/**
 * Promise-wrapped `child_process.spawn`, shared by every phase that shells out (npm pack, npm
 * install, `dungeonmaster init`, the consumer's own build/typecheck/lint/test/ward). Captures
 * stdout/stderr as text and resolves with the exit code rather than rejecting on a non-zero one —
 * callers decide what a failing exit code MEANS (some assertions expect one), so throwing here
 * would force every caller into a try/catch just to read the code back out.
 */

import { spawn } from 'node:child_process';
import { delimiter, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

const CHECKOUT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BIN_SUFFIX = join('node_modules', '.bin');

// `npm run check:consumer` prepends `<dir>/node_modules/.bin` for this checkout and every directory
// above it, and a consumer process inherits that PATH. Ward resolves `jest`, `eslint` and `tsc` from
// the PACKAGE's own `node_modules/.bin` and falls back to a bare name on PATH, and a consumer
// package has no `.bin` of its own, so left in, the bare name finds THIS checkout's jest, eslint and
// tsc and grades the consumer with them. This checkout's jest is older than the consumer's, and its
// `toStrictEqual` rejects a `response.json()` object for its Node-realm constructor — T03's
// contract-check probe fails under ward while the same file passes under the consumer's own jest.
const isCheckoutBinDir = (entry) => {
  const resolved = resolve(entry);
  if (!resolved.endsWith(`${sep}${BIN_SUFFIX}`)) {
    return false;
  }
  const owner = resolved.slice(0, -(BIN_SUFFIX.length + 1));
  return CHECKOUT_ROOT === owner || CHECKOUT_ROOT.startsWith(`${owner}${sep}`);
};

export const pathWithoutCheckoutBins = (pathValue = '') =>
  pathValue
    .split(delimiter)
    .filter((entry) => entry.length > 0 && !isCheckoutBinDir(entry))
    .join(delimiter);

export const hermeticEnv = { ...process.env, PATH: pathWithoutCheckoutBins(process.env.PATH) };

// What `npm run <script>` inside the consumer hands its script: the consumer's own `.bin` first.
export const consumerEnv = ({ consumerRoot }) => ({
  ...hermeticEnv,
  PATH: [join(consumerRoot, BIN_SUFFIX), hermeticEnv.PATH].join(delimiter),
});

export const run = ({ command, args = [], cwd, env, timeoutMs = DEFAULT_TIMEOUT_MS, input }) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ?? hermeticEnv,
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
    env: env ?? hermeticEnv,
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
