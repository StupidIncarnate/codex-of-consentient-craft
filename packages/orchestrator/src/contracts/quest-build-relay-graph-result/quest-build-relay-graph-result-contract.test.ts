import { QuestBuildRelayGraphResultStub } from './quest-build-relay-graph-result.stub';
import { questBuildRelayGraphResultContract } from './quest-build-relay-graph-result-contract';

describe('questBuildRelayGraphResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestBuildRelayGraphResultStub();

      expect(questBuildRelayGraphResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {operations: wrong type} => throws', () => {
      expect(() =>
        questBuildRelayGraphResultContract.parse({
          ...QuestBuildRelayGraphResultStub(),
          operations: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
