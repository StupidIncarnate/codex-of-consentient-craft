import { runWardRefusalStatics } from './run-ward-refusal-statics';

describe('runWardRefusalStatics', () => {
  // The template is agent-facing text: a session that reads it has to be able to act on it without
  // asking anything else, so the exact wording is pinned rather than probed.
  it('VALID: exported value => matches expected shape', () => {
    expect(runWardRefusalStatics).toStrictEqual({
      requiredRole: 'ward',
      messageTemplate:
        'run-ward refused: work item $WORK_ITEM_ID on quest $QUEST_ID has role "$ROLE", not "ward". run-ward is the dispatcher\'s tool for a ward work item: it stamps the named item in_progress, resets its startedAt, and writes ward\'s exit code onto it as a terminal status — so aimed at any other item it marks a session that is still running failed with errorMessage "ward_failed". To capture ward evidence for your own chunk, run ward yourself from Bash instead: npm run ward -- -- <your own files>',
    });
  });
});
