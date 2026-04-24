import { ruleBanQuestStatusLiteralsBroker } from './rule-ban-quest-status-literals-broker';
import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';

const ruleTester = eslintRuleTesterAdapter();

// Virtual fixture paths — RuleTester does NOT read these off disk; it only uses them as the
// "filename" key on each test case so path-based allowlist logic works.
const productionFixture =
  '/repo/packages/local-eslint/src/fixtures/ban-quest-status-literals/production-sample.ts';
const allowlistedTestFixture =
  '/repo/packages/local-eslint/src/fixtures/ban-quest-status-literals/sample.test.ts';
const allowlistedMetadataFixture =
  '/repo/packages/shared/src/statics/quest-status-transitions/quest-status-transitions-statics.ts';
const allowlistedGuardFixture =
  '/repo/packages/shared/src/guards/is-terminal-quest-status/is-terminal-quest-status-guard.ts';
const promptStaticsFixture =
  '/repo/packages/orchestrator/src/statics/pathseeker-prompt/pathseeker-prompt-statics.ts';

ruleTester.run('ban-quest-status-literals', ruleBanQuestStatusLiteralsBroker(), {
  valid: [
    // === ALLOWLIST: metadata statics can compare raw literals ===
    {
      code: "const isDone = quest.status === 'complete';",
      filename: allowlistedMetadataFixture,
    },
    // === ALLOWLIST: guard source files can compare raw literals ===
    {
      code: "const isFailing = wi.status === 'failed';",
      filename: allowlistedGuardFixture,
    },
    // === ALLOWLIST: prompt statics can quote literals ===
    {
      code: "export const prompt = 'The quest is in_progress when status === seek_scope.';",
      filename: promptStaticsFixture,
    },
    // === ALLOWLIST: test files are not linted for this rule ===
    {
      code: "if (quest.status === 'in_progress') { /* ok in test */ }",
      filename: allowlistedTestFixture,
    },

    // === PRODUCTION: unrelated .status comparison (user.status is not a known holder) ===
    {
      code: "if (user.status === 'active') { /* not a quest */ }",
      filename: productionFixture,
    },
    // === PRODUCTION: comparison to a non-status literal (no flag) ===
    {
      code: "if (quest.status === 'not_a_known_status') { /* not in enum */ }",
      filename: productionFixture,
    },
    // === PRODUCTION: status guard call (the blessed pattern) ===
    {
      code: 'if (isActivelyExecutingQuestStatusGuard({ status: quest.status })) { /* ok */ }',
      filename: productionFixture,
    },
    // === PRODUCTION: .startsWith with a non-banned prefix ===
    {
      code: "if (name.startsWith('user_')) { /* unrelated */ }",
      filename: productionFixture,
    },
    // === PRODUCTION: switch discriminant that is NOT a .status access ===
    {
      code: "switch (name) { case 'in_progress': break; default: break; }",
      filename: productionFixture,
    },
    // === PRODUCTION: switch on .status of an unrelated holder ===
    {
      code: "switch (user.status) { case 'in_progress': break; default: break; }",
      filename: productionFixture,
    },
    // === PRODUCTION: array with only 1 status literal (below threshold) ===
    {
      code: "const arr = ['in_progress', 'foo', 'bar'];",
      filename: productionFixture,
    },
    // === PRODUCTION: Set constructed from a variable (no inline literals) ===
    {
      code: 'const s = new Set(input);',
      filename: productionFixture,
    },
  ],

  invalid: [
    // === BinaryExpression: quest.status === 'seek_scope' (quest-only literal) ===
    {
      code: "if (quest.status === 'seek_scope') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'questStatusLiteral', data: { literal: 'seek_scope' } }],
    },
    // === BinaryExpression: wi.status === 'failed' (work-item-only literal) ===
    {
      code: "if (wi.status === 'failed') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'workItemStatusLiteral', data: { literal: 'failed' } }],
    },
    // === BinaryExpression: quest.status === 'in_progress' (ambiguous literal) ===
    {
      code: "if (quest.status === 'in_progress') { /* ambiguous */ }",
      filename: productionFixture,
      errors: [{ messageId: 'ambiguousStatusLiteral', data: { literal: 'in_progress' } }],
    },
    // === BinaryExpression with !== ===
    {
      code: "if (workItem.status !== 'complete') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'ambiguousStatusLiteral', data: { literal: 'complete' } }],
    },
    // === BinaryExpression with swapped sides: 'approved' === quest.status ===
    {
      code: "if ('approved' === quest.status) { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'questStatusLiteral', data: { literal: 'approved' } }],
    },
    // === BinaryExpression: postResult.quest.status === 'blocked' (dotted holder) ===
    {
      code: "if (postResult.quest.status === 'blocked') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'questStatusLiteral', data: { literal: 'blocked' } }],
    },
    // === BinaryExpression: identifier matching /Quest$/ ===
    {
      code: "if (someQuest.status === 'paused') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'questStatusLiteral', data: { literal: 'paused' } }],
    },
    // === BinaryExpression: identifier matching /Item$/ ===
    {
      code: "if (someItem.status === 'skipped') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'workItemStatusLiteral', data: { literal: 'skipped' } }],
    },
    // === BinaryExpression with == (non-strict) ===
    {
      code: "if (quest.status == 'abandoned') { /* missed migration */ }",
      filename: productionFixture,
      errors: [{ messageId: 'questStatusLiteral', data: { literal: 'abandoned' } }],
    },

    // === SwitchStatement on quest.status with known case ===
    {
      code: "switch (quest.status) { case 'in_progress': break; case 'paused': break; default: break; }",
      filename: productionFixture,
      errors: [{ messageId: 'switchOnStatus' }],
    },
    // === SwitchStatement on wi.status with known work-item case ===
    {
      code: "switch (wi.status) { case 'failed': break; default: break; }",
      filename: productionFixture,
      errors: [{ messageId: 'switchOnStatus' }],
    },

    // === CallExpression: .startsWith('seek_') ===
    {
      code: "if (quest.status.startsWith('seek_')) { /* pre-split check */ }",
      filename: productionFixture,
      errors: [{ messageId: 'bannedStartsWithPrefix', data: { prefix: 'seek_' } }],
    },
    // === CallExpression: .startsWith('explore_') ===
    {
      code: "if (status.startsWith('explore_')) { /* pre-split check */ }",
      filename: productionFixture,
      errors: [{ messageId: 'bannedStartsWithPrefix', data: { prefix: 'explore_' } }],
    },
    // === CallExpression: .startsWith('review_') ===
    {
      code: "if (status.startsWith('review_')) { /* pre-split check */ }",
      filename: productionFixture,
      errors: [{ messageId: 'bannedStartsWithPrefix', data: { prefix: 'review_' } }],
    },

    // === new Set([...]) with >=2 status literals ===
    {
      code: "const recoverable = new Set(['in_progress', 'seek_scope', 'paused']);",
      filename: productionFixture,
      errors: [{ messageId: 'inlineStatusSet' }],
    },
    // === new Set([...]) with exactly 2 ambiguous literals ===
    {
      code: "const terminalish = new Set(['complete', 'pending']);",
      filename: productionFixture,
      errors: [{ messageId: 'inlineStatusSet' }],
    },
    // === Array literal (not inside Set) with >=2 status literals ===
    {
      code: "const arr = ['in_progress', 'complete', 'other'];",
      filename: productionFixture,
      errors: [{ messageId: 'inlineStatusSet' }],
    },

    // === Rule options: extraStatusHolders extends the allowlist ===
    {
      code: "if (record.status === 'in_progress') { /* record is a known holder via option */ }",
      filename: productionFixture,
      options: [{ extraStatusHolders: ['record'] }],
      errors: [{ messageId: 'ambiguousStatusLiteral', data: { literal: 'in_progress' } }],
    },
  ],
});
