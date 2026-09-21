import { WorkPlanBatchStub } from '../work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadCodeweaverStub } from '../work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';
import { WorkPlanPayloadFlowriderStub } from '../work-plan-payload-flowrider/work-plan-payload-flowrider.stub';
import { WorkPlanPayloadSiegemasterStub } from '../work-plan-payload-siegemaster/work-plan-payload-siegemaster.stub';
import { WorkPlanPieceStub } from '../work-plan-piece/work-plan-piece.stub';

import { workPlanContract } from './work-plan-contract';
import { WorkPlanStub } from './work-plan.stub';

describe('workPlanContract', () => {
  describe('a full envelope round-trips, one fixture per family', () => {
    it('VALID: {no overrides} => the stub parses, so the default envelope is a legal codeweaver plan', () => {
      const plan = WorkPlanStub();

      expect({
        operationItemId: plan.operationItemId,
        family: plan.family,
        flowId: plan.flowId,
        packageNames: plan.packageNames,
        writtenBy: plan.writtenBy,
        writtenAt: plan.writtenAt,
        plannerMarks: plan.plannerMarks,
        pieceIds: plan.batches.flatMap((batch) => batch.pieces.map((piece) => piece.id)),
      }).toStrictEqual({
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        family: 'codeweaver',
        flowId: 'send-flow',
        packageNames: ['@dungeonmaster/web'],
        writtenBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        writtenAt: '2026-01-01T00:00:00.000Z',
        plannerMarks: [],
        pieceIds: ['pc-badge'],
      });
    });

    it('VALID: {family: flowrider, a spec piece} => parses, with units 1:1 against assignedUnitIds', () => {
      const plan = WorkPlanStub({
        family: 'flowrider',
        batches: [
          WorkPlanBatchStub({
            mode: 'sequential',
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-walk-1',
                step: 'happyWalk',
                assignedUnitIds: ['send-flow:terminal:batch-sent'],
                contextUnitIds: [],
                payload: WorkPlanPayloadFlowriderStub(),
              }),
            ],
          }),
        ],
      });

      expect(
        plan.batches.flatMap((batch) => batch.pieces.map((piece) => piece.assignedUnitIds)),
      ).toStrictEqual([['send-flow:terminal:batch-sent']]);
    });

    it('VALID: {family: siegemaster, an off-map round} => parses on a payload carrying no units key at all', () => {
      const plan = WorkPlanStub({
        family: 'siegemaster',
        batches: [
          WorkPlanBatchStub({
            mode: 'sequential',
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-round-1',
                step: 'offMapRound',
                assignedUnitIds: ['send-flow:off-map:hostile-input'],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub(),
              }),
            ],
          }),
        ],
      });

      expect(
        plan.batches.flatMap((batch) => batch.pieces.map((piece) => piece.assignedUnitIds)),
      ).toStrictEqual([['send-flow:off-map:hostile-input']]);
    });

    it('EMPTY: {a codeweaver piece with assignedUnitIds: [] and units: []} => parses, since contracts are proved by the code that reads them', () => {
      const plan = WorkPlanStub({
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-contracts',
                assignedUnitIds: [],
                contextUnitIds: ['send-flow:observable:check-badge-count-text'],
                payload: WorkPlanPayloadCodeweaverStub({ units: [] }),
              }),
            ],
          }),
        ],
      });

      expect(
        plan.batches.flatMap((batch) => batch.pieces.map((piece) => piece.assignedUnitIds)),
      ).toStrictEqual([[]]);
    });

    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanContract.safeParse({}).success).toBe(false);
    });
  });

  describe("plannerMarks: the planner's ONE mark authority", () => {
    it("INVALID: {a mark of 'met'} => refused, naming the mark and the unit id", () => {
      expect(() =>
        WorkPlanStub({
          plannerMarks: [
            {
              unitId: 'send-flow:branch:queue-has-entries',
              mark: 'met',
              evidence: 'the planner read the reducer and believes the branch already holds',
              at: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ).toThrow(
        /plannerMarks\[0\]: a planner may only write 'cant-meet', never 'met'\. A planner gets no units — it may record that no piece will reach unit 'send-flow:branch:queue-has-entries' this pass, never that one was met\./u,
      );
    });

    it("INVALID: {a mark of 'unmet'} => refused the same way", () => {
      expect(() =>
        WorkPlanStub({
          plannerMarks: [
            {
              unitId: 'send-flow:branch:queue-has-entries',
              mark: 'unmet',
              evidence: 'nobody has written this yet',
              at: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ).toThrow(/a planner may only write 'cant-meet', never 'unmet'\./u);
    });

    it('INVALID: {a mark on a unit a piece in the same plan claims} => refused, naming the unit', () => {
      expect(() =>
        WorkPlanStub({
          plannerMarks: [
            {
              unitId: 'send-flow:observable:check-badge-count-text',
              mark: 'cant-meet',
              evidence: 'only three rounds are budgeted and four families are outstanding',
              toSettle: 'budget a fourth round and walk the badge path in it',
              at: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ).toThrow(
        /plannerMarks\[0\]: unit 'send-flow:observable:check-badge-count-text' is claimed by a piece in this same plan, so it cannot also carry a planner mark — a unit is either assigned to a session or recorded as uncovered, never both\./u,
      );
    });

    it("INVALID: {a 'cant-meet' with no toSettle} => refused, the pairing rule reaching here from the observation contract", () => {
      expect(() =>
        WorkPlanStub({
          plannerMarks: [
            {
              unitId: 'send-flow:off-map:perf',
              mark: 'cant-meet',
              evidence: 'only three rounds are budgeted and four families are outstanding',
              at: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      ).toThrow(/toSettle is required when mark is 'cant-meet'/u);
    });

    it("VALID: {a 'cant-meet' with toSettle, on a unit no piece claims} => parses", () => {
      const plan = WorkPlanStub({
        plannerMarks: [
          {
            unitId: 'send-flow:off-map:perf',
            mark: 'cant-meet',
            evidence: 'only three rounds are budgeted and four families are outstanding',
            toSettle: 'budget a fourth round and allocate perf to it',
            at: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

      expect(plan.plannerMarks).toStrictEqual([
        {
          unitId: 'send-flow:off-map:perf',
          mark: 'cant-meet',
          evidence: 'only three rounds are budgeted and four families are outstanding',
          toSettle: 'budget a fourth round and allocate perf to it',
          at: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('the per-family payload check', () => {
    it('INVALID: {a codeweaver plan whose piece carries a flowrider payload} => refused, naming the piece and the family', () => {
      expect(() =>
        WorkPlanStub({
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-badge',
                  payload: WorkPlanPayloadFlowriderStub(),
                }),
              ],
            }),
          ],
        }),
      ).toThrow(/piece 'pc-badge': payload does not match the codeweaver shape — /u);
    });

    it('INVALID: {a siegemaster plan whose piece carries a codeweaver payload} => refused, naming the piece and the family', () => {
      expect(() =>
        WorkPlanStub({
          family: 'siegemaster',
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-round-1',
                  assignedUnitIds: ['send-flow:off-map:hostile-input'],
                  payload: WorkPlanPayloadCodeweaverStub(),
                }),
              ],
            }),
          ],
        }),
      ).toThrow(/piece 'pc-round-1': payload does not match the siegemaster shape — /u);
    });
  });

  describe('the 1:1 check between payload.units[] and assignedUnitIds', () => {
    it('INVALID: {a codeweaver piece whose payload drops the assigned unit} => refused, naming the piece and the orphan', () => {
      expect(() =>
        WorkPlanStub({
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-badge',
                  assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
                  payload: WorkPlanPayloadCodeweaverStub({ units: [] }),
                }),
              ],
            }),
          ],
        }),
      ).toThrow(
        /piece 'pc-badge': payload\.units\[\] holds 0 entries for 1 assignedUnitIds — 'send-flow:observable:check-badge-count-text' has none/u,
      );
    });

    it('INVALID: {a codeweaver piece whose payload holds a unit nothing assigned} => refused, naming the extra', () => {
      expect(() =>
        WorkPlanStub({
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-badge',
                  assignedUnitIds: [],
                  payload: WorkPlanPayloadCodeweaverStub(),
                }),
              ],
            }),
          ],
        }),
      ).toThrow(
        /piece 'pc-badge': payload\.units\[\] holds 1 entries for 0 assignedUnitIds — 'send-flow:observable:check-badge-count-text' is in units\[\] but not assigned/u,
      );
    });

    it('INVALID: {a flowrider piece whose payload names a different unit} => refused, since the check binds this family too', () => {
      expect(() =>
        WorkPlanStub({
          family: 'flowrider',
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-walk-1',
                  assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
                  payload: WorkPlanPayloadFlowriderStub(),
                }),
              ],
            }),
          ],
        }),
      ).toThrow(
        /piece 'pc-walk-1': payload\.units\[\] holds 1 entries for 1 assignedUnitIds — 'send-flow:observable:check-badge-count-text' has none/u,
      );
    });

    it('VALID: {a siegemaster piece whose assignedUnitIds match nothing on the payload} => parses, since the family declares no units key', () => {
      const plan = WorkPlanStub({
        family: 'siegemaster',
        batches: [
          WorkPlanBatchStub({
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-round-1',
                assignedUnitIds: [
                  'send-flow:terminal:batch-sent',
                  'send-flow:branch:queue-has-entries',
                  'send-flow:off-map:hostile-input',
                ],
                payload: WorkPlanPayloadSiegemasterStub(),
              }),
            ],
          }),
        ],
      });

      expect(
        plan.batches.flatMap((batch) => batch.pieces.map((piece) => piece.assignedUnitIds)),
      ).toStrictEqual([
        [
          'send-flow:terminal:batch-sent',
          'send-flow:branch:queue-has-entries',
          'send-flow:off-map:hostile-input',
        ],
      ]);
    });
  });
});
