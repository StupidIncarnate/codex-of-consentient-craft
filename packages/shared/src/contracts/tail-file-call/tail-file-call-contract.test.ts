import { tailFileCallContract } from './tail-file-call-contract';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('tailFileCallContract', () => {
  describe('parse', () => {
    it('VALID: {literal filePathArg} => parses successfully', () => {
      const result = tailFileCallContract.parse({
        filePathArg: ContentTextStub({ value: '/repo/.dungeonmaster/quests/quest.jsonl' }),
      });

      expect(result).toStrictEqual({
        filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl',
      });
    });

    it('VALID: {computed filePathArg} => parses successfully', () => {
      const result = tailFileCallContract.parse({
        filePathArg: ContentTextStub({ value: '<computed: questPathBroker>' }),
      });

      expect(result).toStrictEqual({
        filePathArg: '<computed: questPathBroker>',
      });
    });
  });
});
