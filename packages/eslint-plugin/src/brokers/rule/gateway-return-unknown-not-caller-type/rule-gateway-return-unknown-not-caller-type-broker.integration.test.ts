import { typedRuleTesterHarness } from '../../../../test/harnesses/typed-rule-tester/typed-rule-tester.harness';
import { ruleGatewayReturnUnknownNotCallerTypeBroker } from './rule-gateway-return-unknown-not-caller-type-broker';

// Real files on disk, so `parserOptions.project: true` resolves each one to its own package's real
// tsconfig.json by walking the real directory tree — a non-gateway anchor (the rule must never
// fire there) and a real gateway file (where it does its work). See
// packages/eslint-plugin/CLAUDE.md: only the FILENAME need be real, not its contents.
const DIR_SEGMENTS = __dirname.split('/');
// .../packages/eslint-plugin/src/brokers/rule/gateway-return-unknown-not-caller-type — 6 up is the repo root
const REPO_ROOT = DIR_SEGMENTS.slice(0, -6).join('/');
const NODE_PACKAGE_FILE = `${DIR_SEGMENTS.slice(0, -3).join('/')}/index.ts`;
const GATEWAY_NODE_FILE = `${REPO_ROOT}/packages/@gateway/node/src/fetch/fetch.ts`;

const ruleTester = typedRuleTesterHarness();

ruleTester.run(
  'gateway-return-unknown-not-caller-type',
  ruleGatewayReturnUnknownNotCallerTypeBroker(),
  {
    valid: [
      // Outside the gateway, the rule never even looks — this exact shape would be flagged inside it
      {
        code: 'const wrap = <T,>(text: string): T => JSON.parse(text) as T;',
        filename: NODE_PACKAGE_FILE,
      },
      // A cast to `unknown` carries no TSTypeReference at all
      {
        code: 'const wrap = (text: string): unknown => JSON.parse(text) as unknown;',
        filename: GATEWAY_NODE_FILE,
      },
      // A cast to a real declared interface names a real type, not a caller-picked one
      {
        code: 'interface Settings { name: string }\nconst wrap = (text: string): Settings => JSON.parse(text) as Settings;',
        filename: GATEWAY_NODE_FILE,
      },
      // The type parameter also names a parameter type — forwards the caller's own value unchanged
      {
        code: 'const identity = <T,>(value: T): T => value;',
        filename: GATEWAY_NODE_FILE,
      },
      // Declared return type is `unknown` — read-json-file.ts's own shape
      {
        code: 'const readJsonFile = async (path: string): Promise<unknown> => JSON.parse(await Promise.resolve(path));',
        filename: GATEWAY_NODE_FILE,
      },
    ],
    invalid: [
      {
        code: 'const wrap = <T,>(text: string): T => JSON.parse(text) as T;',
        filename: GATEWAY_NODE_FILE,
        errors: [
          { messageId: 'bareReturnTypeParameter', data: { typeParameterName: 'T' } },
          { messageId: 'castToCallerType', data: { typeParameterName: 'T' } },
        ],
      },
      {
        code: 'const invent = async <T,>(path: string): Promise<T> => import(path) as Promise<T>;',
        filename: GATEWAY_NODE_FILE,
        errors: [
          { messageId: 'bareReturnTypeParameter', data: { typeParameterName: 'T' } },
          { messageId: 'castToCallerType', data: { typeParameterName: 'T' } },
        ],
      },
      {
        code: 'const readRaw = (text: string) => JSON.parse(text);',
        filename: GATEWAY_NODE_FILE,
        errors: [{ messageId: 'anyLeakNoReturnType' }],
      },
      {
        code: 'const readRaw = (text: string) => {\n  const data = JSON.parse(text);\n  return data;\n};',
        filename: GATEWAY_NODE_FILE,
        errors: [{ messageId: 'anyLeakNoReturnType' }],
      },
    ],
  },
);
