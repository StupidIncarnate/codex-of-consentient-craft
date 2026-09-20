/**
 * PURPOSE: THE BOOK — every recipe this repo declares, as the static data
 * `dungeonmaster siegelense recipes` reads. This is the one declaration, and both readers share it:
 * the listing renders it, and a `seed` step resolves a recipe by matching `name` against it, so the
 * two cannot drift the way a Gherkin sentence drifts from its step definition
 * (siegelense-recipes.md line 713).
 *
 * Plain data rather than parsed values, because a statics file may import only statics — the shape
 * is graded by `recipeManifestContract` at the one place the book is read, `recipeBookReadBroker`,
 * so a malformed entry fails the listing loudly rather than reaching a caller half-formed.
 *
 * Adding a recipe means adding an entry HERE and writing its seed broker. An entry with no broker
 * is a listing that promises a state nothing can create; a broker with no entry is a state no
 * session can discover. Reach for `recipeFidelityStatics` instead when you need what a marker MEANS
 * rather than which recipes carry it.
 *
 * USAGE:
 * recipeBookStatics.recipes;
 * // Returns every declared recipe, each with its produces:, fidelity, mirrors:, parameters and returns
 */

// The lookup keys, declared once. `recipeRunBroker` routes on these and the entries below carry
// them, so a listing and a runner cannot disagree about what a recipe is called — which is the
// whole of "the listing and the runner read the same declaration" (siegelense-recipes.md line 713).
const NAMES = {
  guildWithThreeQuests: 'guild-with-three-quests',
  sessionWithNestedSubagent: 'session-with-nested-subagent',
} as const;

export const recipeBookStatics = {
  names: NAMES,
  recipes: [
    {
      name: NAMES.guildWithThreeQuests,
      // siegelense-tooling.md line 2321-2322, verbatim.
      produces: 'one guild holding three quests, one in_progress',
      fidelity: 'production',
      mirrors: null,
      parameters: [],
      returns: [
        {
          name: 'guildId',
          description: 'the seeded guild, for a later recipe that stacks onto it',
        },
        {
          name: 'guildSlug',
          description: "the guild's own route segment",
        },
        {
          name: 'questId',
          // "TWO of anything an assertion must tell apart" (siegelense-recipes.md line 454) — with
          // three quests and one of them in_progress, "the right one" and "the first one" are
          // different values, so an off-by-index bug cannot pass.
          description:
            'the one quest left in_progress, the one an assertion must tell from the other two',
        },
      ],
    },
    {
      name: NAMES.sessionWithNestedSubagent,
      // siegelense-tooling.md line 2318-2319, verbatim.
      produces:
        'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
      fidelity: 'direct',
      // Three pointers, because a diagnosis needs all three: where it writes, what it writes, and
      // the READER a drift shows up against. The first two were here already and making the recipe
      // executable confirmed both; the third is what the author flagged as the uncertain half, and
      // it is the one a failing recipe test actually points at.
      mirrors:
        'the Claude CLI session transcript writer — its on-disk location is claudePathSlugEncoderTransformer (the same transformer the server resolves a session through), its line shapes are the stream-line contracts and stubs in @dungeonmaster/shared/contracts, and the reader a drift shows up against is the orchestrator chat replay, which pairs a sub-agent file to its Task by toolUseResult.agentId',
      parameters: [
        {
          name: 'guild',
          description:
            "the guild the transcript is filed under — an earlier recipe's guildId, passed explicitly",
          required: true,
        },
      ],
      returns: [
        {
          name: 'sessionId',
          description: 'the session the outer chain was written as',
        },
        {
          name: 'sessions.outer',
          description: 'the route that renders the outer sub-agent chain',
        },
        {
          name: 'sessions.nested',
          description: 'the route that renders the chain nested inside it',
        },
      ],
    },
  ],
} as const;
