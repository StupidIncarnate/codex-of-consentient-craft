import {
  QaChecklistItemStub,
  QaChecklistStub,
  QaWalkPathStub,
} from '@dungeonmaster/shared/contracts';
import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

import { qaChecklistToTextTransformer } from './qa-checklist-to-text-transformer';

describe('qaChecklistToTextTransformer', () => {
  describe('header', () => {
    it('VALID: {checklist} => names the flow, its entry point, and the per-kind unit counts', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          flowName: 'A Flow',
          entryPoint: '/entry',
          items: [
            QaChecklistItemStub({ id: 'a-flow:observable:check-one' }),
            QaChecklistItemStub({
              id: 'a-flow:terminal:end-node',
              kind: 'terminal',
              label: 'The end',
            }),
          ],
          remainingItemIds: ['a-flow:observable:check-one'],
          paths: [],
        }),
      }).split('\n');

      expect(lines.slice(0, 4)).toStrictEqual([
        '# QA CHECKLIST — flow `a-flow` "A Flow"',
        'Entry point: /entry',
        'Units: 2 (1 terminal, 0 branch, 1 observable, 0 off-map)',
        'REMAINING (no disposition in quest.planningNotes.qaLedger): 1 of 2',
      ]);
    });
  });

  describe('coverage markers', () => {
    it('VALID: {one dispositioned} => marked [x] with its id', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [
            QaChecklistItemStub({ id: 'a-flow:observable:check-one', label: 'first thing' }),
            QaChecklistItemStub({ id: 'a-flow:observable:check-two', label: 'second thing' }),
          ],
          remainingItemIds: ['a-flow:observable:check-two'],
          paths: [],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('[x] '))).toBe(
        '[x] a-flow:observable:check-one  [ui-state]',
      );
    });

    it('VALID: {one remaining} => marked [ ] with its id', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [
            QaChecklistItemStub({ id: 'a-flow:observable:check-one', label: 'first thing' }),
            QaChecklistItemStub({ id: 'a-flow:observable:check-two', label: 'second thing' }),
          ],
          remainingItemIds: ['a-flow:observable:check-two'],
          paths: [],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('[ ] '))).toBe(
        '[ ] a-flow:observable:check-two  [ui-state]',
      );
    });

    it('VALID: {unit label} => is rendered verbatim on the line beneath its id', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [
            QaChecklistItemStub({
              id: 'a-flow:observable:check-one',
              label: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
            }),
          ],
          remainingItemIds: [],
          paths: [],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('    COMMENT_COUNT_BADGE'))).toBe(
        '    COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
      );
    });
  });

  describe('check-surface legend', () => {
    it('VALID: {two observables of the same type} => the surface is stated once, not per unit', () => {
      const text = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [
            QaChecklistItemStub({ id: 'a-flow:observable:check-one', observableType: 'ui-state' }),
            QaChecklistItemStub({ id: 'a-flow:observable:check-two', observableType: 'ui-state' }),
          ],
          remainingItemIds: [],
          paths: [],
        }),
      });

      expect(text.split(qaCheckSurfaceStatics.byOutcomeType['ui-state']).length - 1).toBe(1);
    });

    it('VALID: {no observables} => the legend section is omitted from the section list', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [
            QaChecklistItemStub({
              id: 'a-flow:terminal:end-node',
              kind: 'terminal',
              label: 'The end',
            }),
          ],
          remainingItemIds: [],
          paths: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('## '))).toStrictEqual([
        '## TERMINAL SURFACE',
        '## BRANCH SURFACE',
        '## OFF-MAP SURFACE',
        '## WALK PATHS (0)',
        '## UNITS — [ ] no disposition yet, [x] already dispositioned in the ledger',
      ]);
    });

    it('VALID: {observables present} => the legend section is included', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [QaChecklistItemStub({ id: 'a-flow:observable:check-one' })],
          remainingItemIds: [],
          paths: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('## '))).toStrictEqual([
        '## CHECK SURFACES (observable types present on this flow)',
        '## TERMINAL SURFACE',
        '## BRANCH SURFACE',
        '## OFF-MAP SURFACE',
        '## WALK PATHS (0)',
        '## UNITS — [ ] no disposition yet, [x] already dispositioned in the ledger',
      ]);
    });
  });

  describe('walk paths', () => {
    it('VALID: {path with branch labels} => renders the route', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [],
          remainingItemIds: [],
          paths: [
            QaWalkPathStub({
              nodeIds: ['start-node', 'end-node'],
              branchLabels: ['valid'],
              exitsFlow: false,
            }),
          ],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('P1'))).toBe('P1  start-node → end-node');
    });

    it('VALID: {path with branch labels} => names the branches to force', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [],
          remainingItemIds: [],
          paths: [
            QaWalkPathStub({
              nodeIds: ['start-node', 'end-node'],
              branchLabels: ['valid', 'clicks send'],
              exitsFlow: false,
            }),
          ],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('     force:'))).toBe(
        '     force: "valid" , "clicks send"',
      );
    });

    it('VALID: {path that leaves the flow} => says so', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [],
          remainingItemIds: [],
          paths: [QaWalkPathStub({ nodeIds: ['start-node'], branchLabels: [], exitsFlow: true })],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('     (leaves'))).toBe(
        '     (leaves this flow at the last node)',
      );
    });

    it('VALID: {truncated enumeration} => the heading says the list is incomplete', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [],
          remainingItemIds: [],
          paths: [],
          pathsTruncated: true,
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('## WALK PATHS'))).toBe(
        '## WALK PATHS (0) — TRUNCATED at the enumeration cap; this list is INCOMPLETE',
      );
    });
  });

  describe('unit sections', () => {
    it('VALID: {all four kinds} => each gets its own counted subsection', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [
            QaChecklistItemStub({ id: 'a-flow:observable:check-one' }),
            QaChecklistItemStub({
              id: 'a-flow:terminal:end-node',
              kind: 'terminal',
              label: 'The end',
            }),
            QaChecklistItemStub({
              id: 'a-flow:branch:an-edge',
              kind: 'branch',
              label: 'a —"yes"→ b',
            }),
            QaChecklistItemStub({
              id: 'a-flow:off-map:concurrency',
              kind: 'off-map',
              label: 'double submit',
            }),
          ],
          remainingItemIds: [],
          paths: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('### '))).toStrictEqual([
        '### TERMINALS (1)',
        '### BRANCHES (1)',
        '### OBSERVABLES (1)',
        '### OFF-MAP PROBES (1)',
      ]);
    });
  });

  describe('the flat-flow warning', () => {
    it('VALID: {any checklist} => states that walking every path proves nothing on its own', () => {
      const lines = qaChecklistToTextTransformer({
        checklist: QaChecklistStub({ items: [], remainingItemIds: [], paths: [] }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('coverage. A flow can be'))).toBe(
        'coverage. A flow can be two paths carrying twenty observables, so walking every path proves',
      );
    });
  });
});
