import { QuestMcpCreateResultStub } from './quest-mcp-create-result.stub';
import { questMcpCreateResultContract } from './quest-mcp-create-result-contract';

describe('questMcpCreateResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestMcpCreateResultStub();

      expect(questMcpCreateResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: wrong type} => throws', () => {
      expect(() =>
        questMcpCreateResultContract.parse({ ...QuestMcpCreateResultStub(), questId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
