import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { SessionStartHookStub } from '../contracts/session-start-hook-data/session-start-hook-data.stub';
import { SubagentStartHookDataStub } from '../contracts/subagent-start-hook-data/subagent-start-hook-data.stub';

import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

describe('start-session-snippet-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-session-snippet-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  describe('SessionStart', () => {
    it('VALID: {hookData: SessionStart, args: ["discover"]} => exits with code 0 and raw discover snippet in stdout', async () => {
      const hookData = SessionStartHookStub();

      const result = await persistentRunner.runHook({ hookData, args: ['discover'] });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-discover>\n${sessionSnippetStatics.discover}\n</dungeonmaster-discover>\n`,
        stderr: '',
      });
    });

    it('VALID: {hookData: SessionStart, args: ["ward"]} => exits with code 0 and raw ward snippet in stdout', async () => {
      const hookData = SessionStartHookStub();

      const result = await persistentRunner.runHook({ hookData, args: ['ward'] });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: `<dungeonmaster-ward>\n${sessionSnippetStatics.ward}\n</dungeonmaster-ward>\n`,
        stderr: '',
      });
    });

    it('ERROR: {hookData: SessionStart, args: ["nonexistent"]} => exits with code 1 and error in stderr', async () => {
      const hookData = SessionStartHookStub();

      const result = await persistentRunner.runHook({ hookData, args: ['nonexistent'] });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: nonexistent\n',
      });
    });

    it('ERROR: {hookData: SessionStart, no args} => exits with code 1 and error in stderr', async () => {
      const hookData = SessionStartHookStub();

      const result = await persistentRunner.runHook({ hookData });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: (none)\n',
      });
    });
  });

  describe('SubagentStart', () => {
    it('VALID: {hookData: SubagentStart, args: ["discover"]} => exits with code 0 and JSON with additionalContext containing discover snippet', async () => {
      const hookData = SubagentStartHookDataStub();

      const result = await persistentRunner.runHook({ hookData, args: ['discover'] });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'SubagentStart',
            additionalContext: `<dungeonmaster-discover>\n${sessionSnippetStatics.discover}\n</dungeonmaster-discover>\n`,
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {hookData: SubagentStart, args: ["ward"]} => exits with code 0 and JSON with additionalContext containing ward snippet', async () => {
      const hookData = SubagentStartHookDataStub();

      const result = await persistentRunner.runHook({ hookData, args: ['ward'] });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'SubagentStart',
            additionalContext: `<dungeonmaster-ward>\n${sessionSnippetStatics.ward}\n</dungeonmaster-ward>\n`,
          },
        }),
        stderr: '',
      });
    });

    it('ERROR: {hookData: SubagentStart, args: ["nonexistent"]} => exits with code 1 and raw error in stderr', async () => {
      const hookData = SubagentStartHookDataStub();

      const result = await persistentRunner.runHook({ hookData, args: ['nonexistent'] });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: 'Unknown snippet key: nonexistent\n',
      });
    });
  });
});
