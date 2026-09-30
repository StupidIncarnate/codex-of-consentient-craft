import { QuestRouteScopeResultStub } from './quest-route-scope-result.stub';
import { questRouteScopeResultContract } from './quest-route-scope-result-contract';

describe('questRouteScopeResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestRouteScopeResultStub();

      expect(questRouteScopeResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {routed: wrong type} => throws', () => {
      expect(() =>
        questRouteScopeResultContract.parse({ ...QuestRouteScopeResultStub(), routed: 'nope' }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
