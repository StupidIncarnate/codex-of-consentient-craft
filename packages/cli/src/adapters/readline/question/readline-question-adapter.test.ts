import { readlineQuestionAdapter } from './readline-question-adapter';
import { readlineQuestionAdapterProxy } from './readline-question-adapter.proxy';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

describe('readlineQuestionAdapter', () => {
  describe('typed answer', () => {
    it("VALID: {answer: 'my-package'} => resolves with the typed answer", async () => {
      const proxy = readlineQuestionAdapterProxy();
      const prompt = 'Package name: ';
      proxy.setupAnswer({ prompt, answer: 'my-package' });

      const result = await readlineQuestionAdapter({
        prompt,
        fallback: ContentTextStub({ value: 'unused-fallback' }),
      });

      expect(result).toStrictEqual(ContentTextStub({ value: 'my-package' }));
    });
  });

  describe('empty answer', () => {
    it("EMPTY: {answer: ''} => resolves with the fallback", async () => {
      const proxy = readlineQuestionAdapterProxy();
      const prompt = 'Package name: ';
      const fallback = ContentTextStub({ value: 'default-package' });
      proxy.setupAnswer({ prompt, answer: '' });

      const result = await readlineQuestionAdapter({ prompt, fallback });

      expect(result).toStrictEqual(fallback);
    });
  });

  describe('whitespace-padded answer', () => {
    it("EDGE: {answer: '  my-package  '} => resolves with the trimmed answer", async () => {
      const proxy = readlineQuestionAdapterProxy();
      const prompt = 'Package name: ';
      proxy.setupAnswer({ prompt, answer: '  my-package  ' });

      const result = await readlineQuestionAdapter({
        prompt,
        fallback: ContentTextStub({ value: 'unused-fallback' }),
      });

      expect(result).toStrictEqual(ContentTextStub({ value: 'my-package' }));
    });
  });
});
