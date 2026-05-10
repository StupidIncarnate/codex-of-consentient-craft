import { pathseekerContractDedupMinionStatics } from './pathseeker-contract-dedup-minion-statics';

describe('pathseekerContractDedupMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerContractDedupMinionStatics).toStrictEqual({
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
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^You are a Pathseeker Contract Dedup Minion\. Pathseeker has dispatched you during seek_synth Wave B \(after every surface-scope minion has finished writing its slice\) to scan the quest's contracts\[\] for cross-slice near-duplicates and in-package pre-existing matches, then collapse them directly via modify-quest\. You run ONCE per seek_synth — no retry loop, no second pass\. Surface-scope minions wrote their slices in parallel during seek_synth Wave A; you are the first pass that sees the WHOLE contracts\[\] graph and reconciles drift the literal name-equality validator missed\.$/mu,
      );
    });

    it('VALID: template => Constraints section opens with Scope bucket', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(/^\*\*Scope:\*\*$/mu);
    });

    it('VALID: template => Scope bullet forbids Edit/Write/NotebookEdit against packages', () => {
      const needle =
        '- **Read-only on the codebase.** Edit, Write, and NotebookEdit are forbidden against `packages/**`.';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet enforces single-pass discipline', () => {
      const needle = '- **Single-pass discipline.** You run exactly once during seek_synth,';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet declares Quest ID arrives via $ARGUMENTS', () => {
      const needle = '- **Receives Quest ID via `$ARGUMENTS`.**';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet forbids redundant doc citations', () => {
      const needle = '- **Do NOT redundantly cite docs.**';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Scope bullet forbids touching assertion text', () => {
      const needle = '- **Do NOT touch assertion text.**';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => declares modify-quest authority over steps[] and contracts[]', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^\*\*modify-quest authority:\*\*$/mu,
      );
    });

    it('VALID: template => Pre-commit checklist section header present', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^\*\*Pre-commit checklist \(validators run on every modify-quest call\):\*\*$/mu,
      );
    });

    it('VALID: template => Workflow section header present', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(/^## Workflow$/mu);
    });

    it('VALID: template => Step 1 loads quest at implementation stage', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 1: Load the Quest at Implementation Stage$/mu,
      );
    });

    it('VALID: template => Step 2 loads project standards in parallel', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 2: Load Project Standards in Parallel$/mu,
      );
    });

    it('VALID: template => Step 3 cross-slice near-duplicate scan', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 3: Cross-Slice Near-Duplicate Scan$/mu,
      );
    });

    it('VALID: template => Step 4 in-package similar-contract scan', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 4: In-Package Similar-Contract Scan$/mu,
      );
    });

    it('VALID: template => Step 4 cites get-project-inventory as the canonical enumeration', () => {
      const needle = 'Call `get-project-inventory({ packageName })` for that package.';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 4 explains why inventory beats discover globs for naming variants', () => {
      const needle = '**Why inventory and not `discover` globs:**';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 5 applies merges and reuse via modify-quest', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 5: Apply Merges and Reuse via modify-quest$/mu,
      );
    });

    it('VALID: template => Step 5 documents the _delete: true upsert flag for collapsing duplicates', () => {
      const needle = 'Drop the duplicate via `{ name: loserName, _delete: true }`';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 6 leaves ambiguous cases in place and surfaces them', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 6: Ambiguous Cases — Leave Them, Surface Them$/mu,
      );
    });

    it('VALID: template => Step 7 signal back', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(
        /^### Step 7: Signal Back$/mu,
      );
    });

    it('VALID: template => Step 7 contains the canonical complete-signal summary format', () => {
      const needle =
        'summary: \'Contract-dedup: {N} cross-slice merges, {M} in-package reuses applied. Ambiguous: [list pairs with one-line reason each, or "none"].\'';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 7 describes failedChecks handling for modify-quest failure', () => {
      const needle =
        'If `modify-quest` returns `success: false` with a `failedChecks` array, DO NOT signal `complete`.';
      const { template } = pathseekerContractDedupMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Quest Context section header present', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(/^## Quest Context$/mu);
    });

    it('VALID: template => Quest Context section ends with $ARGUMENTS placeholder', () => {
      expect(pathseekerContractDedupMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
    });
  });
});
