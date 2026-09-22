import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { unitMarkingStatics } from './unit-marking-statics';

// PROSE COMPARES IGNORE WRAPPING. `has` collapses every whitespace run — spaces, newlines, indent —
// on BOTH sides before it matches, so a needle written on one line finds its sentence however the
// markdown happens to wrap. Anything measuring the real bytes reads `unitMarkingStatics.markdown`
// directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_MARKDOWN = unitMarkingStatics.markdown.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_MARKDOWN.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('unitMarkingStatics', () => {
  it('VALID: exported value => is exactly one markdown block and nothing else', () => {
    expect(unitMarkingStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  // Every prompt that holds units interpolates this whole block, so it is measured once more by each
  // of those prompts' own colocated tests. This test measures the block itself, on its own.
  it('VALID: markdown => stays under the MCP tool-result verbatim-delivery ceiling on its own', () => {
    const bytes = Buffer.byteLength(unitMarkingStatics.markdown, 'utf8');

    expect(bytes).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: markdown => makes marking continuous rather than one block at the end, and says why', () => {
    expect({
      markTheMomentYouSettle: has(
        '**Mark each unit the moment you settle it, never in one block at the end.**',
      ),
      aDeadSessionLosesTheWholePiece: has(
        'Sessions here run long enough to die mid-piece, and one that dies having marked nothing loses all of it.',
      ),
      markingAtTheEndIsTranscription: has(
        'Marking at the end also means transcribing from memory.',
      ),
    }).toStrictEqual({
      markTheMomentYouSettle: true,
      aDeadSessionLosesTheWholePiece: true,
      markingAtTheEndIsTranscription: true,
    });
  });

  describe('the three marks', () => {
    it('VALID: markdown => carries a row per mark naming when it is written and what it must carry', () => {
      expect({
        met: has(
          '| `met` | you settled it and can say how | the evidence — a test `file:line` and the wrong value that turns it red, or the value measured off the running system |',
        ),
        cantMeet: has(
          '| `cant-meet` | nobody in this role could settle it at this layer | `toSettle` — the action that WOULD settle it, as an instruction |',
        ),
        unmet: has(
          '| `unmet` | real work remains | what is left, and what you already learned. That note reaches your successor |',
        ),
      }).toStrictEqual({
        met: true,
        cantMeet: true,
        unmet: true,
      });
    });
  });

  // No gate can enforce any of these three, which is the whole reason they are prompt text. The
  // second one is the sentence a false `met` gets past when it is missing.
  describe('the three rules no gate enforces', () => {
    it('VALID: markdown => makes `unmet` free, forbids an unsettled mark, and makes `toSettle` an instruction', () => {
      expect({
        unmetIsNotFailure: has('**`unmet` is not failure and costs nothing.**'),
        stoppingOnUnmetIsRight: has(
          'A session marking its remainder `unmet` and stopping is doing the right thing. Pushing on with no context left is what produces a `met` nobody can trust.',
        ),
        neverMarkWhatYouDidNotSettle: has('**Never mark a unit you did not settle.**'),
        theGateCannotTellAHopefulMet: has(
          'The gate forces a mark on every one and cannot tell a real `met` from a hopeful one, so nothing but you stands between a `met` you hoped for and everything the quest builds on top of it.',
        ),
        toSettleIsAnInstruction: has('**`toSettle` is an instruction, not a question.**'),
        toSettleExample: has(
          '"Drive a real send through a live quest and read the session JSONL for a Read call on the written path" — never "how should this be tested?".',
        ),
      }).toStrictEqual({
        unmetIsNotFailure: true,
        stoppingOnUnmetIsRight: true,
        neverMarkWhatYouDidNotSettle: true,
        theGateCannotTellAHopefulMet: true,
        toSettleIsAnInstruction: true,
        toSettleExample: true,
      });
    });
  });

  // A shared block is a contract on every prompt that takes it, so it may carry no question only one
  // kind of reader can answer. These needles pin the surfaces that belong to one step's own prompt.
  describe('what a block read by every unit-holding session must never name', () => {
    it('VALID: markdown => names no single role, step, tool call or per-step budget', () => {
      expect({
        codeweaver: has('codeweaver'),
        flowrider: has('flowrider'),
        siegemaster: has('siegemaster'),
        maxVisits: has('maxVisits'),
        getQuestWork: has('get-quest-work'),
        signalBack: has('signal-back'),
      }).toStrictEqual({
        codeweaver: false,
        flowrider: false,
        siegemaster: false,
        maxVisits: false,
        getQuestWork: false,
        signalBack: false,
      });
    });
  });
});
