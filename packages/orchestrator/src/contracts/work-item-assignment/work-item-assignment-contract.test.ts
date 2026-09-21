import { workItemAssignmentContract } from './work-item-assignment-contract';
import { WorkItemAssignmentStub } from './work-item-assignment.stub';

describe('workItemAssignmentContract', () => {
  describe('valid payloads', () => {
    it('VALID: {no overrides} => parses one assigned unit', () => {
      expect(WorkItemAssignmentStub()).toStrictEqual({
        units: [{ unitId: 'send-flow:observable:check-badge-count-text' }],
      });
    });

    it('VALID: {two units} => parses both, in order', () => {
      expect(
        WorkItemAssignmentStub({
          units: [
            { unitId: 'send-flow:observable:obs-3' },
            { unitId: 'send-flow:terminal:sent-ok' },
          ],
        }),
      ).toStrictEqual({
        units: [{ unitId: 'send-flow:observable:obs-3' }, { unitId: 'send-flow:terminal:sent-ok' }],
      });
    });

    it("VALID: {unitId: 'send-flow:off-map:hostile-input'} => parses the hyphenated off-map kind", () => {
      expect(
        WorkItemAssignmentStub({ units: [{ unitId: 'send-flow:off-map:hostile-input' }] }),
      ).toStrictEqual({ units: [{ unitId: 'send-flow:off-map:hostile-input' }] });
    });
  });

  describe('passthrough keeps the rest of a family entry', () => {
    it('VALID: {unitId plus layer, assert, failsIf} => keeps every key it does not assert', () => {
      expect(
        WorkItemAssignmentStub({
          units: [
            {
              unitId: 'send-flow:observable:obs-3',
              layer: 'browser',
              assert: 'read the badge text',
              failsIf: 'the badge reads 0',
            },
          ],
        }),
      ).toStrictEqual({
        units: [
          {
            unitId: 'send-flow:observable:obs-3',
            layer: 'browser',
            assert: 'read the badge text',
            failsIf: 'the badge reads 0',
          },
        ],
      });
    });
  });

  describe('a payload with no units key', () => {
    it('EMPTY: {empty object} => parses to an empty assignment rather than throwing', () => {
      expect(workItemAssignmentContract.parse({})).toStrictEqual({ units: [] });
    });

    it('VALID: {only a family key} => parses to an empty assignment, keeping nothing else', () => {
      expect(workItemAssignmentContract.parse({ recipeId: 'codeweaver-unit' })).toStrictEqual({
        units: [],
      });
    });
  });

  describe('invalid payloads', () => {
    it("INVALID: {unitId: 'obs-3'} => refused, since a unit id is <flowId>:<kind>:<localId>", () => {
      expect(() => WorkItemAssignmentStub({ units: [{ unitId: 'obs-3' }] })).toThrow(/Invalid/u);
    });

    it('EMPTY: {payload: undefined} => refused, which is what sends the reader to its fallback', () => {
      expect(workItemAssignmentContract.safeParse(undefined).success).toBe(false);
    });

    it('INVALID: {units: not an array} => refused', () => {
      expect(workItemAssignmentContract.safeParse({ units: 'obs-3' }).success).toBe(false);
    });
  });
});
