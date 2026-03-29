import * as ts from 'typescript';
import { typescriptAstToMockCallsAdapter } from './typescript-ast-to-mock-calls-adapter';
import { typescriptAstToMockCallsAdapterProxy } from './typescript-ast-to-mock-calls-adapter.proxy';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';

describe('typescriptAstToMockCallsAdapter', () => {
  describe('valid jest.mock calls', () => {
    it('VALID: {sourceFile with jest.mock} => returns mock call', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `jest.mock('fs');`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'fs',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('VALID: {jest.mock with factory} => returns mock call with factory', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `jest.mock('axios', () => ({ get: jest.fn() }));`;
      const tsSourceFile = ts.createSourceFile(
        'adapter.proxy.ts',
        code,
        ts.ScriptTarget.Latest,
        true,
      );
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'axios',
          factory: '() => ({ get: jest.fn() })',
          sourceFile: 'adapter.proxy.ts',
        },
      ]);
    });

    it('VALID: {multiple jest.mock calls} => returns all mock calls', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
jest.mock('fs');
jest.mock('path');
jest.mock('axios', () => ({}));
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        { moduleName: 'fs', factory: null, sourceFile: 'test.proxy.ts' },
        { moduleName: 'path', factory: null, sourceFile: 'test.proxy.ts' },
        { moduleName: 'axios', factory: '() => ({})', sourceFile: 'test.proxy.ts' },
      ]);
    });
  });

  describe('no mock calls', () => {
    it('EMPTY: {sourceFile without jest.mock} => returns empty array', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
export const adapterProxy = () => {
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty file} => returns empty array', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = '';
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });

  describe('registerMock extraction', () => {
    it('VALID: {registerMock({ fn: execFile })} => returns mock call for import module', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { execFile } from 'child_process';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const handle = registerMock({ fn: execFile });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('VALID: {multiple registerMock from different modules} => returns all mock calls', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const execHandle = registerMock({ fn: execFile });
  const readHandle = registerMock({ fn: readFile });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
        {
          moduleName: 'fs/promises',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('VALID: {registerMock with node: prefix} => preserves node: prefix in module name', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { execFile } from 'node:child_process';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const handle = registerMock({ fn: execFile });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'node:child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('VALID: {registerMock with scoped package} => resolves scoped module', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { panzoom } from '@panzoom/panzoom';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const handle = registerMock({ fn: panzoom });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: '@panzoom/panzoom',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('EMPTY: {registerMock with type-only import} => returns empty array', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import type { execFile } from 'child_process';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const handle = registerMock({ fn: execFile });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {registerMock({ fn: Obj.method })} => resolves module from object import', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const handle = registerMock({ fn: StartOrchestrator.addGuild });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: '@dungeonmaster/orchestrator',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('EMPTY: {registerMock with locally defined fn} => returns empty array', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { registerMock } from '@dungeonmaster/testing';

const myFn = () => {};

export const myProxy = () => {
  const handle = registerMock({ fn: myFn });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });

  describe('jest.mock and registerMock coexistence', () => {
    it('VALID: {both jest.mock and registerMock} => returns both', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { execFile } from 'child_process';
import { registerMock } from '@dungeonmaster/testing';
jest.mock('fs');

export const myProxy = () => {
  const handle = registerMock({ fn: execFile });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'fs',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });

    it('VALID: {jest.mock and registerMock for same module} => returns both for deduplication upstream', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
import { execFile } from 'child_process';
import { registerMock } from '@dungeonmaster/testing';
jest.mock('child_process');

export const myProxy = () => {
  const handle = registerMock({ fn: execFile });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
        },
      ]);
    });
  });
});
