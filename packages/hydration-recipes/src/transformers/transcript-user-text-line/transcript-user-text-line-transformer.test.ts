import { transcriptUserTextLineTransformer } from './transcript-user-text-line-transformer';

describe('transcriptUserTextLineTransformer', () => {
  it('VALID: {text: "Dispatch a nested sub-agent chain"} => returns a user line with string content', () => {
    const result = transcriptUserTextLineTransformer({ text: 'Dispatch a nested sub-agent chain' });

    expect(result).toStrictEqual({
      type: 'user',
      message: { role: 'user', content: 'Dispatch a nested sub-agent chain' },
    });
  });
});
