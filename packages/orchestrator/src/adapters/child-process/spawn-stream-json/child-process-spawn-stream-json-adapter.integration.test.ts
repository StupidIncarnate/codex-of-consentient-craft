/**
 * PURPOSE: Integration test that spawns a real Claude CLI via the adapter to verify every
 * configured SessionStart snippet is injected before the model's first turn. Measures this off the
 * session transcript Claude Code itself writes rather than asking the spawned model to self-report
 * on its own system prompt — that self-report was measured wrong roughly 1 time in 6.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { sessionSpawnHarness } from '../../../../test/harnesses/session-spawn/session-spawn.harness';

jest.setTimeout(65_000);

// The keys of sessionSnippetStatics ARE the snippet names — each one's tag is
// `<dungeonmaster-<key>>`. Deriving the set here (rather than hardcoding it) is what makes an
// eighth snippet, or one silently dropping out of injection, red this test.
const EXPECTED_SNIPPET_KEYS = Object.keys(sessionSnippetStatics);

describe('childProcessSpawnStreamJsonAdapter integration', () => {
  const harness = sessionSpawnHarness();

  it('VALID: {trivial prompt, --settings hooks} => every configured SessionStart snippet attaches once, before the first user entry', async () => {
    const { exitCode, transcript } = await harness.spawnAndCollect({
      prompt: PromptTextStub({ value: 'Reply with the single word: ack' }),
    });

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
