import { isBrowserStepGuard } from './is-browser-step-guard';
import { StepVerbStub } from '../../contracts/step-verb/step-verb.stub';
import { stepStatics } from '../../statics/step/step-statics';

type StepVerb = ReturnType<typeof StepVerbStub>;

const BROWSER_VERBS = new Set<StepVerb>(
  stepStatics.verbs.browser.map((verb) => StepVerbStub({ value: verb })),
);

describe('isBrowserStepGuard', () => {
  it.each(stepStatics.verbs.all)(
    'VALID: {verb: %s} => returns whether the verb is a browser verb',
    (verb) => {
      const stepVerb = StepVerbStub({ value: verb });
      const result = isBrowserStepGuard({ verb: stepVerb });

      expect(result).toBe(BROWSER_VERBS.has(stepVerb));
    },
  );

  describe('empty input', () => {
    it('EMPTY: {verb: undefined} => returns false', () => {
      const result = isBrowserStepGuard({});

      expect(result).toBe(false);
    });
  });
});
