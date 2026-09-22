/**
 * PURPOSE: Drives `SiegelenseRecipesLayerFlow` through `recipes`' whole argv surface — the bare call
 * (the human listing, the default), `--json`, and every refusal `recipesArgsParseTransformer` throws
 * (`--human`, `--instance`, and a bare positional argument) — against the REAL compiled
 * `packages/hydration-recipes/dist/index.js`, with no mock anywhere: `recipesLocateBroker` resolves
 * that sibling package by walking up from `process.cwd()` to the repo root, so unlike `status`'s or
 * `capacity`'s own layer-flow tests, nothing here needs `DUNGEONMASTER_HOME` or an
 * `installTestbedCreateBroker` tree. The listing below is transcribed verbatim from a live
 * `dungeonmaster siegelense recipes` / `recipes --json` run against this checkout's current compiled
 * `hydration-recipes` output, not carried over from an older copy of this test — `guild-with-three-quests`
 * and `guild-mid-execution` both use a runtime `filter()` op in their plan, so their `quest`/`operation`
 * `makes` entries report `count: 'varies'` rather than a fixed number, and only a live run catches
 * that.
 *
 * USAGE:
 * await SiegelenseRecipesLayerFlow({ callArgs: ['--json'] });
 * // Writes the RecipesAnswer as one JSON document, parsed straight off the real hydration-recipes
 * // package
 */

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
    one guild holding three quests, the first running with its riftcarver item dropped
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×3, operation (varies)

  quest-advances-one-step
    one quest under an existing guild, its ledger already one operation along — the first item complete and the second running
    inputs:  guildId
    runs:    serverless
    makes:   quest ×1

  quest-completed
    one guild holding one completed quest with all workflow operations finished
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×1, operation ×2

  session-single-turn
    one session under an existing guild, holding a single turn prompt and response
    inputs:  guildPath
    runs:    serverless
    makes:   session ×1

  session-with-nested-chain
    one session under an existing guild, holding a nested sub-agent chain
    inputs:  guildPath
    runs:    serverless
    makes:   session ×1

  guild-active-suite
    one active guild holding two quests (one in progress, one complete) and a session with subagent chain
    inputs:  none
    runs:    serverless
    makes:   guild ×1, quest ×2, session ×1, subagent ×1
`;

describe('SiegelenseRecipesLayerFlow', () => {
  describe('the bare call, no flags', () => {
    it('VALID: {callArgs: []} => writes the human recipe listing, one block per recipe', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseRecipesLayerFlow({ callArgs: [] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;

      expect(wholeOutput).toBe(EXPECTED_HUMAN_OUTPUT);
    });
  });

  describe('the --json flag', () => {
    it('VALID: {callArgs: [--json]} => writes both real recipes whole — recipeName, description, runs, inputKeys and makes', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseRecipesLayerFlow({ callArgs: ['--json'] });

      process.stdout.write = originalWrite;

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
              'one guild holding three quests, the first running with its riftcarver item dropped',
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
            makes: [{ ingredient: 'quest', count: 1 }],
          },
          {
            recipeName: 'quest-completed',
            description:
              'one guild holding one completed quest with all workflow operations finished',
            inputKeys: [],
            runs: { serverless: true },
            makes: [
              { ingredient: 'guild', count: 1 },
              { ingredient: 'quest', count: 1 },
              { ingredient: 'operation', count: 2 },
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
            description: 'one session under an existing guild, holding a nested sub-agent chain',
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
        ],
      });
    });
  });

  describe('the refusal for --human, a flag the parser removed', () => {
    it('INVALID: {callArgs: [--human]} => rejects --human as an unknown flag, naming the one accepted flag', async () => {
      await expect(SiegelenseRecipesLayerFlow({ callArgs: ['--human'] })).rejects.toThrow(
        /^Unknown flag: --human\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\.\n\nAccepted flags: --json\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
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
        /^Unexpected positional argument: extra\n\nTakes no instance\. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it\. Every value must directly follow the flag it belongs to\.\n\nUsage: dungeonmaster siegelense recipes \[--json\]$/u,
      );
    });
  });
});
