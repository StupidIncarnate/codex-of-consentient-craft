import { ResolveChatQuestLayerResultStub } from './resolve-chat-quest-layer-result.stub';
import { resolveChatQuestLayerResultContract } from './resolve-chat-quest-layer-result-contract';

describe('resolveChatQuestLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ResolveChatQuestLayerResultStub();

      expect(resolveChatQuestLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: wrong type} => throws', () => {
      expect(() =>
        resolveChatQuestLayerResultContract.parse({
          ...ResolveChatQuestLayerResultStub(),
          questId: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
