import { HookPreFolderDetailFlow } from './hook-pre-folder-detail-flow';

const BROKER_FILE = '/repo/packages/hooks/src/brokers/demo/demo-broker.ts';

describe('HookPreFolderDetailFlow', () => {
  describe('fail-open on unusable input', () => {
    it('ERROR: {inputData: malformed JSON} => exits 1 without blocking', async () => {
      const result = await HookPreFolderDetailFlow({ inputData: '{not json' });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .*\n$/su),
        exitCode: 1,
      });
    });

    it('EMPTY: {inputData: ""} => exits 1 without blocking', async () => {
      const result = await HookPreFolderDetailFlow({ inputData: '' });

      expect(result).toStrictEqual({
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .*\n$/su),
        exitCode: 1,
      });
    });

    it('INVALID: {payload without tool_input.file_path} => allows with exit 0', async () => {
      const result = await HookPreFolderDetailFlow({
        inputData: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Write',
          tool_input: {},
          transcript_path: '/tmp/session.jsonl',
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
    });

    it('INVALID: {hook_event_name: SessionStart} => allows with exit 0', async () => {
      const result = await HookPreFolderDetailFlow({
        inputData: JSON.stringify({
          hook_event_name: 'SessionStart',
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE },
          transcript_path: '/tmp/session.jsonl',
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
    });
  });

  describe('out of scope tools and paths', () => {
    it('VALID: {tool_name: Edit into a broker} => allows with exit 0', async () => {
      const result = await HookPreFolderDetailFlow({
        inputData: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Edit',
          tool_input: { file_path: BROKER_FILE },
          transcript_path: '/tmp/session.jsonl',
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
    });

    it('VALID: {Write outside packages/*/src/<folderType>} => allows with exit 0', async () => {
      const result = await HookPreFolderDetailFlow({
        inputData: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Write',
          tool_input: { file_path: '/repo/packages/hooks/test/harnesses/thing.ts' },
          transcript_path: '/tmp/session.jsonl',
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
    });

    it('VALID: {Write into a src segment that is not a folder type} => allows with exit 0', async () => {
      const result = await HookPreFolderDetailFlow({
        inputData: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Write',
          tool_input: { file_path: '/repo/packages/hooks/src/utils/thing.ts' },
          transcript_path: '/tmp/session.jsonl',
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
    });
  });

  describe('unreadable transcript', () => {
    it('EDGE: {Write into a broker, transcript_path does not exist} => allows with exit 0', async () => {
      const result = await HookPreFolderDetailFlow({
        inputData: JSON.stringify({
          hook_event_name: 'PreToolUse',
          tool_name: 'Write',
          tool_input: { file_path: BROKER_FILE },
          transcript_path: '/tmp/definitely-not-a-real-transcript-1a2b3c.jsonl',
        }),
      });

      expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
    });
  });
});
