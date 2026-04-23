import {
  questGateContentRequirementsStatics,
  questStatusTransitionsStatics,
} from '@dungeonmaster/shared/statics';

import { questStatusInputAllowlistStatics } from '../quest-status-input-allowlist/quest-status-input-allowlist-statics';
import { questHydrateStrategyStatics } from './quest-hydrate-strategy-statics';

const WALK_PATH = questHydrateStrategyStatics.walkPath;

const TRANSITION_CASES = WALK_PATH.map((toStatus) => {
  const strategy = questHydrateStrategyStatics.strategies[toStatus];
  const transitions = questStatusTransitionsStatics[strategy.fromStatus];
  const match = transitions.find((t) => t === toStatus) ?? 'missing';
  return { toStatus, match };
});

const GATE_CASES = Object.entries(questGateContentRequirementsStatics.gates)
  .filter(([gate]) => WALK_PATH.some((s) => s === gate))
  .flatMap(([gate, requirements]) =>
    requirements.map((requirement) => {
      const idx = WALK_PATH.findIndex((s) => s === gate);
      const priorSteps = WALK_PATH.slice(0, idx + 1);
      const covered = priorSteps.some((toStatus) => {
        const strategy = questHydrateStrategyStatics.strategies[toStatus];
        return (
          (requirement === 'flows' && strategy.flowsMode !== 'exclude') ||
          (requirement.startsWith('planningNotes.') &&
            strategy.planningNotesFields.some((f) => `planningNotes.${f}` === requirement))
        );
      });
      return { gate, requirement, covered };
    }),
  );

const BLUEPRINT_FIELD_CASES = WALK_PATH.map((toStatus) => {
  const strategy = questHydrateStrategyStatics.strategies[toStatus];
  const allowed = questStatusInputAllowlistStatics[strategy.fromStatus].allowedFields;
  const missing = strategy.blueprintFields.filter((f) => !allowed.some((a) => a === f));
  return { toStatus, missing };
});

const FLOWS_TOPLEVEL_CASES = WALK_PATH.map((toStatus) => {
  const strategy = questHydrateStrategyStatics.strategies[toStatus];
  const flowsAllowed =
    strategy.flowsMode === 'exclude'
      ? true
      : questStatusInputAllowlistStatics[strategy.fromStatus].allowedFields.some(
          (a) => a === 'flows',
        );
  return { toStatus, flowsAllowed };
});

const PLANNING_NOTES_TOPLEVEL_CASES = WALK_PATH.map((toStatus) => {
  const strategy = questHydrateStrategyStatics.strategies[toStatus];
  const planningNotesAllowed =
    strategy.planningNotesFields.length === 0
      ? true
      : questStatusInputAllowlistStatics[strategy.fromStatus].allowedFields.some(
          (a) => a === 'planningNotes',
        );
  return { toStatus, planningNotesAllowed };
});

const PLANNING_NOTES_SUBFIELD_CASES = WALK_PATH.map((toStatus) => {
  const strategy = questHydrateStrategyStatics.strategies[toStatus];
  const allowedSubs =
    questStatusInputAllowlistStatics[strategy.fromStatus].allowedPlanningNotesFields;
  const missing = strategy.planningNotesFields.filter((f) => !allowedSubs.some((a) => a === f));
  return { toStatus, missing };
});

const FLOWS_MODE_RULE_CASES = WALK_PATH.map((toStatus) => {
  const strategy = questHydrateStrategyStatics.strategies[toStatus];
  const fromRule = questStatusInputAllowlistStatics[strategy.fromStatus].flowsRule;
  const effectiveMode = strategy.flowsMode === 'exclude' ? fromRule : strategy.flowsMode;
  return { toStatus, fromRule, effectiveMode };
});

describe('questHydrateStrategyStatics', () => {
  describe('exhaustiveness', () => {
    it('VALID: {strategies keys} => match every quest status key in the allowlist statics', () => {
      expect(Object.keys(questHydrateStrategyStatics.strategies).sort()).toStrictEqual(
        Object.keys(questStatusInputAllowlistStatics).sort(),
      );
    });

    it('VALID: {strategies keys} => match every quest status key in the transitions statics', () => {
      expect(Object.keys(questHydrateStrategyStatics.strategies).sort()).toStrictEqual(
        Object.keys(questStatusTransitionsStatics).sort(),
      );
    });
  });

  describe('walkPath structure', () => {
    it('VALID: {walkPath} => starts at explore_flows and ends at in_progress', () => {
      expect({
        first: WALK_PATH[0],
        last: WALK_PATH[WALK_PATH.length - 1],
      }).toStrictEqual({ first: 'explore_flows', last: 'in_progress' });
    });

    it.each(TRANSITION_CASES)(
      'VALID: {walkPath step: $toStatus} => fromStatus declares toStatus as an allowed transition',
      ({ toStatus, match }) => {
        expect(match).toBe(toStatus);
      },
    );
  });

  describe('gate coverage', () => {
    it.each(GATE_CASES)(
      'VALID: {gate: $gate, requirement: $requirement} => requirement is populated by a prior hydrator step',
      ({ covered }) => {
        expect(covered).toBe(true);
      },
    );
  });

  describe('allowlist compliance', () => {
    it.each(BLUEPRINT_FIELD_CASES)(
      'VALID: {walkPath step: $toStatus} => every blueprint field is in the fromStatus allowedFields',
      ({ missing }) => {
        expect(missing).toStrictEqual([]);
      },
    );

    it.each(FLOWS_TOPLEVEL_CASES)(
      'VALID: {walkPath step: $toStatus} => flows top-level is allowed when flowsMode is not exclude',
      ({ flowsAllowed }) => {
        expect(flowsAllowed).toBe(true);
      },
    );

    it.each(PLANNING_NOTES_TOPLEVEL_CASES)(
      'VALID: {walkPath step: $toStatus} => planningNotes top-level is allowed when strategy writes sub-fields',
      ({ planningNotesAllowed }) => {
        expect(planningNotesAllowed).toBe(true);
      },
    );

    it.each(PLANNING_NOTES_SUBFIELD_CASES)(
      'VALID: {walkPath step: $toStatus} => every planningNotes sub-field is in allowedPlanningNotesFields',
      ({ missing }) => {
        expect(missing).toStrictEqual([]);
      },
    );

    it.each(FLOWS_MODE_RULE_CASES)(
      'VALID: {walkPath step: $toStatus} => flowsMode matches the fromStatus flowsRule when not exclude',
      ({ fromRule, effectiveMode }) => {
        expect(effectiveMode).toBe(fromRule);
      },
    );
  });
});
