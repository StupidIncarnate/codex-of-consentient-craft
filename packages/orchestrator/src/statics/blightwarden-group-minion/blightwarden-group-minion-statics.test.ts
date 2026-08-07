import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightwardenGroupMinionStatics } from './blightwarden-group-minion-statics';

describe('blightwardenGroupMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(blightwardenGroupMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => stays under the MCP tool-result verbatim-delivery ceiling', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    expect(template.length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: template => declares it is summoned by the Blightwarden parent in the opening line', () => {
    const needle =
      'You are a blightwarden-group-minion. The Blightwarden parent summoned you (via the Agent tool) to review and FIX ONE tight group of file pairs';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares it has no work item and returns an artifact instead of signal-back', () => {
    const needle = '**You are a sub-agent with NO work item of your own.**';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => loads all three project standards tools first (BLOCKING)', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const blocking = 'Load project standards FIRST (BLOCKING)';

    expect(
      template.slice(template.indexOf(blocking), template.indexOf(blocking) + blocking.length),
    ).toBe(blocking);

    const arch = 'get-architecture';

    expect(template.slice(template.indexOf(arch), template.indexOf(arch) + arch.length)).toBe(arch);

    const syntax = 'get-syntax-rules';

    expect(template.slice(template.indexOf(syntax), template.indexOf(syntax) + syntax.length)).toBe(
      syntax,
    );

    const testing = 'get-testing-patterns';

    expect(
      template.slice(template.indexOf(testing), template.indexOf(testing) + testing.length),
    ).toBe(testing);
  });

  it.each(['Concern: craft', 'Concern: perf', 'Concern: dedup', 'Concern: integrity'])(
    'VALID: template => %s section is present',
    (needle) => {
      const { template } = blightwardenGroupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    },
  );

  it.each(['Concern: coverage', 'Concern: security', 'Concern: dead-code'])(
    'VALID: template => %s carries no section — that concern is owned by another role',
    (needle) => {
      const { template } = blightwardenGroupMinionStatics.prompt;

      expect(template.indexOf(needle)).toBe(-1);
    },
  );

  it('VALID: template => craft is logic-vs-signature plus useful error context, with simplification moved out', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const logicVsSignature =
      '**Logic-vs-signature/contract correctness** — does the code do what the function name and signature promise?';

    expect(
      template.slice(
        template.indexOf(logicVsSignature),
        template.indexOf(logicVsSignature) + logicVsSignature.length,
      ),
    ).toBe(logicVsSignature);

    const errorContext =
      '**Useful error context** — are failures propagated with enough context to act on?';

    expect(
      template.slice(
        template.indexOf(errorContext),
        template.indexOf(errorContext) + errorContext.length,
      ),
    ).toBe(errorContext);

    const movedOut =
      'Simplification is NOT here — it moved to `perf`, because the same reading finds both.';

    expect(
      template.slice(template.indexOf(movedOut), template.indexOf(movedOut) + movedOut.length),
    ).toBe(movedOut);
  });

  it('VALID: template => craft reads the PURPOSE header against the body, because lint only checks it exists', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const opener =
      "**PURPOSE header vs body** — read every changed impl file's `PURPOSE:` line against the code beneath it.";

    expect(template.slice(template.indexOf(opener), template.indexOf(opener) + opener.length)).toBe(
      opener,
    );

    const lintGap =
      'Lint checks the header EXISTS, never that it is TRUE, and no test or typecheck reads a comment, so a header written before the body and never revisited is false in the same commit that wrote the code';

    expect(
      template.slice(template.indexOf(lintGap), template.indexOf(lintGap) + lintGap.length),
    ).toBe(lintGap);

    const discoverServes =
      "`discover --verbose` serves it as that file's primary description to every later reader";

    expect(
      template.slice(
        template.indexOf(discoverServes),
        template.indexOf(discoverServes) + discoverServes.length,
      ),
    ).toBe(discoverServes);
  });

  it.each([
    'a **return-shape claim the code contradicts** — "returns the parsed value or undefined on failure" over a function returning `{ ok: true, value } | { ok: false }`; the file\'s own `USAGE:` block often contradicts it two lines down.',
    'a **validation claim the contract does not make** — "validates any file path, absolute or relative" over a union requiring a `./` or `../` prefix. Read the zod chain, and what each `.refine()` actually tests rather than what its message says.',
    'a **claim derived from the NAME instead of the body** — a `functionNameExtractorTransformer` whose PURPOSE says "extracts a function name" while the body returns the kebab file stem.',
    'a **PURPOSE that only restates the signature** — a wasted line; `discover` already renders the signature beside it.',
  ])('VALID: template => craft names the false-PURPOSE shape: %s', (needle) => {
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => a false PURPOSE is fixed by correcting the comment, and derivable content is banned from it', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const fixRule =
      'Correct the PURPOSE to what the code does NOW; never change the code to match the comment unless the code is independently wrong on its own terms.';

    expect(
      template.slice(template.indexOf(fixRule), template.indexOf(fixRule) + fixRule.length),
    ).toBe(fixRule);

    const banRule =
      'A PURPOSE must not carry return shapes, throw behaviour, what a contract validates, or parameter types — all derivable, so all of it drifts. It carries why the file exists and when to reach for it over its nearest sibling.';

    expect(
      template.slice(template.indexOf(banRule), template.indexOf(banRule) + banRule.length),
    ).toBe(banRule);
  });

  it('VALID: template => perf carries simplification alongside quadratic, N+1, sync-I/O and unbounded work', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const opener =
      'Hot paths with accidentally quadratic work, N+1 query patterns, sync I/O inside async code, and unbounded work — plus logic that could simply be expressed more directly.';

    expect(template.slice(template.indexOf(opener), template.indexOf(opener) + opener.length)).toBe(
      opener,
    );

    const simplification =
      '**Simplification:** can the logic be expressed more directly? Unnecessary abstractions, premature generalization, a conditional chain that flattens to a single expression, a hand-rolled scan where a `Map`/`Set` lookup does the same work in one pass.';

    expect(
      template.slice(
        template.indexOf(simplification),
        template.indexOf(simplification) + simplification.length,
      ),
    ).toBe(simplification);

    const categories =
      'Categories: `quadratic-loop`, `n-plus-one`, `sync-io-in-async`, `unbounded-work`, `simplification`.';

    expect(
      template.slice(
        template.indexOf(categories),
        template.indexOf(categories) + categories.length,
      ),
    ).toBe(categories);
  });

  it('VALID: template => describes the duplicate-detection broker as string/regex literals only, with no AST or structural comparison', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const literalsOnly =
      "This codebase's duplication detector at `packages/tooling/src/brokers/duplicate-detection/` finds duplicate **string and regex literals ONLY**: `typescriptParseAdapter` collects literal values per file, the broker merges them into one `Map<LiteralValue, LiteralOccurrence[]>`, reports every value occurring at or above an occurrence threshold, and classifies each as `'regex'` or `'string'`.";

    expect(
      template.slice(
        template.indexOf(literalsOnly),
        template.indexOf(literalsOnly) + literalsOnly.length,
      ),
    ).toBe(literalsOnly);

    const noStructural =
      'It does NO AST-shape comparison and no structural comparison of any kind, so it can neither confirm nor refute that two functions do the same work under different names';

    expect(
      template.slice(
        template.indexOf(noStructural),
        template.indexOf(noStructural) + noStructural.length,
      ),
    ).toBe(noStructural);

    const showYourWork =
      '**Structural and near-duplicate logic is a judgement YOU make, and you must show your work for it:**';

    expect(
      template.slice(
        template.indexOf(showYourWork),
        template.indexOf(showYourWork) + showYourWork.length,
      ),
    ).toBe(showYourWork);
  });

  it('VALID: template => never calls the duplicate-detection broker an AST detector', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    expect(template.indexOf('literal/AST duplication detector')).toBe(-1);
    expect(template.indexOf('`ast-duplicate`')).toBe(-1);
  });

  it('VALID: template => integrity skips the signature sweep and keeps semantic drift plus papered-over breaks', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const skipSweep =
      '`ward(full)` and `tsc` already catch every consumer that stops COMPILING against a changed export, so **skip the signature sweep entirely**';

    expect(
      template.slice(template.indexOf(skipSweep), template.indexOf(skipSweep) + skipSweep.length),
    ).toBe(skipSweep);

    const meansDifferent =
      'What you own is the change that typechecks and still MEANS something different:';

    expect(
      template.slice(
        template.indexOf(meansDifferent),
        template.indexOf(meansDifferent) + meansDifferent.length,
      ),
    ).toBe(meansDifferent);

    const defaultSentence = 'a `.default(...)` that papers over a break may itself be wrong.';

    expect(
      template.slice(
        template.indexOf(defaultSentence),
        template.indexOf(defaultSentence) + defaultSentence.length,
      ),
    ).toBe(defaultSentence);
  });

  it('VALID: template => hands dead code to the whole-diff deadcode minion and says why a per-file pass cannot answer it', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    const heading = '#### Dead code is NOT one of your concerns';

    expect(
      template.slice(template.indexOf(heading), template.indexOf(heading) + heading.length),
    ).toBe(heading);

    const why =
      'a file cannot tell you whether its own export is imported anywhere, so no group-scoped pass can answer it';

    expect(template.slice(template.indexOf(why), template.indexOf(why) + why.length)).toBe(why);

    const owner =
      'A dedicated `blightwarden-deadcode-minion` runs alone over the whole diff once every group has returned.';

    expect(template.slice(template.indexOf(owner), template.indexOf(owner) + owner.length)).toBe(
      owner,
    );
  });

  it('VALID: template => may use Edit/Write to fix violations in place', () => {
    const needle = 'You MAY use Edit/Write — fixing the violations you find IS your job.';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => narrows fix authority: hand up architectural fixes, cross-group work, and product decisions', () => {
    const needle =
      'Hand up architectural fixes, anything crossing groups, and anything needing a product decision';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => records each disposition as it goes, not batched to the end', () => {
    const needle =
      'Record as you go, do NOT batch to the end — a session that dies at pair four loses every disposition it earned';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => every disposition clears a unit, including gap and recorded', () => {
    const needle =
      'Every disposition clears a unit — `gap` (the concern cannot be assessed at this layer, with a stated reason) and `recorded` (a real finding handed to a named owner) included. The completion gate refuses absence, not honesty';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => the disposition write is a modify-quest call against planningNotes.blightLedger', () => {
    const needle = "modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: [";
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => has a "What you return" distilled-artifact section', () => {
    expect(blightwardenGroupMinionStatics.prompt.template).toMatch(
      /^## What you return \(the distilled artifact, NOT a transcript\)$/mu,
    );
  });

  it('VALID: template => Briefing section ends with $ARGUMENTS placeholder', () => {
    expect(blightwardenGroupMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
  });

  it('VALID: template => loads discover + project-map/inventory/quest in the same first ToolSearch batch as the standards tools', () => {
    const needle =
      "in the SAME first `ToolSearch` batch as the standards tools above, so you don't pay a second `ToolSearch` round-trip later.";
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => ward paths must be explicit files, never a bare directory scope', () => {
    const needle =
      'a directory scope pulls in the whole package, runs long, and gets auto-backgrounded, stranding you with no wakeup.';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => an unfixable finding is carried forward via the parent partial continuation, not a failure signal', () => {
    const needle =
      'The parent decides whether to fix it itself or carry it forward in its commit handoff for the `partial` continuation.';
    const { template } = blightwardenGroupMinionStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no lawbringer mention (the fold is complete)', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    expect(template.indexOf('lawbringer')).toBe(-1);
    expect(template.indexOf('Lawbringer')).toBe(-1);
  });

  it('VALID: template => the report-only tool restriction from the source minions did not survive the fold', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    expect(template.indexOf('MUST NOT use Edit, Write')).toBe(-1);
  });

  it('VALID: template => carries no stale planning-model or legacy-signal references', () => {
    const { template } = blightwardenGroupMinionStatics.prompt;

    expect(template.indexOf('PathSeeker')).toBe(-1);
    expect(template.indexOf('pathseeker')).toBe(-1);
    expect(template.indexOf('failed-replan')).toBe(-1);
    expect(template.indexOf('signal `failed`')).toBe(-1);
  });

  describe('git prohibition', () => {
    it('VALID: template => forbids git for ANY purpose, read or write', () => {
      const needle = '**Never run `git` — for ANY purpose, read or write.**';
      const { template } = blightwardenGroupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => the git ban is not phrased as an absolute followed only by write verbs', () => {
      const { template } = blightwardenGroupMinionStatics.prompt;

      expect(
        template.indexOf(
          '**Never run `git` at all — no `commit`, no `add`, no `stash`, no `checkout`, no `reset`.**',
        ),
      ).toBe(-1);
    });

    it('VALID: template => never orders a default-branch diff for scope', () => {
      const { template } = blightwardenGroupMinionStatics.prompt;

      expect(template.indexOf('git diff <main-or-master>...HEAD --name-only')).toBe(-1);
    });
  });

  describe('minion operating rules', () => {
    it('VALID: template => embeds the minion rules variant, which forbids signal-back', () => {
      const needle =
        '**1. NEVER call `signal-back` — your final message IS your terminal action.**';
      const { template } = blightwardenGroupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => carries no "ALWAYS call signal-back" mandate contradicting its no-work-item role', () => {
      const { template } = blightwardenGroupMinionStatics.prompt;

      expect(template.indexOf('ALWAYS call `signal-back`')).toBe(-1);
    });
  });
});
