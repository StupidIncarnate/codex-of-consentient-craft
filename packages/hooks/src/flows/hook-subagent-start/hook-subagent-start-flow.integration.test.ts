import { HookSubagentStartFlow } from './hook-subagent-start-flow';

describe('HookSubagentStartFlow', () => {
  describe('delegation to responder', () => {
    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', () => {
      const result = HookSubagentStartFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n$/su),
      });
    });

    it('VALID: {inputData: subagent start} => returns exitCode 0 with content in stdout', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'SubagentStart',
        agent_id: 'agent-abc123',
        agent_type: 'Explore',
      });

      const result = HookSubagentStartFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+<\/dungeonmaster-architecture>\n$/su,
        ),
        stderr: '',
      });
    });
  });
});
