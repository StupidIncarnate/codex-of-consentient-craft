import { typedRuleTesterHarness } from '../../../../test/harnesses/typed-rule-tester/typed-rule-tester.harness';
import { rulePlatformGlobalsBanBroker } from './rule-platform-globals-ban-broker';

// Real files on disk, so `parserOptions.project: true` resolves each one to its OWN package's real
// tsconfig.json by walking the real directory tree — a node-platform package (no DOM lib) and a
// frontend-react package (DOM lib), plus one real file inside each gateway package for the
// gateway-exemption cases. See packages/eslint-plugin/CLAUDE.md: "RuleTester tests work fine
// anywhere (they use synthetic code strings, not real files)" — only the FILENAME need be real.
// Built by slicing `__dirname`'s own segments, not `path.join`/`path.resolve`: this file is a
// test-scenario file, and `@dungeonmaster/ban-node-builtins-in-test-scenarios` refuses a Node
// builtin import here. Slicing also avoids leaving unresolved `..` segments in the filename
// `parserOptions.project: true` walks from on disk.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/brokers/rule/platform-globals-ban — 6 segments up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -6).join('/');
// 3 segments up is packages/eslint-plugin/src
const NODE_PACKAGE_FILE = `${DIR_SEGMENTS.slice(0, -3).join('/')}/index.ts`;
const BROWSER_PACKAGE_FILE = `${REPO_ROOT}/packages/web/src/main.ts`;
const GATEWAY_NODE_FILE = `${REPO_ROOT}/packages/@gateway/node/src/process/process.ts`;
const GATEWAY_BROWSER_FILE = `${REPO_ROOT}/packages/@gateway/browser/src/fetch/fetch.ts`;

// Every browser-side callback case declares its own `page`, so the call type-checks with no
// Playwright import in the fixture.
const PAGE_DECLARATION =
  'declare const page: { evaluate: (fn: unknown, arg?: unknown) => Promise<unknown>; evaluateAll: (fn: unknown) => Promise<unknown>; waitForFunction: (fn: unknown) => Promise<unknown>; addInitScript: (fn: unknown) => Promise<void>; click: (fn: unknown) => Promise<void> };';

const ruleTester = typedRuleTesterHarness();

ruleTester.run('platform-globals-ban', rulePlatformGlobalsBanBroker(), {
  valid: [
    // CommonJS module-scope values are exempt by name
    { code: '__dirname;', filename: NODE_PACKAGE_FILE },
    { code: '__filename;', filename: NODE_PACKAGE_FILE },
    { code: "require('./x');", filename: NODE_PACKAGE_FILE },
    { code: 'module.exports = {};', filename: NODE_PACKAGE_FILE },
    { code: 'const isEntry = require.main === module;', filename: NODE_PACKAGE_FILE },
    // A type position never runs — Buffer as a parameter type, not a value
    { code: 'const f = (b: Buffer): void => undefined;', filename: NODE_PACKAGE_FILE },
    // useRef<HTMLDivElement> — the type argument is a type position too
    { code: 'let el: HTMLDivElement | null = null;', filename: BROWSER_PACKAGE_FILE },
    // NodeJS.ErrnoException — the qualifier sits in a TSQualifiedName, also a type position
    { code: 'let e: NodeJS.ErrnoException | undefined;', filename: NODE_PACKAGE_FILE },
    // A locally declared identifier shadows the ambient global — the checker resolves it to the
    // local declaration, never to lib.dom/@types/node, so it is never flagged
    {
      code: "const process = { stdout: { write: (_x: string): boolean => true } };\nprocess.stdout.write('x');",
      filename: NODE_PACKAGE_FILE,
    },
    // ES built-ins live in lib.es*, never lib.dom/@types/node
    { code: 'JSON.stringify({});', filename: NODE_PACKAGE_FILE },
    { code: 'JSON.stringify({});', filename: BROWSER_PACKAGE_FILE },
    // Gateway files are exempt — this is where these globals get wrapped
    { code: "process.stdout.write('x');", filename: GATEWAY_NODE_FILE },
    { code: "fetch('/x');", filename: GATEWAY_BROWSER_FILE },
    // A plain object-literal key is a label, not a reference to the ambient `fetch`
    { code: 'const o = { fetch: 1 };', filename: BROWSER_PACKAGE_FILE },
    // A destructuring shorthand declares a local; it reads no ambient global
    { code: 'const { fetch } = { fetch: 1 };', filename: BROWSER_PACKAGE_FILE },
    // A function literal written as the FIRST argument of a Playwright browser-side call runs in
    // the driven browser, so its DOM globals are the browser's own
    {
      code: `${PAGE_DECLARATION}\nvoid page.evaluate(() => document.title);`,
      filename: BROWSER_PACKAGE_FILE,
    },
    {
      code: `${PAGE_DECLARATION}\nvoid page.waitForFunction(() => document.querySelector('x') !== null);`,
      filename: BROWSER_PACKAGE_FILE,
    },
    {
      code: `${PAGE_DECLARATION}\nvoid page.evaluateAll((els: unknown[]) => els.map(() => window.innerWidth));`,
      filename: BROWSER_PACKAGE_FILE,
    },
    {
      code: `${PAGE_DECLARATION}\nvoid page.addInitScript(function () {\n  localStorage.clear();\n});`,
      filename: BROWSER_PACKAGE_FILE,
    },
    // A named function passed BY REFERENCE as that first argument — declared above the call, the
    // shape every *_BROWSER_FN in web's e2e harnesses takes
    {
      code: `${PAGE_DECLARATION}\nconst CLEAR_STORAGE_BROWSER_FN = (): void => {\n  localStorage.clear();\n  indexedDB.deleteDatabase('x');\n};\nvoid page.addInitScript(CLEAR_STORAGE_BROWSER_FN);`,
      filename: BROWSER_PACKAGE_FILE,
    },
    {
      code: `${PAGE_DECLARATION}\nfunction readTitle(): string {\n  return document.title;\n}\nvoid page.evaluate(readTitle);`,
      filename: BROWSER_PACKAGE_FILE,
    },
  ],
  invalid: [
    {
      // the VALUE half of an object-literal shorthand reads the ambient global itself
      code: 'const o = { fetch };',
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'fetch', gatewayPath: '#gateway/browser/fetch' },
        },
      ],
    },
    {
      // a later argument of page.evaluate is built in the calling process, not the browser
      code: `${PAGE_DECLARATION}\nvoid page.evaluate((x: unknown) => x, document.title);`,
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'document', gatewayPath: '#gateway/browser/document' },
        },
      ],
    },
    {
      // a function literal handed to any other method runs in the calling process
      code: `${PAGE_DECLARATION}\nvoid page.click(() => document.title);`,
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'document', gatewayPath: '#gateway/browser/document' },
        },
      ],
    },
    {
      // a named function never passed to a browser-side call is still reported, at Program:exit
      code: 'const READ_TITLE = (): string => document.title;\nREAD_TITLE();',
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'document', gatewayPath: '#gateway/browser/document' },
        },
      ],
    },
    {
      code: "process.stdout.write('x');",
      filename: NODE_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'process', gatewayPath: '#gateway/node/process' },
        },
      ],
    },
    {
      // globalThis.fetch — the property counts as the global itself
      code: "globalThis.fetch('/x');",
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'fetch', gatewayPath: '#gateway/browser/fetch' },
        },
      ],
    },
    {
      // bare fetch, no globalThis. prefix, in a browser-platform package
      code: "fetch('/x');",
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'fetch', gatewayPath: '#gateway/browser/fetch' },
        },
      ],
    },
    {
      // the Web Crypto global
      code: 'crypto.randomUUID();',
      filename: BROWSER_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'crypto', gatewayPath: '#gateway/browser/crypto' },
        },
      ],
    },
    {
      // bare setTimeout, no globalThis. prefix — 'settimeout' is not a Node builtin, so the
      // subpath keeps its camelCase spelling rather than falling back to a lowercase module name
      code: 'setTimeout((): void => undefined, 0);',
      filename: NODE_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'setTimeout', gatewayPath: '#gateway/node/setTimeout' },
        },
      ],
    },
    {
      // Buffer used as a VALUE (not a type) IS flagged — proves the AST-position guard
      // discriminates a value use from the exempt type-position case above. The suggested
      // subpath is the lowercase 'buffer' — the real Node builtin module name — not the
      // capitalized 'Buffer' class identifier written in the source.
      code: 'Buffer.from("x");',
      filename: NODE_PACKAGE_FILE,
      errors: [
        {
          messageId: 'platformGlobal',
          data: { name: 'Buffer', gatewayPath: '#gateway/node/buffer' },
        },
      ],
    },
  ],
});
