import { agentOperatingRulesStatics } from './agent-operating-rules-statics';

// Every exported piece, keyed to the bracketed tag it opens with. The tag is a rule's ID, so a
// piece that opens with none reads as 'none' here — the heading and the two closes are all that
// should land in that group.
const OPENING_TAGS = Object.fromEntries(
  Object.entries(agentOperatingRulesStatics).map(([key, piece]) => [
    key,
    /^\*\*\[(?<tag>[A-Z ]+)\]/u.exec(piece)?.groups?.tag ?? 'none',
  ]),
);

// Pieces that number themselves, by key. A number is a POSITION, and a prompt composes its own
// block out of these, so a numbered rule would claim a slot no piece here can see.
const SELF_NUMBERING_PIECES = Object.entries(agentOperatingRulesStatics)
  .filter(([, piece]) => /^\*\*\d/mu.test(piece))
  .map(([key]) => key);

describe('agentOperatingRulesStatics', () => {
  it('VALID: exported value => carries every piece a prompt composes from, all non-empty strings', () => {
    expect(agentOperatingRulesStatics).toStrictEqual({
      heading: expect.stringMatching(/^.+$/su),
      turnEndRole: expect.stringMatching(/^.+$/su),
      turnEndMinion: expect.stringMatching(/^.+$/su),
      background: expect.stringMatching(/^.+$/su),
      wardScoped: expect.stringMatching(/^.+$/su),
      wardNone: expect.stringMatching(/^.+$/su),
      delegationSynchronous: expect.stringMatching(/^.+$/su),
      delegationSpike: expect.stringMatching(/^.+$/su),
      delegationLeafBan: expect.stringMatching(/^.+$/su),
      wallRole: expect.stringMatching(/^.+$/su),
      wallMinion: expect.stringMatching(/^.+$/su),
      treeCleanRole: expect.stringMatching(/^.+$/su),
      treeCleanOperator: expect.stringMatching(/^.+$/su),
    });
  });

  // A rule reaching a prompt under the wrong tag, or under no tag at all, fails nothing at runtime.
  // The agent simply cannot resolve the citations that name it — here, and in every sibling prompt
  // that cites a rule from inside its own text.
  it('VALID: exported pieces => every rule opens with its tag, and no other piece opens with one', () => {
    expect(OPENING_TAGS).toStrictEqual({
      heading: 'none',
      turnEndRole: 'TURN END',
      turnEndMinion: 'TURN END',
      background: 'BACKGROUND',
      wardScoped: 'WARD',
      wardNone: 'WARD',
      delegationSynchronous: 'DELEGATION',
      delegationSpike: 'DELEGATION',
      delegationLeafBan: 'DELEGATION',
      wallRole: 'WALL',
      wallMinion: 'WALL',
      treeCleanRole: 'none',
      treeCleanOperator: 'none',
    });
  });

  it('VALID: exported pieces => no piece numbers itself', () => {
    expect(SELF_NUMBERING_PIECES).toStrictEqual([]);
  });

  // The heading is what makes a tag resolvable. Without it the agent meets `[WALL]` as decoration
  // rather than as the name of a rule it can go and find. It also closes on the subheading the
  // rules render under, so a prompt composes the whole frame from this one piece.
  it('VALID: heading => names the tag convention, refuses a priority order, and closes on the rules subheading', () => {
    expect({
      readsFirst: agentOperatingRulesStatics.heading.startsWith(
        '## Operating Rules\n\nRead every rule below before you do anything else.',
      ),
      tagsAreIds: agentOperatingRulesStatics.heading.includes(
        'Each rule opens with its TAG in brackets.',
      ),
      citationsNameTheTag: agentOperatingRulesStatics.heading.includes(
        'Anything that cites a rule — here, or later in this prompt — names that tag.',
      ),
      noPriorityOrder: agentOperatingRulesStatics.heading.includes(
        'All rules MUST be followed. No one rule has more priority over any others.',
      ),
      closesOnTheRulesSubheading:
        agentOperatingRulesStatics.heading.endsWith('\n\n### Rules to follow'),
    }).toStrictEqual({
      readsFirst: true,
      tagsAreIds: true,
      citationsNameTheTag: true,
      noPriorityOrder: true,
      closesOnTheRulesSubheading: true,
    });
  });

  // AXIS 1 IS THE TERMINAL ACTION, and it has exactly two sides. A work-item role ENDS in
  // `signal-back`, whether it changes files or only dispatches. A minion never calls it: the
  // `workItemId` in a minion's briefing is its PARENT's, so signalling on it would complete the
  // parent's operation item mid-round.
  describe('axis 1: the terminal action', () => {
    // ONE form serves every work-item role. An operator's failure exits are its wall and its spent
    // round budget, and both end in `signal-back` like any other, so "every failure path" already
    // covers them. A second form saying "the path a wall puts you on" would state a subset of this
    // and drift from it.
    it('VALID: {turnEndRole} => mandates signal-back on every path, and names what a missing one costs', () => {
      expect({
        mandatesIt: agentOperatingRulesStatics.turnEndRole.startsWith(
          '**[TURN END] ALWAYS call `signal-back` as the final action of your turn.**',
        ),
        exactlyOneCall: agentOperatingRulesStatics.turnEndRole.includes(
          'Every path through this prompt ends in exactly one `signal-back(...)` call.',
        ),
        failurePathsToo: agentOperatingRulesStatics.turnEndRole.includes(
          'Every failure path ends there too.',
        ),
        theItemHangsForGood: agentOperatingRulesStatics.turnEndRole.includes(
          'your work item stays `in_progress` for good. No downstream role dispatches. Nothing retries you.',
        ),
      }).toStrictEqual({
        mandatesIt: true,
        exactlyOneCall: true,
        failurePathsToo: true,
        theItemHangsForGood: true,
      });
    });

    it('VALID: {turnEndMinion} => forbids signal-back, names the parent-item hazard and the NEXT: line', () => {
      expect({
        forbidsIt: agentOperatingRulesStatics.turnEndMinion.startsWith(
          '**[TURN END] NEVER call `signal-back`. Your final message IS your terminal action.**',
        ),
        namesTheHazard: agentOperatingRulesStatics.turnEndMinion.includes(
          "Signalling on it would complete the parent's operation item. It would also advance the relay while the parent is still working.",
        ),
        namesTheNextLine: agentOperatingRulesStatics.turnEndMinion.includes(
          'The LAST line of that block is always `NEXT:`',
        ),
        parentActsOnOneWord: agentOperatingRulesStatics.turnEndMinion.includes(
          'It reads the `NEXT:` line. It acts on that one word. It never opens a file to check the rest.',
        ),
      }).toStrictEqual({
        forbidsIt: true,
        namesTheHazard: true,
        namesTheNextLine: true,
        parentActsOnOneWord: true,
      });
    });
  });

  // AXIS 2 IS WHETHER THE READER MAY DELEGATE. A LEAF minion that spawns a sub-agent produces a
  // grandchild whose conclusions no gate reads. A prompt taking both of these says "never delegate"
  // and "delegate for a spike" in one block, and the agent follows whichever it reads first.
  describe('axis 2: delegation', () => {
    it('VALID: {delegationSpike} => permits a bounded spike and refuses whole-assignment delegation', () => {
      expect({
        spikeOnly: agentOperatingRulesStatics.delegationSpike.includes('a SPIKE, and only a spike'),
        notTheWholeAssignment: agentOperatingRulesStatics.delegationSpike.includes(
          'You may NOT delegate your whole assignment to a helper',
        ),
        judgmentIsTheDeliverable: agentOperatingRulesStatics.delegationSpike.includes(
          "Never pass a helper's conclusions up as your own output.",
        ),
      }).toStrictEqual({
        spikeOnly: true,
        notTheWholeAssignment: true,
        judgmentIsTheDeliverable: true,
      });
    });

    it('VALID: {delegationLeafBan} => bans the Agent tool outright and names why a grandchild is ungraded', () => {
      expect({
        nobodyGradesIt: agentOperatingRulesStatics.delegationLeafBan.includes(
          "your parent reads YOUR files, not your helper's conclusions",
        ),
        escalateInstead: agentOperatingRulesStatics.delegationLeafBan.includes(
          'say so in your return. Let your parent decide.',
        ),
      }).toStrictEqual({ nobodyGradesIt: true, escalateInstead: true });
    });

    it('VALID: {delegationSynchronous} => cites [BACKGROUND] by tag and says the Agent tool is synchronous', () => {
      expect({
        citesTheTag: agentOperatingRulesStatics.delegationSynchronous.includes(
          'You do NOT break [BACKGROUND] by awaiting a helper you spawn.',
        ),
        whyItIsSafe: agentOperatingRulesStatics.delegationSynchronous.includes(
          '[BACKGROUND] forbids ending your turn on a backgrounded *shell* command.',
        ),
        decideEarly: agentOperatingRulesStatics.delegationSynchronous.includes('decide it EARLY'),
      }).toStrictEqual({ citesTheTag: true, whyItIsSafe: true, decideEarly: true });
    });
  });

  // AXIS 3 IS WHETHER THE READER RUNS WARD AT ALL. An operator runs none. Its reviewer runs the
  // round's single `--staged` pass. Hand an operator the scoping rule and you hand back a command
  // its own prompt FORBIDS.
  describe('axis 3: ward ownership', () => {
    // The scoping rule has to cover BOTH legitimate forms. A worker runs the named-file form. A
    // reviewer runs `--staged`. Name only one of them, and the other reads as a violation of the
    // rule that was supposed to permit it.
    it('VALID: {wardScoped} => names the file-scoped form, the --staged form, and refuses a choice between them', () => {
      expect({
        namedFileForm: agentOperatingRulesStatics.wardScoped.includes(
          '`npm run ward -- --only <checks> -- <file1> <file2>` — a NAMED file set',
        ),
        stagedForm: agentOperatingRulesStatics.wardScoped.includes(
          '`npm run ward -- --staged` — every SOURCE FILE ORIGIN DOES NOT HAVE YET',
        ),
        exactlyTwo: agentOperatingRulesStatics.wardScoped.includes(
          'There are exactly TWO scoped forms',
        ),
        noChoosing: agentOperatingRulesStatics.wardScoped.includes(
          'Do not choose between them. Your own prompt tells you which one is yours:',
        ),
        stagedTakesNoOtherFlag: agentOperatingRulesStatics.wardScoped.includes(
          'Ward REJECTS it combined with `--only`, `--onlyTests` or a file list',
        ),
        bansBareDirectory: agentOperatingRulesStatics.wardScoped.includes(
          'NEVER a bare directory (`-- packages/<pkg>`)',
        ),
        citesBackgroundByTag: agentOperatingRulesStatics.wardScoped.includes('See [BACKGROUND].'),
      }).toStrictEqual({
        namedFileForm: true,
        stagedForm: true,
        exactlyTwo: true,
        noChoosing: true,
        stagedTakesNoOtherFlag: true,
        bansBareDirectory: true,
        citesBackgroundByTag: true,
      });
    });

    it('VALID: {wardNone} => runs no ward at all and names the reviewer as the one that does', () => {
      expect({
        reviewerRunsIt: agentOperatingRulesStatics.wardNone.includes(
          "Your REVIEWER runs the round's ward, once, as `npm run ward -- --staged`",
        ),
        overridesBothSnippets: agentOperatingRulesStatics.wardNone.includes(
          'OVERRIDES both the `<dungeonmaster-ward>` and the `<dungeonmaster-ward-discipline>` snippets',
        ),
        namesTheCost: agentOperatingRulesStatics.wardNone.includes(
          'compete with your reviewer for the same tree',
        ),
      }).toStrictEqual({ reviewerRunsIt: true, overridesBothSnippets: true, namesTheCost: true });
    });
  });

  // The wall rule is one subject in two vocabularies. A work-item role signals an outcome. A minion
  // writes a `NEXT:` line its parent matches on one word. A minion handed the role form has nothing
  // to match.
  describe('the wall rule in both vocabularies', () => {
    it('VALID: {wallMinion} => names NEXT: wall, and says rework is the answer for unfinished work', () => {
      expect({
        namesWall: agentOperatingRulesStatics.wallMinion.includes(
          '`NEXT: wall — <what a human must change>`',
        ),
        onlyForThat: agentOperatingRulesStatics.wallMinion.includes(
          'Write that line for nothing else',
        ),
        haltsTheQuest: agentOperatingRulesStatics.wallMinion.includes(
          "Your parent turns that line into an `operationStatus: 'blocked'` that halts the whole quest",
        ),
        reworkForTheRest: agentOperatingRulesStatics.wallMinion.includes(
          'Work that merely remains unfinished is `NEXT: rework` instead',
        ),
        noFakeGreen: agentOperatingRulesStatics.wallMinion.includes(
          'Do NOT report a green ward you did not actually get',
        ),
      }).toStrictEqual({
        namesWall: true,
        onlyForThat: true,
        haltsTheQuest: true,
        reworkForTheRest: true,
        noFakeGreen: true,
      });
    });

    // The FRESH-SESSION test, in the minion's own vocabulary. Without it a minion reports a bounced
    // dev server as `NEXT: wall`. Its parent turns that into an `operationStatus: 'blocked'` that
    // halts the whole quest, over a resource the parent could have restarted. `wallRole` gets the
    // same test in its own vocabulary.
    it('VALID: {wallMinion} => sends a wall a restart clears to NEXT: rework', () => {
      expect({
        restartableIsRework: agentOperatingRulesStatics.wallMinion.includes(
          '**A wall your parent can clear by restarting a resource it owns is `NEXT: rework`, not `NEXT: wall`.**',
        ),
        namesWhereMinionsGetItWrong: agentOperatingRulesStatics.wallMinion.includes(
          'A dev server your parent started is where minions get this wrong. A URL that stops answering is `NEXT: rework`, because a restart makes it answer again.',
        ),
        wallIsWhatAFreshSessionHits: agentOperatingRulesStatics.wallMinion.includes(
          'Write `wall` only for what a FRESH session hits exactly as you did.',
        ),
      }).toStrictEqual({
        restartableIsRework: true,
        namesWhereMinionsGetItWrong: true,
        wallIsWhatAFreshSessionHits: true,
      });
    });

    it('VALID: {wallRole} => separates blocked from partial and demands a blockedReason', () => {
      expect({
        partialSpawnsTheSameFailure: agentOperatingRulesStatics.wallRole.includes(
          'Costs a pt-chain attempt. Spawns exactly the successor that will fail the same way.',
        ),
        blockedReasonShape: agentOperatingRulesStatics.wallRole.includes(
          'Include a `blockedReason` that names the wall AND what the user must change',
        ),
        freshSessionTest: agentOperatingRulesStatics.wallRole.includes(
          '"No session of my role could pass" is a claim about a FRESH session.',
        ),
      }).toStrictEqual({
        partialSpawnsTheSameFailure: true,
        blockedReasonShape: true,
        freshSessionTest: true,
      });
    });

    it('VALID: {wallRole, wallMinion} => both carry the denied-command definition of a wall', () => {
      const DENIED_COMMAND =
        "A command outside the project's permission allowlist comes back `This command requires approval`. It is DENIED outright.";

      expect({
        role: agentOperatingRulesStatics.wallRole.includes(DENIED_COMMAND),
        minion: agentOperatingRulesStatics.wallMinion.includes(DENIED_COMMAND),
      }).toStrictEqual({ role: true, minion: true });
    });
  });

  // Both work-item closes exist because `signal-back` refuses EVERY outcome while the tree is
  // dirty, `blocked` included. They differ on who did the work: a spiritmender commits its own, and
  // an operator cannot see what is sitting there.
  describe('the tree-clean close differs by who did the work', () => {
    it('VALID: {treeCleanRole} => tells a file-changing role to land its own work in git first', () => {
      expect({
        landsItsOwn: agentOperatingRulesStatics.treeCleanRole.includes(
          'Land whatever you finished in git first, exactly as you would for `partial`',
        ),
        refusesWhileDirty: agentOperatingRulesStatics.treeCleanRole.includes(
          '`signal-back` refuses every outcome while the tree is dirty',
        ),
      }).toStrictEqual({ landsItsOwn: true, refusesWhileDirty: true });
    });

    it('VALID: {treeCleanOperator} => says the minions committed, and that you never clear the tree by committing', () => {
      expect({
        minionsCommitted: agentOperatingRulesStatics.treeCleanOperator.includes(
          'The tree should already be clean when you signal, because your minions commit their own work',
        ),
        blockedIncluded: agentOperatingRulesStatics.treeCleanOperator.includes(
          'refuses every outcome while the tree is dirty, `blocked` included',
        ),
        notByCommitting: agentOperatingRulesStatics.treeCleanOperator.includes(
          '**Never clear one by committing.** You cannot see what is sitting there.',
        ),
      }).toStrictEqual({ minionsCommitted: true, blockedIncluded: true, notByCommitting: true });
    });
  });
});
