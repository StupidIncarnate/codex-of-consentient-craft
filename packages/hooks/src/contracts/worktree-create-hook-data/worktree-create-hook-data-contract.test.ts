import { worktreeCreateHookDataContract } from './worktree-create-hook-data-contract';
import { WorktreeCreateHookDataStub } from './worktree-create-hook-data.stub';

describe('worktreeCreateHookDataContract', () => {
  describe('parse()', () => {
    it('VALID: complete WorktreeCreate hook data => parses successfully', () => {
      const input = WorktreeCreateHookDataStub();

      const result = worktreeCreateHookDataContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: custom name => parses successfully', () => {
      const input = WorktreeCreateHookDataStub({
        name: 'feature-abc',
      });

      const result = worktreeCreateHookDataContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('INVALID: missing name => throws ZodError', () => {
      expect(() =>
        worktreeCreateHookDataContract.parse({
          session_id: 'abc',
          transcript_path: '/tmp/t.jsonl',
          cwd: '/home',
          hook_event_name: 'WorktreeCreate',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: wrong hook_event_name => throws ZodError', () => {
      expect(() =>
        worktreeCreateHookDataContract.parse({
          ...WorktreeCreateHookDataStub(),
          hook_event_name: 'SessionStart',
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
