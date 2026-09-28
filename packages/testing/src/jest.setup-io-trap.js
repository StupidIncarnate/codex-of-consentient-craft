// The unit-test I/O trap. Loaded by jest.setup.js; a no-op for integration and e2e test files, which
// do real I/O by design, and for a `packages/@gateway/*` package's OWN test files — a gateway
// wrapper's own test proves the wrapper against the real socket/process/module it wraps rather than
// staging one (its proxy headers say so directly: "Real TCP sockets against loopback, not
// registerMock"). This is safe for a gateway proxy that DOES stage a TRAPPED_MODULES function
// (`fs`/`fs/promises`/`child_process`, e.g. `read-file-if-exists.proxy.ts`'s `registerMock({fn:
// readFile})`): the ts-jest hoister writes that mock's OTHER, unstaged functions as
// `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` regardless of whether this file's own block
// below ever runs, so they fall back to the real module instead of losing coverage. Holds in a
// consumer repo too, whose `packages/@gateway/*` is copied source at the same path.
//
// Every trapped call throws when made, unless:
//   - its first argument is a path inside node_modules (a package loading its own files), or
//   - it READS a fixture under a package's own `test/` directory, or
//   - it is a READ made by the TypeScript compiler itself, or
//   - the first repo frame on the call stack is test infrastructure (.test/.proxy/.stub/.harness, or
//     a file under `test/`) — that is how a proxy's data is recorded from the real thing.
// Implementation code reaching real I/O unstaged is what it catches.
//
// Two DIFFERENT mechanisms cover it, because one of them cannot reach everything:
//   - `fs`, `fs/promises`, `child_process` (TRAPPED_MODULES) go through `jest.mock()`: a fresh
//     trapped module object, built new per test file, with the proxy-mock hoister able to layer a
//     selective `jest.fn()` on top for whatever one function a proxy stages (see
//     `globalThis.__ioTrap` below).
//   - `net`, `tls`, `dgram`, `dns`, `dns/promises`, `http2`, `worker_threads` and `process.kill`
//     (MUTATED_MODULES) instead mutate the REAL, shared module object's own properties in place.
//     `jest.mock()` cannot cover them: `msw/node`'s `setupServer()` — which every package's Jest
//     setup now constructs before any test file loads, since MSW loads everywhere — pulls in
//     `@mswjs/interceptors`, which statically imports `node:net` at ITS OWN module-evaluation time.
//     That MATERIALIZES 'net' under whatever `jest.mock()` factory is registered at that moment
//     (this file's, since it runs in `setupFiles`, before MSW's own `setupFilesAfterEnv` entry) —
//     chronologically before the test file's own hoisted, registerMock-driven `jest.mock('net', …)`
//     call ever gets to register. A second `jest.mock()` call cannot retroactively replace an
//     already-materialized module, so every registerMock-staged call on these modules would resolve
//     to the UNSTAGED trap instead of the test's own override, in every package that loads MSW.
//     Mutating the real object sidesteps the race: whoever requires it first — MSW's eager import,
//     or the test file's own lazy one — reads the SAME object, and this file's setupFiles run has
//     already installed the wrapper by the time anything requires it. `process.kill` needs the same
//     treatment for an unrelated reason: it is a global the VM injects into every module's scope
//     directly, never resolved through `require()`/`import`, so no `jest.mock()` can reach a bare
//     `process.kill(pid, signal)` call at all.
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
// See the file header: these go through direct mutation of the real, shared module object, never
// `jest.mock()`. `worker_threads` carries no module FUNCTION this repo calls today — only its
// `Worker` constructor, handled by its own branch below, since a constructor is neither lowercase
// nor a function key the generic per-module loop touches.
const MUTATED_MODULES = ['net', 'tls', 'dgram', 'dns', 'dns/promises', 'http2', 'worker_threads'];
const NODE_MODULES_SEGMENT = `${path.sep}node_modules${path.sep}`;
// A `/node_modules` segment, with or without a trailing separator: module resolution stats the
// directory itself while walking up the tree.
const NODE_MODULES_PATH = /[\\/]node_modules(?:[\\/]|$)/iu;
// A test/proxy/stub/harness file, any file under a package's own `test/` directory, or one of
// `@dungeonmaster/testing`'s own ts-jest AST-transformer glue files (`proxy-mock-transformer.js`,
// `harness-lifecycle-transformer.js`, `transformers.js`). Those glue files `require('tsx/cjs')` at
// their own top, which ts-jest invokes fresh on the first `getCacheKey()`/`resolveTransformers()`
// call after ANY edit to a shared jest setup file invalidates the disk cache for every `.ts` file
// in the repo — a real, first-party compile step, not application code reaching real I/O. Without
// this, that cold compile can land inside a DIFFERENT test's own `afterEach` window (whichever file
// happens to need a fresh compile first in a given worker) and this trap misreports it as that
// test's own unstaged call — observed as `net.createConnection` to tsx's IPC pipe and `new
// Worker(esbuild/lib/main.js)`, on a file with no real I/O of its own.
//
// The glue files call back INTO `@dungeonmaster/testing`'s own `src/middleware/**` (import path
// resolution, proxy-mock collection) before that cold compile happens, so the FIRST repo-owned
// frame `isCallFromTestInfrastructure` finds is often one of those, not the glue file itself —
// observed as `src/middleware/import-path-resolver/…` sitting between the `ts-jest/` glue and the
// `esbuild`/`tsx` frames on `@dungeonmaster/shared`'s contract tests, which import more sibling
// contracts (more proxy-mock collection) than most packages' own tests do. This package's own
// `src/` is the compiler-pipeline's implementation, same trust level as the `ts-jest/` glue above.
const TEST_INFRASTRUCTURE_FRAME =
  /\.(test|proxy|stub|harness)\.[jt]sx?$|[\\/]packages[\\/][^\\/]+[\\/]test[\\/]|[\\/]ts-jest[\\/]|[\\/]packages[\\/]testing[\\/]src[\\/]/u;
// The glue files' OWN `.ts` dependencies — the hoister's `middleware/`/`adapters/` implementation,
// which `proxy-mock-transformer.js` requires transitively through the `tsx/cjs` hook — carry none of
// TEST_INFRASTRUCTURE_FRAME's markers (no `/ts-jest/` segment, no `.test`/`.proxy` suffix), so a cold
// tsx compile of one of THOSE files is a repo frame the check above cannot recognize. It is still a
// first-party compile step, not application code: the call originates from INSIDE tsx/esbuild's own
// toolchain (`node_modules/tsx/…`, `node_modules/esbuild/…`), one or more `node_modules` frames above
// wherever the compiled `.ts` file's own top-level code happens to sit. Checked by walking frames
// nearest-first and asking "toolchain, or application repo code — whichever this call reaches first".
const COMPILER_TOOLCHAIN_FRAME = /[\\/]node_modules[\\/](tsx|ts-jest|esbuild)[\\/]/u;
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
// Functions of the newly trapped network modules that do NO I/O at all — no socket, no disk, no
// syscall, ever, regardless of caller or argument — so both trap mechanisms skip wrapping them
// entirely (the same treatment a class export already gets) rather than gating them behind
// READ_ONLY_FUNCTIONS' fixture-path/compiler-frame checks, which only make sense for a function
// whose first argument is a file path. Checked against this repo's installed `@types/node`, one
// module at a time: `net.isIP`, `isIPv4`, `isIPv6` and the four `AutoSelectFamily` getters/setters
// are pure computations over already-in-memory state; `tls.checkServerIdentity` and
// `createSecureContext` take certificate content already in memory (never a file path) and
// `getCiphers` returns a hardcoded list; `dns`/`dns/promises`'
// `getServers`/`setServers`/`getDefaultResultOrder`/`setDefaultResultOrder` read or write the
// resolver's in-memory config, never the network (`lookup`/`resolve*`/`reverse` do real DNS I/O and
// stay trapped); `http2`'s three `*Settings` functions pack/unpack a settings object with no
// connection involved. `net.isIPv6` matters in practice: `@mswjs/interceptors`'s ClientRequest
// interceptor (which `msw/node`'s `setupServer` always constructs) calls it from
// `MockSocket.mockConnect()` — see T02's DECISIONS for how that was found, alongside the module-
// materialization race the file header above describes.
const NO_IO_FUNCTIONS = new Set([
  'isIP',
  'isIPv4',
  'isIPv6',
  'getDefaultAutoSelectFamily',
  'setDefaultAutoSelectFamily',
  'getDefaultAutoSelectFamilyAttemptTimeout',
  'setDefaultAutoSelectFamilyAttemptTimeout',
  'checkServerIdentity',
  'createSecureContext',
  'getCiphers',
  'getServers',
  'setServers',
  'getDefaultResultOrder',
  'setDefaultResultOrder',
  'getDefaultSettings',
  'getPackedSettings',
  'getUnpackedSettings',
]);
const REAL_IO_TEST_FILE = /\.(integration\.test|e2e)\.[jt]sx?$/u;
// Any test file that sits inside one of the four gateway wrapper packages, in this repo or a
// consumer's copy of it — never widened to a bare `@gateway` segment, which would also swallow a
// path like `packages/foo/src/uses-at-gateway/…`.
const GATEWAY_OWN_TEST_FILE = /[\\/]packages[\\/]@gateway[\\/]/u;

const testPath = String(expect.getState().testPath);

if (!REAL_IO_TEST_FILE.test(testPath) && !GATEWAY_OWN_TEST_FILE.test(testPath)) {
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

  // Shared by every trap point below. Walks frames nearest-first and answers the first of two
  // questions the stack reaches: a `node_modules/tsx|ts-jest|esbuild` frame (COMPILER_TOOLCHAIN_FRAME)
  // means tsx is mid-compile of some `.ts` file, whatever that file turns out to be — exempt outright,
  // before ever asking what repo file it is. Otherwise, the first repo-owned frame — skipping every
  // node_modules frame, including MSW's and any other npm package's — decides it: a test/proxy/stub/
  // harness file, or a file under a package's own `test/` directory. That is how a proxy's own
  // recorded-failure stub is allowed to do the real call it exists to capture.
  const isCallFromTestInfrastructure = () => {
    for (const frame of callerFrames(400)) {
      if (COMPILER_TOOLCHAIN_FRAME.test(frame)) {
        return true;
      }
      if (frame.includes(`${path.sep}packages${path.sep}`) && !frame.includes(NODE_MODULES_SEGMENT)) {
        return TEST_INFRASTRUCTURE_FRAME.test(frame);
      }
    }
    return false;
  };

  // Every trap point's final step: record the message so the afterEach drain below still catches
  // a blocked call whose throw a test's own try/catch swallowed, then throw it for real.
  const recordAndThrow = (message) => {
    hits.push(message);
    throw new Error(message);
  };

  const trapObject = (label, real) => {
    const trapped = {};
    for (const key of Object.keys(real)) {
      const value = real[key];
      if (typeof value === 'function' && !/^[A-Z]/u.test(key) && !NO_IO_FUNCTIONS.has(key)) {
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
          if (isCallFromTestInfrastructure()) {
            return value.apply(real, args);
          }
          return recordAndThrow(
            `[io-trap] unstaged ${label}.${key}(${JSON.stringify(first)}) — stage it with ` +
              `registerMock in the calling file's proxy, using a recorded-failure stub for a real error`,
          );
        };
      } else {
        trapped[key] = value;
      }
    }
    return trapped;
  };

  // Returns undefined for a module this trap does not cover, so the hoister's
  // `globalThis.__ioTrap?.(m) ?? jest.requireActual(m)` falls back to the real module and this file
  // stays the only place the trapped list lives. For a MUTATED_MODULES name that fallback is exactly
  // right: `jest.requireActual` returns the same real object this file already mutated in place
  // below, so the hoister's spread picks up every trapped function this file installed on it.
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

  // `owner[key]`'s TRUE original survives this test file's rewrap: a Symbol-keyed property on the
  // wrapper stores it once, and every later file's setup (this whole block reruns fresh, once per
  // test file, since it is a `setupFiles` entry) reads that Symbol back rather than treating a
  // PREVIOUS file's wrapper as "real" — `owner` is the real, shared module or prototype object,
  // which resolves to the SAME singleton across every test file a worker process runs (proved by
  // `process` itself, and true of every core-module export for the same reason), unlike a
  // user-space file Jest's own per-test-file module registry resets. Without this, the second test
  // file to touch a given target would chain into the FIRST file's wrapper — still correct on an
  // unstaged call (it still throws), but reporting through a `hits`/`afterEach` closure nothing
  // reads any more, and paying for one extra stack walk per file thereafter.
  const TRUE_ORIGINAL = Symbol.for('dungeonmaster.ioTrap.trueOriginal');

  const rewrapInPlace = ({ owner, key, label }) => {
    const current = owner[key];
    const trueOriginal =
      typeof current === 'function' && current[TRUE_ORIGINAL] !== undefined
        ? current[TRUE_ORIGINAL]
        : current;
    const wrapped = function ioTrappedInPlace(...args) {
      if (isCallFromTestInfrastructure()) {
        return trueOriginal.apply(this, args);
      }
      return recordAndThrow(
        `[io-trap] unstaged ${label}(${JSON.stringify(args[0])}) — stage it with registerMock/` +
          `registerSpyOn in the calling file's proxy, using a recorded-failure stub for a real error`,
      );
    };
    wrapped[TRUE_ORIGINAL] = trueOriginal;
    owner[key] = wrapped;
  };

  const mutateModuleFunctionsInPlace = ({ name, owner, label }) => {
    for (const key of Object.keys(owner)) {
      const value = owner[key];
      if (typeof value === 'function' && !/^[A-Z]/u.test(key) && !NO_IO_FUNCTIONS.has(key)) {
        rewrapInPlace({ owner, key, label: `${label}.${key}` });
      }
    }
  };

  for (const name of MUTATED_MODULES) {
    const real = jest.requireActual(name);
    // `new Worker(…)` is a constructor call, not a function call, so the generic loop below (which
    // only wraps lowercase function keys) never sees it — the constructor-equivalent of wrapping a
    // function in place is a Proxy `construct` trap over the same real class, reassigned onto the
    // module's own `Worker` export.
    if (name === 'worker_threads') {
      const trueOriginalWorker =
        real.Worker[TRUE_ORIGINAL] !== undefined ? real.Worker[TRUE_ORIGINAL] : real.Worker;
      const wrappedWorker = new Proxy(trueOriginalWorker, {
        construct: (target, args, newTarget) => {
          if (isCallFromTestInfrastructure()) {
            return Reflect.construct(target, args, newTarget);
          }
          return recordAndThrow(
            `[io-trap] unstaged new Worker(${JSON.stringify(args[0])}) — stage it with ` +
              `registerMock/registerSpyOn in the calling file's proxy`,
          );
        },
      });
      wrappedWorker[TRUE_ORIGINAL] = trueOriginalWorker;
      real.Worker = wrappedWorker;
      continue;
    }
    mutateModuleFunctionsInPlace({ name, owner: real, label: name });
    if (real.promises) {
      mutateModuleFunctionsInPlace({ name, owner: real.promises, label: `${name}.promises` });
    }
    // `new net.Socket().connect(…)` and `server.listen(…)` leave the process without ever calling a
    // module FUNCTION, so the generic loop above never sees them either — `Socket` and `Server` are
    // classes. Their PROTOTYPE methods are what every instance actually calls, whichever code
    // constructed the instance, so wrapping them here (rather than only the module-level
    // `createServer`/`createConnection` factories, which is what every existing proxy in this repo
    // already stages) is what makes `new net.Socket()` built directly, bypassing those factories,
    // trapped too.
    if (name === 'net') {
      rewrapInPlace({
        owner: real.Socket.prototype,
        key: 'connect',
        label: 'net.Socket.prototype.connect',
      });
      rewrapInPlace({
        owner: real.Server.prototype,
        key: 'listen',
        label: 'net.Server.prototype.listen',
      });
    }
  }

  // registerMock's own AST transform special-cases `process`/`node:process` (see
  // `typescript-mock-calls-to-statements-adapter.ts`) and stages `kill` with a plain `jest.fn()` on
  // an `Object.create(jest.requireActual('process'))` shim — that shim's OWN `kill` shadows
  // whatever this installs, so a proxy that calls `registerMock({ fn: kill })` is unaffected by this
  // trap either way. Only a caller that does not stage the call (`registerSpyOn({ object: process,
  // method: 'kill' })`, T2's own worked example) reaches this wrapper.
  rewrapInPlace({ owner: process, key: 'kill', label: 'process.kill' });

  afterEach(() => {
    const found = hits.splice(0);
    if (found.length > 0) {
      throw new Error(
        `Test did real I/O that nothing staged. Stage it with registerMock or registerSpyOn in the ` +
          `calling file's proxy — a recorded-failure stub for a real error — or move the test to an ` +
          `integration test:\n  ${found.join('\n  ')}`,
      );
    }
  });
}
