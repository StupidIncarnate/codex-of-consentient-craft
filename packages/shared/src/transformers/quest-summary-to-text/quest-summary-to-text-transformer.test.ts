import { QuestNoteStub } from '../../contracts/quest-note/quest-note.stub';
import { QuestSummaryDebtStub } from '../../contracts/quest-summary-debt/quest-summary-debt.stub';
import { QuestSummaryFlowStub } from '../../contracts/quest-summary-flow/quest-summary-flow.stub';
import { QuestSummaryNoteGroupStub } from '../../contracts/quest-summary-note-group/quest-summary-note-group.stub';
import { QuestSummaryObservableStub } from '../../contracts/quest-summary-observable/quest-summary-observable.stub';
import { QuestSummaryTrackCountsStub } from '../../contracts/quest-summary-track-counts/quest-summary-track-counts.stub';
import { QuestSummaryStub } from '../../contracts/quest-summary/quest-summary.stub';
import { mcpToolResultStatics } from '../../statics/mcp-tool-result/mcp-tool-result-statics';
import { questSummaryLimitsStatics } from '../../statics/quest-summary-limits/quest-summary-limits-statics';
import { questSummaryToTextTransformer } from './quest-summary-to-text-transformer';

// One realistic quest: seven flows carrying 281 verification units between them. The counts are the
// per-flow unit totals the tracks partition, and they sum to 281.
const REAL_QUEST_FLOW_UNIT_COUNTS = [45, 52, 38, 41, 33, 47, 25];

describe('questSummaryToTextTransformer', () => {
  describe('header', () => {
    it('VALID: {questId} => names the quest on the first line', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({ questId: 'add-auth' }),
      }).split('\n');

      expect(lines[0]).toBe('# QUEST SUMMARY — `add-auth`');
    });

    it('VALID: {any summary} => states that neither a cant-meet nor an unmet holds the ledger', () => {
      const lines = questSummaryToTextTransformer({ summary: QuestSummaryStub() }).split('\n');

      expect([
        lines.find((line) => line.startsWith('quest reaches `complete`')),
        lines.find((line) => line.startsWith('marked `met`.')),
        lines.find((line) => line.startsWith('open, and neither one')),
      ]).toStrictEqual([
        'quest reaches `complete` when its operations ledger drains, not when every verification unit is',
        'marked `met`. A `cant-meet` settles a unit without proving it and an `unmet` leaves the work',
        'open, and neither one holds that ledger. So a complete quest can still carry real holes, real',
      ]);
    });
  });

  // The truncation notice tells a reader which sections run in which order, so it can say where
  // whatever fell off the end used to be. That promise is only true while the render matches it.
  describe('section order — the truncation notice names it', () => {
    it('VALID: {any summary} => the sections run coverage, mid-quest observables, debt, notes', () => {
      const headings = questSummaryToTextTransformer({ summary: QuestSummaryStub() })
        .split('\n')
        .filter((line) => line.startsWith('## '));

      expect(headings).toStrictEqual([
        '## COVERAGE — 1 flow(s), one row per track that measures each',
        '## MID-QUEST OBSERVABLES (1) — added AFTER the user approved the spec',
        '## DEBT (1) — every unit that is NOT proven',
        '## NOTES — 1 kind(s), open questions first',
      ]);
    });
  });

  describe('coverage', () => {
    it('VALID: {one flow measured by both tracks} => one row per track carrying all four counts', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          flows: [
            QuestSummaryFlowStub({
              id: 'login-flow',
              name: 'Login Flow',
              flowType: 'runtime',
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'flowrider',
                  met: 12,
                  cantMeet: 1,
                  unmet: 2,
                  outstanding: 3,
                }),
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  met: 15,
                  cantMeet: 0,
                  unmet: 4,
                  outstanding: 1,
                }),
              ],
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('### `login-flow`')),
        lines.find((line) => line.startsWith('    flowrider:')),
        lines.find((line) => line.startsWith('    siegemaster:')),
      ]).toStrictEqual([
        '### `login-flow` "Login Flow" [runtime]',
        '    flowrider: met 12 / cant-meet 1 / unmet 2 / outstanding 3',
        '    siegemaster: met 15 / cant-meet 0 / unmet 4 / outstanding 1',
      ]);
    });

    it('VALID: {operational flow measured by siegemaster alone} => renders that track only', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          flows: [
            QuestSummaryFlowStub({
              id: 'register-lint-rule',
              name: 'Register Lint Rule',
              flowType: 'operational',
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  met: 4,
                  cantMeet: 0,
                  unmet: 0,
                  outstanding: 0,
                }),
              ],
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('### `register-lint-rule`')),
        lines.filter((line) => line.startsWith('    flowrider:')),
        lines.find((line) => line.startsWith('    siegemaster:')),
      ]).toStrictEqual([
        '### `register-lint-rule` "Register Lint Rule" [operational]',
        [],
        '    siegemaster: met 4 / cant-meet 0 / unmet 0 / outstanding 0',
      ]);
    });

    it('EDGE: {flow with no tracks} => says no track measures it rather than printing a blank block', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          flows: [QuestSummaryFlowStub({ id: 'orphan-flow', tracks: [] })],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('    (no track'))).toBe(
        '    (no track measures this flow)',
      );
    });

    it('EMPTY: {flows: []} => states the quest has no flows instead of an empty section', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({ flows: [] }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## COVERAGE')),
        lines.find((line) => line.startsWith('(no flows')),
      ]).toStrictEqual([
        '## COVERAGE — 0 flow(s), one row per track that measures each',
        '(no flows on this quest — nothing decomposes into verification units)',
      ]);
    });

    it('VALID: {any summary} => the section prose tells apart all four counts the rows print', () => {
      const lines = questSummaryToTextTransformer({ summary: QuestSummaryStub() }).split('\n');

      expect([
        lines.find((line) => line.startsWith('`met` and `cant-meet`')),
        lines.find((line) => line.startsWith('left work open on;')),
        lines.find((line) => line.startsWith('work list, which nothing')),
      ]).toStrictEqual([
        '`met` and `cant-meet` are both settled; `unmet` is a unit a session of that track looked at and',
        "left work open on; `outstanding` is one nobody of that track has marked at all — the track's",
        'work list, which nothing refuses a `done` over. A track ABSENT from a flow does not measure it',
      ]);
    });
  });

  describe('mid-quest observables', () => {
    it('VALID: {observable added by siegemaster} => names the adding role, the unit, its node, its flow and the verbatim text', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          midQuestObservables: [
            QuestSummaryObservableStub({
              id: 'login-flow:observable:rejects-bleh-payload',
              flowId: 'login-flow',
              nodeId: 'submit-credentials',
              addedBy: 'siegemaster',
              observableType: 'api-call',
              description: 'POST /api/auth/login returns 400 for a non-JSON body',
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## MID-QUEST OBSERVABLES')),
        lines.find((line) => line.startsWith('- added by')),
        lines.find((line) => line.startsWith('      on node')),
        lines.find((line) => line.startsWith('      POST')),
      ]).toStrictEqual([
        '## MID-QUEST OBSERVABLES (1) — added AFTER the user approved the spec',
        '- added by siegemaster: `login-flow:observable:rejects-bleh-payload` [api-call]',
        '      on node `submit-credentials` of flow `login-flow`',
        '      POST /api/auth/login returns 400 for a non-JSON body',
      ]);
    });

    it('EMPTY: {midQuestObservables: []} => states every observable was in the spec at approval', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({ midQuestObservables: [] }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## MID-QUEST OBSERVABLES')),
        lines.find((line) => line.startsWith('(none — every observable')),
      ]).toStrictEqual([
        '## MID-QUEST OBSERVABLES (0) — added AFTER the user approved the spec',
        '(none — every observable on this quest was in the spec at approval)',
      ]);
    });
  });

  describe('debt', () => {
    it('VALID: {one cant-meet entry} => renders the unit, the mark, the track, the evidence AND the toSettle AND who raised it', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:observable:rejects-bleh-payload:flowrider',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              flowId: 'login-flow',
              kind: 'observable',
              track: 'flowrider',
              mark: 'cant-meet',
              evidence: 'playwright.config.ts declares no webServer, so no e2e run reaches the app',
              toSettle:
                'Add a webServer block to playwright.config.ts, then re-run this spec against it.',
              workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              at: '2026-02-03T04:05:06.000Z',
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## DEBT')),
        lines.find((line) => line.startsWith('### `login-flow:observable')),
        lines.find((line) => line.startsWith('      flow:')),
        lines.find((line) => line.startsWith('      evidence:')),
        lines.find((line) => line.startsWith('      toSettle:')),
        lines.find((line) => line.startsWith('      raised by')),
      ]).toStrictEqual([
        '## DEBT (1) — every unit that is NOT proven',
        '### `login-flow:observable:rejects-bleh-payload` [observable] — cant-meet on the flowrider track',
        '      flow:     `login-flow`',
        '      evidence: playwright.config.ts declares no webServer, so no e2e run reaches the app',
        '      toSettle: Add a webServer block to playwright.config.ts, then re-run this spec against it.',
        '      raised by work item f47ac10b-58cc-4372-a567-0e02b2c3d479 at 2026-02-03T04:05:06.000Z',
      ]);
    });

    // An `unmet` entry carries no `toSettle` — the mark itself says work is outstanding rather than
    // handed over. Saying so beats printing a blank field a reader would take for a rendering bug.
    it('VALID: {one unmet entry} => names the unmet mark and says no toSettle was recorded', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          debt: [QuestSummaryDebtStub()],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('### `login-flow:observable')),
        lines.find((line) => line.startsWith('      toSettle:')),
      ]).toStrictEqual([
        '### `login-flow:observable:rejects-bleh-payload` [observable] — unmet on the flowrider track',
        '      toSettle: (none recorded)',
      ]);
    });

    it('VALID: {a cant-meet and an unmet together} => both marks render in the one section', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          debt: [
            QuestSummaryDebtStub({
              id: 'login-flow:observable:no-webserver:flowrider',
              unitId: 'login-flow:observable:no-webserver',
              mark: 'cant-meet',
              toSettle: 'Add a webServer block to playwright.config.ts, then re-run this spec.',
            }),
            QuestSummaryDebtStub({
              id: 'login-flow:observable:stale-badge:siegemaster',
              unitId: 'login-flow:observable:stale-badge',
              track: 'siegemaster',
              mark: 'unmet',
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## DEBT')),
        ...lines.filter((line) => line.startsWith('### `login-flow:observable')),
      ]).toStrictEqual([
        '## DEBT (2) — every unit that is NOT proven',
        '### `login-flow:observable:no-webserver` [observable] — cant-meet on the flowrider track',
        '### `login-flow:observable:stale-badge` [observable] — unmet on the siegemaster track',
      ]);
    });

    it('VALID: {any summary} => the section prose separates what a cant-meet owes from what an unmet owes', () => {
      const lines = questSummaryToTextTransformer({ summary: QuestSummaryStub() }).split('\n');

      expect([
        lines.find((line) => line.startsWith('Two marks land here')),
        lines.find((line) => line.startsWith('and its `toSettle`')),
        lines.find((line) => line.startsWith('carries no `toSettle`')),
      ]).toStrictEqual([
        'Two marks land here and they are different work. `cant-meet` settled a unit without proving it,',
        'and its `toSettle` names the action that would. `unmet` means work is outstanding right now and',
        'carries no `toSettle`, because a successor is owed it rather than a handover. `evidence` is what',
      ]);
    });

    it('EMPTY: {debt: []} => states no unit carries either mark and points at COVERAGE for the rest', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({ debt: [] }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## DEBT')),
        lines.find((line) => line.startsWith('(none — no unit')),
      ]).toStrictEqual([
        '## DEBT (0) — every unit that is NOT proven',
        '(none — no unit carries a cant-meet or an unmet mark; unmarked units are in COVERAGE)',
      ]);
    });
  });

  describe('notes', () => {
    it('VALID: {open-question group listed last} => it still renders first', () => {
      const headings = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          // The flow and debt sections use `### ` headings too, so this narrows the summary to
          // notes alone rather than filtering their headings back out by shape.
          flows: [],
          debt: [],
          noteGroups: [
            QuestSummaryNoteGroupStub({ id: 'tooling-error', notes: [] }),
            QuestSummaryNoteGroupStub({ id: 'out-of-scope', notes: [] }),
            QuestSummaryNoteGroupStub({ id: 'walk-reset', notes: [] }),
            QuestSummaryNoteGroupStub({ id: 'open-question', notes: [] }),
          ],
        }),
      })
        .split('\n')
        .filter((line) => line.startsWith('### '));

      expect(headings).toStrictEqual([
        '### open-question (0)',
        '### tooling-error (0)',
        '### out-of-scope (0)',
        '### walk-reset (0)',
      ]);
    });

    it('VALID: {note with a flow and a unit} => renders its summary, detail, role, work item, timestamp and scope', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'open-question',
              notes: [
                QuestNoteStub({
                  kind: 'open-question',
                  role: 'siegemaster',
                  workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                  flowId: 'login-flow',
                  unitId: 'login-flow:observable:check-badge',
                  summary: 'Should a stale anchor notify per box or once per batch?',
                  detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
                  at: '2026-02-03T04:05:06.000Z',
                }),
              ],
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('- Should a stale')),
        lines.find((line) => line.startsWith('      The batch send')),
        lines.find((line) => line.startsWith('      siegemaster ·')),
      ]).toStrictEqual([
        '- Should a stale anchor notify per box or once per batch?',
        '      The batch send drops boxes whose node id no longer exists in the flow.',
        '      siegemaster · work item f47ac10b-58cc-4372-a567-0e02b2c3d479 · 2026-02-03T04:05:06.000Z · flow `login-flow` · unit `login-flow:observable:check-badge`',
      ]);
    });

    it('EDGE: {quest-wide note carrying no flow and no unit} => omits both scope trailers', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'tooling-error',
              notes: [
                QuestNoteStub({
                  kind: 'tooling-error',
                  role: 'flowrider',
                  workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  flowId: undefined,
                  unitId: undefined,
                  summary: 'npm run build races when minions run in parallel',
                  detail: 'Two concurrent tsc runs corrupted the shared dist between bundles.',
                  at: '2026-02-03T04:05:06.000Z',
                }),
              ],
            }),
          ],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('      flowrider ·'))).toBe(
        '      flowrider · work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa · 2026-02-03T04:05:06.000Z',
      );
    });

    it('EMPTY: {group with no notes} => renders the kind with an explicit none, so "none" and "nobody looked" differ', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          noteGroups: [QuestSummaryNoteGroupStub({ id: 'walk-reset', notes: [] })],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('### walk-reset')),
        lines.find((line) => line.startsWith('    (none recorded)')),
      ]).toStrictEqual(['### walk-reset (0)', '    (none recorded)']);
    });

    it('EMPTY: {noteGroups: []} => states no note kinds were recorded', () => {
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({ noteGroups: [] }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## NOTES')),
        lines.find((line) => line.startsWith('(no note kinds')),
      ]).toStrictEqual([
        '## NOTES — 0 kind(s), open questions first',
        '(no note kinds recorded on this quest)',
      ]);
    });
  });

  describe('truncation — the caps state exactly what they dropped', () => {
    it('EDGE: {one flow past maxFlows} => the coverage heading names the cap and the dropped count', () => {
      const overCap = questSummaryLimitsStatics.maxFlows + 1;
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          flows: Array.from({ length: overCap }, (_unused, index) =>
            QuestSummaryFlowStub({ id: `flow-${String(index)}` }),
          ),
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## COVERAGE')),
        lines.filter((line) => line.startsWith('### `flow-')).length,
      ]).toStrictEqual([
        `## COVERAGE — ${String(overCap)} flow(s), one row per track that measures each — TRUNCATED at the ${String(questSummaryLimitsStatics.maxFlows)}-flow cap; 1 flow(s) NOT SHOWN`,
        questSummaryLimitsStatics.maxFlows,
      ]);
    });

    it('EDGE: {three observables past maxMidQuestObservables} => the heading names the cap and the dropped count', () => {
      const overCap = questSummaryLimitsStatics.maxMidQuestObservables + 3;
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          midQuestObservables: Array.from({ length: overCap }, (_unused, index) =>
            QuestSummaryObservableStub({ id: `login-flow:observable:drift-${String(index)}` }),
          ),
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## MID-QUEST OBSERVABLES')),
        lines.filter((line) => line.startsWith('- added by')).length,
      ]).toStrictEqual([
        `## MID-QUEST OBSERVABLES (${String(overCap)}) — added AFTER the user approved the spec — TRUNCATED at the ${String(questSummaryLimitsStatics.maxMidQuestObservables)}-entry cap; 3 entry(s) NOT SHOWN`,
        questSummaryLimitsStatics.maxMidQuestObservables,
      ]);
    });

    it('EDGE: {two entries past the debt cap} => the heading names the cap and the dropped count', () => {
      const overCap = questSummaryLimitsStatics.maxUnconfirmable + 2;
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          debt: Array.from({ length: overCap }, (_unused, index) =>
            QuestSummaryDebtStub({
              id: `login-flow:observable:hole-${String(index)}:flowrider`,
              unitId: `login-flow:observable:hole-${String(index)}`,
            }),
          ),
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('## DEBT')),
        lines.filter((line) => line.startsWith('      evidence:')).length,
      ]).toStrictEqual([
        `## DEBT (${String(overCap)}) — every unit that is NOT proven — TRUNCATED at the ${String(questSummaryLimitsStatics.maxUnconfirmable)}-entry cap; 2 entry(s) NOT SHOWN`,
        questSummaryLimitsStatics.maxUnconfirmable,
      ]);
    });

    it('EDGE: {five notes past maxNotesPerKind in one group} => that kind heading names the cap and the dropped count', () => {
      const overCap = questSummaryLimitsStatics.maxNotesPerKind + 5;
      const lines = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'open-question',
              notes: Array.from({ length: overCap }, (_unused, index) =>
                QuestNoteStub({ id: `open-question-${String(index)}` }),
              ),
            }),
          ],
        }),
      }).split('\n');

      expect([
        lines.find((line) => line.startsWith('### open-question')),
        lines.filter((line) => line.startsWith('- Should a stale')).length,
      ]).toStrictEqual([
        `### open-question (${String(overCap)}) — TRUNCATED at the ${String(questSummaryLimitsStatics.maxNotesPerKind)}-note cap; 5 note(s) NOT SHOWN`,
        questSummaryLimitsStatics.maxNotesPerKind,
      ]);
    });
  });

  describe('the character ceiling is the bound that actually holds', () => {
    // The section caps count ENTRIES, and every entry carries author-written prose, so no count on
    // its own can promise a character total. This drives the sections AT their caps with realistic
    // (not pathological) prose — the shape the counts alone let through — and proves the render is
    // still delivered verbatim, with the cut announced rather than swallowed.
    it('EDGE: {every section filled to its cap} => the render is cut at maxRenderChars, names the dropped character count, and stays under mcpToolResultStatics.maxVerbatimChars', () => {
      const rendered = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          questId: 'pathological-quest',
          flows: Array.from({ length: questSummaryLimitsStatics.maxFlows }, (_unused, index) =>
            QuestSummaryFlowStub({ id: `flow-${String(index)}` }),
          ),
          midQuestObservables: Array.from(
            { length: questSummaryLimitsStatics.maxMidQuestObservables },
            (_unused, index) =>
              QuestSummaryObservableStub({ id: `login-flow:observable:drift-${String(index)}` }),
          ),
          debt: Array.from(
            { length: questSummaryLimitsStatics.maxUnconfirmable },
            (_unused, index) =>
              QuestSummaryDebtStub({
                id: `login-flow:observable:hole-${String(index)}:flowrider`,
                unitId: `login-flow:observable:hole-${String(index)}`,
              }),
          ),
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'open-question',
              notes: Array.from(
                { length: questSummaryLimitsStatics.maxNotesPerKind },
                (_unused, index) => QuestNoteStub({ id: `open-question-${String(index)}` }),
              ),
            }),
          ],
        }),
      });

      const lines = rendered.split('\n');

      expect({
        withinVerbatimBudget: rendered.length <= mcpToolResultStatics.maxVerbatimChars,
        // The cut lands on a line boundary, so the line before the notice is whole — never half an
        // id or half an instruction, which reads as a rendering bug rather than a limit.
        lineBeforeTheNotice: lines[lines.length - 2],
        notice: lines[lines.length - 1],
      }).toStrictEqual({
        withinVerbatimBudget: true,
        lineBeforeTheNotice: '',
        notice:
          '[TRUNCATED at the 48000-character ceiling — 17230 character(s) were dropped from the END of this render, so the sections after this line are missing or cut short. Sections run coverage, mid-quest observables, debt, notes; read quest.json for whatever fell off.]',
      });
    });
  });

  // Over `mcpToolResultStatics.maxVerbatimChars` Claude Code does not deliver a tool result to the
  // model at all — it spills it to a file and hands the agent an error stub. For this tool that
  // means the role reading the summary loses the debt list its routing depends on. This builds the
  // largest realistic quest and measures the actual render.
  describe('scale — a real quest-sized summary', () => {
    it('VALID: {7 flows, 281 units, 26 mid-quest observables, 35 debt entries, 24 notes} => renders under mcpToolResultStatics.maxVerbatimChars with no section truncated', () => {
      const rendered = questSummaryToTextTransformer({
        summary: QuestSummaryStub({
          questId: 'comment-queue-persistence',
          flows: REAL_QUEST_FLOW_UNIT_COUNTS.map((unitCount, index) =>
            QuestSummaryFlowStub({
              id: `packages-web-flows-quest-detail-comment-queue-${String(index)}`,
              name: `Quest Detail — Comment Queue Persistence, slice ${String(index)}`,
              flowType: 'runtime',
              tracks: [
                QuestSummaryTrackCountsStub({
                  id: 'flowrider',
                  met: unitCount - 5,
                  cantMeet: 3,
                  unmet: 0,
                  outstanding: 2,
                }),
                QuestSummaryTrackCountsStub({
                  id: 'siegemaster',
                  met: unitCount - 3,
                  cantMeet: 2,
                  unmet: 0,
                  outstanding: 1,
                }),
              ],
            }),
          ),
          midQuestObservables: Array.from({ length: 26 }, (_unused, index) =>
            QuestSummaryObservableStub({
              id: `packages-web-flows-quest-detail-comment-queue-0:observable:drift-${String(index)}`,
              flowId: 'packages-web-flows-quest-detail-comment-queue-0',
              nodeId: `submit-comment-batch-${String(index)}`,
              observableId: `drift-${String(index)}`,
              addedBy: 'siegemaster',
              observableType: 'api-call',
              description: `POST /api/quests/:questId/comments returns 400 when box ${String(index)} names a node id the flow no longer carries, instead of dropping it silently`,
            }),
          ),
          debt: Array.from({ length: 35 }, (_unused, index) =>
            QuestSummaryDebtStub({
              id: `packages-web-flows-quest-detail-comment-queue-0:observable:hole-${String(index)}:flowrider`,
              unitId: `packages-web-flows-quest-detail-comment-queue-0:observable:hole-${String(index)}`,
              flowId: 'packages-web-flows-quest-detail-comment-queue-0',
              mark: 'cant-meet',
              evidence: `the project playwright.config.ts declares no webServer, so no e2e run can reach the app to drive unit hole-${String(index)}; the integration layer cannot see the rendered badge either`,
              toSettle: `Add a webServer block to playwright.config.ts, then drive hole-${String(index)} end to end.`,
            }),
          ),
          noteGroups: [
            QuestSummaryNoteGroupStub({
              id: 'open-question',
              notes: Array.from({ length: 9 }, (_unused, index) =>
                QuestNoteStub({ id: `open-question-${String(index)}`, kind: 'open-question' }),
              ),
            }),
            QuestSummaryNoteGroupStub({
              id: 'tooling-error',
              notes: Array.from({ length: 6 }, (_unused, index) =>
                QuestNoteStub({ id: `tooling-error-${String(index)}`, kind: 'tooling-error' }),
              ),
            }),
            QuestSummaryNoteGroupStub({
              id: 'out-of-scope',
              notes: Array.from({ length: 5 }, (_unused, index) =>
                QuestNoteStub({ id: `out-of-scope-${String(index)}`, kind: 'out-of-scope' }),
              ),
            }),
            QuestSummaryNoteGroupStub({
              id: 'walk-reset',
              notes: Array.from({ length: 4 }, (_unused, index) =>
                QuestNoteStub({ id: `walk-reset-${String(index)}`, kind: 'walk-reset' }),
              ),
            }),
          ],
        }),
      });

      const unitTotal = REAL_QUEST_FLOW_UNIT_COUNTS.reduce((sum, count) => sum + count, 0);

      expect({
        unitTotal,
        truncationNotices: rendered.split('\n').filter((line) => line.includes('TRUNCATED')),
        withinVerbatimBudget: rendered.length < mcpToolResultStatics.maxVerbatimChars,
      }).toStrictEqual({
        unitTotal: 281,
        truncationNotices: [],
        withinVerbatimBudget: true,
      });
    });
  });
});
