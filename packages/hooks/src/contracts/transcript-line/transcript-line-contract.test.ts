import { transcriptLineContract } from './transcript-line-contract';
import { TranscriptLineStub } from './transcript-line.stub';

describe('transcriptLineContract', () => {
  it('VALID: {assistant line with tool_use content} => parses content as an array', () => {
    const result = TranscriptLineStub();

    expect(Array.isArray(result.message.content)).toBe(true);
  });

  it('VALID: {user line with string content} => parses content as a string', () => {
    const result = transcriptLineContract.parse({
      message: { role: 'user', content: 'plain user text' },
    });

    expect(result.message.content).toBe('plain user text');
  });

  it('VALID: {content item with non-tool_use type} => passthrough keeps the line valid', () => {
    const result = transcriptLineContract.parse({
      message: { role: 'assistant', content: [{ type: 'text', text: 'hello' }] },
    });

    expect(result.message.content).toStrictEqual([{ type: 'text', text: 'hello' }]);
  });

  it('INVALID: {missing message} => fails to parse', () => {
    const result = transcriptLineContract.safeParse({ type: 'system' });

    expect(result.success).toBe(false);
  });
});
