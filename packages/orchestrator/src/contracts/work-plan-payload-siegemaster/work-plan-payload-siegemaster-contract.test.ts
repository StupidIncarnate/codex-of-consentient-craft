import { workPlanPayloadSiegemasterContract } from './work-plan-payload-siegemaster-contract';
import { WorkPlanPayloadSiegemasterStub } from './work-plan-payload-siegemaster.stub';

const OFF_MAP_FAMILIES = workPlanPayloadSiegemasterContract.shape.offMapFamily.unwrap().options;

describe('workPlanPayloadSiegemasterContract', () => {
  describe('valid payloads', () => {
    it('VALID: {no overrides} => parses the whole worked payload', () => {
      expect(WorkPlanPayloadSiegemasterStub()).toStrictEqual({
        path: {
          nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
          branchLabels: ['1 or more queued', 'clicks send'],
          exitsFlow: false,
        },
        offMapFamily: 'hostile-input',
      });
    });

    it('EMPTY: {offMapFamily: null} => parses, since a round may attack no family', () => {
      expect(WorkPlanPayloadSiegemasterStub({ offMapFamily: null }).offMapFamily).toBe(null);
    });

    it('VALID: {path with exitsFlow true} => the crossing survives the parse', () => {
      expect(
        WorkPlanPayloadSiegemasterStub({
          path: { nodeIds: ['queue-has-entries', 'hand-off-to-review'], exitsFlow: true },
        }).path,
      ).toStrictEqual({
        nodeIds: ['queue-has-entries', 'hand-off-to-review'],
        branchLabels: [],
        exitsFlow: true,
      });
    });
  });

  describe('offMapFamily accepts only the real seven', () => {
    it('VALID: {options} => are the seven probe families, in the enumerator order', () => {
      expect(OFF_MAP_FAMILIES).toStrictEqual([
        're-entry',
        'concurrency',
        'interruption',
        'staleness',
        'configuration',
        'hostile-input',
        'perf',
      ]);
    });

    it.each(OFF_MAP_FAMILIES)('VALID: {offMapFamily: %s} => parses', (family) => {
      expect(WorkPlanPayloadSiegemasterStub({ offMapFamily: family }).offMapFamily).toBe(family);
    });

    it("INVALID: {offMapFamily: 'security'} => refused by name, since an eighth family is not one", () => {
      expect(() => WorkPlanPayloadSiegemasterStub({ offMapFamily: 'security' as never })).toThrow(
        /Invalid enum value.*received 'security'/su,
      );
    });
  });

  describe('this family declares no units key', () => {
    it('VALID: {a units key supplied} => it is stripped, which is what switches off the 1:1 check', () => {
      expect(
        workPlanPayloadSiegemasterContract.parse({
          path: { nodeIds: ['batch-sent'] },
          offMapFamily: null,
          units: [{ unitId: 'send-flow:terminal:batch-sent' }],
        }),
      ).toStrictEqual({
        path: { nodeIds: ['batch-sent'], branchLabels: [], exitsFlow: false },
        offMapFamily: null,
      });
    });
  });

  describe('invalid payloads', () => {
    it('EMPTY: {empty object} => refused, since neither key carries a default', () => {
      expect(workPlanPayloadSiegemasterContract.safeParse({}).success).toBe(false);
    });

    it('EMPTY: {path with no nodeIds} => refused', () => {
      expect(() => WorkPlanPayloadSiegemasterStub({ path: { nodeIds: [] } })).toThrow(
        /Array must contain at least 1 element/u,
      );
    });
  });
});
