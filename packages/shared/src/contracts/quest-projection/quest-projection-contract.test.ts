import { questProjectionContract } from './quest-projection-contract';
import { QuestProjectionStub } from './quest-projection.stub';

describe('questProjectionContract', () => {
  describe('valid projections', () => {
    it('VALID: {questId only} => defaults scopes and counts to empty/zero', () => {
      expect(QuestProjectionStub()).toStrictEqual({
        questId: 'add-auth',
        scopes: [],
        totalPlannedSteps: 0,
        completedSteps: 0,
      });
    });

    it('VALID: {one scope with an actual and a planned step} => keeps both rows in order', () => {
      const projection = QuestProjectionStub({
        scopes: [
          {
            operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
            steps: [
              {
                step: 'plan',
                kind: 'actual',
                workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status: 'complete',
              },
              { step: 'work', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 2,
        completedSteps: 1,
      });

      expect(projection).toStrictEqual({
        questId: 'add-auth',
        scopes: [
          {
            operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
            steps: [
              {
                step: 'plan',
                kind: 'actual',
                workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                status: 'complete',
              },
              { step: 'work', kind: 'planned' },
            ],
          },
        ],
        totalPlannedSteps: 2,
        completedSteps: 1,
      });
    });

    it('VALID: {an actual step carrying pieceId and mintedBy} => keeps both back-edge fields', () => {
      const projection = QuestProjectionStub({
        scopes: [
          {
            operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            status: 'in_progress',
            steps: [
              {
                step: 'fixHappy',
                kind: 'actual',
                workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                pieceId: 'pc-1',
                status: 'complete',
                mintedBy: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
              },
            ],
          },
        ],
      });

      expect(projection.scopes[0]?.steps[0]).toStrictEqual({
        step: 'fixHappy',
        kind: 'actual',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        pieceId: 'pc-1',
        status: 'complete',
        mintedBy: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {no questId} => throws, a projection names the quest it projects', () => {
      expect(() => questProjectionContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {kind: "pending"} => throws, kind is only actual or planned', () => {
      expect(() =>
        questProjectionContract.parse({
          questId: 'add-auth',
          scopes: [
            {
              operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              role: 'codeweaver',
              text: 'core: config load+validate adapter',
              status: 'pending',
              steps: [{ step: 'plan', kind: 'pending' }],
            },
          ],
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {a step carrying an unrecognized key} => throws rather than dropping it', () => {
      expect(() =>
        questProjectionContract.parse({
          questId: 'add-auth',
          scopes: [
            {
              operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              role: 'codeweaver',
              text: 'core: config load+validate adapter',
              status: 'pending',
              steps: [{ step: 'plan', kind: 'planned', pieceLabel: 'login broker' }],
            },
          ],
        }),
      ).toThrow(/Unrecognized key\(s\) in object: 'pieceLabel'/u);
    });

    it('INVALID: {a scope carrying an unrecognized key} => throws rather than dropping it', () => {
      expect(() =>
        questProjectionContract.parse({
          questId: 'add-auth',
          scopes: [
            {
              operationId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              role: 'codeweaver',
              text: 'core: config load+validate adapter',
              status: 'pending',
              flowIds: ['login-flow'],
              steps: [],
            },
          ],
        }),
      ).toThrow(/Unrecognized key\(s\) in object: 'flowIds'/u);
    });

    it('INVALID: {totalPlannedSteps written as totalSteps} => throws rather than defaulting to zero', () => {
      expect(() => questProjectionContract.parse({ questId: 'add-auth', totalSteps: 5 })).toThrow(
        /Unrecognized key\(s\) in object: 'totalSteps'/u,
      );
    });
  });
});
