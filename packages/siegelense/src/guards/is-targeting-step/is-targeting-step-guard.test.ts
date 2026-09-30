import { isTargetingStepGuard } from './is-targeting-step-guard';
import { LocatorStateStub } from '../../contracts/locator-state/locator-state.stub';
import { stepStatics } from '../../statics/step/step-statics';
import { StepStub } from '../../contracts/step/step.stub';

// Every member's own minimal fixture, built through StepStub so each override goes through
// stepContract.parse rather than a raw literal — one entry per member of stepStatics.verbs.all.
const STEP_FIXTURES = [
  StepStub({ step: 'goto', path: '/api/guilds' }),
  StepStub({ step: 'waitFor', target: '[data-testid="GUILD_ADD"]', state: LocatorStateStub() }),
  StepStub({ step: 'click', target: '[data-testid="GUILD_ADD"]' }),
  StepStub({ step: 'type', target: '[data-testid="GUILD_ADD"]', value: 'Result text' }),
  StepStub({ step: 'screenshot', name: 'step1.png' }),
  StepStub({ step: 'eval', source: 'Result text' }),
  StepStub({ step: 'dom', target: '[data-testid="GUILD_ADD"]' }),
  StepStub({ step: 'until', visible: '[data-testid="GUILD_ADD"]' }),
  StepStub({ step: 'key', press: 'Enter' }),
  StepStub({ step: 'health' }),
  StepStub({ step: 'resize', width: 1280, height: 720 }),
  StepStub({ step: 'storage' }),
  StepStub({ step: 'paste', target: '[data-testid="GUILD_ADD"]', value: 'Result text' }),
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
