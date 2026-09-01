import { chaoswhispererGapMinionStatics } from '../chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPromptStatics } from '../codeweaver-prompt/codeweaver-prompt-statics';
import { codeweaverReviewerStatics } from '../codeweaver-reviewer/codeweaver-reviewer-statics';
import { dumpsterCreatePromptStatics } from '../dumpster-create-prompt/dumpster-create-prompt-statics';
import { dumpsterHuntPromptStatics } from '../dumpster-hunt-prompt/dumpster-hunt-prompt-statics';
import { flowriderPromptStatics } from '../flowrider-prompt/flowrider-prompt-statics';
import { flowriderReviewerStatics } from '../flowrider-reviewer/flowrider-reviewer-statics';
import { glyphsmithPromptStatics } from '../glyphsmith-prompt/glyphsmith-prompt-statics';
import { siegemasterPromptStatics } from '../siegemaster-prompt/siegemaster-prompt-statics';
import { siegemasterReviewerStatics } from '../siegemaster-reviewer/siegemaster-reviewer-statics';
import { siegemasterWalkerStatics } from '../siegemaster-walker/siegemaster-walker-statics';
import { spiritmenderPromptStatics } from '../spiritmender-prompt/spiritmender-prompt-statics';
import { tavernkeeperPromptStatics } from '../tavernkeeper-prompt/tavernkeeper-prompt-statics';
import { warpgatePromptStatics } from '../warpgate-prompt/warpgate-prompt-statics';
import { spilledToolResultStatics } from './spilled-tool-result-statics';

const BLOCK = spilledToolResultStatics.markdown;

// Every prompt whose session fetches quest data and can therefore be handed a spilled result. Read
// as the value each one actually serves, so a prompt that stops interpolating the block reds here
// rather than shipping a session that skims its own scope.
const HOSTS = [
  ['codeweaver', codeweaverPromptStatics.prompt.template],
  ['flowrider', flowriderPromptStatics.prompt.template],
  ['siegemaster', siegemasterPromptStatics.prompt.template],
  ['codeweaver-reviewer', codeweaverReviewerStatics.prompt.template],
  ['flowrider-reviewer', flowriderReviewerStatics.prompt.template],
  ['siegemaster-reviewer', siegemasterReviewerStatics.prompt.template],
  ['siegemaster-walker', siegemasterWalkerStatics.prompt.template],
  ['chaoswhisperer-gap-minion', chaoswhispererGapMinionStatics.prompt.template],
  ['glyphsmith', glyphsmithPromptStatics.prompt.template],
  ['tavernkeeper', tavernkeeperPromptStatics.prompt.template],
  // These two call `stage: 'spec'`, the largest render the tool produces, so they are the likeliest
  // of all hosts to meet a spill.
  ['dumpster-create', dumpsterCreatePromptStatics.prompt.template],
  ['dumpster-hunt', dumpsterHuntPromptStatics.prompt.template],
] as const;

// A SIBLING ROLE'S TOOL NAME IN A SHARED BLOCK REDS EVERY HOST THAT BANS IT. Seven prompts assert
// they never name `get-blight-checklist`, which is the reviewer's alone — an earlier draft of this
// block listed it and failed all seven at once. The rule holds for every fetch, so it needs no tool
// name to state it.
const ROLE_SCOPED_TOOL_NAMES = ['get-blight-checklist', 'get-qa-checklist', 'run-ward'];

describe('spilledToolResultStatics', () => {
  describe('the rule itself', () => {
    it('VALID: markdown => says read it in full, and refuses the two shortcuts by name', () => {
      expect({
        readsInFull: BLOCK.includes(
          '**A tool result too large to return inline is READ IN FULL — never skimmed, never summarised.**',
        ),
        sequentialChunks: BLOCK.includes(
          'from its first line to its last, in sequential chunks where one read cannot hold it',
        ),
        refusesOffset: BLOCK.includes('It offers `offset` and `limit` to read "specific'),
        notAFailure: BLOCK.includes('the data is not lost\nand the call did not fail: it moved'),
        reCallingIsNoEscape: BLOCK.includes(
          'Re-calling the tool\nreturns the same oversized result, so the file is the only route to it.',
        ),
      }).toStrictEqual({
        readsInFull: true,
        sequentialChunks: true,
        refusesOffset: true,
        notAFailure: true,
        reCallingIsNoEscape: true,
      });
    });

    it('VALID: markdown => introduces no `##` heading, so a host prompt keeps its own section list', () => {
      expect(BLOCK.split('\n').filter((line) => line.startsWith('#'))).toStrictEqual([]);
    });

    it('VALID: markdown => names no role-scoped tool, so every host can carry it', () => {
      expect(ROLE_SCOPED_TOOL_NAMES.filter((name) => BLOCK.includes(name))).toStrictEqual([]);
    });
  });

  describe('every prompt that fetches quest data carries it', () => {
    // Counted rather than tested for presence: twice would mean an interpolation landed in two
    // sections, which costs the host prompt its budget twice over for one rule.
    it.each(HOSTS)('VALID: {%s} => serves the block exactly once', (_name, template) => {
      expect(template.split(BLOCK).length - 1).toBe(1);
    });

    // The two roles that fetch NO quest data must not carry it: spiritmender works from the ward
    // blob its Operation Context names and warpgate from the base branch, so neither can ever be
    // handed a spilled result — and a fetch rule in either is a paragraph its session skims past on
    // the way to what it actually does.
    it.each([
      ['spiritmender', spiritmenderPromptStatics.prompt.template],
      ['warpgate', warpgatePromptStatics.prompt.template],
    ])('EMPTY: {%s} => fetches nothing, so it does not carry the block', (_name, template) => {
      expect(template.split(BLOCK).length - 1).toBe(0);
    });
  });
});
