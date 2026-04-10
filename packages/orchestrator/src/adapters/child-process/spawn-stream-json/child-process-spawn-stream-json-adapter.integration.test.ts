/**
 * PURPOSE: Integration test that spawns a real Claude CLI via the adapter to verify project hooks fire in -p mode
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { sessionSpawnHarness } from '../../../../test/harnesses/session-spawn/session-spawn.harness';

jest.setTimeout(65_000);

describe('childProcessSpawnStreamJsonAdapter integration', () => {
  const harness = sessionSpawnHarness();

  it('VALID: {prompt with --settings hooks} => SessionStart snippet hooks fire and inject content', async () => {
    const { assistantText, exitCode } = await harness.spawnAndCollect({
      prompt: PromptTextStub({
        value:
          'If you see a dungeonmaster-discover tag in your system prompt, respond with exactly: SNIPPET_INCLUDED. If you do not see one, respond with exactly: SNIPPET_MISSING. Do not include any other text.',
      }),
    });

    expect(String(assistantText).trim()).toBe('SNIPPET_INCLUDED');
    expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
  });
});
