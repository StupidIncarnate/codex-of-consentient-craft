import { pathseekerAssertionCorrectnessMinionStatics } from './pathseeker-assertion-correctness-minion-statics';

describe('pathseekerAssertionCorrectnessMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerAssertionCorrectnessMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  describe('prompt.template content', () => {
    it('VALID: template => declares assertion-cleanup role in opening line', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^You are the Pathseeker Assertion Correctness Minion\. Pathseeker has dispatched you during seek_synth Wave B \(after every surface-scope minion has finished writing its slice\) in parallel with the contract-dedup-minion\. Both cleanup minions run in Wave B; both wait for Wave A surface-scope minions to fully complete before dispatch\. Your job is ONE pass of assertion cleanup across every step in the quest: catch channel-discipline drift, weak clause-mappings, paraphrased banned matchers, and per-prefix `field` mistakes — and fix the confident cases directly via `modify-quest`\.$/mu,
      );
    });

    it('VALID: template => Constraints section opens with Scope bucket', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^\*\*Scope:\*\*$/mu,
      );
    });

    it('VALID: template => Scope bullet forbids Edit/Write/NotebookEdit against packages/**', () => {
      const needle =
        '- **Read-only on the codebase.** Edit, Write, and NotebookEdit are forbidden against `packages/**`. Your only writes are `modify-quest` calls that patch steps with assertion fixes.';
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet enforces single-pass discipline', () => {
      const needle =
        '- **Single-pass discipline.** You run exactly ONE pass during seek_synth Wave B. There is no retry loop.';
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet instructs to leave ambiguous fixes in place', () => {
      const needle =
        '- **Confident fixes only.** If a rewrite is plausible but you are not sure the new text preserves the original intent, LEAVE THE ASSERTION IN PLACE';
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => doc-redundancy rule forbids reminding codeweaver of documented standards', () => {
      const needle =
        '**Doc-redundancy rule.** Codeweaver reads CLAUDE.md, `get-architecture`, `get-testing-patterns`, and `get-syntax-rules` itself.';
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Workflow section header is present', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^## Workflow$/mu,
      );
    });

    it('VALID: template => Step 1 header loads implementation + spec-obs in parallel', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 1: Load Quest Data \(Implementation \+ Spec-Obs\)$/mu,
      );
    });

    it('VALID: template => Step 2 header loads project standards', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 2: Load Project Standards$/mu,
      );
    });

    it('VALID: template => Step 3 header walks four issue classes on assertions[]', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 3: Walk Every Step's assertions\[\] — Four Issue Classes$/mu,
      );
    });

    it('VALID: template => Step 3 has (a) channel discipline subsection', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^#### \(a\) Channel discipline — assertion vs instruction$/mu,
      );
    });

    it('VALID: template => Step 3 has (b) clause-mapping subsection', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^#### \(b\) Clause-mapping depth — does the assertion exercise the claimed observable's then\[\]\?$/mu,
      );
    });

    it('VALID: template => Step 3 has (c) paraphrased banned matchers subsection', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^#### \(c\) Paraphrased banned matchers$/mu,
      );
    });

    it('VALID: template => Step 3 has (d) per-prefix field correctness subsection', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^#### \(d\) Per-prefix `field` correctness$/mu,
      );
    });

    it('VALID: template => clause-mapping subsection calls out lexical-only matches as common drift', () => {
      const needle = 'The most common drift is a **lexical-only match**';
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => paraphrased matchers subsection lists "approximately equals"', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^- "approximately equals"$/mu,
      );
    });

    it('VALID: template => paraphrased matchers subsection lists "matches the structure of"', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^- "matches the structure of"$/mu,
      );
    });

    it('VALID: template => per-prefix field table lists VALID as forbidden', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^\| VALID \| forbidden \|$/mu,
      );
    });

    it('VALID: template => per-prefix field table lists INVALID as required', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^\| INVALID \| required \|$/mu,
      );
    });

    it('VALID: template => Step 4 header applies confident fixes via modify-quest', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 4: Apply Confident Fixes Directly via modify-quest$/mu,
      );
    });

    it('VALID: template => Step 4 forbids prescribing a specific jest matcher', () => {
      const needle =
        "**Paraphrased matchers:** rewrite the assertion's `input` and/or `expected` text to plain prose. Do NOT name a jest matcher.";
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 5 header instructs to leave ambiguous cases in place', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 5: Ambiguous Cases — Leave In Place, Flag for Pathseeker$/mu,
      );
    });

    it('VALID: template => Step 6 header handles modify-quest failure', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 6: Handle modify-quest Failure$/mu,
      );
    });

    it('VALID: template => Step 6 signal-back failed includes failedChecks verbatim', () => {
      const needle =
        "summary: 'BLOCKED: modify-quest rejected the assertion-correctness write. FAILED CHECKS: [paste failedChecks array verbatim].'";
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 7 header signals back ONCE', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^### Step 7: Signal Back ONCE$/mu,
      );
    });

    it('VALID: template => Step 7 complete signal summary names the four fix counts and Ambiguous list', () => {
      const needle =
        'summary: \'Assertion-correctness: {N} channel-drift moves, {M} clause-mapping strengthens, {P} paraphrase fixes, {Q} prefix corrections. Ambiguous: [list with one-line reason each, or "none"].\'';
      const { template } = pathseekerAssertionCorrectnessMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Quest Context section header is present', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^## Quest Context$/mu,
      );
    });

    it('VALID: template => Quest Context section ends with $ARGUMENTS placeholder', () => {
      expect(pathseekerAssertionCorrectnessMinionStatics.prompt.template).toMatch(
        /^\$ARGUMENTS$/mu,
      );
    });
  });
});
