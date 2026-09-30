import { BashToolInputStub } from '../contracts/bash-tool-input/bash-tool-input.stub';
import { PostToolUseHookStub } from '../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { ExecResultStub } from '@dungeonmaster/shared/contracts/exec-result/exec-result.stub';
import { fakeDungeonmasterBinHarness } from '../../test/harnesses/fake-dungeonmaster-bin/fake-dungeonmaster-bin.harness';
import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('start-post-bash-hook', () => {
  const runner = hookRunnerHarness();
  const fakeBin = fakeDungeonmasterBinHarness();

  it('VALID: {npm install left-pad} => runs dungeonmaster gateway-sync in the hook cwd and writes its output as PostToolUse context', async () => {
    const projectDir = await fakeBin.createProjectDir();
    const pathValue = await fakeBin.withSucceedingSync();
    const hookData = PostToolUseHookStub({
      tool_name: 'Bash',
      cwd: projectDir,
      tool_input: BashToolInputStub({ command: 'npm install left-pad' }),
    });

    const result = runner.runHook({
      hookName: 'start-post-bash-hook',
      hookData,
      env: { PATH: pathValue },
    });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `dungeonmaster gateway-sync ran after this npm install:\nfake gateway-sync cwd=${projectDir} args=gateway-sync`,
        },
      }),
      stderr: '',
    });
  });

  it('EMPTY: {bare npm install} => exits 0 silently without running the sync', async () => {
    const projectDir = await fakeBin.createProjectDir();
    const pathValue = await fakeBin.withSucceedingSync();
    const hookData = PostToolUseHookStub({
      tool_name: 'Bash',
      cwd: projectDir,
      tool_input: BashToolInputStub({ command: 'npm install' }),
    });

    const result = runner.runHook({
      hookName: 'start-post-bash-hook',
      hookData,
      env: { PATH: pathValue },
    });

    expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
  });

  it('INVALID: {command: ls} => exits 0 silently without running the sync', async () => {
    const projectDir = await fakeBin.createProjectDir();
    const pathValue = await fakeBin.withSucceedingSync();
    const hookData = PostToolUseHookStub({
      tool_name: 'Bash',
      cwd: projectDir,
      tool_input: BashToolInputStub({ command: 'ls' }),
    });

    const result = runner.runHook({
      hookName: 'start-post-bash-hook',
      hookData,
      env: { PATH: pathValue },
    });

    expect(result).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
  });

  it('ERROR: {sync exits 3} => still exits 0 and reports the failure as context', async () => {
    const projectDir = await fakeBin.createProjectDir();
    const pathValue = await fakeBin.withFailingSync();
    const hookData = PostToolUseHookStub({
      tool_name: 'Bash',
      cwd: projectDir,
      tool_input: BashToolInputStub({ command: 'npm i -D left-pad -w packages/web' }),
    });

    const result = runner.runHook({
      hookName: 'start-post-bash-hook',
      hookData,
      env: { PATH: pathValue },
    });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext:
            'dungeonmaster gateway-sync exited 3 after this npm install, so packages/@gateway/npm/src may lack a folder for the new package. Fix the cause and run `dungeonmaster gateway-sync` again. Output:\nfake gateway-sync blew up',
        },
      }),
      stderr: '',
    });
  });

  it('ERROR: {no dungeonmaster on PATH} => still exits 0 and reports that the sync never ran', async () => {
    const projectDir = await fakeBin.createProjectDir();
    const pathValue = await fakeBin.withNoDungeonmasterOnPath();
    const hookData = PostToolUseHookStub({
      tool_name: 'Bash',
      cwd: projectDir,
      tool_input: BashToolInputStub({ command: 'npm install left-pad' }),
    });

    const result = runner.runHook({
      hookName: 'start-post-bash-hook',
      hookData,
      env: { PATH: pathValue },
    });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext:
            'dungeonmaster gateway-sync did not run after this npm install: "dungeonmaster" never started: spawn dungeonmaster ENOENT. Run `dungeonmaster gateway-sync` yourself so packages/@gateway/npm/src gets a folder for the new package.',
        },
      }),
      stderr: '',
    });
  });

  it('ERROR: {invalid JSON on stdin} => exits 0 with the parse error on stderr', () => {
    const result = runner.runHookRaw({
      hookName: 'start-post-bash-hook',
      input: ExecResultStub({ stdout: 'not json' }).stdout,
    });

    expect({ status: result.status, stdout: result.stdout, stderr: result.stderr }).toStrictEqual({
      status: 0,
      stdout: '',
      stderr: `[post-bash] Unexpected token 'o', "not json" is not valid JSON\n`,
    });
  });
});
