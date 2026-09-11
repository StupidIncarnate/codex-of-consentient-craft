/**
 * PURPOSE: Grades the SessionStart-snippet chain at its two measurable points, cheapest first.
 * The first test is HERMETIC: the `--settings` blob the adapter hands the CLI registers a hook for
 * every configured snippet — the half a settings file answers on its own, in milliseconds, with no
 * child process. Reach for that one for anything about WHICH snippets are wired.
 *
 * The second reads a REAL CLAUDE CLI SESSION, spawned in `beforeAll`, because only a live session
 * answers the other half: that Claude Code honours an inline `--settings` blob and fires every hook
 * in it ahead of the first user entry. It measures off the transcript Claude Code itself writes
 * rather than asking the spawned model to self-report on its own system prompt — a self-report
 * measured wrong roughly 1 time in 6.
 *
 * THAT SPAWN COSTS A BILLED MODEL TURN ON EVERY RUN and needs network plus a logged-in
 * `claude` on PATH — neither a property of the code under test. It is a re-measurement probe for a
 * Claude Code upgrade rather than a regression guard, so it wants to be opt-in; nothing in this
 * repo can express that yet. `.skip`/`.todo` throw at runtime (packages/testing/src/jest.setup.js),
 * a discovered file producing no result fails ward's discovery-integrity check, and a conditional
 * loop around `it` is refused by `jest/prefer-each` and `jest/require-hook` — while `it.each([])`
 * throws inside jest-each. Making it opt-in is therefore a ward change, not a change to this file.
 * The snippet-drift regression it guards is already held by the hermetic test above, which is what
 * makes retiring the live probe a decision someone can now take freely.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { ElapsedMsStub } from '../../../contracts/elapsed-ms/elapsed-ms.stub';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { sessionSpawnHarness } from '../../../../test/harnesses/session-spawn/session-spawn.harness';

// A live turn plus the harness's 15s transcript-flush poll. A budget on the beforeAll that spawns
// it rather than a file-wide jest.setTimeout, so both tests keep jest's ordinary timeout.
const LIVE_SPAWN_TIMEOUT_MS = ElapsedMsStub({ value: 65_000 });

// The keys of sessionSnippetStatics ARE the snippet names — each one's tag is
// `<dungeonmaster-<key>>`. Deriving the set here (rather than hardcoding it) is what makes an
// eighth snippet, or one silently dropping out of injection, red these tests.
const EXPECTED_SNIPPET_KEYS = Object.keys(sessionSnippetStatics);

describe('childProcessSpawnStreamJsonAdapter integration', () => {
  const harness = sessionSpawnHarness();

  // The live turn runs HERE, and that placement is a measurement rather than a tidy-up. A spawned
  // CLI session plus the harness's transcript-flush poll is the RUNTIME's cost, not the cost of the
  // assertions below; charged to a test it read 3230ms and ward's slow-test gate reported it as slow
  // test code. jest runs beforeAll outside the test_start..test_done window, so the turn lands in
  // the suite's wall time — which ward already reports as `durationMs` — and each test measures its
  // own assertion. The hermetic test above the spawn keeps its own zero-cost path either way.
  let live: Awaited<ReturnType<typeof harness.spawnAndCollect>>;

  beforeAll(async () => {
    live = await harness.spawnAndCollect({
      prompt: PromptTextStub({ value: 'Reply with the single word: ack' }),
    });
  }, LIVE_SPAWN_TIMEOUT_MS);

  it('VALID: {this checkout .claude/settings.json} => the --settings blob registers a hook for every configured snippet key', async () => {
    const registeredKeys = await harness.settingsSnippetKeys();

    expect(registeredKeys.map((key) => String(key))).toStrictEqual(
      [...EXPECTED_SNIPPET_KEYS].sort(),
    );
  });

  it('VALID: {trivial prompt, --settings hooks} => every configured SessionStart snippet attaches once, before the first user entry', () => {
    const { exitCode, transcript } = live;

    const firstUserIndex = transcript.findIndex((entry) => String(entry.type) === 'user');
    const sessionStartAttachments = transcript
      .filter((entry) => String(entry.type) === 'attachment')
      .filter((entry) => String(entry.attachment?.hookEvent) === 'SessionStart');
    const attachmentIndices = sessionStartAttachments.map((entry) => transcript.indexOf(entry));
    // Each attachment maps to the ONE expected key whose tag appears in its content; an
    // unmatched attachment (a rogue extra) maps to the literal string "undefined" instead, which
    // cannot appear in EXPECTED_SNIPPET_KEYS, so it fails the comparison below same as a missing
    // key would (a shorter/longer sorted array, or a wrong entry, both go red).
    const attachmentSnippetKeys = sessionStartAttachments
      .map((entry) =>
        String(
          EXPECTED_SNIPPET_KEYS.find((key) =>
            String(entry.attachment?.content).includes(`<dungeonmaster-${key}>`),
          ),
        ),
      )
      .sort();

    expect(attachmentSnippetKeys).toStrictEqual([...EXPECTED_SNIPPET_KEYS].sort());
    expect(sessionStartAttachments.map((entry) => String(entry.attachment?.type))).toStrictEqual(
      EXPECTED_SNIPPET_KEYS.map(() => 'hook_success'),
    );
    expect(
      sessionStartAttachments.map((entry) => Number(entry.attachment?.exitCode)),
    ).toStrictEqual(EXPECTED_SNIPPET_KEYS.map(() => 0));
    expect(Math.max(...attachmentIndices)).toBeLessThan(firstUserIndex);
    expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
  });
});
