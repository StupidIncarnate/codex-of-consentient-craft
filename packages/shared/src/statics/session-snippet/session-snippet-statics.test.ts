import { sessionSnippetStatics } from './session-snippet-statics';

const MAX_SNIPPET_BYTES = 2048;

describe('sessionSnippetStatics', () => {
  const staticEntries = Object.entries(sessionSnippetStatics).filter(([, value]) => value !== null);

  const dynamicEntries = Object.entries(sessionSnippetStatics).filter(
    ([, value]) => value === null,
  );

  it('VALID: exported value => has at least one static snippet', () => {
    expect(staticEntries.length).toBeGreaterThan(0);
  });

  it.each(staticEntries)(
    'VALID: snippet "%s" => is a non-empty string under 2048 bytes',
    (_key, value) => {
      expect(String(value).length).toBeGreaterThan(0);
      expect(Buffer.byteLength(String(value), 'utf8')).toBeLessThanOrEqual(MAX_SNIPPET_BYTES);
    },
  );

  it.each(dynamicEntries)(
    'VALID: dynamic snippet "%s" => value is null (generated at runtime)',
    (_key, value) => {
      expect(value).toBe(null);
    },
  );

  it('VALID: wardDiscipline snippet => splits FULL-run ownership by dispatch surface', () => {
    expect(sessionSnippetStatics.wardDiscipline).toMatch(
      /^\*\*Who owns a FULL run\.\*\* An agent working directly for the user makes a full `npm run ward` exit 0 and owns every failure in it, including ones it did not cause\. An orchestrator-dispatched role never runs the full sweep; its Operating Rules name its rung, and the dispatcher's own `run-ward` item is the regression pass\.$/mu,
    );
  });

  // A BARE WARD HAS TWO TRIGGERS AND THE SECOND ONE KEPT GOING MISSING. Stating only the merge case
  // leaves a session asked outright for a full run reading its own instructions as a refusal. The
  // ownership paragraph above names NEITHER trigger, deliberately: it answers WHO, this answers
  // WHEN, and two paragraphs answering when is how the two drifted apart in the first place.
  it('VALID: wardDiscipline snippet => gives a bare ward both of its triggers and keeps them in one place', () => {
    expect({
      bothTriggers: sessionSnippetStatics.wardDiscipline.includes(
        'Run a bare `npm run ward` before a merge into the default branch, or when the user asks for one.',
      ),
      ownershipNamesNoTrigger:
        sessionSnippetStatics.wardDiscipline.indexOf('exit 0 before a merge'),
    }).toStrictEqual({
      bothTriggers: true,
      ownershipNamesNoTrigger: -1,
    });
  });

  // WARD'S E2E CHECK DOES BUILD — it spawns the package's own `npm run build` into
  // `<pkg>/.ward/bundle/<hash>/`. What stays true is WHERE ward writes: never your source tree and
  // never your `dist`. The claim is pinned on that, so a snippet that goes back to promising ward
  // builds nothing fails here rather than sending a session looking for a bundle ward never left.
  // The clause HANDS OFF rather than ruling: `npm run ward` runs ward's own compiled binary, so
  // "never a step before ward" was false for a session editing ward itself. buildDiscipline owns
  // that case; a wardDiscipline that answers it again is two rules to keep in agreement.
  it('VALID: wardDiscipline snippet => scopes ward to the files given and hands the build question to buildDiscipline', () => {
    expect(sessionSnippetStatics.wardDiscipline).toMatch(
      /^\*\*Scope ward to the job\.\*\* Given specific files, run ward on those files and nothing wider: `npm run ward -- -- <files>`\..*Ward never emits into your source tree or your `dist`; a build is a separate command — see build-discipline\.$/mu,
    );
  });

  // A WARD RUN THAT CROSSES ITS TIMEOUT IS BACKGROUNDED BY THE HARNESS, AND THE CALL RETURNS NO
  // RESULT. Two claims cost real work here. One said a hook blocked that outright — "there is no
  // second mode and no output file anyone has to wait on" — so an agent meeting the real thing had
  // no rule and invented one: two reviewers on a quest sleep-polled the output file (`sleep 90`,
  // then `sleep 240`), 815 seconds of sleeps. The other promised a notification on exit, which a
  // final response cannot receive: a measured run under a headless `claude -p` child killed a
  // whole-repo ward mid-`e2e` while the session reported success. So this snippet points at
  // background-tasks and refuses the turn-ending branch by name, and both dead claims stay gone.
  it('VALID: wardDiscipline snippet => bans sleeping, and routes a backgrounded run to background-tasks', () => {
    expect({
      neverSleepNeverTail: sessionSnippetStatics.wardDiscipline.includes(
        '**Never `sleep` on a ward run, and never `tail` its output file.**',
      ),
      routesToBackgroundTasks: sessionSnippetStatics.wardDiscipline.includes(
        'background-tasks says what to do there, and it is never "end your turn"',
      ),
      dropsTheNotificationPromise: sessionSnippetStatics.wardDiscipline.indexOf(
        'it notifies you when the run exits',
      ),
      dropsTheOldFalsehood: sessionSnippetStatics.wardDiscipline.indexOf(
        'there is no second mode and no output file anyone has to wait on',
      ),
    }).toStrictEqual({
      neverSleepNeverTail: true,
      routesToBackgroundTasks: true,
      dropsTheNotificationPromise: -1,
      dropsTheOldFalsehood: -1,
    });
  });

  // BOTH BRANCHES ARE LOAD-BEARING, AND DROPPING EITHER DEADLOCKS SOMEBODY. A command whose RESULT
  // the agent needs routes to wait-and-poll. A long-lived process it is FINISHED with — a dev
  // server, a watcher, a siege lane — routes to kill-then-stop, because that kind never reports
  // anything but `running`, so a wait-only page would hold every lane-owning session open forever.
  it('VALID: backgroundTasks snippet => carries the wait branch, the kill branch, and the turn-ending ban', () => {
    expect({
      terminatesOnFinalResponse: sessionSnippetStatics.backgroundTasks.includes(
        '**Your final response TERMINATES every background command you own, and no notification can follow it.**',
      ),
      waitBranch: sessionSnippetStatics.backgroundTasks.includes('**Do not end your turn.**'),
      killBranch: sessionSnippetStatics.backgroundTasks.includes('**Kill it now**'),
      conditionNotGuess: sessionSnippetStatics.backgroundTasks.includes(
        '**Wait on a condition, never on a guess.**',
      ),
      helperIsSeparate: sessionSnippetStatics.backgroundTasks.includes(
        '**A HELPER is a different mechanic.**',
      ),
    }).toStrictEqual({
      terminatesOnFinalResponse: true,
      waitBranch: true,
      killBranch: true,
      conditionNotGuess: true,
      helperIsSeparate: true,
    });
  });

  // A BARE SWEEP IS THE WRONG PLACE TO FIND A RED, and `Run it ONCE` alone read as a ban on the fix
  // loop that finds one cheaply. Ward's typecheck is a per-package `tsc --noEmit` grading every file
  // in a package you touched whatever paths you pass, so `--uncommitted` reports the same type
  // errors a bare run would for that package; a bare run only adds packages you did not touch.
  // Measured on one guard file: the red took a 749-second sweep to surface and would have cost
  // another to confirm, against 12 seconds scoped to that file. The two rules are ONE paragraph
  // because splitting them is what let the ban and the loop contradict each other.
  it('VALID: wardDiscipline snippet => sends the fix loop to --uncommitted and the bare run last', () => {
    expect({
      oneParagraph: sessionSnippetStatics.wardDiscipline.includes(
        '**Run it ONCE per tree state, and fix on `--uncommitted`.**',
      ),
      iterateThenOneBareRun: sessionSnippetStatics.wardDiscipline.includes(
        'Iterate there to exit 0, THEN one bare run as the regression pass.',
      ),
      typecheckIsNeverScoped: sessionSnippetStatics.wardDiscipline.includes(
        '`tsc --noEmit` grades a touched package WHOLE whatever paths you pass',
      ),
    }).toStrictEqual({
      oneParagraph: true,
      iterateThenOneBareRun: true,
      typecheckIsNeverScoped: true,
    });
  });

  // THE FILE-SCOPED FORM IS THE ONE MOST SESSIONS ACTUALLY NEED, and it is the one a reader cannot
  // derive from the flags table: `-- <files>` with no `--only` lets ward decide which checks apply to
  // those paths, which is what a worker proving one chunk wants. The snippet runs within a handful of
  // bytes of its 2048 cap, so this example is the kind of line a later trim reaches for first.
  it('VALID: ward snippet => shows the multi-file scoped invocation and how to spell the paths', () => {
    expect({
      multiFileExample: sessionSnippetStatics.ward.includes(
        'npm run ward -- -- pkg/a.ts pkg/a.test.ts',
      ),
      wardPicksTheChecks: sessionSnippetStatics.ward.includes('ward picks the checks'),
      howToSpellThem: sessionSnippetStatics.ward.includes(
        'Pass every path you touched after `--`. Repo-relative, no `./`.',
      ),
      // This snippet is the REFERENCE — check types, flags, invocations. When a bare run is right is
      // a rule, so it belongs to ward-discipline, and stating it in both is what let this one keep
      // calling a bare run the pre-merge sweep after the rule grew a second trigger.
      routesBareRunToDiscipline: sessionSnippetStatics.ward.includes(
        'see ward-discipline before a bare run',
      ),
      claimsNoTriggerItself: sessionSnippetStatics.ward.indexOf('pre-merge sweep'),
    }).toStrictEqual({
      multiFileExample: true,
      wardPicksTheChecks: true,
      howToSpellThem: true,
      routesBareRunToDiscipline: true,
      claimsNoTriggerItself: -1,
    });
  });

  it('VALID: ward snippet => defers FULL-run ownership to the role rather than mandating green', () => {
    expect(sessionSnippetStatics.ward).toMatch(
      /^\*\*Zero tolerance:\*\* Never assume a failure is pre-existing — investigate and fix every one\. Whether a FULL run is yours to make green depends on your role; see ward-discipline\.$/mu,
    );
  });

  it('VALID: ward snippet => carries no unconditional "fully green" mandate to contradict a dispatched role', () => {
    expect(sessionSnippetStatics.ward.indexOf('Ward must be fully green')).toBe(-1);
  });

  // EACH RULE IS THE WHOLE SNIPPET WITHOUT THE OTHERS. A model handed only "keep comments to a
  // minimum" deletes the one comment that was carrying a decision; handed only "record the
  // decision" it writes a changelog. The bold leads are pinned individually so a reword that drops
  // one goes red here rather than in a consumer repo, where nothing measures it at all.
  it('VALID: commentDiscipline snippet => carries every rule and routes history to the plan document', () => {
    expect({
      historyToPlanDoc: sessionSnippetStatics.commentDiscipline.includes(
        '**History belongs in the plan document for the change, written as a before/after.**',
      ),
      neverInCommentOrInstructionFile: sessionSnippetStatics.commentDiscipline.includes(
        'Never a code comment, never an instruction file',
      ),
      minimum: sessionSnippetStatics.commentDiscipline.includes('**Keep comments to a minimum.**'),
      decisionAndState: sessionSnippetStatics.commentDiscipline.includes(
        'recording the DECISION and the STATE behind the code',
      ),
      neverReExplains: sessionSnippetStatics.commentDiscipline.includes(
        '**A comment never re-explains the file.**',
      ),
      noGrowingCounts: sessionSnippetStatics.commentDiscipline.includes(
        '**Never record a count of things that grow.**',
      ),
    }).toStrictEqual({
      historyToPlanDoc: true,
      neverInCommentOrInstructionFile: true,
      minimum: true,
      decisionAndState: true,
      neverReExplains: true,
      noGrowingCounts: true,
    });
  });

  // WITHOUT THE MEASUREMENT CARVE-OUT THE COUNT RULE READS AS "NO NUMBERS EVER", which strips the
  // error counts, byte sizes and durations that are the only checkable part of a finding. A tally
  // over a set goes false when someone adds to the set with nothing having gone wrong; a number
  // anchored to one observed run does not. The carve-out and the on-the-spot test that separates
  // the two are pinned alongside the bold lead, because the lead alone does not carry the
  // distinction and a reader who loses it deletes evidence.
  it('VALID: commentDiscipline snippet => spares a measurement from the ban on tallies', () => {
    expect({
      shapeNotTally: sessionSnippetStatics.commentDiscipline.includes(
        'Write the SHAPE, not the tally.',
      ),
      measurementIsEvidence: sessionSnippetStatics.commentDiscipline.includes(
        'A number recording what ONE run observed is evidence, not inventory',
      ),
      anchoredExamplesSurvive: sessionSnippetStatics.commentDiscipline.includes(
        'an error count from a named run, a byte size, a duration, a before/after delta',
      ),
      onTheSpotTest: sessionSnippetStatics.commentDiscipline.includes(
        'would it change if someone added a file tomorrow, nothing having gone wrong?',
      ),
      namingStaysFine: sessionSnippetStatics.commentDiscipline.includes(
        'Naming a specific file stays checkable; arithmetic over the set is what rots.',
      ),
      neverWriteTally: sessionSnippetStatics.commentDiscipline.includes(
        'Never write: "all thirteen build configs"',
      ),
    }).toStrictEqual({
      shapeNotTally: true,
      measurementIsEvidence: true,
      anchoredExamplesSurvive: true,
      onTheSpotTest: true,
      namingStaysFine: true,
      neverWriteTally: true,
    });
  });

  // IT SHIPS INTO EVERY REPO THE INSTALLER TOUCHES, so a name only this repo holds reads there as an
  // instruction about a package the reader cannot find.
  it('VALID: commentDiscipline snippet => names no repo-local package, path or role', () => {
    expect(
      /dungeonmaster|packages\/|scrolls\/|codeweaver|flowrider|siegemaster/iu.test(
        sessionSnippetStatics.commentDiscipline,
      ),
    ).toBe(false);
  });

  it('VALID: discover snippet => flags shell grep/find/sed as blocked and points to ToolSearch', () => {
    expect(sessionSnippetStatics.discover).toMatch(
      /^`discover` is the ONLY way to search this codebase\. Native Glob, Grep, Search, and Find tools — plus shell `grep`\/`find`\/`sed` — are blocked by hooks\. `discover` and `get-project-map` are MCP \*\*tools\*\*: load them via `ToolSearch`, never as shell commands or skills\.$/mu,
    );
  });

  // A BUILD IS THE ONE COMMAND THAT REACHES OUTSIDE THE AGENT RUNNING IT: it rewrites every
  // package's compiled output with no lock, so it breaks siblings rather than itself. The rule has
  // to arrive by snippet, because a dispatched sub-agent reads no root instruction file. It must
  // also say what to do INSTEAD — an agent told only "do not build" invents a reason it is exempt.
  it('VALID: buildDiscipline snippet => gives the build to one process and tells a dispatched agent to defer', () => {
    expect(sessionSnippetStatics.buildDiscipline).toMatch(
      /^\*\*Only one process builds at a time, and a dispatched agent is never it\.\*\*.*Do not build\. Report that a build is needed and let the coordinator run it\.$/mu,
    );
  });

  // THE WARD ROW IS THE CASE THE OLD WORDING GOT WRONG. `npm run ward` invokes ward's own compiled
  // binary, so a session editing ward's source and then running it grades the previous build — and
  // every other surface said a build is never a step before ward. The row is the correction; drop
  // it and the contradiction comes back.
  it('VALID: buildDiscipline snippet => carries the ward-source row, the no-build-before-checks rule and the stale-tree command', () => {
    expect({
      wardOwnSourceRow: sessionSnippetStatics.buildDiscipline.includes(
        "| ward itself, having edited ward's own source | that package |",
      ),
      sourceChecksNeedNone: sessionSnippetStatics.buildDiscipline.includes(
        '**Nothing that reads source needs one.**',
      ),
      rebuildIsNotADiagnosis: sessionSnippetStatics.buildDiscipline.includes(
        '"rebuild, then re-run the check" is not a diagnosis',
      ),
      staleTreeNeedsClean: sessionSnippetStatics.buildDiscipline.includes(
        'A stale or cold tree needs `build:clean`',
      ),
    }).toStrictEqual({
      wardOwnSourceRow: true,
      sourceChecksNeedNone: true,
      rebuildIsNotADiagnosis: true,
      staleTreeNeedsClean: true,
    });
  });

  // THE HOOK REFUSES CLAUDE CODE'S OWN WORKTREE COMMAND WITH EXIT 2 AND A MESSAGE. A session that
  // never learned why reads that as an obstacle and hand-assembles `git worktree add` instead,
  // producing a tree with no `node_modules` and no binaries — where ward cannot start and the
  // failure looks like a broken repo. The tool call and the rebuild ban both have to arrive before
  // the refusal does, which is what makes this a snippet rather than a line in one repo's
  // instruction file.
  it('VALID: worktrees snippet => names the one tool, bans the in-place native rebuild, and warns that resolution escapes', () => {
    expect({
      theOneTool: sessionSnippetStatics.worktrees.includes(
        '**One tool makes a worktree: `mcp__dungeonmaster__create-worktree({ name })`.**',
      ),
      neverRecompileInside: sessionSnippetStatics.worktrees.includes(
        '**Never recompile a native module inside a worktree.**',
      ),
      rebuildInTheMainCheckout: sessionSnippetStatics.worktrees.includes(
        'Rebuild in the main checkout instead',
      ),
      notHermetic: sessionSnippetStatics.worktrees.includes(
        '**A worktree is NOT hermetic, and that fakes experiments.**',
      ),
      // The rule is about ANY native module. Naming one package sends a reader looking for that
      // package, and every repo installing dungeonmaster has a different set.
      namesNoOnePackage: sessionSnippetStatics.worktrees.indexOf('node-pty'),
    }).toStrictEqual({
      theOneTool: true,
      neverRecompileInside: true,
      rebuildInTheMainCheckout: true,
      notHermetic: true,
      namesNoOnePackage: -1,
    });
  });

  // A HAND-EDIT TO A GENERATED FILE SURVIVES UNTIL THE NEXT `dungeonmaster init` AND THEN VANISHES,
  // which reads as the harness undoing work rather than as the install doing its job. The owner
  // table is the actionable half: without it a session that accepts "edit the generator" still has
  // to find which package generates the entry, and guesses.
  it('VALID: generatedConfig snippet => bans the hand-edit, routes to the generator, and keeps the ungenerated case', () => {
    expect({
      bansTheHandEdit: sessionSnippetStatics.generatedConfig.includes(
        '**Never hand-edit `.claude/settings.json`, `.claude/settings.local.json`, `.mcp.json`, or any `.env*` file.**',
      ),
      routesToTheGenerator: sessionSnippetStatics.generatedConfig.includes(
        '**To change a generated entry, change the code that generates it, then re-run `dungeonmaster init`.**',
      ),
      namesTheHooksOwner: sessionSnippetStatics.generatedConfig.includes(
        '`WorktreeCreate` | `@dungeonmaster/hooks` |',
      ),
      ungeneratedGoesToTheUser: sessionSnippetStatics.generatedConfig.includes(
        'write up the cause and the exact one-line diff and ask the user to apply it',
      ),
    }).toStrictEqual({
      bansTheHandEdit: true,
      routesToTheGenerator: true,
      namesTheHooksOwner: true,
      ungeneratedGoesToTheUser: true,
    });
  });
});
