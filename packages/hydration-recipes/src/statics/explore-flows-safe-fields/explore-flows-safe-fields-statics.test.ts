import { exploreFlowsSafeFieldsStatics } from './explore-flows-safe-fields-statics';

describe('exploreFlowsSafeFieldsStatics', () => {
  describe('names', () => {
    it('VALID: {} => carries exactly the three fields explore_flows admits besides title/comments/status', () => {
      expect(exploreFlowsSafeFieldsStatics.names).toStrictEqual([
        'flows',
        'designDecisions',
        'packagesAffected',
      ]);
    });
  });
});
