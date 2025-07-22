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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            expect(result.stderr).toContain('@ts-ignore');
            expect(result.stderr).toContain(': any');
          });

          it('Write overwriting file that already had escape hatches → allows if not adding new ones', () => {
            const projectDir = createTestProject('escape-hatch-overwrite');
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            expect(result.stderr).toContain(': any');
          });

          it('edit on line that already has escape hatch → allows preserving it', () => {
            const projectDir = createTestProject('edit-preserve-escape-hatch');
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
      });
    });

    describe('when handling PostToolUse event', () => {
      describe('with Write tool', () => {
        describe('when file has fixable linting issues', () => {
          it('missing semicolons → exits with code 0 and fixes file', () => {
            const projectDir = createTestProject('post-tool-autofix');
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
            const filePath = path.join(projectDir, 'test.ts');

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
