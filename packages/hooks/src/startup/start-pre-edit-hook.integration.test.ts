import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import {
  EditToolHookStub,
  MultiEditToolHookStub,
  WriteToolHookStub,
} from '../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data.stub';

import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';
import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

// CRITICAL: Must use temp dir inside repo so ESLint can find eslint.config.js
// Using packages/hooks/src/.test-tmp to ensure ESLint config discovery works
const BASE_DIR = FilePathStub({
  value: `${process.cwd()}/src/.test-tmp/pre-edit-lint-tests`,
});

describe('pre-edit-lint', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-pre-edit-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  describe('process smoke tests', () => {
    const runner = hookRunnerHarness();

    it('VALID: success path via spawnSync => returns exit code 0', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'smoke-success' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.ts`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: `export function add({ a, b }: { a: boolean; b: boolean }): boolean {
  return a || b;
}`,
        },
      });

      const result = runner.runHook({ hookName: 'start-pre-edit-hook', hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: failure path via spawnSync => returns exit code 2', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'smoke-failure' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.ts`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: `export function test({ param }: { param: any }): void {}`,
        },
      });

      const result = runner.runHook({ hookName: 'start-pre-edit-hook', hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^🛑 New code quality violations detected:\n.+\n$/su),
      });
    });
  });

  describe('with Write tool', () => {
    describe('success cases', () => {
      it.each([
        {
          label: 'VALID: {content: clean TypeScript code}',
          baseName: 'clean-write',
          content: `export function add({ a, b }: { a: boolean; b: boolean }): boolean {
  return a || b;
}`,
        },
        {
          label: 'VALID: {content: string containing "any"}',
          baseName: 'string-any-write',
          content: `export const message = 'This can be any string you want';`,
        },
        {
          label: 'VALID: {content: comment containing "any"}',
          baseName: 'comment-any-write',
          content: `export function test(): void {
  // This function can accept any parameter type
}`,
        },
        {
          label: 'EMPTY: {content: empty file}',
          baseName: 'empty-write',
          content: '',
        },
      ])('$label => returns exit code 0', async ({ baseName, content }) => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: baseName }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: overwrites existing file with same violations} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'overwrite-same-violations' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        // Create file with existing violations
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: `const bad: any = 'test';` }),
        });

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `const bad: any = 'updated test';`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID: {content: new explicit any type} => returns exit code 2', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'any-violation-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const hookData = WriteToolHookStub({
          cwd: `${process.cwd()}/../..`, // Use monorepo root so ESLint can find eslint.config.js
          tool_input: {
            file_path: filePath,
            content: `export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(
            /^🛑 New code quality violations detected:\n.+Type Safety Violation.+\n$/su,
          ),
        });
      });

      it.each([
        {
          label: 'INVALID: {content: @ts-ignore comment}',
          baseName: 'ts-ignore-write',
          content: `// @ts-ignore
export function test(): void {}`,
          expectedPattern: /Type Error Suppression/u,
        },
        {
          label: 'INVALID: {content: @ts-expect-error comment}',
          baseName: 'ts-expect-error-write',
          content: `// @ts-expect-error
export function test(): void {}`,
          expectedPattern: /Type Error Suppression/u,
        },
        {
          label: 'INVALID: {content: eslint-disable comment}',
          baseName: 'eslint-disable-write',
          content: `// eslint-disable-next-line no-console
console.log('test');`,
          expectedPattern: /Code Quality Rule Bypass/u,
        },
      ])('$label => returns exit code 2', async ({ baseName, content, expectedPattern }) => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: baseName }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(
            new RegExp(
              `^🛑 New code quality violations detected:\\n.+${expectedPattern.source}.+\\n$`,
              'su',
            ),
          ),
        });
      });

      it('INVALID: {content: multiple violations} => returns exit code 2', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'multiple-violations-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `// @ts-ignore
export function dirty({ param }: { param: any }): any {
  return param;
}`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(
            /^🛑 New code quality violations detected:\n.+Type Error Suppression.+Type Safety Violation.+\n$/su,
          ),
        });
      });
    });
  });

  describe('with Edit tool', () => {
    describe('success cases', () => {
      it('VALID: {old_string: clean code, new_string: clean code} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `export function oldFunction(): string {
  return 'hello';
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `export function oldFunction(): string {
  return 'hello';
}`,
            new_string: `export function newFunction(): string {
  return 'hello world';
}`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {old_string: existing violation, new_string: same violation} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'preserve-violation-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `const bad: any = 'test';
export function oldFunc(): void {}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `const bad: any = 'test';
export function oldFunc(): void {}`,
            new_string: `const bad: any = 'test';  // Same violation
export function newFunc(): void {}`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {old_string: text, new_string: text with "any" in string} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'string-any-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `const message = 'hello';`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `const message = 'hello';`,
            new_string: `const message = 'This can be any string you want';`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('EDGE: {old_string: code, new_string: whitespace change only} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'whitespace-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `function test(){return 'hello';}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `function test(){return 'hello';}`,
            new_string: `function test() {
  return 'hello';
}`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it.each([
        {
          label: 'INVALID: {old_string: clean code, new_string: adds any type}',
          baseName: 'add-any-edit',
          initialContent: `export function test(): void {}`,
          oldString: `export function test(): void {}`,
          newString: `export function test({ param }: { param: any }): void {}`,
          expectedPattern: /Type Safety Violation/u,
        },
        {
          label: 'INVALID: {old_string: partial function signature, new_string: adds any type}',
          baseName: 'add-any-partial-edit',
          initialContent: `function testClean(param: string): void {
    console.log(param);
}`,
          oldString: 'function testClean(param: string): void {',
          newString: 'function testClean(param: any): void {',
          expectedPattern: /Type Safety Violation/u,
        },
        {
          label: 'INVALID: {old_string: clean code, new_string: adds @ts-ignore}',
          baseName: 'add-ts-ignore-edit',
          initialContent: `export function test(): void {}`,
          oldString: `export function test(): void {}`,
          newString: `// @ts-ignore
export function test(): void {}`,
          expectedPattern: /Type Error Suppression/u,
        },
        {
          label: 'INVALID: {old_string: console.log, new_string: adds eslint-disable}',
          baseName: 'add-eslint-disable-edit',
          initialContent: `console.log('test');`,
          oldString: `console.log('test');`,
          newString: `// eslint-disable-next-line no-console
console.log('test');`,
          expectedPattern: /Code Quality Rule Bypass/u,
        },
      ])(
        '$label => returns exit code 2',
        async ({ baseName, initialContent, oldString, newString, expectedPattern }) => {
          const testbed = installTestbedCreateBroker({
            baseName: BaseNameStub({ value: baseName }),
            baseDir: BASE_DIR,
          });

          const filePath = `${testbed.guildPath}/example.ts`;

          testbed.writeFile({
            relativePath: RelativePathStub({ value: 'example.ts' }),
            content: FileContentStub({ value: initialContent }),
          });

          const hookData = EditToolHookStub({
            cwd: testbed.guildPath,
            tool_input: {
              file_path: filePath,
              old_string: oldString,
              new_string: newString,
            },
          });

          const result = await persistentRunner.runHook({ hookData });

          testbed.cleanup();

          expect(result).toStrictEqual({
            exitCode: 2,
            stdout: '',
            stderr: expect.stringMatching(
              new RegExp(
                `^🛑 New code quality violations detected:\\n.+${expectedPattern.source}.+\\n$`,
                'su',
              ),
            ),
          });
        },
      );

      it('ERROR: {old_string: existing violation, new_string: adds second violation} => returns exit code 2', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-second-violation-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        // File with existing violation
        const initialContent = `const bad: any = 'test';`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `const bad: any = 'test';`,
            new_string: `const bad: any = 'test';
export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(
            /^🛑 New code quality violations detected:\n.+Type Safety Violation.+\n$/su,
          ),
        });
      });
    });

    describe('edge cases', () => {
      it('EDGE: {file_path: non-existent file} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'non-existent-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/does-not-exist.ts`;

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: 'old',
            new_string: 'new',
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });
  });

  describe('with MultiEdit tool', () => {
    describe('success cases', () => {
      it('VALID: {edits: multiple clean changes} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `export class Calculator {
  add({ a, b }: { a: number; b: number }): number {
    return a + b;
  }

  subtract({ a, b }: { a: number; b: number }): number {
    return a - b;
  }
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = MultiEditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            edits: [
              {
                old_string: 'add({ a, b }: { a: number; b: number }): number',
                new_string: 'add({ a, b, c = 0 }: { a: number; b: number; c?: number }): number',
              },
              {
                old_string: 'return a + b;',
                new_string: 'return a + b + c;',
              },
            ],
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {edits: preserves existing violations without adding new ones} => returns exit code 0', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'preserve-violations-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        // File with existing violations
        const initialContent = `// @ts-ignore
export class Calculator {
  add({ a, b }: { a: any; b: any }): any {
    return a + b;
  }

  subtract({ a, b }: { a: number; b: number }): number {
    return a - b;
  }
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = MultiEditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            edits: [
              {
                old_string: '// @ts-ignore\nexport class Calculator {',
                new_string: '// @ts-ignore\nexport class AdvancedCalculator {',
              },
              {
                old_string: 'add({ a, b }: { a: any; b: any }): any {',
                new_string: 'add({ a, b, c = 0 }: { a: any; b: any; c?: number }): any {',
              },
            ],
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID: {edits: one edit adds any violation} => returns exit code 2', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-any-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `export class Calculator {
  add({ a, b }: { a: number; b: number }): number {
    return a + b;
  }

  subtract({ a, b }: { a: number; b: number }): number {
    return a - b;
  }
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = MultiEditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            edits: [
              {
                old_string: 'add({ a, b }: { a: number; b: number }): number',
                new_string: 'add({ a, b }: { a: any; b: any }): any',
              },
              {
                old_string: 'export class Calculator {',
                new_string: '// @ts-ignore\nexport class Calculator {',
              },
            ],
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(/^🛑 New code quality violations detected:\n.+\n$/su),
        });
      });

      it('INVALID: {edits: multiple edits add different violations} => returns exit code 2', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'multiple-violations-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `export function processData({ data }: { data: string }): string {
  return data;
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = MultiEditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            edits: [
              {
                old_string: 'data: string',
                new_string: 'data: any',
              },
              {
                old_string: 'export function processData',
                new_string: '// @ts-ignore\nexport function processData',
              },
              {
                old_string: '): string {',
                new_string: '): any {',
              },
            ],
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(/^🛑 New code quality violations detected:\n.+\n$/su),
        });
      });

      it('EDGE: {edits: replace_all adds violations} => returns exit code 2', async () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'replace-all-violations-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = `${testbed.guildPath}/example.ts`;

        const initialContent = `export function processItem({ item }: { item: string }): string {
  if (item === '') {
    return '';
  }
  return item;
}

export function processItems({ items }: { items: string[] }): string[] {
  return items.map((item: string) => processItem({ item }));
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = MultiEditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            edits: [
              {
                old_string: 'string',
                new_string: 'any',
                replace_all: true,
              },
            ],
          },
        });

        const result = await persistentRunner.runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 2,
          stdout: '',
          stderr: expect.stringMatching(
            /^🛑 New code quality violations detected:\n.+Type Safety Violation.+\n$/su,
          ),
        });
      });
    });
  });

  describe('edge cases', () => {
    it.each([
      {
        label: 'EDGE: {tool_input: non-TypeScript file} => returns exit code 0',
        baseName: 'non-ts-file',
        fileName: 'README.md',
        content: `# TypeScript Guide

Here are some examples with any type and @ts-ignore patterns:

\`\`\`typescript
function test({ param }: { param: any }): void {
  // @ts-ignore
  return param;
}
\`\`\``,
      },
      {
        label:
          'EDGE: {tool_input: JavaScript file with TypeScript patterns} => ignores TypeScript patterns',
        baseName: 'js-file-ts-patterns',
        fileName: 'example.js',
        content: `function test(param) {
  // @ts-ignore - this should be ignored in JS
  return param;
}`,
      },
    ])('$label', async ({ baseName, fileName, content }) => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: baseName }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/${fileName}`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content,
        },
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('ERROR: {tool_input: violations in string literals and code} => detects only code violations', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'mixed-violations' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.ts`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: `export const ERROR_MSG = "Never use @ts-ignore or any type";

// Real violations below:
// @ts-ignore
export const handler: any = getValue();`,
        },
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(
          /^🛑 New code quality violations detected:\n.+Type Error Suppression.+Type Safety Violation.+\n$/su,
        ),
      });
    });

    it('EDGE: {tool_input: very large file with violations} => detects violations', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'large-file-violations' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/example.ts`;

      const largeContent = `export function processData({ data }: { data: unknown }): unknown {
  ${'  return data;\n'.repeat(100)}
}

// Violation at the end:
export const handler: any = processData;`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: largeContent,
        },
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(
          /^🛑 New code quality violations detected:\n.+Type Safety Violation.+\n$/su,
        ),
      });
    });

    it('EMPTY: {tool_input: empty old_string to empty new_string} => returns exit code 0', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'empty-to-empty' }),
        baseDir: BASE_DIR,
      });

      const filePath = `${testbed.guildPath}/empty.ts`;

      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'empty.ts' }),
        content: FileContentStub({ value: '' }),
      });

      const hookData = EditToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          old_string: '',
          new_string: '',
        },
      });

      const result = await persistentRunner.runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });
});
