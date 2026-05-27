import { pathseekerAssertionCorrectnessStatics } from './pathseeker-assertion-correctness-statics';

describe('pathseekerAssertionCorrectnessStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerAssertionCorrectnessStatics).toStrictEqual({
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
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^You are the pathseeker-assertion-correctness agent\. The orchestrator monitor dispatched you after every pathseeker-surface agent finished, in parallel with the pathseeker-dedup agent\. Your job is ONE pass of assertion cleanup across every step in the quest: catch channel-discipline drift, weak clause-mappings, paraphrased banned matchers, and per-prefix `field` mistakes — and fix the confident cases directly via `modify-quest`\.$/mu,
      );
    });

    it('VALID: template => Constraints section opens with Scope bucket', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(/^\*\*Scope:\*\*$/mu);
    });

    it('VALID: template => Scope bullet forbids Edit/Write/NotebookEdit against packages/**', () => {
      const needle =
        '- **Read-only on the codebase.** Edit, Write, and NotebookEdit are forbidden against `packages/**`. Your only writes are `modify-quest` calls that patch steps with assertion fixes.';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet enforces single-pass discipline', () => {
      const needle =
        '- **Single-pass discipline.** You run exactly ONE pass during seek_synth Wave B. There is no retry loop.';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet instructs to leave ambiguous fixes in place', () => {
      const needle =
        '- **Confident fixes only.** If a rewrite is plausible but you are not sure the new text preserves the original intent, LEAVE THE ASSERTION IN PLACE';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => doc-redundancy rule forbids reminding codeweaver of documented standards', () => {
      const needle =
        '**Doc-redundancy rule.** Codeweaver reads CLAUDE.md, `get-architecture`, `get-testing-patterns`, and `get-syntax-rules` itself.';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Workflow section header is present', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(/^## Workflow$/mu);
    });

    it('VALID: template => Step 1 header loads implementation + spec-obs in parallel', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 1: Load Quest Data \(Implementation \+ Spec-Obs\)$/mu,
      );
    });

    it('VALID: template => Step 2 header loads project standards', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 2: Load Project Standards$/mu,
      );
    });

    it('VALID: template => Step 3 header walks four issue classes on assertions[]', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 3: Walk Every Step's assertions\[\] — Four Issue Classes$/mu,
      );
    });

    it('VALID: template => Step 3 has (a) channel discipline subsection', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^#### \(a\) Channel discipline — assertion vs instruction$/mu,
      );
    });

    it('VALID: template => Step 3 has (b) clause-mapping subsection', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^#### \(b\) Clause-mapping depth — does the assertion exercise the claimed observable's then\[\]\?$/mu,
      );
    });

    it('VALID: template => Step 3 has (c) paraphrased banned matchers subsection', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^#### \(c\) Paraphrased banned matchers$/mu,
      );
    });

    it('VALID: template => Step 3 has (d) per-prefix field correctness subsection', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^#### \(d\) Per-prefix `field` correctness$/mu,
      );
    });

    it('VALID: template => clause-mapping subsection calls out lexical-only matches as common drift', () => {
      const needle = 'The most common drift is a **lexical-only match**';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => paraphrased matchers subsection lists "approximately equals"', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^- "approximately equals"$/mu,
      );
    });

    it('VALID: template => paraphrased matchers subsection lists "matches the structure of"', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^- "matches the structure of"$/mu,
      );
    });

    it('VALID: template => per-prefix field table lists VALID as forbidden', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^\| VALID \| forbidden \|$/mu,
      );
    });

    it('VALID: template => per-prefix field table lists INVALID as required', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^\| INVALID \| required \|$/mu,
      );
    });

    it('VALID: template => Step 4 header applies confident fixes via modify-quest', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 4: Apply Confident Fixes Directly via modify-quest$/mu,
      );
    });

    it('VALID: template => Step 4 forbids prescribing a specific jest matcher', () => {
      const needle =
        "**Paraphrased matchers:** rewrite the assertion's `input` and/or `expected` text to plain prose. Do NOT name a jest matcher.";
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 5 header instructs to leave ambiguous cases in place', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 5: Ambiguous Cases — Leave In Place, Flag for Pathseeker$/mu,
      );
    });

    it('VALID: template => Step 6 header handles modify-quest failure', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 6: Handle modify-quest Failure$/mu,
      );
    });

    it('VALID: template => Step 6 signal-back failed includes failedChecks verbatim', () => {
      const needle =
        "summary: 'BLOCKED: modify-quest rejected the assertion-correctness write. FAILED CHECKS: [paste failedChecks array verbatim].'";
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 7 header signals back ONCE', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(
        /^### Step 7: Signal Back ONCE$/mu,
      );
    });

    it('VALID: template => Step 7 complete signal summary names the four fix counts and Ambiguous list', () => {
      const needle =
        'summary: \'Assertion-correctness: {N} channel-drift moves, {M} clause-mapping strengthens, {P} paraphrase fixes, {Q} prefix corrections. Ambiguous: [list with one-line reason each, or "none"].\'';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Quest Context section header is present', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(/^## Quest Context$/mu);
    });

    it('VALID: template => Quest Context section ends with $ARGUMENTS placeholder', () => {
      expect(pathseekerAssertionCorrectnessStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
    });

    it('VALID: template => Step 4 teaches partial-patch shape and warns against full-step regeneration', () => {
      const needle =
        '**Use the partial-patch shape: send only the fields you changed (`assertions[]` and/or `instructions[]`), NOT the full step shape.**';
      const { template } = pathseekerAssertionCorrectnessStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });
  });
});
