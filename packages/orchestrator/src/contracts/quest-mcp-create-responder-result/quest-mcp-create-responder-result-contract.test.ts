import { QuestMcpCreateResponderResultStub } from './quest-mcp-create-responder-result.stub';
import { questMcpCreateResponderResultContract } from './quest-mcp-create-responder-result-contract';

describe('questMcpCreateResponderResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestMcpCreateResponderResultStub();

      expect(questMcpCreateResponderResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: wrong type} => throws', () => {
      expect(() =>
        questMcpCreateResponderResultContract.parse({
          ...QuestMcpCreateResponderResultStub(),
          questId: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
