import { tailFileCallContract } from './tail-file-call-contract';
import { TailFileCallStub } from './tail-file-call.stub';

describe('tailFileCallContract', () => {
  describe('parse', () => {
    it('VALID: {literal filePathArg} => parses successfully', () => {
      const result = TailFileCallStub();

      expect(result).toStrictEqual({
        filePathArg: '/repo/.dungeonmaster/quests/quest.jsonl',
      });
    });

    it('VALID: {computed filePathArg} => parses successfully', () => {
      const result = tailFileCallContract.parse({
        filePathArg: '<computed: questPathBroker>',
      });

      expect(result).toStrictEqual({
        filePathArg: '<computed: questPathBroker>',
      });
    });
  });
});
