import { pathseekerDedupMinionStatics } from './pathseeker-dedup-minion-statics';

describe('pathseekerDedupMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerDedupMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  describe('prompt.template content', () => {
    it('VALID: template => declares contract-dedup role in opening paragraph', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^You are a pathseeker-dedup agent\. PathSeeker summoned you \(via the Agent tool\) after every pathseeker-surface agent finished, to scan the quest's contracts\[\] for cross-slice near-duplicates and in-package pre-existing matches, then collapse them directly via modify-quest\. You run ONCE — no retry loop, no second pass\. The pathseeker-surface agents wrote their slices in parallel before you were dispatched; you are the first pass that sees the WHOLE contracts\[\] graph and reconciles drift the literal name-equality validator missed\.$/mu,
      );
    });

    it('VALID: template => declares it has no work item and returns a final message instead of signal-back', () => {
      const needle = '**You are a sub-agent with NO work item of your own.**';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints section opens with Scope bucket', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(/^\*\*Scope:\*\*$/mu);
    });

    it('VALID: template => Scope bullet forbids Edit/Write/NotebookEdit against packages', () => {
      const needle =
        '- **Read-only on the codebase.** Edit, Write, and NotebookEdit are forbidden against `packages/**`.';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet enforces single-pass discipline', () => {
      const needle = '- **Single-pass discipline.** You run exactly once during seek_synth,';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet declares Quest ID arrives via $ARGUMENTS', () => {
      const needle = '- **Receives Quest ID via `$ARGUMENTS`.**';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet forbids redundant doc citations', () => {
      const needle = '- **Do NOT redundantly cite docs.**';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet forbids touching assertion text', () => {
      const needle = '- **Do NOT touch assertion text.**';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => declares modify-quest authority over steps[] and contracts[]', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^\*\*modify-quest authority:\*\*$/mu,
      );
    });

    it('VALID: template => Pre-commit checklist section header present', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^\*\*Pre-commit checklist \(validators run on every modify-quest call\):\*\*$/mu,
      );
    });

    it('VALID: template => Workflow section header present', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(/^## Workflow$/mu);
    });

    it('VALID: template => Step 1 loads quest at implementation stage', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 1: Load the Quest at Implementation Stage$/mu,
      );
    });

    it('VALID: template => Step 2 loads project standards in parallel', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 2: Load Project Standards in Parallel$/mu,
      );
    });

    it('VALID: template => Step 3 cross-slice near-duplicate scan', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 3: Cross-Slice Near-Duplicate Scan$/mu,
      );
    });

    it('VALID: template => Step 4 in-package similar-contract scan', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 4: In-Package Similar-Contract Scan$/mu,
      );
    });

    it('VALID: template => Step 4 cites get-project-inventory as the canonical enumeration', () => {
      const needle = 'Call `get-project-inventory({ packageName })` for that package.';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 4 explains why inventory beats discover globs for naming variants', () => {
      const needle = '**Why inventory and not `discover` globs:**';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 5 applies merges and reuse via modify-quest', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 5: Apply Merges and Reuse via modify-quest$/mu,
      );
    });

    it('VALID: template => Step 5 documents the _delete: true upsert flag for collapsing duplicates', () => {
      const needle = 'Drop the duplicate via `{ id: <loser-id>, _delete: true }`';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 5 teaches partial-patch shape and warns against full-step regeneration', () => {
      const needle = '**Use partial-patch shape on every step and contract you touch.**';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 6 leaves ambiguous cases in place and surfaces them', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 6: Ambiguous Cases — Leave Them, Surface Them$/mu,
      );
    });

    it('VALID: template => Step 7 returns final message', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(
        /^### Step 7: Return Your Final Message$/mu,
      );
    });

    it('VALID: template => Step 7 contains the canonical complete final-message summary format', () => {
      const needle =
        'COMPLETE: Contract-dedup: {N} cross-slice merges, {M} in-package reuses applied. Ambiguous: [list pairs with one-line reason each, or "none"].';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 7 describes failedChecks handling for modify-quest failure', () => {
      const needle =
        'If `modify-quest` returns `success: false` with a `failedChecks` array, your reconciliations never landed — do NOT report success.';
      const { template } = pathseekerDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Quest Context section header present', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(/^## Quest Context$/mu);
    });

    it('VALID: template => Quest Context section ends with $ARGUMENTS placeholder', () => {
      expect(pathseekerDedupMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
    });
  });
});
