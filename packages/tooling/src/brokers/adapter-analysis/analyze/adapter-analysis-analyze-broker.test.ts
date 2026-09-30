import { adapterAnalysisAnalyzeBroker } from './adapter-analysis-analyze-broker';
import { adapterAnalysisAnalyzeBrokerProxy } from './adapter-analysis-analyze-broker.proxy';
import { CensusPathStub } from '../../../contracts/census-path/census-path.stub';

const analyze = ({ text }: { text: string }): ReturnType<typeof adapterAnalysisAnalyzeBroker> => {
  adapterAnalysisAnalyzeBrokerProxy();
  return adapterAnalysisAnalyzeBroker({
    file: CensusPathStub({ value: 'packages/a/src/adapters/x/x-adapter.ts' }),
    text: text,
    workspaceScope: '@acme',
    workspacePackageNames: ['plain-workspace'],
  });
};

describe('adapterAnalysisAnalyzeBroker', () => {
  describe('pass-through shapes', () => {
    it('VALID: {a named import called once, with a contract parse} => one outside call, no reasons', () => {
      const result = analyze({
        text: [
          "import { readFile } from 'fs/promises';",
          "import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';",
          'export const fsReadFileAdapter = async ({ filePath }: { filePath: string }) =>',
          "  fileContentsContract.parse(await readFile(filePath, 'utf8'));",
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
        reasons: [],
      });
    });

    it('VALID: {a namespace import and a default import} => the called member is the name', () => {
      const result = analyze({
        text: [
          "import * as fs from 'fs';",
          "import path from 'path';",
          'export const a = (p: string) => fs.readFileSync(p);',
          "export const b = (p: string) => path.join(p, 'x');",
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [
          { module: 'fs', name: 'readFileSync' },
          { module: 'path', name: 'join' },
        ],
        reasons: [],
      });
    });

    it('VALID: {a call through a gateway import} => the gateway module and name', () => {
      const result = analyze({
        text: [
          "import { readFile } from '#gateway/node/fs__promises';",
          'export const a = (p: string) => readFile(p);',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [{ module: '#gateway/node/fs__promises', name: 'readFile' }],
        reasons: [],
      });
    });

    it('VALID: {undeclared globals} => the global is the module, the member the name', () => {
      const result = analyze({
        text: [
          'export const a = () => process.cwd();',
          'export const b = () => structuredClone({});',
          'export const c = (fn: () => void) => setTimeout(fn, 1);',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [
          { module: 'process', name: 'cwd' },
          { module: 'setTimeout', name: 'setTimeout' },
        ],
        reasons: [],
      });
    });

    it('VALID: {language built-ins only} => no outside call at all', () => {
      const result = analyze({
        text: 'export const a = (raw: string) => JSON.parse(raw);',
      });

      expect(result).toStrictEqual({ outsideCalls: [], reasons: [] });
    });

    it('VALID: {a type-only import} => nothing is bound, so its name is a global', () => {
      const result = analyze({
        text: [
          "import type { readFile } from 'fs/promises';",
          'export const a = (p: string) => readFile(p);',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [{ module: 'readFile', name: 'readFile' }],
        reasons: [],
      });
    });
  });

  describe('logic reasons', () => {
    it('VALID: {try/catch and an if} => try-catch and branching', () => {
      const result = analyze({
        text: [
          "import { readFile } from 'fs/promises';",
          'export const a = async (p: string) => {',
          '  try {',
          '    return await readFile(p);',
          '  } catch (error) {',
          '    if (error instanceof Error) { throw error; }',
          '    return null;',
          '  }',
          '};',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
        reasons: ['try-catch', 'branching'],
      });
    });

    it('VALID: {a call chained onto an outside result} => the call counts and chained-call is a reason', () => {
      const result = analyze({
        text: [
          "import { readFile } from 'fs/promises';",
          'export const a = (p: string) => readFile(p).then((value) => value);',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
        reasons: ['chained-call'],
      });
    });

    it('VALID: {new Promise wrapping setTimeout} => promise-construction beside the outside call', () => {
      const result = analyze({
        text: 'export const a = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });',
      });

      expect(result).toStrictEqual({
        outsideCalls: [{ module: 'setTimeout', name: 'setTimeout' }],
        reasons: ['promise-construction'],
      });
    });

    it('VALID: {a call into another adapter and into other repo code} => calls-adapter and calls-repo-code', () => {
      const result = analyze({
        text: [
          "import { otherAdapter } from '../other/other-adapter';",
          "import { shapeTransformer } from '../../../transformers/shape/shape-transformer';",
          "import { thing } from '@acme/shared/things';",
          'export const a = () => shapeTransformer({ value: otherAdapter({}) });',
          'export const b = () => thing();',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [],
        reasons: ['calls-repo-code', 'calls-adapter'],
      });
    });

    it('VALID: {a workspace package import by name} => repo code, not an outside call', () => {
      const result = analyze({
        text: [
          "import { thing } from 'plain-workspace/things';",
          'export const a = () => thing();',
        ].join('\n'),
      });

      expect(result).toStrictEqual({ outsideCalls: [], reasons: ['calls-repo-code'] });
    });

    it('VALID: {calls on a parameter} => calls-held-value and method-on-held-value', () => {
      const result = analyze({
        text: [
          'export const a = ({ run }: { run: () => void }) => run();',
          'export const b = (stream: { on: (name: string) => void }) => stream.on("x");',
          'export const c = () => [1].map((n) => n);',
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        outsideCalls: [],
        reasons: ['calls-held-value', 'method-on-held-value'],
      });
    });

    it('VALID: {&&, ??, a ternary and a loop} => branching once', () => {
      const result = analyze({
        text: [
          'export const a = (x: number | undefined, y: boolean) => {',
          '  for (const item of [1]) { void item; }',
          '  return y && x ? (x ?? 1) : 0;',
          '};',
        ].join('\n'),
      });

      expect(result).toStrictEqual({ outsideCalls: [], reasons: ['branching'] });
    });
  });

  describe('files with nothing to call', () => {
    it('EMPTY: {an empty file} => no calls and no reasons', () => {
      const result = analyze({ text: '' });

      expect(result).toStrictEqual({ outsideCalls: [], reasons: [] });
    });

    it('EDGE: {a dynamic import and super()} => skipped', () => {
      const result = analyze({
        text: 'export const a = () => import("x"); class A extends Object { constructor() { super(); } }',
      });

      expect(result).toStrictEqual({ outsideCalls: [], reasons: [] });
    });
  });
});
