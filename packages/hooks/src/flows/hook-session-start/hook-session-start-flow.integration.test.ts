import { HookSessionStartFlow } from './hook-session-start-flow';

describe('HookSessionStartFlow', () => {
  describe('delegation to responder', () => {
    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', async () => {
      const result = await HookSessionStartFlow({ inputData: 'not json' });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Hook error/u);
    });

    it('VALID: {inputData: new session} => returns exitCode 0 with content in stdout', async () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/nonexistent-transcript-for-flow-test.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'SessionStart',
      });

      const result = await HookSessionStartFlow({ inputData });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/dungeonmaster-architecture/u);
    });
  });
});
