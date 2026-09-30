import { OrchestrationResumeResultStub } from './orchestration-resume-result.stub';
import { orchestrationResumeResultContract } from './orchestration-resume-result-contract';

describe('orchestrationResumeResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = OrchestrationResumeResultStub();

      expect(orchestrationResumeResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {resumed: wrong type} => throws', () => {
      expect(() =>
        orchestrationResumeResultContract.parse({
          ...OrchestrationResumeResultStub(),
          resumed: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
