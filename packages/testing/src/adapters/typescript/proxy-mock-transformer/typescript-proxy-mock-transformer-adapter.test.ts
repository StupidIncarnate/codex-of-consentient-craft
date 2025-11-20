/**
 * Integration tests for typescript-proxy-mock-transformer-adapter
 *
 * These tests verify that the transformer correctly hoists jest.mock() calls
 * from .proxy.ts files to test files during TypeScript compilation.
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { typescriptProxyMockTransformerAdapter } from './typescript-proxy-mock-transformer-adapter';

describe('typescriptProxyMockTransformerAdapter', () => {
  describe('integration', () => {
    /**
     * Helper to compile a test file with the transformer and return the output
     */
    const compileWithTransformer = ({
      testFileContent,
      proxyFileContent,
      testFileName = 'test.test.ts',
      proxyFileName = 'test.proxy.ts',
      adapterFileName = 'adapter.ts',
      adapterContent = '',
    }: {
      testFileContent: string;
      proxyFileContent: string;
      testFileName?: string;
      proxyFileName?: string;
      adapterFileName?: string;
      adapterContent?: string;
    }): string => {
      // Create a temporary directory for test files
      const tempDir = path.join(__dirname, '__temp_transformer_test__');
      fs.mkdirSync(tempDir, { recursive: true });

      const testFilePath = path.join(tempDir, testFileName);
      const proxyFilePath = path.join(tempDir, proxyFileName);
      const adapterFilePath = path.join(tempDir, adapterFileName);

      try {
        // Write test files
        fs.writeFileSync(testFilePath, testFileContent);
        fs.writeFileSync(proxyFilePath, proxyFileContent);
        if (adapterContent) {
          fs.writeFileSync(adapterFilePath, adapterContent);
        }

        // Create a TypeScript program
        const program = ts.createProgram([testFilePath], {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          moduleResolution: ts.ModuleResolutionKind.Node10,
          skipLibCheck: true,
        });

        // Get the source file
        const sourceFile = program.getSourceFile(testFilePath);
        if (!sourceFile) {
          throw new Error(`Could not get source file: ${testFilePath}`);
        }

        // Apply the transformer
        const transformerFactory = typescriptProxyMockTransformerAdapter({
          program,
          options: { baseDir: tempDir },
        });
        const result = ts.transform(sourceFile, [transformerFactory]);
        const transformedSourceFile = result.transformed[0]!;

        // Print the transformed source
        const printer = ts.createPrinter();
        const output = printer.printFile(transformedSourceFile);

        result.dispose();

        return output;
      } finally {
        // Cleanup - inline per test
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    };

    it('VALID: {test imports proxy with jest.mock} => hoists jest.mock to top of test file', () => {
      const testFileContent = `
import { adapterProxy } from './test.proxy';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;

      const proxyFileContent = `
jest.mock('fs');

export const adapterProxy = () => {
  return {};
};
`;

      const output = compileWithTransformer({
        testFileContent,
        proxyFileContent,
      });

      // Verify jest.mock was hoisted to the top
      expect(output).toMatch(/jest\.mock\(['"]fs['"]\)/u);

      // Verify the comment indicating auto-hoisting
      expect(output).toMatch(/Auto-hoisted from.*test\.proxy\.ts/u);

      // Verify the original imports are still there
      expect(output).toMatch(/import.*adapterProxy.*from.*test\.proxy/u);
    });

    it('VALID: {proxy chain: test -> proxy1 -> proxy2 with mocks} => hoists all mocks', () => {
      const testFileContent = `
import { proxy1 } from './proxy1.proxy';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;

      const proxy1Content = `
import { proxy2 } from './proxy2.proxy';

jest.mock('axios');

export const proxy1 = () => {
  return {};
};
`;

      const proxy2Content = `
jest.mock('fs');

export const proxy2 = () => {
  return {};
};
`;

      const tempDir = path.join(__dirname, '__temp_transformer_test__');
      fs.mkdirSync(tempDir, { recursive: true });

      const testFilePath = path.join(tempDir, 'test.test.ts');
      const proxy1Path = path.join(tempDir, 'proxy1.proxy.ts');
      const proxy2Path = path.join(tempDir, 'proxy2.proxy.ts');

      fs.writeFileSync(testFilePath, testFileContent);
      fs.writeFileSync(proxy1Path, proxy1Content);
      fs.writeFileSync(proxy2Path, proxy2Content);

      const program = ts.createProgram([testFilePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        skipLibCheck: true,
      });

      const sourceFile = program.getSourceFile(testFilePath)!;

      const transformerFactory = typescriptProxyMockTransformerAdapter({
        program,
        options: { baseDir: tempDir },
      });
      const result = ts.transform(sourceFile, [transformerFactory]);
      const transformedSourceFile = result.transformed[0]!;

      const printer = ts.createPrinter();
      const output = printer.printFile(transformedSourceFile);

      result.dispose();

      // Cleanup inline before assertions
      fs.rmSync(tempDir, { recursive: true, force: true });

      // Verify both mocks were hoisted
      expect(output).toMatch(/jest\.mock\(['"]axios['"]\)/u);
      expect(output).toMatch(/jest\.mock\(['"]fs['"]\)/u);

      // Verify comments for both
      expect(output).toMatch(/Auto-hoisted from.*proxy1\.proxy\.ts/u);
      expect(output).toMatch(/Auto-hoisted from.*proxy2\.proxy\.ts/u);
    });

    it('VALID: {non-test file imports proxy} => does not hoist mocks', () => {
      const nonTestFileContent = `
import { adapterProxy } from './test.proxy';

export const something = () => {
  return adapterProxy();
};
`;

      const proxyFileContent = `
jest.mock('fs');

export const adapterProxy = () => {
  return {};
};
`;

      const output = compileWithTransformer({
        testFileContent: nonTestFileContent,
        proxyFileContent,
        testFileName: 'not-a-test.ts',
      });

      // Verify jest.mock was NOT hoisted (file doesn't end in .test.ts)
      expect(output).not.toMatch(/jest\.mock\(['"]fs['"]\)/u);
    });

    it('VALID: {proxy without jest.mock} => no changes to test file', () => {
      const testFileContent = `
import { adapterProxy } from './test.proxy';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;

      const proxyFileContent = `
export const adapterProxy = () => {
  return {};
};
`;

      const output = compileWithTransformer({
        testFileContent,
        proxyFileContent,
      });

      // Verify no jest.mock was added
      expect(output).not.toMatch(/jest\.mock/u);

      // Verify the import is still there
      expect(output).toMatch(/import.*adapterProxy.*from.*test\.proxy/u);
    });

    it('VALID: {test file without proxy imports} => no changes', () => {
      const testFileContent = `
import { something } from './adapter';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;

      const adapterContent = `
export const something = () => {
  return 'hello';
};
`;

      const proxyFileContent = `
export const adapterProxy = () => {
  return {};
};
`;

      const output = compileWithTransformer({
        testFileContent,
        proxyFileContent,
        adapterContent,
      });

      // Verify no jest.mock was added (no proxy import)
      expect(output).not.toMatch(/jest\.mock/u);
    });

    it('EDGE: {circular proxy imports} => handles gracefully without infinite loop', () => {
      const testFileContent = `
import { proxy1 } from './proxy1.proxy';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;

      const proxy1Content = `
import { proxy2 } from './proxy2.proxy';

jest.mock('axios');

export const proxy1 = () => {
  return {};
};
`;

      const proxy2Content = `
import { proxy1 } from './proxy1.proxy';

jest.mock('fs');

export const proxy2 = () => {
  return {};
};
`;

      const tempDir = path.join(__dirname, '__temp_transformer_test__');
      fs.mkdirSync(tempDir, { recursive: true });

      const testFilePath = path.join(tempDir, 'test.test.ts');
      const proxy1Path = path.join(tempDir, 'proxy1.proxy.ts');
      const proxy2Path = path.join(tempDir, 'proxy2.proxy.ts');

      fs.writeFileSync(testFilePath, testFileContent);
      fs.writeFileSync(proxy1Path, proxy1Content);
      fs.writeFileSync(proxy2Path, proxy2Content);

      const program = ts.createProgram([testFilePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        skipLibCheck: true,
      });

      const sourceFile = program.getSourceFile(testFilePath)!;

      const transformerFactory = typescriptProxyMockTransformerAdapter({
        program,
        options: { baseDir: tempDir },
      });
      const result = ts.transform(sourceFile, [transformerFactory]);
      const transformedSourceFile = result.transformed[0]!;

      const printer = ts.createPrinter();
      const output = printer.printFile(transformedSourceFile);

      result.dispose();

      // Cleanup inline before assertions
      fs.rmSync(tempDir, { recursive: true, force: true });

      // Should hoist both mocks without infinite loop
      expect(output).toMatch(/jest\.mock\(['"]axios['"]\)/u);
      expect(output).toMatch(/jest\.mock\(['"]fs['"]\)/u);

      // Should not duplicate mocks (each mock should appear only once)
      const axiosMocks = output.match(/jest\.mock\(['"]axios['"]\)/gu);
      const fsMocks = output.match(/jest\.mock\(['"]fs['"]\)/gu);

      expect(axiosMocks).toHaveLength(1);
      expect(fsMocks).toHaveLength(1);
    });

    it('VALID: {jest.mock with factory function} => hoists both module name and factory', () => {
      const testFileContent = `
import { adapterProxy } from './test.proxy';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;

      const proxyFileContent = `
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

export const adapterProxy = () => {
  return {};
};
`;

      const output = compileWithTransformer({
        testFileContent,
        proxyFileContent,
      });

      // Verify jest.mock with factory was hoisted
      expect(output).toMatch(/jest\.mock\(['"]axios['"]/u);

      // Verify factory function is present (contains get and post)
      expect(output).toMatch(/get.*jest\.fn/u);
      expect(output).toMatch(/post.*jest\.fn/u);
    });
  });
});
