// The unit-test I/O trap. Loaded by jest.setup.js; a no-op for integration and e2e test files, which
// do real I/O by design.
//
// Every function of the trapped Node modules throws when called, unless:
//   - its first argument is a path inside node_modules (a package loading its own files), or
//   - it READS a fixture under a package's own `test/` directory, or
//   - it is a READ made by the TypeScript compiler itself, or
//   - the first repo frame on the call stack is test infrastructure (.test/.proxy/.stub/.harness, or
//     a file under `test/`) — that is how a proxy's data is recorded from the real thing.
// Implementation code reaching real I/O unstaged is what it catches.
//
// Three choices here each fixed a failure measured while building it:
//   - PLAIN functions, not jest.fn: jest.setup.js resets every mock before each test, which would
//     wipe a jest.fn trap after the first test and turn it into a silent `return undefined`.
//   - Every trapped call is RECORDED and the test fails in afterEach: code that catches every error
//     would otherwise swallow the thrown one and pass.
//   - `globalThis.__ioTrap(name)` is what the proxy-mock hoister spreads under its selectively mocked
//     functions, so a test file whose proxies mock `readFile` still has every other `fs/promises`
//     function trapped, not real.
//
// Jest keys built-in modules without the `node:` prefix, so mocking `fs` covers `node:fs` too.

const path = require('path');

const TRAPPED_MODULES = ['fs', 'fs/promises', 'child_process'];
const NODE_MODULES_SEGMENT = `${path.sep}node_modules${path.sep}`;
// A `/node_modules` segment, with or without a trailing separator: module resolution stats the
// directory itself while walking up the tree.
const NODE_MODULES_PATH = /[\\/]node_modules(?:[\\/]|$)/iu;
// A test/proxy/stub/harness file, or any file under a package's own `test/` directory.
const TEST_INFRASTRUCTURE_FRAME =
  /\.(test|proxy|stub|harness)\.[jt]sx?$|[\\/]packages[\\/][^\\/]+[\\/]test[\\/]/u;
// Reading a fixture under a package's `test/` directory is test infrastructure, whoever reads it —
// a real TypeScript compile over fixtures reads them from inside node_modules. Reads only: nothing
// may write into the checkout's fixtures.
const TEST_FIXTURE_PATH = /[\\/]packages[\\/][^\\/]+[\\/]test[\\/]/u;
const TYPESCRIPT_COMPILER_FRAME = /[\\/]node_modules[\\/]typescript[\\/]/u;
const READ_ONLY_FUNCTIONS = new Set([
  'access',
  'accessSync',
  'existsSync',
  'lstat',
  'lstatSync',
  'readFile',
  'readFileSync',
  'readdir',
  'readdirSync',
  'realpath',
  'realpathSync',
  'stat',
  'statSync',
]);
const REAL_IO_TEST_FILE = /\.(integration\.test|e2e)\.[jt]sx?$/u;

const testPath = String(expect.getState().testPath);

if (!REAL_IO_TEST_FILE.test(testPath)) {
  const hits = [];

  // The caller file names. Structured call sites, never `new Error().stack`: under jest that string
  // is built through source-map lookups, which made one real TypeScript compile take 1,864ms against
  // 285ms. `depth` is two-phase: the compiler check needs only the nearest frame and runs on nearly
  // every call of a compile, so it asks for 3; only the rarer test-infrastructure check pays for a
  // deep capture, deep enough to climb out of jest's require chain (Playwright reads
  // /etc/os-release while its own module loads, dozens of frames below the harness that required it).
  const callerFrames = (depth) => {
    const savedPrepare = Error.prepareStackTrace;
    const savedLimit = Error.stackTraceLimit;
    Error.prepareStackTrace = (_error, callSites) => callSites;
    Error.stackTraceLimit = depth;
    const holder = {};
    Error.captureStackTrace(holder, callerFrames);
    const callSites = holder.stack;
    Error.prepareStackTrace = savedPrepare;
    Error.stackTraceLimit = savedLimit;
    return callSites
      .map((site) => site.getFileName() || '')
      .filter((fileName) => !fileName.endsWith('jest.setup-io-trap.js'));
  };

  const trapObject = (label, real) => {
    const trapped = {};
    for (const key of Object.keys(real)) {
      const value = real[key];
      if (typeof value === 'function' && !/^[A-Z]/u.test(key)) {
        trapped[key] = function ioTrapped(...args) {
          const [first] = args;
          // Case-insensitive: TypeScript probes filesystem case-sensitivity by stat-ing its own
          // path upper-cased, which is still a package reading its own file.
          if (typeof first === 'string' && NODE_MODULES_PATH.test(first)) {
            return value.apply(real, args);
          }
          if (
            typeof first === 'string' &&
            TEST_FIXTURE_PATH.test(first) &&
            READ_ONLY_FUNCTIONS.has(key)
          ) {
            return value.apply(real, args);
          }
          // A real TypeScript compile runs fully real, like any DSL engine the testing standards
          // name: a type-level test compiles fixtures against the package's real source, so the
          // compiler must read it. Reads only, and only when the nearest caller is the compiler.
          if (
            READ_ONLY_FUNCTIONS.has(key) &&
            TYPESCRIPT_COMPILER_FRAME.test(callerFrames(3)[0] ?? '')
          ) {
            return value.apply(real, args);
          }
          const firstRepoFrame = callerFrames(400).find(
            (line) =>
              line.includes(`${path.sep}packages${path.sep}`) && !line.includes(NODE_MODULES_SEGMENT),
          );
          if (firstRepoFrame !== undefined && TEST_INFRASTRUCTURE_FRAME.test(firstRepoFrame)) {
            return value.apply(real, args);
          }
          const message = `[io-trap] unstaged ${label}.${key}(${JSON.stringify(first)})`;
          hits.push(message);
          throw new Error(message);
        };
      } else {
        trapped[key] = value;
      }
    }
    return trapped;
  };

  // Returns undefined for a module this trap does not cover, so the hoister's
  // `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` falls back to the real module and this file
  // stays the only place the trapped list lives.
  globalThis.__ioTrap = (name) => {
    if (!TRAPPED_MODULES.includes(name.replace(/^node:/u, ''))) {
      return undefined;
    }
    const real = jest.requireActual(name);
    const trapped = trapObject(name, real);
    if (real.promises) {
      trapped.promises = trapObject(`${name}.promises`, real.promises);
    }
    return trapped;
  };

  for (const name of TRAPPED_MODULES) {
    jest.mock(name, () => globalThis.__ioTrap(name));
  }

  afterEach(() => {
    const found = hits.splice(0);
    if (found.length > 0) {
      throw new Error(
        `Test did real I/O that nothing staged. Stage it through a proxy, or move the test to an ` +
          `integration test:\n  ${found.join('\n  ')}`,
      );
    }
  });
}
