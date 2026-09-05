import { toolUseToBriefTransformer } from './tool-use-to-brief-transformer';
import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';
import { TranscriptRecordContentBlockStub } from '../../contracts/transcript-record-content-block/transcript-record-content-block.stub';

describe('toolUseToBriefTransformer', () => {
  describe('single interesting key', () => {
    it('VALID: {name: "Read", input: {file_path}} => name and file_path brief', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Read',
          input: { file_path: '/tmp/example.ts' },
        }),
      });

      expect(result).toStrictEqual({ name: 'Read', brief: 'file_path=/tmp/example.ts' });
    });
  });

  describe('several interesting keys', () => {
    it('VALID: {description, prompt, subagent_type} => rendered in statics order, space-joined', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Task',
          input: {
            subagent_type: 'general-purpose',
            prompt: 'Investigate X',
            description: 'Investigate',
          },
        }),
      });

      expect(result).toStrictEqual({
        name: 'Task',
        brief: 'description=Investigate prompt=Investigate X subagent_type=general-purpose',
      });
    });
  });

  describe('whitespace in a value', () => {
    it('EDGE: {command with newlines and runs of spaces} => collapsed to single spaces', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Bash',
          input: { command: 'ls -la    \n\n  /tmp' },
        }),
      });

      expect(result).toStrictEqual({ name: 'Bash', brief: 'command=ls -la /tmp' });
    });
  });

  describe('value longer than maxChars', () => {
    it('EDGE: {command longer than maxChars} => truncated to exactly maxChars', () => {
      const longValue = 'a'.repeat(digestDefaultStatics.maxTextChars + 50);

      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Bash',
          input: { command: longValue },
        }),
      });

      expect(result).toStrictEqual({
        name: 'Bash',
        brief: `command=${'a'.repeat(digestDefaultStatics.maxTextChars)}`,
      });
    });
  });

  describe('explicit small maxChars', () => {
    it('EDGE: {maxChars: 5} => truncation honours the explicit value', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Read',
          input: { file_path: '/tmp/very-long-path-name.ts' },
        }),
        maxChars: 5,
      });

      expect(result).toStrictEqual({ name: 'Read', brief: 'file_path=/tmp/' });
    });
  });

  describe('no interesting keys present', () => {
    it('EMPTY: {input with none of the interesting keys} => whole input JSON, truncated', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Custom',
          input: { foo: 'bar', baz: 42 },
        }),
      });

      expect(result).toStrictEqual({ name: 'Custom', brief: '{"foo":"bar","baz":42}' });
    });
  });

  describe('no input', () => {
    it('EMPTY: {no input} => brief is empty string', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({ type: 'tool_use', name: 'Glob' }),
      });

      expect(result).toStrictEqual({ name: 'Glob', brief: '' });
    });
  });

  describe('no name', () => {
    it('EMPTY: {no name} => name is "?"', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          input: { file_path: '/tmp/x.ts' },
        }),
      });

      expect(result).toStrictEqual({ name: '?', brief: 'file_path=/tmp/x.ts' });
    });
  });

  describe('non-string values', () => {
    it('EDGE: {workItemId: number} => JSON-stringified', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'ModifyQuest',
          input: { workItemId: 42 },
        }),
      });

      expect(result).toStrictEqual({ name: 'ModifyQuest', brief: 'workItemId=42' });
    });

    it('EDGE: {packages: array} => JSON-stringified', () => {
      const result = toolUseToBriefTransformer({
        block: TranscriptRecordContentBlockStub({
          type: 'tool_use',
          name: 'Ward',
          input: { packages: ['shared', 'mcp'] },
        }),
      });

      expect(result).toStrictEqual({ name: 'Ward', brief: 'packages=["shared","mcp"]' });
    });
  });
});
