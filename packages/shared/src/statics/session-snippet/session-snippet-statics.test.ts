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

  // A WARD RUN THAT CROSSES ITS TIMEOUT IS BACKGROUNDED BY THE HARNESS, AND THE HARNESS NOTIFIES.
  // The old wording claimed a hook blocked that outright — "there is no second mode and no output
  // file anyone has to wait on" — so an agent that hit the real thing had no rule covering it and
  // invented one. Two reviewers on one quest sleep-polled the output file (`sleep 90`, then
  // `sleep 240`), 815 seconds of sleeps in total. The ban on ENDING a turn to wait still holds: a
  // notification cannot follow a final response.
  it('VALID: wardDiscipline snippet => bans sleeping on a ward run and names the exit notification', () => {
    expect({
      neverSleepNeverTail: sessionSnippetStatics.wardDiscipline.includes(
        '**Never `sleep` on a ward run, and never `tail` its output file.**',
      ),
      notifiesOnExit: sessionSnippetStatics.wardDiscipline.includes(
        'it notifies you when the run exits',
      ),
      dropsTheOldFalsehood: sessionSnippetStatics.wardDiscipline.indexOf(
        'there is no second mode and no output file anyone has to wait on',
      ),
    }).toStrictEqual({
      neverSleepNeverTail: true,
      notifiesOnExit: true,
      dropsTheOldFalsehood: -1,
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
});
