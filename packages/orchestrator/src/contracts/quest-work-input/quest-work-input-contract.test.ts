import { UnitObservationFieldsStub } from '@dungeonmaster/shared/contracts/unit-observation-fields/unit-observation-fields.stub';

import { WorkPlanFieldsStub } from '../work-plan-fields/work-plan-fields.stub';

import { questWorkInputContract } from './quest-work-input-contract';
import { QuestWorkInputStub } from './quest-work-input.stub';

describe('questWorkInputContract', () => {
  describe('plan payload', () => {
    it('VALID: {kind: plan, plan: envelope with no writtenBy/writtenAt} => round-trips', () => {
      const plan = { ...WorkPlanFieldsStub() };
      Reflect.deleteProperty(plan, 'writtenBy');
      Reflect.deleteProperty(plan, 'writtenAt');
      const input = QuestWorkInputStub({ payload: { kind: 'plan', plan } });

      const result = questWorkInputContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('INVALID: {kind: plan, plan carries a caller-supplied writtenAt} => throws, key refused not discarded', () => {
      const plan = { ...WorkPlanFieldsStub() };
      Reflect.deleteProperty(plan, 'writtenBy');

      expect(() => QuestWorkInputStub({ payload: { kind: 'plan', plan } })).toThrow(
        /unrecognized/iu,
      );
    });

    it("INVALID: {kind: plan, plannerMarks holds 'met'} => throws via the re-applied workPlanContract refinement", () => {
      const plan = WorkPlanFieldsStub({
        plannerMarks: [
          UnitObservationFieldsStub({ mark: 'met', unitId: 'send-flow:observable:unreached' }),
        ],
      });
      Reflect.deleteProperty(plan, 'writtenBy');
      Reflect.deleteProperty(plan, 'writtenAt');
      plan.plannerMarks.forEach((mark) => Reflect.deleteProperty(mark, 'at'));

      expect(() => QuestWorkInputStub({ payload: { kind: 'plan', plan } })).toThrow(
        /a planner may only write 'cant-meet'/u,
      );
    });

    it('VALID: {kind: plan, a cant-meet plannerMark carrying no at} => accepted, the broker stamps at', () => {
      const plan = WorkPlanFieldsStub({
        plannerMarks: [
          UnitObservationFieldsStub({
            mark: 'cant-meet',
            toSettle: 'allocate perf to a fourth round',
            unitId: 'send-flow:off-map:perf',
          }),
        ],
      });
      Reflect.deleteProperty(plan, 'writtenBy');
      Reflect.deleteProperty(plan, 'writtenAt');
      plan.plannerMarks.forEach((mark) => Reflect.deleteProperty(mark, 'at'));

      const result = QuestWorkInputStub({ payload: { kind: 'plan', plan } });

      expect(result.payload).toStrictEqual({ kind: 'plan', plan });
    });

    it('INVALID: {kind: plan, a plannerMark carrying a caller-supplied at} => refused, key named by its path', () => {
      const plan = WorkPlanFieldsStub({
        plannerMarks: [
          UnitObservationFieldsStub({
            mark: 'cant-meet',
            toSettle: 'allocate perf to a fourth round',
            unitId: 'send-flow:off-map:perf',
          }),
        ],
      });
      Reflect.deleteProperty(plan, 'writtenBy');
      Reflect.deleteProperty(plan, 'writtenAt');

      expect(() => QuestWorkInputStub({ payload: { kind: 'plan', plan } })).toThrow(
        /unrecognized/iu,
      );
    });
  });

  describe('amendment payload', () => {
    it('VALID: {kind: amendment, reason, plan} => round-trips', () => {
      const plan = { ...WorkPlanFieldsStub() };
      Reflect.deleteProperty(plan, 'writtenBy');
      Reflect.deleteProperty(plan, 'writtenAt');
      const input = QuestWorkInputStub({
        payload: {
          kind: 'amendment',
          reason: 'the piece boundary was wrong',
          plan,
        },
      });

      const result = questWorkInputContract.parse(input);

      expect(result).toStrictEqual(input);
    });
  });

  describe('observations payload', () => {
    it("VALID: {kind: observations, one 'met'} => round-trips", () => {
      const observation = { ...UnitObservationFieldsStub() };
      Reflect.deleteProperty(observation, 'at');
      const input = QuestWorkInputStub({
        payload: { kind: 'observations', observations: [observation] },
      });

      const result = questWorkInputContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it("VALID: {kind: observations, one 'cant-meet' with toSettle} => round-trips", () => {
      const observation = {
        ...UnitObservationFieldsStub({
          mark: 'cant-meet',
          toSettle: 'drive a real send and read the session JSONL',
        }),
      };
      Reflect.deleteProperty(observation, 'at');
      const input = QuestWorkInputStub({
        payload: { kind: 'observations', observations: [observation] },
      });

      const result = questWorkInputContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it("INVALID: {kind: observations, 'cant-meet' with NO toSettle} => throws at the tool", () => {
      const observation = { ...UnitObservationFieldsStub({ mark: 'cant-meet' }) };
      Reflect.deleteProperty(observation, 'at');
      Reflect.deleteProperty(observation, 'toSettle');

      expect(() =>
        QuestWorkInputStub({
          payload: { kind: 'observations', observations: [observation] },
        }),
      ).toThrow(/toSettle is required when mark is 'cant-meet'/u);
    });

    it("INVALID: {kind: observations, 'met' carrying a toSettle} => throws at the tool", () => {
      const observation = {
        ...UnitObservationFieldsStub({ toSettle: 'never valid on met' }),
      };
      Reflect.deleteProperty(observation, 'at');

      expect(() =>
        QuestWorkInputStub({
          payload: { kind: 'observations', observations: [observation] },
        }),
      ).toThrow(/toSettle is only valid when mark is 'cant-meet'/u);
    });

    it('INVALID: {kind: observations, a caller-supplied at} => throws, key refused not discarded', () => {
      const observation = { ...UnitObservationFieldsStub() };

      expect(() =>
        QuestWorkInputStub({
          payload: { kind: 'observations', observations: [observation] },
        }),
      ).toThrow(/unrecognized/iu);
    });

    it('EMPTY: {kind: observations, observations: []} => throws — an empty call should say so through outcome', () => {
      expect(() =>
        QuestWorkInputStub({ payload: { kind: 'observations', observations: [] } }),
      ).toThrow(/>=1 items/iu);
    });
  });

  describe('outcome payload', () => {
    it.each(['done', 'unmet', 'empty', 'wall'] as const)(
      'VALID: {kind: outcome, word: %s} => round-trips',
      (word) => {
        const input = QuestWorkInputStub({
          payload: { kind: 'outcome', word, reason: 'why this word' },
        });

        const result = questWorkInputContract.parse(input);

        expect(result).toStrictEqual(input);
      },
    );
  });

  describe('invalidation payload', () => {
    it('INVALID: {kind: invalidation} => refused, the kind no longer exists', () => {
      expect(() =>
        questWorkInputContract.parse(
          QuestWorkInputStub({
            payload: { kind: 'invalidation', flowId: 'send-flow', reason: 'fixed' } as never,
          }),
        ),
      ).toThrow(/invalid/iu);
    });
  });

  describe('request payload', () => {
    it('VALID: {kind: request, step, reason} => round-trips', () => {
      const input = QuestWorkInputStub({
        payload: {
          kind: 'request',
          step: 'recipe',
          reason: 'the send-flow seed is missing',
        },
      });

      const result = questWorkInputContract.parse(input);

      expect(result).toStrictEqual(input);
    });
  });

  describe('the discriminated union', () => {
    it("INVALID: {payload.kind: 'signal'} => refused, no seventh branch exists", () => {
      expect(() =>
        questWorkInputContract.parse({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          payload: { kind: 'signal', reason: 'not a real kind' },
        }),
      ).toThrow(/invalid/iu);
    });

    it('INVALID: {an unadvertised top-level key} => refused by .strict()', () => {
      const input: Record<PropertyKey, unknown> = QuestWorkInputStub();
      input.extra = 'nope';

      expect(() => questWorkInputContract.parse(input)).toThrow(/unrecognized/iu);
    });
  });
});
