import { Readable, Writable } from 'stream';
import { question } from './question';
import { questionProxy } from './question.proxy';

const writableSink = (): Writable =>
  new Writable({
    write(_chunk, _encoding, callback): void {
      callback();
    },
  });

describe('question', () => {
  it('VALID: {typed answer with surrounding whitespace} => resolves the trimmed answer', async () => {
    const proxy = questionProxy();
    proxy.answers({ prompt: 'Name: ', answer: '  Guild Alpha  \n' });

    const result = await question({
      input: Readable.from([]),
      output: writableSink(),
      prompt: 'Name: ',
      fallback: 'my-package',
    });

    expect(result).toBe('Guild Alpha');
    expect(proxy.getPromptsAsked()).toStrictEqual(['Name: ']);
  });

  it('EMPTY: {answer is empty string} => resolves the fallback', async () => {
    const proxy = questionProxy();
    proxy.answers({ prompt: 'Name: ', answer: '' });

    const result = await question({
      input: Readable.from([]),
      output: writableSink(),
      prompt: 'Name: ',
      fallback: 'my-package',
    });

    expect(result).toBe('my-package');
    expect(proxy.getPromptsAsked()).toStrictEqual(['Name: ']);
  });

  it('EMPTY: {answer is only whitespace} => resolves the fallback', async () => {
    const proxy = questionProxy();
    proxy.answers({ prompt: 'Name: ', answer: '   \n' });

    const result = await question({
      input: Readable.from([]),
      output: writableSink(),
      prompt: 'Name: ',
      fallback: 'my-package',
    });

    expect(result).toBe('my-package');
  });

  it('ERROR: {no answer staged for prompt} => throws naming the prompt', async () => {
    questionProxy();

    await expect(
      question({
        input: Readable.from([]),
        output: writableSink(),
        prompt: 'Unstaged prompt: ',
        fallback: 'fallback',
      }),
    ).rejects.toThrow(/^questionProxy: no answer staged for prompt "Unstaged prompt: "$/u);
  });

  describe('read-back', () => {
    it('VALID: {multiple prompts asked} => getCallsFor reads back all prompts in order', async () => {
      const proxy = questionProxy();
      proxy.answers({ prompt: 'First: ', answer: 'alpha' });
      proxy.answers({ prompt: 'Second: ', answer: 'beta' });

      await question({
        input: Readable.from([]),
        output: writableSink(),
        prompt: 'First: ',
        fallback: 'f',
      });
      await question({
        input: Readable.from([]),
        output: writableSink(),
        prompt: 'Second: ',
        fallback: 's',
      });

      expect(proxy.getCallsFor()).toStrictEqual(['First: ', 'Second: ']);
      expect(proxy.getCallsFor({ prompt: 'First: ' })).toStrictEqual(['First: ']);
    });
  });
});
