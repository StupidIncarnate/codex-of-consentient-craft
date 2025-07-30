import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import {
  PreToolUseHookStub,
  PostToolUseHookStub,
  WriteToolHookStub,
  EditToolHookStub,
  MultiEditToolHookStub,
} from '../../tests/stubs/hook-data.stub';

interface ExecError extends Error {
  status?: number;
  stdout?: Buffer;
  stderr?: Buffer;
}

describe('sanitation-hook', () => {
  const tempRoot = path.join(process.cwd(), '.test-tmp', 'sanitation-hook-tests');
  const hookPath = path.join(process.cwd(), 'src', 'hooks', 'sanitation-hook.ts');

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

  function createTestProject(name: string) {
    const testId = crypto.randomBytes(4).toString('hex');
    const projectDir = path.join(tempRoot, `${name}-${testId}`);
    fs.mkdirSync(projectDir, { recursive: true });
    return projectDir;
  }

  function runHook(hookData: unknown): { exitCode: number; stdout: string; stderr: string } {
    const input = JSON.stringify(hookData);

    try {
      const stdout = execSync(`npx tsx ${hookPath}`, {
        input,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { exitCode: 0, stdout, stderr: '' };
    } catch (error) {
      const execError = error as ExecError;
      return {
        exitCode: execError.status || 1,
        stdout: execError.stdout?.toString() || '',
        stderr: execError.stderr?.toString() || '',
      };
    }
  }

  describe('runHook()', () => {
    describe('when handling PreToolUse event', () => {
      describe('with Write tool', () => {
        describe('when content is valid TypeScript', () => {
          it('returns exit code 0', () => {
            const projectDir = createTestProject('valid-write');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = PreToolUseHookStub({
              cwd: projectDir,
              tool_name: 'Write',
              tool_input: {
                file_path: filePath,
                content: `export function add(a: number, b: number): number {
  return a + b;
}
`,
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('when content has TypeScript escape hatches', () => {
          it('content with @ts-ignore and : any → exits with code 2 and error message', () => {
            const projectDir = createTestProject('escape-hatch-write');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '550e8400-e29b-41d4-a716-446655440000',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: [
                  '// @',
                  'ts-ignore\n',
                  'export function add(a: ',
                  'any, b: ',
                  'any): ',
                  'any {\n',
                  '  return a + b;\n',
                  '}\n',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('Code quality escape hatches detected');
            expect(result.stderr).toContain("'any'");
          });

          it('Write overwriting file that already had escape hatches → allows if not adding new ones', () => {
            const projectDir = createTestProject('escape-hatch-overwrite');
            const filePath = path.join(projectDir, 'example.ts');

            // Create file with existing escape hatches
            fs.writeFileSync(
              filePath,
              `// @ts-ignore
export function add(a: any, b: any): any {
  return a + b;
}
`,
            );

            // Write new content that still has the same escape hatches
            const hookData = WriteToolHookStub({
              session_id: '550e8400-e29b-41d4-a716-446655440001',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `// @ts-ignore
export function add(a: any, b: any): any {
  console.log('Adding numbers');
  return a + b;
}
`,
              },
            });

            const result = runHook(hookData);

            // Should allow since not introducing NEW escape hatches
            expect(result.exitCode).toBe(0);
          });
        });

        describe('when content has ESLint escape hatches', () => {
          it('content with eslint-disable → exits with code 2 and error message', () => {
            const projectDir = createTestProject('lint-error-write');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: [
                  '// eslint',
                  '-disable-next-line\n',
                  'export function add(a: number, b: number): number {\n',
                  '  return a + b;\n',
                  '}\n',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('Code quality escape hatches detected');
            expect(result.stderr).toContain('eslint-disable');
          });
        });
      });

      describe('with Edit tool', () => {
        describe('when editing existing file', () => {
          it('valid edit on existing file → exits with code 0', () => {
            const projectDir = createTestProject('edit-full-content');
            const filePath = path.join(projectDir, 'example.ts');

            // Create initial file
            const initialContent = `export interface User {
  id: string;
  name: string;
}
`;
            fs.writeFileSync(filePath, initialContent);

            const hookData = EditToolHookStub({
              session_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: '  name: string;\n}',
                new_string: '  name: string;\n  email: string;\n}',
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('edit adding new escape hatch → exits with code 2', () => {
            const projectDir = createTestProject('edit-add-escape-hatch');
            const filePath = path.join(projectDir, 'example.ts');

            // Create initial file without escape hatches
            const initialContent = `export function add(a: number, b: number): number {
  return a + b;
}
`;
            fs.writeFileSync(filePath, initialContent);

            const hookData = EditToolHookStub({
              session_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c9',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'export function add(a: number, b: number): number {',
                new_string: '// @ts-ignore\nexport function add(a: any, b: any): any {',
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('[PreToolUse Hook] New escape hatches detected');
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain("'any'");
          });

          it('edit on line that already has escape hatch → allows preserving it', () => {
            const projectDir = createTestProject('edit-preserve-escape-hatch');
            const filePath = path.join(projectDir, 'example.ts');

            // Create file with existing escape hatch
            const initialContent = `// @ts-ignore
export function add(a: any, b: any): any {
  return a + b;
}
`;
            fs.writeFileSync(filePath, initialContent);

            // Edit that preserves the existing escape hatch
            const hookData = EditToolHookStub({
              session_id: '6ba7b811-9dad-11d1-80b4-00c04fd430ca',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: '// @ts-ignore\nexport function add(a: any, b: any): any {',
                new_string: '// @ts-ignore\nexport function add(a: any, b: any, c: any = 0): any {',
              },
            });

            const result = runHook(hookData);

            // Should allow since not introducing NEW escape hatches
            expect(result.exitCode).toBe(0);
          });

          it('file has escape hatch, edit on different line → allows', () => {
            const projectDir = createTestProject('edit-different-line');
            const filePath = path.join(projectDir, 'example.ts');

            // Create file with escape hatch in one function
            const initialContent = `// @ts-ignore
export function add(a: any, b: any): any {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
`;
            fs.writeFileSync(filePath, initialContent);

            // Edit the clean function (no escape hatches)
            const hookData = EditToolHookStub({
              session_id: '6ba7b811-9dad-11d1-80b4-00c04fd430cb',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'export function subtract(a: number, b: number): number {',
                new_string:
                  'export function subtract(a: number, b: number, c: number = 0): number {',
              },
            });

            const result = runHook(hookData);

            // Should allow since not introducing NEW escape hatches
            expect(result.exitCode).toBe(0);
          });

          it('edit that would create type errors → exits with code 0 (pre-hook filters TS errors)', () => {
            const projectDir = createTestProject('edit-detect-errors');
            const filePath = path.join(projectDir, 'example.ts');

            // Create initial file
            const initialContent = `export interface User {
  id: string;
  name: string;
}

export function getUser(id: string): User {
  return {
    id,
    name: 'Test User',
  };
}
`;
            fs.writeFileSync(filePath, initialContent);

            // Edit that will make the function return type incorrect
            const hookData = EditToolHookStub({
              session_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: '  name: string;\n}',
                new_string: '  name: string;\n  email: string;\n}',
              },
            });

            const result = runHook(hookData);

            // This should pass because the edit itself doesn't introduce syntax errors
            // (TypeScript type checking would catch the mismatch, but that's filtered in pre-hook)
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });
      });

      describe('with MultiEdit tool', () => {
        describe('when applying multiple edits', () => {
          it('valid edits → exits with code 0', () => {
            const projectDir = createTestProject('multiedit-test');
            const filePath = path.join(projectDir, 'example.ts');

            // Create initial file
            const initialContent = `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }
}
`;
            fs.writeFileSync(filePath, initialContent);

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: 'add(a: number, b: number): number',
                    new_string: 'add(a: number, b: number, c: number = 0): number',
                  },
                  {
                    old_string: 'return a + b;',
                    new_string: 'return a + b + c;',
                  },
                ],
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('multiedit with one edit adding escape hatch → exits with code 2', () => {
            const projectDir = createTestProject('multiedit-add-escape');
            const filePath = path.join(projectDir, 'example.ts');

            // Create initial file without escape hatches
            const initialContent = `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }
}
`;
            fs.writeFileSync(filePath, initialContent);

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b813-9dad-11d1-80b4-00c04fd430cc',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: 'add(a: number, b: number): number',
                    new_string: 'add(a: any, b: any): any',
                  },
                  {
                    old_string: 'export class Calculator {',
                    new_string: '// @ts-ignore\nexport class Calculator {',
                  },
                ],
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('[PreToolUse Hook] New escape hatches detected');
          });

          it('multiedit preserving existing escape hatches → allows', () => {
            const projectDir = createTestProject('multiedit-preserve-escape');
            const filePath = path.join(projectDir, 'example.ts');

            // Create file with existing escape hatches
            const initialContent = `// @ts-ignore
export class Calculator {
  add(a: any, b: any): any {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }
}
`;
            fs.writeFileSync(filePath, initialContent);

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b813-9dad-11d1-80b4-00c04fd430cd',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: '// @ts-ignore\nexport class Calculator {',
                    new_string: '// @ts-ignore\nexport class AdvancedCalculator {',
                  },
                  {
                    old_string: 'add(a: any, b: any): any {',
                    new_string: 'add(a: any, b: any, c: any = 0): any {',
                  },
                ],
              },
            });

            const result = runHook(hookData);

            // Should allow since not introducing NEW escape hatches
            expect(result.exitCode).toBe(0);
          });

          it('edits with replace_all → exits with appropriate code', () => {
            const projectDir = createTestProject('multiedit-replace-all');
            const filePath = path.join(projectDir, 'example.ts');

            // Create initial file with proper types
            const initialContent = `export function processItem(item: string): string {
  if (item === '') {
    return '';
  }
  return item;
}

export function processItems(items: string[]): string[] {
  return items.map((item: string) => processItem(item));
}
`;
            fs.writeFileSync(filePath, initialContent);

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: 'string',
                    new_string: 'unknown',
                    replace_all: true,
                  },
                ],
              },
            });

            const result = runHook(hookData);

            // This might fail if there are type errors after replacing string with unknown
            // but it should at least run without crashing
            expect([0, 2]).toContain(result.exitCode);
          });
        });
      });

      describe('edge cases', () => {
        describe('when file does not exist', () => {
          it('Edit on non-existent file → exits with code 0', () => {
            const projectDir = createTestProject('non-existent-edit');
            const filePath = path.join(projectDir, 'does-not-exist.ts');

            const hookData = EditToolHookStub({
              session_id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'old',
                new_string: 'new',
              },
            });

            const result = runHook(hookData);

            // Should fall back to using just the new_string for linting
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('when content is empty', () => {
          it('Write with empty content → exits with code 0', () => {
            const projectDir = createTestProject('empty-content');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: '',
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('when file is non-lintable', () => {
          it('Write to README.md → exits with code 0', () => {
            const projectDir = createTestProject('non-lintable');
            const filePath = path.join(projectDir, 'README.md');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: '# Hello World\n\nThis is a markdown file.',
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('escape hatch patterns in string literals', () => {
          it('Write with escape hatches in string literals → exits with code 0', () => {
            const projectDir = createTestProject('escape-in-strings');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430cf',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: [
                  'export function getErrorMessage(): string {\n',
                  '  return "Use @',
                  "ts-ignore sparingly and avoid using '",
                  'any\' type";\n',
                  '}\n\n',
                  "export const LINT_MESSAGE = 'Do not use eslint",
                  "-disable comments';\n",
                  'export const TEMPLATE = `\n',
                  '  // This is a template with @',
                  'ts-expect-error\n',
                  '  const value: ',
                  'any = getValue();\n',
                  '`;',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            // Should allow escape hatch patterns in string literals
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('Edit changing string literal with escape hatches → exits with code 0', () => {
            const projectDir = createTestProject('edit-string-with-escapes');
            const filePath = path.join(projectDir, 'example.ts');

            // Create file with escape hatches in strings
            fs.writeFileSync(
              filePath,
              [
                'export const ERROR_MSG = "Do not use @',
                'ts-ignore";\n',
                'export const LINT_MSG = "Avoid eslint',
                '-disable";',
              ].join(''),
            );

            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d0',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: ['export const ERROR_MSG = "Do not use @', 'ts-ignore";'].join(''),
                new_string: [
                  'export const ERROR_MSG = "Never use @',
                  'ts-ignore or ',
                  'any type";',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            // Should allow because patterns are in string literals
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('Write with escape hatches in comments about strings → exits with code 2', () => {
            const projectDir = createTestProject('escape-in-comment-about-string');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d1',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: [
                  '// This function returns ',
                  'any type\n',
                  '// @',
                  'ts-ignore\n',
                  'export function getValue(): ',
                  'any {\n',
                  '  return "This string mentions @',
                  'ts-ignore safely";\n',
                  '}',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            // Should detect escape hatches in actual code/comments, not in strings
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('ignore');
            expect(result.stderr).toContain('any');
          });
        });

        describe('complex escape hatch scenarios', () => {
          it('Write with multiple escape hatch types together → reports all violations', () => {
            const projectDir = createTestProject('multiple-escape-types');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d2',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: [
                  '// @',
                  'ts-nocheck\n',
                  '/* eslint',
                  '-disable */\n',
                  '// @',
                  'ts-ignore\n',
                  'export function process(data: ',
                  'any): ',
                  'any {\n',
                  '  // @',
                  'ts-expect-error\n',
                  '  return data.nonExistent;\n',
                  '}',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('nocheck');
            expect(result.stderr).toContain('ignore');
            expect(result.stderr).toContain('expect-error');
            expect(result.stderr).toContain('eslint');
            expect(result.stderr).toContain('any');
          });

          it('MultiEdit gradually adding escape hatches → detects new additions', () => {
            const projectDir = createTestProject('gradual-escape-addition');
            const filePath = path.join(projectDir, 'example.ts');

            // Start with clean code
            fs.writeFileSync(
              filePath,
              `export function process(data: unknown): unknown {
  return data;
}`,
            );

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d3',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: 'data: unknown',
                    new_string: ['data: ', 'any'].join(''),
                  },
                  {
                    old_string: 'export function process',
                    new_string: ['// @', 'ts-ignore\nexport function process'].join(''),
                  },
                  {
                    old_string: '): unknown {',
                    new_string: ['): ', 'any {'].join(''),
                  },
                ],
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('[PreToolUse Hook] New escape hatches detected');
          });

          it('Edit removing some but not all escape hatches → allows partial cleanup', () => {
            const projectDir = createTestProject('partial-escape-cleanup');
            const filePath = path.join(projectDir, 'example.ts');

            // Create file with multiple escape hatches
            fs.writeFileSync(
              filePath,
              [
                '// @',
                'ts-ignore\n',
                '// eslint',
                '-disable-next-line\n',
                'export function process(data: ',
                'any): ',
                'any {\n',
                '  return data;\n',
                '}',
              ].join(''),
            );

            // Remove one escape hatch but keep others
            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d4',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: [
                  '// @',
                  'ts-ignore\n',
                  '// eslint',
                  '-disable-next-line\n',
                  'export function process(data: ',
                  'any): ',
                  'any {',
                ].join(''),
                new_string: [
                  '// @',
                  'ts-ignore\n',
                  'export function process(data: ',
                  'any): ',
                  'any {',
                ].join(''),
              },
            });

            const result = runHook(hookData);

            // Should allow because we're reducing escape hatches
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('file type filtering', () => {
          it('Write to markdown file with TypeScript patterns → exits with code 0', () => {
            const projectDir = createTestProject('md-with-ts-patterns');
            const filePath = path.join(projectDir, 'guide.md');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430c9',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `# TypeScript Guide

Here are some examples:

\`\`\`typescript
function test(param: any) {
  // @ts-ignore
  return param;
}
\`\`\`

Use \`eslint-disable\` sparingly.`,
              },
            });

            const result = runHook(hookData);

            // Should allow TypeScript patterns in markdown files
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('Write to JavaScript file with TypeScript patterns → ignores TS patterns but checks ESLint', () => {
            const projectDir = createTestProject('js-with-ts-patterns');
            const filePath = path.join(projectDir, 'example.js');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430ca',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `function test(param) {
  // @ts-ignore - this should be ignored in JS
  /* eslint-disable */ // this should be caught
  return param;
}`,
              },
            });

            const result = runHook(hookData);

            // Should catch eslint-disable but ignore @ts-ignore in JS files
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('eslint-disable');
            expect(result.stderr).not.toContain('@ts-ignore');
          });

          it('Write to TypeScript file with all patterns → catches all patterns', () => {
            const projectDir = createTestProject('ts-with-all-patterns');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430cb',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `function test(param: any) {
  // @ts-ignore
  /* eslint-disable */
  return param;
}`,
              },
            });

            const result = runHook(hookData);

            // Should catch all patterns in TypeScript files
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain('eslint-disable');
          });

          it('Write to test file with escape hatches → exits with code 2', () => {
            const projectDir = createTestProject('test-file-with-escape-hatches');
            const filePath = path.join(projectDir, 'example.test.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430cc',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `describe('test', () => {
  it('should handle any type', () => {
    // @ts-ignore
    const mockFn = jest.fn() as any;
    /* eslint-disable */
    expect(mockFn).toBeDefined();
  });
});`,
              },
            });

            const result = runHook(hookData);

            // Test files should have escape hatch protection
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('Code quality escape hatches detected');
          });

          it('Edit adding TypeScript patterns to JavaScript file → ignores TS patterns', () => {
            const projectDir = createTestProject('edit-js-with-ts');
            const filePath = path.join(projectDir, 'example.js');

            // Create initial JS file
            fs.writeFileSync(
              filePath,
              `function test(param) {
  return param;
}`,
            );

            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430cd',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'function test(param) {',
                new_string: '// @ts-ignore\nfunction test(param) { // any param',
              },
            });

            const result = runHook(hookData);

            // Should ignore TypeScript patterns in JS files
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('Edit adding eslint-disable to markdown file → ignores pattern', () => {
            const projectDir = createTestProject('edit-md-with-eslint');
            const filePath = path.join(projectDir, 'README.md');

            // Create initial markdown file
            fs.writeFileSync(
              filePath,
              `# Guide

Some content here.`,
            );

            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430ce',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'Some content here.',
                new_string: 'Use `eslint-disable` carefully in your code.',
              },
            });

            const result = runHook(hookData);

            // Should ignore eslint-disable pattern in markdown files
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('edge cases with special characters and escaping', () => {
          it('Write with escape hatches in regex patterns → detects correctly', () => {
            const projectDir = createTestProject('escape-in-regex');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d5',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `const pattern = /any|@ts-ignore/;
// But this is real: @ts-ignore
export function test(param: any): void {
  console.log(pattern);
}`,
              },
            });

            const result = runHook(hookData);

            // Should detect real escape hatches, not patterns in regex
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain('any');
          });

          it('Write with escape hatches in backticks spanning lines → handles correctly', () => {
            const projectDir = createTestProject('escape-in-multiline-template');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d6',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `export const SQL_QUERY = \`
  SELECT * FROM users
  WHERE type = 'any'
  -- @ts-ignore this SQL comment
\`;

// Real escape hatch outside string
// @ts-ignore
const result: any = executeQuery(SQL_QUERY);`,
              },
            });

            const result = runHook(hookData);

            // Should only detect escape hatches outside template literals
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain('any');
          });

          it('Write with escaped quotes containing escape hatches → handles correctly', () => {
            const projectDir = createTestProject('escape-in-escaped-quotes');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d9',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `export const MSG = "He said \\"Use any type carefully\\"";
export const OTHER = 'Don\\'t use @ts-ignore';
// But this is real
const value: any = 42;`,
              },
            });

            const result = runHook(hookData);

            // Should detect real escape hatch, not ones in strings
            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
            expect(result.stderr).not.toContain('@ts-ignore'); // This one is only in a string
          });
        });

        describe('escape hatches in different file locations', () => {
          it('Write adding escape hatch at end of file → detects correctly', () => {
            const projectDir = createTestProject('escape-at-eof');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d7',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `export function clean(): void {
  console.log('clean code');
}
// @ts-ignore`,
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
          });

          it('MultiEdit with escape hatches in first and last edits → detects all', () => {
            const projectDir = createTestProject('escape-first-last-edit');
            const filePath = path.join(projectDir, 'example.ts');

            fs.writeFileSync(
              filePath,
              `export class Service {
  method1(): void {}
  method2(): void {}
  method3(): void {}
}`,
            );

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430d8',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: 'export class Service {',
                    new_string: '// @ts-nocheck\nexport class Service {',
                  },
                  {
                    old_string: 'method2(): void {}',
                    new_string: 'method2(): void { console.log("updated"); }',
                  },
                  {
                    old_string: 'method3(): void {}',
                    new_string: 'method3(): any { return "changed"; }',
                  },
                ],
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-nocheck');
            expect(result.stderr).toContain('any');
          });
        });

        describe('escape hatch detection with replace_all', () => {
          it('MultiEdit with replace_all adding escape hatches → detects correctly', () => {
            const projectDir = createTestProject('replace-all-escape');
            const filePath = path.join(projectDir, 'example.ts');

            fs.writeFileSync(
              filePath,
              `export function process(data: unknown): unknown {
  if (typeof data === 'unknown') {
    return data;
  }
  return data;
}`,
            );

            const hookData = MultiEditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430da',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                edits: [
                  {
                    old_string: 'unknown',
                    new_string: 'any',
                    replace_all: true,
                  },
                ],
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
          });

          it('Edit with replace_all preserving existing escape hatches → allows', () => {
            const projectDir = createTestProject('replace-all-preserve');
            const filePath = path.join(projectDir, 'example.ts');

            fs.writeFileSync(
              filePath,
              `// @ts-ignore
export function oldName(data: any): any {
  return data;
}
export function oldNameHelper() {}`,
            );

            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430db',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'oldName',
                new_string: 'newName',
                replace_all: true,
              },
            });

            const result = runHook(hookData);

            // Should allow because not adding NEW escape hatches
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('boundary conditions', () => {
          it('Write with escape hatch as the only content → detects', () => {
            const projectDir = createTestProject('only-escape-hatch');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430dc',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: '// @ts-ignore',
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
          });

          it('Write with very long line containing escape hatch → detects', () => {
            const projectDir = createTestProject('long-line-escape');
            const filePath = path.join(projectDir, 'example.ts');

            const longLine = 'x'.repeat(1000) + ': any = ' + "'y'".repeat(100) + ';';

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430dd',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `export const ${longLine}`,
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
          });

          it('Edit on empty file adding escape hatch → detects', () => {
            const projectDir = createTestProject('empty-file-escape');
            const filePath = path.join(projectDir, 'empty.ts');

            // Create empty file
            fs.writeFileSync(filePath, '');

            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430de',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: '',
                new_string: '// @ts-ignore\nexport const x: any = 1;',
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain('any');
          });
        });

        describe('complex generic patterns', () => {
          it('Write with any in complex generic types → detects all instances', () => {
            const projectDir = createTestProject('complex-generics');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430df',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `type ComplexType<T> = {
  data: Array<any>;
  map: Map<string, any>;
  promise: Promise<any>;
  func: (x: any) => any;
  conditional: T extends any ? true : false;
  record: Record<string, any>;
};`,
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
          });

          it('Edit converting specific types to any → detects', () => {
            const projectDir = createTestProject('type-to-any');
            const filePath = path.join(projectDir, 'example.ts');

            fs.writeFileSync(
              filePath,
              `interface User {
  id: string;
  name: string;
  age: number;
}

function processUser(user: User): string {
  return user.name;
}`,
            );

            const hookData = EditToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430e0',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                old_string: 'function processUser(user: User): string {',
                new_string: 'function processUser(user: any): any {',
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
          });
        });

        describe('escape hatches with decorators and metadata', () => {
          it('Write with escape hatches near decorators → detects correctly', () => {
            const projectDir = createTestProject('decorator-escape');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430e1',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `@Injectable()
// @ts-ignore
export class UserService {
  // eslint-disable-next-line
  constructor(private db: any) {}
  
  @Get()
  async getUser(id: any): Promise<any> {
    return this.db.findOne(id);
  }
}`,
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain('eslint-disable');
            expect(result.stderr).toContain('any');
          });
        });

        describe('escape hatches in imports and exports', () => {
          it('Write with any in import/export statements → detects', () => {
            const projectDir = createTestProject('import-export-any');
            const filePath = path.join(projectDir, 'example.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430e2',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `// @ts-ignore
import { someFunc } from './untyped-module';

export const handler: any = someFunc;
export type AnyAlias = any;
export interface Config {
  options: any;
}`,
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain('any');
          });
        });

        describe('non-TypeScript file behavior', () => {
          it('Write to .d.ts file with any → detects (declaration files need quality too)', () => {
            const projectDir = createTestProject('dts-file-any');
            const filePath = path.join(projectDir, 'types.d.ts');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430e3',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `declare module 'untyped-module' {
  export function someFunc(): any;
  export const config: any;
}`,
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('any');
          });

          it('Write to .json file with escape hatch patterns → exits with code 0', () => {
            const projectDir = createTestProject('json-file-patterns');
            const filePath = path.join(projectDir, 'config.json');

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430e4',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `{
  "rules": {
    "no-any": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "description": "Use @ts-ignore carefully"
  }
}`,
              },
            });

            const result = runHook(hookData);

            // JSON files should not trigger escape hatch detection
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });

          it('Write to .yaml file with escape hatch patterns → exits with code 0', () => {
            const projectDir = createTestProject('yaml-file-patterns');
            const filePath = path.join(projectDir, '.github/workflows/test.yml');

            fs.mkdirSync(path.dirname(filePath), { recursive: true });

            const hookData = WriteToolHookStub({
              session_id: '6ba7b817-9dad-11d1-80b4-00c04fd430e5',
              cwd: projectDir,
              tool_input: {
                file_path: filePath,
                content: `name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: |
          # Don't use any or @ts-ignore
          npm test`,
              },
            });

            const result = runHook(hookData);

            // YAML files should not trigger escape hatch detection
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });
      });
    });

    describe('when handling PostToolUse event', () => {
      describe('with Write tool', () => {
        describe('when file has fixable linting issues', () => {
          it('missing semicolons → exits with code 0 and fixes file', () => {
            const projectDir = createTestProject('post-tool-autofix');
            const filePath = path.join(projectDir, 'example.ts');

            // First write a file with fixable issues (missing semicolons)
            fs.writeFileSync(
              filePath,
              `export function add(a: number, b: number): number {
  console.log("Adding numbers")
  return a + b
}
`,
            );

            const hookData = PostToolUseHookStub({
              session_id: '6ba7b818-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_name: 'Write',
              tool_input: {
                file_path: filePath,
                content: '', // PostToolUse doesn't use content, but type requires it
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });

            // Check that file was auto-fixed (semicolons added)
            const fixedContent = fs.readFileSync(filePath, 'utf8');
            expect(fixedContent).toContain("console.log('Adding numbers');");
            expect(fixedContent).toContain('return a + b;');
          });
        });

        describe('when file has TypeScript errors', () => {
          it('type mismatch → exits with code 2 and error message', () => {
            const projectDir = createTestProject('post-tool-ts-errors');
            const filePath = path.join(projectDir, 'example.ts');

            // Write a file with TypeScript type errors
            fs.writeFileSync(
              filePath,
              `export function add(a: number, b: number): string {
  return a + b; // Type error: number not assignable to string
}
`,
            );

            const hookData = PostToolUseHookStub({
              session_id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_name: 'Write',
              tool_input: {
                file_path: filePath,
                content: '', // PostToolUse doesn't use content, but type requires it
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('[PostToolUse Hook] TypeScript found errors');
            expect(result.stderr).toContain("Type 'number' is not assignable to type 'string'");
          });
        });

        describe('when file has ESLint errors after TypeScript passes', () => {
          it('duplicate test names → exits with code 2 and error message', () => {
            const projectDir = createTestProject('post-tool-eslint-errors');
            const filePath = path.join(projectDir, 'test.test.ts');

            // Write a test file with duplicate test names (TypeScript valid, ESLint error)
            fs.writeFileSync(
              filePath,
              `describe('Test', () => {
  it('duplicate name', () => {
    expect(true).toBe(true);
  });

  it('duplicate name', () => {
    expect(false).toBe(false);
  });
});
`,
            );

            const hookData = PostToolUseHookStub({
              session_id: '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_name: 'Write',
              tool_input: {
                file_path: filePath,
                content: '', // PostToolUse doesn't use content, but type requires it
              },
            });

            const result = runHook(hookData);

            expect(result.exitCode).toBe(2);
            expect(result.stderr).toContain('[PostToolUse Hook] ESLint found');
            expect(result.stderr).toContain('jest/no-identical-title');
          });
        });
      });

      describe('edge cases', () => {
        describe('when file does not exist', () => {
          it('Edit on non-existent file → exits with code 0', () => {
            const projectDir = createTestProject('post-tool-nonexistent');
            const filePath = path.join(projectDir, 'does-not-exist.ts');

            const hookData = PostToolUseHookStub({
              session_id: '6ba7b81b-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_name: 'Edit',
              tool_input: {
                file_path: filePath,
                old_string: 'old',
                new_string: 'new',
              },
            });

            const result = runHook(hookData);

            // Non-existent files are skipped
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });

        describe('when file is already formatted', () => {
          it('properly formatted file → exits with code 0 and does not modify', () => {
            const projectDir = createTestProject('post-tool-no-changes');
            const filePath = path.join(projectDir, 'example.ts');

            const originalContent = `export function add(a: number, b: number): number {
  return a + b;
}
`;
            fs.writeFileSync(filePath, originalContent);

            const hookData = PostToolUseHookStub({
              session_id: '6ba7b81c-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_name: 'Write',
              tool_input: {
                file_path: filePath,
                content: '', // PostToolUse doesn't use content, but type requires it
              },
            });

            const result = runHook(hookData);

            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });

            // Check that file was not modified
            const afterContent = fs.readFileSync(filePath, 'utf8');
            expect(afterContent).toBe(originalContent);
          });
        });

        describe('when file is non-lintable', () => {
          it('README.md → exits with code 0', () => {
            const projectDir = createTestProject('post-tool-non-lintable');
            const filePath = path.join(projectDir, 'README.md');

            fs.writeFileSync(filePath, '# Hello World\n\nThis is a markdown file.');

            const hookData = PostToolUseHookStub({
              session_id: '6ba7b81d-9dad-11d1-80b4-00c04fd430c8',
              cwd: projectDir,
              tool_name: 'Write',
              tool_input: {
                file_path: filePath,
                content: '', // PostToolUse doesn't use content, but type requires it
              },
            });

            const result = runHook(hookData);

            // Non-TS/JS files skip TypeScript check and ESLint ignores them
            expect(result).toStrictEqual({
              exitCode: 0,
              stdout: '',
              stderr: '',
            });
          });
        });
      });
    });
  });
});
