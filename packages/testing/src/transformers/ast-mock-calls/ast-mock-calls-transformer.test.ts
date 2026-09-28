import * as ts from '#gateway/npm/typescript';
import { astMockCallsTransformer } from './ast-mock-calls-transformer';
import { TypescriptSourceFileStub } from '../../contracts/typescript-source-file/typescript-source-file.stub';

describe('astMockCallsTransformer', () => {
  describe('valid jest.mock calls', () => {
    it('VALID: {sourceFile with jest.mock} => returns mock call', () => {
      const code = `jest.mock('fs');`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'fs',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('VALID: {jest.mock with factory} => returns mock call with factory', () => {
      const code = `jest.mock('axios', () => ({ get: jest.fn() }));`;
      const tsSourceFile = ts.createSourceFile(
        'adapter.proxy.ts',
        code,
        ts.ScriptTarget.Latest,
        true,
      );
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'axios',
          factory: '() => ({ get: jest.fn() })',
          sourceFile: 'adapter.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('VALID: {multiple jest.mock calls} => returns all mock calls', () => {
      const code = `
jest.mock('fs');
jest.mock('path');
jest.mock('axios', () => ({}));
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'fs',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
        {
          moduleName: 'path',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
        {
          moduleName: 'axios',
          factory: '() => ({})',
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
      ]);
    });
  });

  describe('no mock calls', () => {
    it('EMPTY: {sourceFile without jest.mock} => returns empty array', () => {
      const code = `
export const adapterProxy = () => {
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty file} => returns empty array', () => {
      const code = '';
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });

  describe('registerMock extraction', () => {
    it('VALID: {registerMock({ fn: execFile })} => returns mock call for import module', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['execFile'],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('VALID: {multiple registerMock from different modules} => returns all mock calls', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['execFile'],
          objectIdentifierNames: [],
        },
        {
          moduleName: 'fs/promises',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['readFile'],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('VALID: {registerMock with node: prefix} => preserves node: prefix in module name', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'node:child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['execFile'],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('VALID: {registerMock with scoped package} => resolves scoped module', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: '@panzoom/panzoom',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['panzoom'],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('EMPTY: {registerMock with type-only import} => returns empty array', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {registerMock({ fn: Obj.method })} => records the OBJECT name in objectIdentifierNames, not identifierNames', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: '@dungeonmaster/orchestrator',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: ['StartOrchestrator'],
        },
      ]);
    });

    it('VALID: {registerMock({ fn: Obj.method }) with a renamed import} => records the ORIGINAL export name, not the local alias', () => {
      const code = `
import { orchestrationEventsState as oes } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing';

export const myProxy = () => {
  const handle = registerMock({ fn: oes.on });
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: '@dungeonmaster/orchestrator',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: ['orchestrationEventsState'],
        },
      ]);
    });

    it('EMPTY: {registerMock with locally defined fn} => returns empty array', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });

  describe('jest.mock and registerMock coexistence', () => {
    it('VALID: {both jest.mock and registerMock} => returns both', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'fs',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['execFile'],
          objectIdentifierNames: [],
        },
      ]);
    });

    it('VALID: {jest.mock and registerMock for same module} => returns both for deduplication upstream', () => {
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

      const result = astMockCallsTransformer({ sourceFile });

      expect(result).toStrictEqual([
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: [],
          objectIdentifierNames: [],
        },
        {
          moduleName: 'child_process',
          factory: null,
          sourceFile: 'test.proxy.ts',
          identifierNames: ['execFile'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });
});
