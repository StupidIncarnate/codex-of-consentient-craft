import {
  QaChecklistItemStub,
  QaChecklistStub,
  QaWalkPathStub,
  SignoffTrackStub,
} from '@dungeonmaster/shared/contracts';
import { qaCheckSurfaceStatics, textDisplaySymbolsStatics } from '@dungeonmaster/shared/statics';

import { qaChecklistToTextTransformer } from './qa-checklist-to-text-transformer';

// The two SIGN-OFF FIELDS a unit can carry, derived from the render marks — one mark per track, so
// its keys are 1:1 with signoffTrackContract's options and a test file cannot import the contract
// itself. Deliberately NOT `signoffTrackEligibilityStatics.byTrack`: that map is keyed by the ROLE
// whose denominator it defines, and Groundstomper has a denominator of its own while writing
// Flowrider's field.
const SIGNOFF_TRACKS = Object.keys(textDisplaySymbolsStatics.signoffTrackMarks);

describe('qaChecklistToTextTransformer', () => {
  describe('header', () => {
    it('VALID: {checklist, no track} => names the flow, its entry point, the per-kind counts, and an unattributed REMAINING', () => {
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
        'REMAINING (no sign-off yet on the track you are signing): 1 of 2',
      ]);
    });

    it.each(SIGNOFF_TRACKS)(
      "VALID: {track: %s} => REMAINING names that track's own sign-off field",
      (trackName) => {
        const track = SignoffTrackStub({ value: trackName });
        const lines = qaChecklistToTextTransformer({
          track,
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

        expect(lines[3]).toBe(`REMAINING (awaiting your \`${track}Signoff\`): 1 of 2`);
      },
    );

    // Groundstomper is the ONE case where the two lookups differ: it is its own denominator and it
    // writes Flowrider's field. A render that took the handed value for both would tell the session
    // to write a `groundstomperSignoff` no contract carries.
    it('VALID: {track: groundstomper} => REMAINING names `flowriderSignoff`, the field it actually writes', () => {
      const lines = qaChecklistToTextTransformer({
        track: 'groundstomper',
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

      expect(lines[3]).toBe('REMAINING (awaiting your `flowriderSignoff`): 1 of 2');
    });

    it("VALID: {any checklist} => states that the other track's sign-off never settles yours", () => {
      const lines = qaChecklistToTextTransformer({
        track: 'flowrider',
        checklist: QaChecklistStub({ items: [], remainingItemIds: [], paths: [] }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('The two tracks are measured'))).toBe(
        'The two tracks are measured separately: your sign-off field is the only one counted here, and',
      );
    });

    it('VALID: {any checklist} => states that both verdicts close a unit', () => {
      const lines = qaChecklistToTextTransformer({
        track: 'siegemaster',
        checklist: QaChecklistStub({ items: [], remainingItemIds: [], paths: [] }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('`confirmed`'))).toBe(
        '`confirmed` with evidence, or `unconfirmable` with what you tried plus a `question`.',
      );
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
        '## UNITS — [ ] outstanding on your track, [x] already settled on it',
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
        '## UNITS — [ ] outstanding on your track, [x] already settled on it',
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

  describe('the units legend', () => {
    it.each(SIGNOFF_TRACKS)(
      "VALID: {track: %s} => the legend names that track's field on both marks",
      (trackName) => {
        const track = SignoffTrackStub({ value: trackName });
        const lines = qaChecklistToTextTransformer({
          track,
          checklist: QaChecklistStub({
            flowId: 'a-flow',
            items: [QaChecklistItemStub({ id: 'a-flow:observable:check-one' })],
            remainingItemIds: [],
            paths: [],
          }),
        }).split('\n');

        expect(lines.find((line) => line.startsWith('## UNITS'))).toBe(
          `## UNITS — [ ] awaiting your \`${track}Signoff\`, [x] already settled on the ${track} track`,
        );
      },
    );

    // The legend carries BOTH values because they differ here: the column to write is Flowrider's,
    // the denominator already settled is Groundstomper's own.
    it('VALID: {track: groundstomper} => the legend names `flowriderSignoff` and the groundstomper track', () => {
      const lines = qaChecklistToTextTransformer({
        track: 'groundstomper',
        checklist: QaChecklistStub({
          flowId: 'a-flow',
          items: [QaChecklistItemStub({ id: 'a-flow:observable:check-one' })],
          remainingItemIds: [],
          paths: [],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('## UNITS'))).toBe(
        '## UNITS — [ ] awaiting your `flowriderSignoff`, [x] already settled on the groundstomper track',
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
