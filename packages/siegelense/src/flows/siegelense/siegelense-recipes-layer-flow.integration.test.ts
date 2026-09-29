/**
 * PURPOSE: Drives `SiegelenseRecipesLayerFlow` through `recipes`' whole argv surface — the bare call
 * (the human listing, the default), `--json`, and every refusal `recipesArgsParseTransformer` throws
 * (`--human`, `--instance`, and a bare positional argument) — against the REAL compiled
 * `packages/hydration-recipes/dist/index.js`, with no mock anywhere: `recipesLocateBroker` resolves
 * that sibling package by walking up from `cwd()` to the repo root, so unlike `status`'s or
 * `capacity`'s own layer-flow tests, nothing here needs `DUNGEONMASTER_HOME` or an
 * `installTestbedCreateBroker` tree. The listing below is transcribed verbatim from a live
 * `dungeonmaster siegelense recipes` / `recipes --json` run against this checkout's current compiled
 * `hydration-recipes` output, not carried over from an older copy of this test — `guild-with-three-quests`,
 * `guild-mid-execution`, `quest-advances-one-step` and `quest-completed` all use a runtime `filter()`
 * op in their plan (the last two to drop the riftcarver operation a live target's real START route
 * auto-seeds), so their `quest`/`operation` `makes` entries report `count: 'varies'` rather than a
 * fixed number, and only a live run catches that.
 *
 * USAGE:
 * await SiegelenseRecipesLayerFlow({ callArgs: ['--json'] });
 * // Writes the RecipesAnswer as one JSON document, parsed straight off the real hydration-recipes
 * // package
 */

import { stdout } from '#gateway/node/process';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { SiegelenseRecipesLayerFlow } from './siegelense-recipes-layer-flow';

const EXPECTED_HUMAN_OUTPUT = `  guild-empty
    one empty guild with no quests or sessions, ready for initial configuration
    inputs:  none
    runs:    serverless
    makes:   guild ×1

  guild-with-three-quests
    one guild holding three quests: one created, one in_progress, and one complete
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest (varies)

  guild-mid-execution
    one guild holding three quests — the first running with codeweaver actually in progress and its riftcarver item dropped, the second and third both freshly created and told apart only by their seeded title and request text ("Quest 2"/"Quest 3")
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×3, operation (varies)

  quest-advances-one-step
    one quest under an existing guild, its ledger already one operation along — the first item complete and the second running
    inputs:  guildId
    runs:    serverless
    makes:   quest ×1, operation (varies)

  quest-completed
    one guild holding one completed quest with all workflow operations and work items finished
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×1, operation (varies)

  session-single-turn
    one session under an existing guild, holding a single turn prompt and response
    inputs:  guildPath
    runs:    serverless
    makes:   session ×1

  session-with-nested-chain
    one session under an existing guild, holding a nested sub-agent chain two levels deep — a top agent with one sub-agent nested under it
    inputs:  guildPath
    runs:    serverless
    makes:   session ×1

  guild-active-suite
    one active guild holding two quests (one in progress, one complete) and a session with subagent chain
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×2, session ×1, subagent ×1

  session-with-nested-subagent
    one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished
    inputs:  guild
    runs:    needs a server: guild
    makes:   session ×1, subagent ×2
`;

describe('SiegelenseRecipesLayerFlow', () => {
  // `recipesReadBroker` dynamically imports the built `hydration-recipes/dist/index.js` once per
  // process and node caches the path after that (its own header: "No caching: node's own module
  // cache already makes a repeated import() of the same path free"), so whichever test runs first
  // pays the whole cost — measured at 5157ms before this landed, against every test in this file
  // finishing under 25ms after. jest runs `beforeAll` outside the window it charges to a test, so
  // paying the import here keeps every `it` fast and under ward's `integrationTestWarnMs` gate.
  // `stdout.write` is spied for the same reason the tests below swap it: a real write
  // here would land in the jest process's stdout and corrupt the `--json` report ward parses.
  beforeAll(async () => {
    const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
    stdoutSpy.calledWith([]).returns(true);

    await SiegelenseRecipesLayerFlow({ callArgs: ['--json'] });
  });

  describe('the bare call, no flags', () => {
    it('VALID: {callArgs: []} => writes the human recipe listing, one block per recipe', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await SiegelenseRecipesLayerFlow({ callArgs: [] });

      const writes = stdoutSpy
        .callsMatching([])
        .map((call) => ContentTextStub({ value: String(call[0]) }));

      const [wholeOutput] = writes;

      expect(wholeOutput).toBe(EXPECTED_HUMAN_OUTPUT);
    });
  });

  describe('the --json flag', () => {
    it('VALID: {callArgs: [--json]} => writes both real recipes whole — recipeName, description, runs, inputKeys and makes', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await SiegelenseRecipesLayerFlow({ callArgs: ['--json'] });

      const writes = stdoutSpy
        .callsMatching([])
        .map((call) => ContentTextStub({ value: String(call[0]) }));

      const [wholeOutput] = writes;

      expect(JSON.parse(wholeOutput!)).toStrictEqual({
        recipes: [
          {
            recipeName: 'guild-empty',
            description:
              'one empty guild with no quests or sessions, ready for initial configuration',
            inputKeys: [],
            runs: { serverless: true },
            makes: [{ ingredient: 'guild', count: 1 }],
          },
          {
            recipeName: 'guild-with-three-quests',
            description:
              'one guild holding three quests: one created, one in_progress, and one complete',
            inputKeys: [],
            runs: { serverless: true },
            makes: [
              { ingredient: 'guild', count: 1 },
              { ingredient: 'quest', count: 'varies' },
            ],
          },
          {
            recipeName: 'guild-mid-execution',
            description:
              'one guild holding three quests — the first running with codeweaver actually in progress and its riftcarver item dropped, the second and third both freshly created and told apart only by their seeded title and request text ("Quest 2"/"Quest 3")',
            inputKeys: [],
            runs: { serverless: true },
            makes: [
              { ingredient: 'guild', count: 1 },
              { ingredient: 'quest', count: 3 },
              { ingredient: 'operation', count: 'varies' },
            ],
          },
          {
            recipeName: 'quest-advances-one-step',
            description:
              'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
            inputKeys: ['guildId'],
            runs: { serverless: true },
            makes: [
              { ingredient: 'quest', count: 1 },
              { ingredient: 'operation', count: 'varies' },
            ],
          },
          {
            recipeName: 'quest-completed',
            description:
              'one guild holding one completed quest with all workflow operations and work items finished',
            inputKeys: [],
            runs: { serverless: true },
            makes: [
              { ingredient: 'guild', count: 1 },
              { ingredient: 'quest', count: 1 },
              { ingredient: 'operation', count: 'varies' },
            ],
          },
          {
            recipeName: 'session-single-turn',
            description:
              'one session under an existing guild, holding a single turn prompt and response',
            inputKeys: ['guildPath'],
            runs: { serverless: true },
            makes: [{ ingredient: 'session', count: 1 }],
          },
          {
            recipeName: 'session-with-nested-chain',
            description:
              'one session under an existing guild, holding a nested sub-agent chain two levels deep — a top agent with one sub-agent nested under it',
            inputKeys: ['guildPath'],
            runs: { serverless: true },
            makes: [{ ingredient: 'session', count: 1 }],
          },
          {
            recipeName: 'guild-active-suite',
            description:
              'one active guild holding two quests (one in progress, one complete) and a session with subagent chain',
            inputKeys: [],
            runs: { serverless: true },
            makes: [
              { ingredient: 'guild', count: 1 },
              { ingredient: 'quest', count: 2 },
              { ingredient: 'session', count: 1 },
              { ingredient: 'subagent', count: 1 },
            ],
          },
          {
            recipeName: 'session-with-nested-subagent',
            description:
              'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
            inputKeys: ['guild'],
            runs: { serverless: false, needsServerFor: 'guild' },
            makes: [
              { ingredient: 'session', count: 1 },
              { ingredient: 'subagent', count: 2 },
            ],
          },
        ],
      });
    });
  });

  describe('the refusal for --human, a flag the parser removed', () => {
    it('INVALID: {callArgs: [--human]} => rejects --human as an unknown flag, with no --instance explanation', async () => {
      await expect(SiegelenseRecipesLayerFlow({ callArgs: ['--human'] })).rejects.toThrow(
        /^Unknown flag: --human\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });

  describe('the refusal for --instance, a catalogue having nothing to narrow by', () => {
    it('INVALID: {callArgs: [--instance, inst_deadbeef01]} => rejects --instance as an unknown flag', async () => {
      await expect(
        SiegelenseRecipesLayerFlow({ callArgs: ['--instance', 'inst_deadbeef01'] }),
      ).rejects.toThrow(
        /^Unknown flag: --instance\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });

  describe('the refusal for a bare positional argument', () => {
    it('INVALID: {callArgs: [extra]} => rejects it, stating the catalogue needs no running instance', async () => {
      await expect(SiegelenseRecipesLayerFlow({ callArgs: ['extra'] })).rejects.toThrow(
        /^Unexpected positional argument: extra\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\.\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });
});
