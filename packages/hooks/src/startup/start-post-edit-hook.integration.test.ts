import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as crypto from 'crypto';
import { PostToolUseHookStub } from '../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { EditToolInputStub } from '../contracts/edit-tool-input/edit-tool-input.stub';
import { WriteToolInputStub } from '../contracts/write-tool-input/write-tool-input.stub';
import { ExecResultStub } from '../contracts/exec-result/exec-result.stub';

// CRITICAL: Must use temp dir inside repo so ESLint can find eslint.config.js
// Using packages/hooks/src/.test-tmp to ensure ESLint config discovery works
const tempRoot = path.join(process.cwd(), 'src', '.test-tmp', 'post-edit-tests');
const hookPath = path.join(process.cwd(), 'src', 'startup', 'start-post-edit-hook.ts');

const createTestProject = ({ name }: { name: typeof tempRoot }) => {
  const testId = crypto.randomBytes(4).toString('hex');
  const projectDir = path.join(tempRoot, `${name}-${testId}`);
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
};

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

describe('post-edit-hook', () => {
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
        const filePath = path.join(projectDir, 'example.info.ts');

        const fileContent = `export const add = ({ a, b }: { a: number; b: number }): number => a + b;
`;

        const hookData = PostToolUseHookStub({
          cwd: process.cwd(),
          tool_name: 'Write',
          tool_input: WriteToolInputStub({
            file_path: filePath,
            content: fileContent,
          }),
        });

        // Actually write the file so hook can check it
        fs.writeFileSync(filePath, fileContent);

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
        // Post-edit hook reports success when no violations remain
        expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
      });

      it('VALID: {content: with console.log} => reports violation but exits with 0', () => {
        const projectDir = createTestProject({ name: 'console-log-write' });
        const filePath = path.join(projectDir, 'example.info.ts');

        const fileContent = `export const test = (): void => {
  console.log('test');
};
`;

        const hookData = PostToolUseHookStub({
          cwd: process.cwd(),
          tool_name: 'Write',
          tool_input: WriteToolInputStub({
            file_path: filePath,
            content: fileContent,
          }),
        });

        // Actually write the file so hook can check it
        fs.writeFileSync(filePath, fileContent);

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(0);
        // Post-edit hook reports console.log violation (non-fixable)
        expect(result.stderr).toMatch(/Unexpected console statement/iu);
      });

      it('EMPTY: {content: empty file} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'empty-write' });
        const filePath = path.join(projectDir, 'example.info.ts');

        const fileContent = '';

        const hookData = PostToolUseHookStub({
          cwd: process.cwd(),
          tool_name: 'Write',
          tool_input: WriteToolInputStub({
            file_path: filePath,
            content: fileContent,
          }),
        });

        // Actually write the file so hook can check it
        fs.writeFileSync(filePath, fileContent);

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
        // Post-edit hook reports success for empty files
        expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
      });
    });
  });

  describe('with Edit tool', () => {
    describe('success cases', () => {
      it('VALID: {old_string: clean code, new_string: clean code} => returns exit code 0', () => {
        const projectDir = createTestProject({ name: 'clean-edit' });
        const filePath = path.join(projectDir, 'example.info.ts');

        // Create initial file
        const initialContent = `export const oldFunction = (): string => 'hello';
`;
        fs.writeFileSync(filePath, initialContent);

        const newContent = `export const newFunction = (): string => 'hello world';
`;

        const hookData = PostToolUseHookStub({
          cwd: process.cwd(),
          tool_name: 'Edit',
          tool_input: EditToolInputStub({
            file_path: filePath,
            old_string: initialContent,
            new_string: newContent,
          }),
        });

        // Apply the edit so hook can check the result
        fs.writeFileSync(filePath, newContent);

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
        // Post-edit hook reports success for clean code
        expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
      });

      it('VALID: {new_string: adds console.log} => reports violation but exits with 0', () => {
        const projectDir = createTestProject({ name: 'add-console-edit' });
        const filePath = path.join(projectDir, 'example.info.ts');

        const initialContent = `export const test = (): void => {};
`;
        fs.writeFileSync(filePath, initialContent);

        const newContent = `export const test = (): void => {
  console.log('debug');
};
`;

        const hookData = PostToolUseHookStub({
          cwd: process.cwd(),
          tool_name: 'Edit',
          tool_input: EditToolInputStub({
            file_path: filePath,
            old_string: initialContent,
            new_string: newContent,
          }),
        });

        // Apply the edit so hook can check the result
        fs.writeFileSync(filePath, newContent);

        const result = runHook({ hookData });

        expect(result.exitCode).toBe(0);
        // Post-edit hook reports console.log violation (non-fixable)
        expect(result.stderr).toMatch(/Unexpected console statement/iu);
      });
    });
  });

  describe('with invalid hook data', () => {
    it('INVALID_INPUT: {invalid JSON} => exits with 1', () => {
      const result = spawnSync('npx', ['tsx', hookPath], {
        input: 'not valid json',
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Hook error/iu);
    });

    it('INVALID_INPUT: {missing required fields} => exits with 1', () => {
      const result = spawnSync('npx', ['tsx', hookPath], {
        input: JSON.stringify({ invalid: 'data' }),
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/Invalid hook data format/iu);
    });
  });

  describe('auto-fix behavior', () => {
    it('AUTOFIX: {content: arrow-body-style violation} => auto-fixes and writes to disk', () => {
      const projectDir = createTestProject({ name: 'autofix-arrow-body' });
      const filePath = path.join(projectDir, 'test.info.ts');

      // Write code with arrow-body-style violation (fixable) - using .info.ts to avoid colocation rules
      const fileContent = `export const add = ({ a, b }: { a: number; b: number }): number => {
  return a + b;
};

export const subtract = ({ a, b }: { a: number; b: number }): number => {
  return a - b;
};`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      fs.writeFileSync(filePath, fileContent);

      // Run the hook
      const result = runHook({ hookData });

      // Hook should exit successfully
      expect(result.exitCode).toBe(0);

      // Read the file after hook runs
      const fileContentAfterHook = fs.readFileSync(filePath, 'utf8');

      // File should be auto-fixed to expression body
      const expectedFixedContent = `export const add = ({ a, b }: { a: number; b: number }): number => a + b;

export const subtract = ({ a, b }: { a: number; b: number }): number => a - b;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Stderr should report success (no colocation errors for .info.ts)
      expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
    });

    it('AUTOFIX: {content: prettier violation} => auto-fixes and writes to disk', () => {
      const projectDir = createTestProject({ name: 'autofix-prettier' });
      const filePath = path.join(projectDir, 'format.info.ts');

      // Write code with prettier violations (extra spaces, missing semicolons)
      const fileContent = `export const test=({x}:{x:number}):number=>x;`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      fs.writeFileSync(filePath, fileContent);

      // Run the hook
      const result = runHook({ hookData });

      // Hook should exit successfully
      expect(result.exitCode).toBe(0);

      // Read the file after hook runs
      const fileContentAfterHook = fs.readFileSync(filePath, 'utf8');

      // File should be formatted correctly
      const expectedFixedContent = `export const test = ({ x }: { x: number }): number => x;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Stderr should report success (no colocation errors for .info.ts)
      expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
    });

    it('AUTOFIX: {content: multiple fixable violations} => auto-fixes all and writes to disk', () => {
      const projectDir = createTestProject({ name: 'autofix-multiple' });
      const filePath = path.join(projectDir, 'multi.info.ts');

      // Write code with multiple fixable violations
      const fileContent = `export const add = ({ a, b }: { a: number; b: number }): number => {
  return a + b;
};

export const subtract=({a,b}:{a:number;b:number}):number=>{
return a-b;
};`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      fs.writeFileSync(filePath, fileContent);

      // Run the hook
      const result = runHook({ hookData });

      // Hook should exit successfully
      expect(result.exitCode).toBe(0);

      // Read the file after hook runs
      const fileContentAfterHook = fs.readFileSync(filePath, 'utf8');

      // Both functions should be auto-fixed
      const expectedFixedContent = `export const add = ({ a, b }: { a: number; b: number }): number => a + b;

export const subtract = ({ a, b }: { a: number; b: number }): number => a - b;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Stderr should report success (no colocation errors for .info.ts)
      expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
    });

    it('NON_FIXABLE: {content: implementation without test} => reports colocation error', () => {
      const projectDir = createTestProject({ name: 'non-fixable-colocation' });
      const filePath = path.join(projectDir, 'example-broker.ts');

      // Write implementation file without test - violates colocation (non-fixable)
      const fileContent = `/**
 * PURPOSE: Example broker for testing colocation violations
 *
 * USAGE:
 * const result = await exampleBroker({ data: 'test' });
 * // Returns processed data
 */
export const exampleBroker = async ({ data }: { data: string }): Promise<string> => data;
`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      fs.writeFileSync(filePath, fileContent);

      // Run the hook
      const result = runHook({ hookData });

      // Hook should exit successfully (never blocks)
      expect(result.exitCode).toBe(0);

      // Read the file after hook runs
      const fileContentAfterHook = fs.readFileSync(filePath, 'utf8');

      // File content should have only formatting fixes (prettier adds trailing newline)
      // Colocation violation is not auto-fixable
      expect(fileContentAfterHook).toStrictEqual(fileContent);

      // Stderr should report colocation violation (non-fixable)
      expect(result.stderr).toMatch(/must have a colocated test file/iu);
      expect(result.stderr).toMatch(/Create example-broker.test.ts/iu);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {tool_input: non-TypeScript file} => returns exit code 0', () => {
      const projectDir = createTestProject({ name: 'non-ts-file' });
      const filePath = path.join(projectDir, 'README.md');

      const fileContent = `# TypeScript Guide

Here are some examples with console.log:

\`\`\`typescript
function test(): void {
  console.log('test');
}
\`\`\``;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Actually write the file so hook can check it
      fs.writeFileSync(filePath, fileContent);

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
      // Post-edit hook may output auto-fix messages to stderr
      expect(result.stderr).toMatch(/All violations auto-fixed successfully|^$/u);
    });

    it('EDGE: {file_path: non-existent file} => returns exit code 0', () => {
      const projectDir = createTestProject({ name: 'non-existent-edit' });
      const filePath = path.join(projectDir, 'does-not-exist.ts');

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Edit',
        tool_input: EditToolInputStub({
          file_path: filePath,
          old_string: 'old',
          new_string: 'new',
        }),
      });

      // Don't create the file - testing non-existent scenario

      const result = runHook({ hookData });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
      // Post-edit hook may output ESLint error about missing file
      expect(result.stderr).toMatch(/ESLint error|All violations auto-fixed successfully|^$/u);
    });
  });
});
