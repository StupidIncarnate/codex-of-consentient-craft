import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';

import { workPlanFieldsContract } from './work-plan-fields-contract';
import { WorkPlanFieldsStub } from './work-plan-fields.stub';

const FAMILIES = workPlanFieldsContract.shape.family.options;

describe('workPlanFieldsContract', () => {
  describe('the family enum', () => {
    it('VALID: {options} => are exactly agentPromptClassificationStatics.operatorRoleNames', () => {
      expect(FAMILIES).toStrictEqual([...agentPromptClassificationStatics.operatorRoleNames]);
    });

    it.each(FAMILIES)('VALID: {family: %s} => parses', (family) => {
      expect(WorkPlanFieldsStub({ family, batches: [] }).family).toBe(family);
    });

    it("INVALID: {family: 'warpgate'} => refused, since warpgate holds no plan step", () => {
      expect(() => WorkPlanFieldsStub({ family: 'warpgate' as never })).toThrow(
        /Invalid enum value.*received 'warpgate'/su,
      );
    });
  });

  describe('flowId is nullable, not optional', () => {
    it('EMPTY: {flowId: null} => parses — a contracts-only cell tags no node anywhere', () => {
      expect(WorkPlanFieldsStub({ flowId: null }).flowId).toBe(null);
    });

    it('INVALID: {no flowId key} => refused, since the field is nullable rather than optional', () => {
      expect(
        workPlanFieldsContract.safeParse({
          operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          family: 'codeweaver',
          writtenBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          writtenAt: '2026-01-01T00:00:00.000Z',
        }).success,
      ).toBe(false);
    });
  });

  describe('defaults', () => {
    it('VALID: {only the required keys} => packageNames, batches and plannerMarks each default to []', () => {
      const plan = workPlanFieldsContract.parse({
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        family: 'siegemaster',
        flowId: null,
        writtenBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        writtenAt: '2026-01-01T00:00:00.000Z',
      });

      expect(plan).toStrictEqual({
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        family: 'siegemaster',
        flowId: null,
        packageNames: [],
        writtenBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        writtenAt: '2026-01-01T00:00:00.000Z',
        batches: [],
        plannerMarks: [],
      });
    });
  });

  describe('the shape story 17 needs: the two server-stamped fields omitted', () => {
    it('VALID: {omit writtenBy and writtenAt} => an inbound payload carrying neither parses', () => {
      const inboundContract = workPlanFieldsContract.omit({ writtenBy: true, writtenAt: true });

      expect(
        inboundContract.parse({
          operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          family: 'flowrider',
          flowId: 'send-flow',
        }),
      ).toStrictEqual({
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        family: 'flowrider',
        flowId: 'send-flow',
        packageNames: [],
        batches: [],
        plannerMarks: [],
      });
    });
  });

  describe('invalid plans', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanFieldsContract.safeParse({}).success).toBe(false);
    });

    it('INVALID: {writtenAt not an ISO datetime} => refused', () => {
      expect(() => WorkPlanFieldsStub({ writtenAt: '2026-01-01' })).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {operationItemId not a uuid} => refused', () => {
      expect(() => WorkPlanFieldsStub({ operationItemId: 'pc-badge' })).toThrow(/Invalid uuid/u);
    });
  });
});
