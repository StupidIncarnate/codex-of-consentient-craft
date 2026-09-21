import { OperationItemStub } from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { familyGraphCompleteDetectTransformer } from './family-graph-complete-detect-transformer';

type QuestTypeKey = keyof typeof questFlowStatics;

// Both declared types share one graph, so the terminal test has to hold for each of them; reading
// the list off the statics covers a third type the day it is added.
const QUEST_TYPES = Object.keys(questFlowStatics) as readonly QuestTypeKey[];

const WARD_FULL_COMPLETE = OperationItemStub({
  id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
  role: 'ward',
  text: 'Ward gate (full monorepo)',
  status: 'complete',
  locked: true,
});

const CODEWEAVER_COMPLETE = OperationItemStub({
  id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
  role: 'codeweaver',
  text: 'Codeweaver: build this slice — package: web · flow: send-comment',
  status: 'complete',
});

describe('familyGraphCompleteDetectTransformer', () => {
  describe('a family routing to @complete holds every one of its scopes complete', () => {
    it.each(QUEST_TYPES)(
      'VALID: {questType: %s, a complete wardFull scope} => true',
      (questType) => {
        expect(
          familyGraphCompleteDetectTransformer({
            operations: [CODEWEAVER_COMPLETE, WARD_FULL_COMPLETE],
            questType,
            questFlowStatics,
          }),
        ).toBe(true);
      },
    );

    it('VALID: {a complete warpgate scope, no wardFull scope} => true, which is the merged side of the same test', () => {
      expect(
        familyGraphCompleteDetectTransformer({
          operations: [
            OperationItemStub({
              id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
              role: 'warpgate',
              text: 'Warpgate: land this quest on the base branch',
              status: 'complete',
              locked: true,
            }),
          ],
          questType: 'feature',
          questFlowStatics,
        }),
      ).toBe(true);
    });
  });

  describe('a drained ledger that is an ordinary mid-run state', () => {
    it('EMPTY: {every codeweaver scope complete, NO wardFull scope on the ledger} => false', () => {
      expect(
        familyGraphCompleteDetectTransformer({
          operations: [CODEWEAVER_COMPLETE],
          questType: 'feature',
          questFlowStatics,
        }),
      ).toBe(false);
    });

    it('EMPTY: {operations: []} => false, because no family routing to @complete holds a scope', () => {
      expect(
        familyGraphCompleteDetectTransformer({
          operations: [],
          questType: 'feature',
          questFlowStatics,
        }),
      ).toBe(false);
    });
  });

  describe('a terminal family whose scopes have not all landed', () => {
    it('VALID: {one wardFull scope at pending} => false', () => {
      expect(
        familyGraphCompleteDetectTransformer({
          operations: [
            OperationItemStub({
              id: 'e5f6a7b8-58cc-4372-a567-0e02b2c3d479',
              role: 'ward',
              text: 'Ward gate (full monorepo)',
              status: 'pending',
              locked: true,
            }),
          ],
          questType: 'feature',
          questFlowStatics,
        }),
      ).toBe(false);
    });

    it('VALID: {a complete wardFull scope beside a pt N wardFull scope still pending} => false', () => {
      expect(
        familyGraphCompleteDetectTransformer({
          operations: [
            WARD_FULL_COMPLETE,
            OperationItemStub({
              id: 'f6a7b8c9-58cc-4372-a567-0e02b2c3d479',
              role: 'ward',
              text: 'pt 2: Ward gate (full monorepo)',
              status: 'pending',
              locked: true,
            }),
          ],
          questType: 'feature',
          questFlowStatics,
        }),
      ).toBe(false);
    });
  });

  describe('a family whose `empty` route is the terminal one', () => {
    it("VALID: {a graph where flowrider's empty routes to @complete, one complete flowrider scope} => true", () => {
      expect(
        familyGraphCompleteDetectTransformer({
          operations: [
            OperationItemStub({
              id: 'a7b8c9d0-58cc-4372-a567-0e02b2c3d479',
              role: 'flowrider',
              text: 'Flowrider: author the test suites that prove this flow — flow: send-comment',
              status: 'complete',
              locked: true,
            }),
          ],
          questType: 'feature',
          questFlowStatics: {
            feature: {
              families: {
                flowrider: { routes: { done: 'siegemaster', empty: '@complete' } },
                wardFull: { routes: { done: '@complete' } },
              },
            },
          },
        }),
      ).toBe(true);
    });
  });

  describe('a quest type the graph does not declare', () => {
    it('ERROR: {questFlowStatics holding no entry for the quest type} => throws naming what it does hold', () => {
      expect(() =>
        familyGraphCompleteDetectTransformer({
          operations: [WARD_FULL_COMPLETE],
          questType: 'feature',
          questFlowStatics: { 'bug-hunt': { families: {} } },
        }),
      ).toThrow(
        /^familyGraphCompleteDetectTransformer: questFlowStatics declares no 'feature' quest type — it holds: bug-hunt$/u,
      );
    });
  });
});
