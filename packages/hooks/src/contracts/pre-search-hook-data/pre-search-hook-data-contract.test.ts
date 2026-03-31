import { preSearchHookDataContract } from './pre-search-hook-data-contract';
import { PreSearchHookDataStub } from './pre-search-hook-data.stub';

type PreSearchHookData = ReturnType<typeof PreSearchHookDataStub>;

describe('preSearchHookDataContract', () => {
  describe('valid data', () => {
    it('VALID: {tool_name: "Grep"} => parses successfully', () => {
      const data: PreSearchHookData = PreSearchHookDataStub({ tool_name: 'Grep' });

      expect(data).toStrictEqual({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Grep',
        tool_input: { pattern: 'searchTerm', path: '/src' },
      });
    });

    it('VALID: {tool_name: "Glob"} => parses successfully', () => {
      const data: PreSearchHookData = PreSearchHookDataStub({ tool_name: 'Glob' });

      expect(data).toStrictEqual({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Glob',
        tool_input: { pattern: 'searchTerm', path: '/src' },
      });
    });

    it('VALID: {tool_input: unknown shape} => accepts any tool_input', () => {
      const data: PreSearchHookData = PreSearchHookDataStub({
        tool_input: { pattern: '*.ts', path: '/src' },
      });

      expect(data).toStrictEqual({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Grep',
        tool_input: { pattern: '*.ts', path: '/src' },
      });
    });
  });

  describe('invalid data', () => {
    it('INVALID: {hook_event_name: "PostToolUse"} => throws validation error', () => {
      expect(() => {
        return preSearchHookDataContract.parse({
          session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          transcript_path: '/tmp/transcript.jsonl',
          cwd: process.cwd(),
          hook_event_name: 'PostToolUse',
          tool_name: 'Grep',
          tool_input: {},
        });
      }).toThrow(/Invalid literal/u);
    });

    it('INVALID: {session_id: ""} => throws validation error', () => {
      expect(() => {
        return preSearchHookDataContract.parse({
          session_id: '',
          transcript_path: '/tmp/transcript.jsonl',
          cwd: process.cwd(),
          hook_event_name: 'PreToolUse',
          tool_name: 'Grep',
          tool_input: {},
        });
      }).toThrow(/too_small/u);
    });
  });
});
