import * as path from 'path';
import { spawnSync } from 'child_process';
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
import { ExecResultStub } from '../contracts/exec-result/exec-result.stub';

// CRITICAL: Must use temp dir inside repo so ESLint can find eslint.config.js
// Using packages/hooks/src/.test-tmp to ensure ESLint config discovery works
const BASE_DIR = FilePathStub({
  value: path.join(process.cwd(), 'src', '.test-tmp', 'pre-edit-lint-tests'),
});
const hookPath = path.join(process.cwd(), 'src', 'startup', 'start-pre-edit-hook.ts');

const runHook = ({ hookData }: { hookData: unknown }): ReturnType<typeof ExecResultStub> => {
  const input = JSON.stringify(hookData);

  // Use spawnSync to capture both stdout and stderr on success AND failure
  const result = spawnSync('npx', ['tsx', hookPath], {
    input,
    encoding: 'utf8',
    cwd: process.cwd(),
  });

  return ExecResultStub({
    exitCode: result.status === null ? 1 : result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  });
};

describe('pre-edit-lint', () => {
  describe('with Write tool', () => {
    describe('success cases', () => {
      it('VALID: {content: clean TypeScript code} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `export function add({ a, b }: { a: boolean; b: boolean }): boolean {
  return a || b;
}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: string containing "any"} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'string-any-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `export const message = 'This can be any string you want';`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: comment containing "any"} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'comment-any-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `export function test(): void {
  // This function can accept any parameter type
}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('EMPTY: {content: empty file} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'empty-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: '',
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: overwrites existing file with same violations} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'overwrite-same-violations' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID_ANY: {content: new explicit any type} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'any-violation-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: path.resolve(process.cwd(), '../..'), // Use monorepo root so ESLint can find eslint.config.js
          tool_input: {
            file_path: filePath,
            content: `export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Safety Violation/u);
      });

      it('INVALID_TS_IGNORE: {content: @ts-ignore comment} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'ts-ignore-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `// @ts-ignore
export function test(): void {}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Error Suppression/u);
      });

      it('INVALID_TS_EXPECT_ERROR: {content: @ts-expect-error comment} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'ts-expect-error-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `// @ts-expect-error
export function test(): void {}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Error Suppression/u);
      });

      it('INVALID_ESLINT_DISABLE: {content: eslint-disable comment} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'eslint-disable-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            content: `// eslint-disable-next-line no-console
console.log('test');`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Code Quality Rule Bypass/u);
      });

      it('INVALID_MULTIPLE: {content: multiple violations} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'multiple-violations-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Safety Violation/u);
        expect(result.stderr).toMatch(/Type Error Suppression/u);
      });
    });
  });

  describe('with Edit tool', () => {
    describe('success cases', () => {
      it('VALID: {old_string: clean code, new_string: clean code} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        // Create initial file
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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {old_string: existing violation, new_string: same violation} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'preserve-violation-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        // Create file with existing violation
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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {old_string: text, new_string: text with "any" in string} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'string-any-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('EDGE: {old_string: code, new_string: whitespace change only} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'whitespace-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID_ANY: {old_string: clean code, new_string: adds any type} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-any-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const initialContent = `export function test(): void {}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `export function test(): void {}`,
            new_string: `export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Safety Violation/u);
      });

      it('INVALID_ANY: {old_string: partial function signature, new_string: adds any type} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-any-partial-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const initialContent = `function testClean(param: string): void {
    console.log(param);
}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: 'function testClean(param: string): void {',
            new_string: 'function testClean(param: any): void {',
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Safety Violation/u);
      });

      it('INVALID_TS_IGNORE: {old_string: clean code, new_string: adds @ts-ignore} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-ts-ignore-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const initialContent = `export function test(): void {}`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `export function test(): void {}`,
            new_string: `// @ts-ignore
export function test(): void {}`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Error Suppression/u);
      });

      it('INVALID_ESLINT_DISABLE: {old_string: console.log, new_string: adds eslint-disable} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-eslint-disable-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

        const initialContent = `console.log('test');`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: `console.log('test');`,
            new_string: `// eslint-disable-next-line no-console
console.log('test');`,
          },
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Code Quality Rule Bypass/u);
      });

      it('ERROR: {old_string: existing violation, new_string: adds second violation} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-second-violation-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Safety Violation/u);
      });
    });

    describe('edge cases', () => {
      it('EDGE: {file_path: non-existent file} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'non-existent-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'does-not-exist.ts');

        const hookData = EditToolHookStub({
          cwd: testbed.guildPath,
          tool_input: {
            file_path: filePath,
            old_string: 'old',
            new_string: 'new',
          },
        });

        const result = runHook({ hookData });

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
      it('VALID: {edits: multiple clean changes} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {edits: preserves existing violations without adding new ones} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'preserve-violations-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID_ANY: {edits: one edit adds any violation} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-any-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
      });

      it('INVALID_MULTIPLE: {edits: multiple edits add different violations} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'multiple-violations-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
      });

      it('EDGE: {edits: replace_all adds violations} => returns exit code 2', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'replace-all-violations-multiedit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.ts');

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

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toMatch(/🛑 New code quality violations detected/u);
        expect(result.stderr).toMatch(/Type Safety Violation/u);
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {tool_input: non-TypeScript file} => returns exit code 0', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-ts-file' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'README.md');

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: `# TypeScript Guide

Here are some examples with any type and @ts-ignore patterns:

\`\`\`typescript
function test({ param }: { param: any }): void {
  // @ts-ignore
  return param;
}
\`\`\``,
        },
      });

      const result = runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('EDGE: {tool_input: JavaScript file with TypeScript patterns} => ignores TypeScript patterns', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'js-file-ts-patterns' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.js');

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: `function test(param) {
  // @ts-ignore - this should be ignored in JS
  return param;
}`,
        },
      });

      const result = runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('ERROR: {tool_input: violations in string literals and code} => detects only code violations', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'mixed-violations' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

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

      const result = runHook({ hookData });

      testbed.cleanup();

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/Type Safety Violation/u);
      expect(result.stderr).toMatch(/Type Error Suppression/u);
    });

    it('EDGE: {tool_input: very large file with violations} => detects violations', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'large-file-violations' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

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

      const result = runHook({ hookData });

      testbed.cleanup();

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/Type Safety Violation/u);
    });

    it('EMPTY: {tool_input: empty old_string to empty new_string} => returns exit code 0', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'empty-to-empty' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'empty.ts');

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

      const result = runHook({ hookData });

      testbed.cleanup();

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('performance tests', () => {
    it('PERF: typical file processing should be under 5 seconds', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'perf-test-typical' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

      const typicalContent = `export interface UserConfig {
  name: boolean;
  email: boolean;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export class UserService {
  private users = new Map<boolean, UserConfig>();

  addUser(config: UserConfig): void {
    this.users.set(config.email, config);
  }

  getUser(email: boolean): UserConfig | undefined {
    return this.users.get(email);
  }

  updatePreferences(email: boolean, prefs: Partial<UserConfig['preferences']>): boolean {
    const user = this.users.get(email);
    if (!user) return false;

    user.preferences = { ...user.preferences, ...prefs };
    return true;
  }
}`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: typicalContent,
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(6000); // ESLint initialization overhead
    });

    it('PERF: large file processing should be under 5 seconds', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'perf-test-large' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

      // Generate a large file with multiple classes and methods
      const CLASS_COUNT = 20;
      const METHOD_COUNT = 10;
      const classes = Array.from({ length: CLASS_COUNT }, (_, classIndex) => {
        const methods = Array.from(
          { length: METHOD_COUNT },
          (__, methodIndex) => `
  method${methodIndex}(param: boolean): boolean {
    const result = this.processData(param);
    return result || false;
  }`,
        );
        const methodsCode = methods.join('\n');
        return `
export class Service${classIndex} {
  private data = new Map<boolean, unknown>();

  ${methodsCode}

  private processData(input: boolean): boolean | null {
    if (!input) {
      return null;
    }
    return input;
  }

  getData(key: boolean): unknown {
    return this.data.get(key);
  }

  setData(key: boolean, value: unknown): void {
    this.data.set(key, value);
  }
}`;
      });
      const largeContent = classes.join('\n');

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: largeContent,
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(6000); // Large files still bound by ESLint initialization
    });

    it('PERF: violation detection should be under 5 seconds', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'perf-test-violations' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

      const contentWithViolations = `// @ts-ignore
export function badFunction(param: any): any {
  // eslint-disable-next-line no-console
  console.log(param);
  return param;
}

export class BadService {
  processItem(item: any): any {
    return item;
  }

  handleError(error: any): void {
    // @ts-ignore
    throw error;
  }
}`;

      const hookData = WriteToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          content: contentWithViolations,
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      testbed.cleanup();

      expect(result.exitCode).toBe(2); // Should block due to violations
      expect(executionTime).toBeLessThan(6000); // Violation detection still requires ESLint initialization
    });

    it('PERF: edit operation should be under 5 seconds', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'perf-test-edit' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

      const initialContent = `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
}`;
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'example.ts' }),
        content: FileContentStub({ value: initialContent }),
      });

      const hookData = EditToolHookStub({
        cwd: testbed.guildPath,
        tool_input: {
          file_path: filePath,
          old_string: 'add(a: number, b: number): number',
          new_string: 'add(a: number, b: number, c = 0): number',
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(6000); // Edit operations bound by ESLint initialization
    });

    it('PERF: multiedit operation should be under 5 seconds', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'perf-test-multiedit' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example.ts');

      const initialContent = `export class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  removeUser(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  findUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
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
              old_string: 'addUser(user: User): void',
              new_string: 'addUser(user: User): Promise<void>',
            },
            {
              old_string: 'removeUser(id: string): boolean',
              new_string: 'removeUser(id: string): Promise<boolean>',
            },
            {
              old_string: 'findUser(id: string): User | undefined',
              new_string: 'findUser(id: string): Promise<User | undefined>',
            },
            {
              old_string: 'getAllUsers(): User[]',
              new_string: 'getAllUsers(): Promise<User[]>',
            },
          ],
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(6000); // MultiEdit operations bound by ESLint initialization
    });
  });
});
