import * as path from 'path';
import { spawnSync } from 'child_process';
import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { PostToolUseHookStub } from '../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { EditToolInputStub } from '../contracts/edit-tool-input/edit-tool-input.stub';
import { WriteToolInputStub } from '../contracts/write-tool-input/write-tool-input.stub';
import { ExecResultStub } from '../contracts/exec-result/exec-result.stub';

// CRITICAL: Must use temp dir inside repo so ESLint can find eslint.config.js
// Using _test-workspace (NOT .test-tmp which is ESLint-ignored, and no dot-prefix which ESLint globs skip)
const BASE_DIR = FilePathStub({
  value: path.join(process.cwd(), 'src', '_test-workspace', 'post-edit-tests'),
});
const hookPath = path.join(process.cwd(), 'src', 'startup', 'start-post-edit-hook.ts');

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
  describe('with Write tool', () => {
    describe('success cases', () => {
      it('VALID: {content: clean TypeScript code} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.info.ts');

        const fileContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => a || b;
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
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: fileContent }),
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
        // Post-edit hook reports success when no violations remain
        expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
      });

      it('VALID: {content: with console.log} => reports violation but exits with 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'console-log-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.info.ts');

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
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: fileContent }),
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(0);
        // Post-edit hook reports console.log violation (non-fixable)
        expect(result.stderr).toMatch(/Unexpected console statement/iu);
      });

      it('EMPTY: {content: empty file} => returns exit code 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'empty-write' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.info.ts');

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
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: fileContent }),
        });

        const result = runHook({ hookData });

        testbed.cleanup();

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
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'clean-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.info.ts');

        // Create initial file
        const initialContent = `export const oldFunction = (): boolean => true;
`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

        const newContent = `export const newFunction = (): boolean => false;
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
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: newContent }),
        });

        const result = runHook({ hookData });

        testbed.cleanup();

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('');
        // Post-edit hook reports success for clean code
        expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
      });

      it('VALID: {new_string: adds console.log} => reports violation but exits with 0', () => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: 'add-console-edit' }),
          baseDir: BASE_DIR,
        });

        const filePath = path.join(testbed.guildPath, 'example.info.ts');

        const initialContent = `export const test = (): void => {};
`;
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: initialContent }),
        });

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
        testbed.writeFile({
          relativePath: RelativePathStub({ value: 'example.info.ts' }),
          content: FileContentStub({ value: newContent }),
        });

        const result = runHook({ hookData });

        testbed.cleanup();

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
      expect(result.stderr).toMatch(/Unsupported hook event/iu);
    });
  });

  describe('auto-fix behavior', () => {
    it('AUTOFIX: {content: arrow-body-style violation} => auto-fixes and writes to disk', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'autofix-arrow-body' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'test.info.ts');

      // Write code with arrow-body-style violation (fixable) - using .info.ts to avoid colocation rules
      const fileContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => {
  return a || b;
};

export const subtract = ({ a, b }: { a: boolean; b: boolean }): boolean => {
  return a && b;
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
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'test.info.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      // Run the hook
      const result = runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: RelativePathStub({ value: 'test.info.ts' }),
      });

      testbed.cleanup();

      // Hook should exit successfully
      expect(result.exitCode).toBe(0);

      // File should be auto-fixed to expression body
      const expectedFixedContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => a || b;

export const subtract = ({ a, b }: { a: boolean; b: boolean }): boolean => a && b;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Stderr should report success (no colocation errors for .info.ts)
      expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
    });

    it('AUTOFIX: {content: prettier violation} => auto-fixes and writes to disk', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'autofix-prettier' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'format.info.ts');

      // Write code with prettier violations (extra spaces, missing semicolons)
      const fileContent = `export const test=({x}:{x:boolean}):boolean=>x;`;

      const hookData = PostToolUseHookStub({
        cwd: process.cwd(),
        tool_name: 'Write',
        tool_input: WriteToolInputStub({
          file_path: filePath,
          content: fileContent,
        }),
      });

      // Write the file before running hook
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'format.info.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      // Run the hook
      const result = runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: RelativePathStub({ value: 'format.info.ts' }),
      });

      testbed.cleanup();

      // Hook should exit successfully
      expect(result.exitCode).toBe(0);

      // File should be formatted correctly
      const expectedFixedContent = `export const test = ({ x }: { x: boolean }): boolean => x;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Stderr should report success (no colocation errors for .info.ts)
      expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
    });

    it('AUTOFIX: {content: multiple fixable violations} => auto-fixes all and writes to disk', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'autofix-multiple' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'multi.info.ts');

      // Write code with multiple fixable violations
      const fileContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => {
  return a || b;
};

export const subtract=({a,b}:{a:boolean;b:boolean}):boolean=>{
return a&&b;
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
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'multi.info.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      // Run the hook
      const result = runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: RelativePathStub({ value: 'multi.info.ts' }),
      });

      testbed.cleanup();

      // Hook should exit successfully
      expect(result.exitCode).toBe(0);

      // Both functions should be auto-fixed
      const expectedFixedContent = `export const add = ({ a, b }: { a: boolean; b: boolean }): boolean => a || b;

export const subtract = ({ a, b }: { a: boolean; b: boolean }): boolean => a && b;
`;

      expect(fileContentAfterHook).toStrictEqual(expectedFixedContent);

      // Stderr should report success (no colocation errors for .info.ts)
      expect(result.stderr).toMatch(/All violations auto-fixed successfully/iu);
    });

    it('NON_FIXABLE: {content: implementation without test} => reports colocation error', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-fixable-colocation' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'example-broker.ts');

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
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'example-broker.ts' }),
        content: FileContentStub({ value: fileContent }),
      });

      // Run the hook
      const result = runHook({ hookData });

      // Read the file after hook runs
      const fileContentAfterHook = testbed.readFile({
        relativePath: RelativePathStub({ value: 'example-broker.ts' }),
      });

      testbed.cleanup();

      // Hook should exit successfully (never blocks)
      expect(result.exitCode).toBe(0);

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
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-ts-file' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'README.md');

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
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'README.md' }),
        content: FileContentStub({ value: fileContent }),
      });

      const result = runHook({ hookData });

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
      // Post-edit hook may output auto-fix messages to stderr
      expect(result.stderr).toMatch(/All violations auto-fixed successfully|^$/u);
    });

    it('EDGE: {file_path: non-existent file} => returns exit code 0', () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'non-existent-edit' }),
        baseDir: BASE_DIR,
      });

      const filePath = path.join(testbed.guildPath, 'does-not-exist.ts');

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

      testbed.cleanup();

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
      // Post-edit hook may output ESLint error about missing file
      expect(result.stderr).toMatch(/ESLint error|All violations auto-fixed successfully|^$/u);
    });
  });
});
