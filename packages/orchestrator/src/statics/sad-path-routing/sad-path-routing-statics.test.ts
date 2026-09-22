import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from './sad-path-routing-statics';

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its row however the
// markdown happens to wrap. Anything measuring the real bytes reads
// `sadPathRoutingStatics.markdown` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_MARKDOWN = sadPathRoutingStatics.markdown.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_MARKDOWN.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('sadPathRoutingStatics', () => {
  it('VALID: exported value => is exactly one markdown block and nothing else', () => {
    expect(sadPathRoutingStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  // Every prompt that runs a step interpolates this whole block, so it is measured once more by each
  // of those prompts' own colocated tests. This test measures the block itself, on its own.
  it('VALID: markdown => stays under the MCP tool-result verbatim-delivery ceiling on its own', () => {
    const bytes = Buffer.byteLength(sadPathRoutingStatics.markdown, 'utf8');

    expect(bytes).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: markdown => heads the table with a claim about every row beneath it', () => {
    const headings = Array.from(
      sadPathRoutingStatics.markdown.matchAll(/^#{2,3} .+$/gmu),
      (match) => match[0],
    );

    expect(headings).toStrictEqual(['## The sad paths, and where each lands']);
  });

  // Each row is a contract in three parts: the situation, an action the session can actually take,
  // and what the router does with it. A row missing the third part is the one a session invents a
  // consequence for.
  describe('the five situations', () => {
    it('VALID: markdown => carries a row per situation naming both the action and where it lands', () => {
      expect({
        outOfScope: has(
          '| out of scope, or out of context | mark those units `unmet` with a note on what is left, then signal | the router mints part two on exactly those |',
        ),
        cannotBeSettledAtThisLayer: has(
          '| cannot be settled at this layer, by anyone in this role | mark `cant-meet` with `toSettle` | the unit is settled; nothing re-opens it |',
        ),
        environmentWall: has(
          '| an environment wall — a denied command, a missing credential, an unreachable service | mark what is markable, declare the outcome `wall`, then signal | the quest blocks for a human, carrying the reason |',
        ),
        planIsWrong: has(
          '| the plan itself is wrong | `quest-work` → `amendment`, then mark and signal normally | the router re-reads the plan |',
        ),
        seedIsWrongOrMissing: has(
          '| the seed is wrong or missing | request `recipe`, and carry on when it returns | never invent a seed inline |',
        ),
      }).toStrictEqual({
        outOfScope: true,
        cannotBeSettledAtThisLayer: true,
        environmentWall: true,
        planIsWrong: true,
        seedIsWrongOrMissing: true,
      });
    });

    it('VALID: markdown => holds these situations in the first column, in this order, and no others', () => {
      const situations = Array.from(
        sadPathRoutingStatics.markdown.matchAll(/^\| ([^|]+) \|/gmu),
        (match) => match[1],
      );

      expect(situations).toStrictEqual([
        'Situation',
        'out of scope, or out of context',
        'cannot be settled at this layer, by anyone in this role',
        'an environment wall — a denied command, a missing credential, an unreachable service',
        'the plan itself is wrong',
        'the seed is wrong or missing',
      ]);
    });
  });

  // A shared block is a contract on every prompt that takes it, so it may carry no route only one
  // role can walk. These needles pin the surfaces that belong to one step's own prompt.
  describe('what a block read by every stepping session must never name', () => {
    it('VALID: markdown => names no single role, step or per-step budget', () => {
      expect({
        codeweaver: has('codeweaver'),
        flowrider: has('flowrider'),
        siegemaster: has('siegemaster'),
        maxVisits: has('maxVisits'),
        blocked: has('@blocked'),
      }).toStrictEqual({
        codeweaver: false,
        flowrider: false,
        siegemaster: false,
        maxVisits: false,
        blocked: false,
      });
    });
  });
});
