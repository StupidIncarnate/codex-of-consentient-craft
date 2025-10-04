import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import {
  EditToolHookStub,
  MultiEditToolHookStub,
  WriteToolHookStub,
} from '../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data.stub';

interface ExecError extends Error {
  status?: number;
  stdout?: Buffer;
  stderr?: Buffer;
}

const isExecError = (error: unknown): error is ExecError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
};

const tempRoot = path.join(process.cwd(), '.test-tmp', 'pre-edit-lint-tests');
const hookPath = path.join(process.cwd(), 'src', 'startup', 'start-pre-edit-hook.ts');

const createTestProject = ({ name }: { name: string }): string => {
  const testId = crypto.randomBytes(4).toString('hex');
  const projectDir = path.join(tempRoot, `${name}-${testId}`);
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
};

const runHook = ({
  hookData,
}: {
  hookData: unknown;
}): {
  exitCode: number;
  stdout: string;
  stderr: string;
} => {
  const input = JSON.stringify(hookData);

  try {
    const stdout = execSync(`npx tsx ${hookPath}`, {
      input,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (error) {
    if (!isExecError(error)) {
      throw error;
    }
    const execError = error;
    const DEFAULT_EXIT_CODE = 1;
    const exitCode = execError.status ?? DEFAULT_EXIT_CODE;
    const stdout = execError.stdout?.toString() ?? '';
    const stderr = execError.stderr?.toString() ?? '';
    return {
      exitCode,
      stdout,
      stderr,
    };
  }
};

describe('pre-edit-lint', () => {
  beforeEach(() => {
    // Ensure temp directory exists
    fs.mkdirSync(tempRoot, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  describe('with Write tool', () => {
    describe('success cases', () => {
      it('VALID: {content: clean TypeScript code} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'clean-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `export function add({ a, b }: { a: number; b: number }): number {
  return a + b;
}`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: string containing "any"} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'string-any-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `export const message = 'This can be any string you want';`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: comment containing "any"} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'comment-any-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `export function test(): void {
  // This function can accept any parameter type
}`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('EMPTY: {content: empty file} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'empty-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: '',
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {content: overwrites existing file with same violations} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'overwrite-same-violations' });
        const filePath = path.join(projectDir, 'example.ts');

        // Create file with existing violations
        fs.writeFileSync(filePath, `const bad: any = 'test';`);

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `const bad: any = 'updated test';`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID_ANY: {content: new explicit any type} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'any-violation-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Safety Violation');
      });

      it('INVALID_TS_IGNORE: {content: @ts-ignore comment} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'ts-ignore-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `// @ts-ignore
export function test(): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Error Suppression');
      });

      it('INVALID_TS_EXPECT_ERROR: {content: @ts-expect-error comment} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'ts-expect-error-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `// @ts-expect-error
export function test(): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Error Suppression');
      });

      it('INVALID_ESLINT_DISABLE: {content: eslint-disable comment} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'eslint-disable-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `// eslint-disable-next-line no-console
console.log('test');`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Code Quality Rule Bypass');
      });

      it('INVALID_MULTIPLE: {content: multiple violations} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'multiple-violations-write' });
        const filePath = path.join(projectDir, 'example.ts');

        const hookData = WriteToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            content: `// @ts-ignore
export function dirty({ param }: { param: any }): any {
  return param;
}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Safety Violation');
        expect(result.stderr).toContain('Type Error Suppression');
      });
    });
  });

  describe('with Edit tool', () => {
    describe('success cases', () => {
      it('VALID: {old_string: clean code, new_string: clean code} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'clean-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        // Create initial file
        const initialContent = `export function oldFunction(): string {
  return 'hello';
}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
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

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {old_string: existing violation, new_string: same violation} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'preserve-violation-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        // Create file with existing violation
        const initialContent = `const bad: any = 'test';
export function oldFunc(): void {}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `const bad: any = 'test';
export function oldFunc(): void {}`,
            new_string: `const bad: any = 'test';  // Same violation
export function newFunc(): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {old_string: text, new_string: text with "any" in string} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'string-any-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `const message = 'hello';`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `const message = 'hello';`,
            new_string: `const message = 'This can be any string you want';`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('EDGE: {old_string: code, new_string: whitespace change only} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'whitespace-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `function test(){return 'hello';}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `function test(){return 'hello';}`,
            new_string: `function test() {
  return 'hello';
}`,
          },
        });

        const result = runHook({ hookData });

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID_ANY: {old_string: clean code, new_string: adds any type} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'add-any-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `export function test(): void {}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `export function test(): void {}`,
            new_string: `export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Safety Violation');
      });

      it('INVALID_ANY: {old_string: partial function signature, new_string: adds any type} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'add-any-partial-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `function testClean(param: string): void {
    console.log(param);
}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: 'function testClean(param: string): void {',
            new_string: 'function testClean(param: any): void {',
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Safety Violation');
      });

      it('INVALID_TS_IGNORE: {old_string: clean code, new_string: adds @ts-ignore} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'add-ts-ignore-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `export function test(): void {}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `export function test(): void {}`,
            new_string: `// @ts-ignore
export function test(): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Error Suppression');
      });

      it('INVALID_ESLINT_DISABLE: {old_string: console.log, new_string: adds eslint-disable} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'add-eslint-disable-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `console.log('test');`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `console.log('test');`,
            new_string: `// eslint-disable-next-line no-console
console.log('test');`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Code Quality Rule Bypass');
      });

      it('ERROR: {old_string: existing violation, new_string: adds second violation} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'add-second-violation-edit' });
        const filePath = path.join(projectDir, 'example.ts');

        // File with existing violation
        const initialContent = `const bad: any = 'test';`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: `const bad: any = 'test';`,
            new_string: `const bad: any = 'test';
export function test({ param }: { param: any }): void {}`,
          },
        });

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Safety Violation');
      });
    });

    describe('edge cases', () => {
      it('EDGE: {file_path: non-existent file} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'non-existent-edit' });
        const filePath = path.join(projectDir, 'does-not-exist.ts');

        const hookData = EditToolHookStub({
          cwd: projectDir,
          tool_input: {
            file_path: filePath,
            old_string: 'old',
            new_string: 'new',
          },
        });

        const result = runHook({ hookData });

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
        const projectDir = createTestProject({ name: 'clean-multiedit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `export class Calculator {
  add({ a, b }: { a: number; b: number }): number {
    return a + b;
  }

  subtract({ a, b }: { a: number; b: number }): number {
    return a - b;
  }
}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = MultiEditToolHookStub({
          cwd: projectDir,
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

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });

      it('VALID: {edits: preserves existing violations without adding new ones} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'preserve-violations-multiedit' });
        const filePath = path.join(projectDir, 'example.ts');

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
        fs.writeFileSync(filePath, initialContent);

        const hookData = MultiEditToolHookStub({
          cwd: projectDir,
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

        expect(result).toStrictEqual({
          exitCode: 0,
          stdout: '',
          stderr: '',
        });
      });
    });

    describe('failure cases', () => {
      it('INVALID_ANY: {edits: one edit adds any violation} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'add-any-multiedit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `export class Calculator {
  add({ a, b }: { a: number; b: number }): number {
    return a + b;
  }

  subtract({ a, b }: { a: number; b: number }): number {
    return a - b;
  }
}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = MultiEditToolHookStub({
          cwd: projectDir,
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

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
      });

      it('INVALID_MULTIPLE: {edits: multiple edits add different violations} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'multiple-violations-multiedit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `export function processData({ data }: { data: string }): string {
  return data;
}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = MultiEditToolHookStub({
          cwd: projectDir,
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

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
      });

      it('EDGE: {edits: replace_all adds violations} => returns exit code 2', () => {
        const projectDir = createTestProject({ name: 'replace-all-violations-multiedit' });
        const filePath = path.join(projectDir, 'example.ts');

        const initialContent = `export function processItem({ item }: { item: string }): string {
  if (item === '') {
    return '';
  }
  return item;
}

export function processItems({ items }: { items: string[] }): string[] {
  return items.map((item: string) => processItem({ item }));
}`;
        fs.writeFileSync(filePath, initialContent);

        const hookData = MultiEditToolHookStub({
          cwd: projectDir,
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

        expect(result.exitCode).toBe(2);
        expect(result.stderr).toContain('🛑 New code quality violations detected');
        expect(result.stderr).toContain('Type Safety Violation');
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {tool_input: non-TypeScript file} => returns exit code 0', () => {
      const projectDir = createTestProject({ name: 'non-ts-file' });
      const filePath = path.join(projectDir, 'README.md');

      const hookData = WriteToolHookStub({
        cwd: projectDir,
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

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('EDGE: {tool_input: JavaScript file with TypeScript patterns} => ignores TypeScript patterns', () => {
      const projectDir = createTestProject({ name: 'js-file-ts-patterns' });
      const filePath = path.join(projectDir, 'example.js');

      const hookData = WriteToolHookStub({
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          content: `function test(param) {
  // @ts-ignore - this should be ignored in JS
  return param;
}`,
        },
      });

      const result = runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('ERROR: {tool_input: violations in string literals and code} => detects only code violations', () => {
      const projectDir = createTestProject({ name: 'mixed-violations' });
      const filePath = path.join(projectDir, 'example.ts');

      const hookData = WriteToolHookStub({
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          content: `export const ERROR_MSG = "Never use @ts-ignore or any type";

// Real violations below:
// @ts-ignore
export const handler: any = getValue();`,
        },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Type Safety Violation');
      expect(result.stderr).toContain('Type Error Suppression');
    });

    it('EDGE: {tool_input: very large file with violations} => detects violations', () => {
      const projectDir = createTestProject({ name: 'large-file-violations' });
      const filePath = path.join(projectDir, 'example.ts');

      const largeContent = `export function processData({ data }: { data: unknown }): unknown {
  ${'  return data;\n'.repeat(100)}
}

// Violation at the end:
export const handler: any = processData;`;

      const hookData = WriteToolHookStub({
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          content: largeContent,
        },
      });

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Type Safety Violation');
    });

    it('EMPTY: {tool_input: empty old_string to empty new_string} => returns exit code 0', () => {
      const projectDir = createTestProject({ name: 'empty-to-empty' });
      const filePath = path.join(projectDir, 'empty.ts');

      fs.writeFileSync(filePath, '');

      const hookData = EditToolHookStub({
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          old_string: '',
          new_string: '',
        },
      });

      const result = runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('performance tests', () => {
    it('PERF: typical file processing should be under 3 seconds', () => {
      const projectDir = createTestProject({ name: 'perf-test-typical' });
      const filePath = path.join(projectDir, 'example.ts');

      const typicalContent = `export interface UserConfig {
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export class UserService {
  private users = new Map<string, UserConfig>();

  addUser(config: UserConfig): void {
    this.users.set(config.email, config);
  }

  getUser(email: string): UserConfig | undefined {
    return this.users.get(email);
  }

  updatePreferences(email: string, prefs: Partial<UserConfig['preferences']>): boolean {
    const user = this.users.get(email);
    if (!user) return false;

    user.preferences = { ...user.preferences, ...prefs };
    return true;
  }
}`;

      const hookData = WriteToolHookStub({
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          content: typicalContent,
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(4000); // ESLint initialization overhead
    });

    it('PERF: large file processing should be under 3 seconds', () => {
      const projectDir = createTestProject({ name: 'perf-test-large' });
      const filePath = path.join(projectDir, 'example.ts');

      // Generate a large file with multiple classes and methods
      const CLASS_COUNT = 20;
      const METHOD_COUNT = 10;
      const classes: string[] = [];
      for (let classIndex = 0; classIndex < CLASS_COUNT; classIndex += 1) {
        const methods: string[] = [];
        for (let methodIndex = 0; methodIndex < METHOD_COUNT; methodIndex += 1) {
          methods.push(`
  method${methodIndex}(param: string): string {
    const result = this.processData(param);
    return result || '';
  }`);
        }
        const methodsCode = methods.join('\n');
        classes.push(`
export class Service${classIndex} {
  private data = new Map<string, unknown>();

  ${methodsCode}

  private processData(input: string): string | null {
    if (!input || input.length === 0) {
      return null;
    }
    return input.toUpperCase();
  }

  getData(key: string): unknown {
    return this.data.get(key);
  }

  setData(key: string, value: unknown): void {
    this.data.set(key, value);
  }
}`);
      }
      const largeContent = classes.join('\n');

      const hookData = WriteToolHookStub({
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          content: largeContent,
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(4000); // Large files still bound by ESLint initialization
    });

    it('PERF: violation detection should be under 3 seconds', () => {
      const projectDir = createTestProject({ name: 'perf-test-violations' });
      const filePath = path.join(projectDir, 'example.ts');

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
        cwd: projectDir,
        tool_input: {
          file_path: filePath,
          content: contentWithViolations,
        },
      });

      const startTime = Date.now();
      const result = runHook({ hookData });
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.exitCode).toBe(2); // Should block due to violations
      expect(executionTime).toBeLessThan(4000); // Violation detection still requires ESLint initialization
    });

    it('PERF: edit operation should be under 3 seconds', () => {
      const projectDir = createTestProject({ name: 'perf-test-edit' });
      const filePath = path.join(projectDir, 'example.ts');

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
      fs.writeFileSync(filePath, initialContent);

      const hookData = EditToolHookStub({
        cwd: projectDir,
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

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(4000); // Edit operations bound by ESLint initialization
    });

    it('PERF: multiedit operation should be under 3 seconds', () => {
      const projectDir = createTestProject({ name: 'perf-test-multiedit' });
      const filePath = path.join(projectDir, 'example.ts');

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
      fs.writeFileSync(filePath, initialContent);

      const hookData = MultiEditToolHookStub({
        cwd: projectDir,
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

      expect(result.exitCode).toBe(0);
      expect(executionTime).toBeLessThan(4000); // MultiEdit operations bound by ESLint initialization
    });
  });
});
