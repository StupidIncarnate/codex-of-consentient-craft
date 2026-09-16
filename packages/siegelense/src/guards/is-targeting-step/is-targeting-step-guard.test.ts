import { ContentTextStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { isTargetingStepGuard } from './is-targeting-step-guard';
import { LocatorStateStub } from '../../contracts/locator-state/locator-state.stub';
import { SelectorStub } from '../../contracts/selector/selector.stub';
import { UrlPathStub } from '../../contracts/url-path/url-path.stub';
import { stepStatics } from '../../statics/step/step-statics';
import { StepStub } from '../../contracts/step/step.stub';

// Every member's own minimal fixture, built through StepStub so each override goes through
// stepContract.parse rather than a raw literal — one entry per member of stepStatics.verbs.all.
const STEP_FIXTURES = [
  StepStub({ step: 'goto', path: UrlPathStub() }),
  StepStub({ step: 'waitFor', target: SelectorStub(), state: LocatorStateStub() }),
  StepStub({ step: 'click', target: SelectorStub() }),
  StepStub({ step: 'type', target: SelectorStub(), value: ContentTextStub() }),
  StepStub({ step: 'screenshot', name: FileNameStub({ value: 'step1.png' }) }),
  StepStub({ step: 'eval', source: ContentTextStub() }),
];

type StepVerbLiteral = ReturnType<typeof StepStub>['step'];

const TARGETING_VERBS = new Set<StepVerbLiteral>(stepStatics.verbs.targeting);

describe('isTargetingStepGuard', () => {
  describe.each(STEP_FIXTURES)('verb: $step', (step) => {
    it('VALID: {step} => returns whether the member carries a target', () => {
      const result = isTargetingStepGuard({ step });

      expect(result).toBe(TARGETING_VERBS.has(step.step));
    });
  });

  describe('empty input', () => {
    it('EMPTY: {step: undefined} => returns false', () => {
      const result = isTargetingStepGuard({});

      expect(result).toBe(false);
    });
  });
});
