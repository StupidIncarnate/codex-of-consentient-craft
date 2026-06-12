import { planningCodeweaverPlanContract } from './planning-codeweaver-plan-contract';
import { PlanningCodeweaverPlanStub } from './planning-codeweaver-plan.stub';

describe('planningCodeweaverPlanContract', () => {
  describe('valid codeweaver plan', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningCodeweaverPlanStub();

      expect(result).toStrictEqual({
        id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        sliceName: 'web',
        logicPlan: [],
        delegations: [],
        rationale: [],
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {populated logicPlan, delegations, rationale} => parses successfully', () => {
      const result = PlanningCodeweaverPlanStub({
        logicPlan: ['Lift confirmingQuestId to the parent; pass it + onChange down'],
        delegations: [
          {
            pattern: 'Mantine Popover jsdom test recipe',
            status: 'returned',
            exampleArtifact: 'withinPortal={false} + transitionProps={{duration:0}}',
            outcome: 'Pattern proven; mirrored into the widget step',
          },
        ],
        rationale: ['Mirror quest-abandon-broker for the fetch shape'],
      });

      expect(result).toStrictEqual({
        id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        sliceName: 'web',
        logicPlan: ['Lift confirmingQuestId to the parent; pass it + onChange down'],
        delegations: [
          {
            pattern: 'Mantine Popover jsdom test recipe',
            status: 'returned',
            exampleArtifact: 'withinPortal={false} + transitionProps={{duration:0}}',
            outcome: 'Pattern proven; mirrored into the widget step',
          },
        ],
        rationale: ['Mirror quest-abandon-broker for the fetch shape'],
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {delegation status: pending, no outcome} => parses successfully', () => {
      const result = PlanningCodeweaverPlanStub({
        delegations: [{ pattern: 'novel adapter', status: 'pending' }],
      });

      expect(result.delegations).toStrictEqual([{ pattern: 'novel adapter', status: 'pending' }]);
    });
  });

  describe('invalid codeweaver plan', () => {
    it('INVALID: {updatedAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningCodeweaverPlanContract.parse({
          id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          sliceName: 'web',
          updatedAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return planningCodeweaverPlanContract.parse({
          id: 'not-a-uuid',
          sliceName: 'web',
          updatedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {logicPlan: [""]} => throws validation error', () => {
      expect(() => {
        return planningCodeweaverPlanContract.parse({
          id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          sliceName: 'web',
          logicPlan: [''],
          updatedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {delegations: [{status: "bogus"}]} => throws validation error', () => {
      expect(() => {
        return planningCodeweaverPlanContract.parse({
          id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          sliceName: 'web',
          delegations: [{ pattern: 'x', status: 'bogus' }],
          updatedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
