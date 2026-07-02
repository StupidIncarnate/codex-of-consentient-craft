import { pathseekerSurfaceMinionStatics } from './pathseeker-surface-minion-statics';

describe('pathseekerSurfaceMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerSurfaceMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  describe('prompt.template content', () => {
    it('VALID: template => declares slice-authoritative deliverable in opening paragraph', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^You are a pathseeker-surface agent\. PathSeeker summoned you \(via the Agent tool\) with an assigned slice of a quest spec\. Your job is to commit the steps\[\] and contracts\[\] for your slice directly to the quest via modify-quest\. You are the authority for your slice's step shape — you write the steps yourself\.$/mu,
      );
    });

    it('VALID: template => declares it has no work item and returns a final message instead of signal-back', () => {
      const needle = '**You are a sub-agent with NO work item of your own.**';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints section opens with Scope bucket', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(/^\*\*Scope:\*\*$/mu);
    });

    it('VALID: template => Constraints/Scope bullet forbids cross-slice writes', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^- \*\*No cross-slice writes\.\*\* Do not set `dependsOn` entries that point at steps in other slices, and do not author step IDs outside your slice's prefix\. Pathseeker handles cross-slice DAG wiring during seek_walk\.$/mu,
      );
    });

    it('VALID: template => Step 8 header introduces Assertions vs Instructions section', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^### Step 8: Assertions vs Instructions — the Boundary$/mu,
      );
    });

    it('VALID: template => Step 8 contains the GOOD behavioral assertion example header', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^GOOD assertion \(behavioral, compiles to expect\(\)\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the GOOD negative behavioral assertion example header', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^GOOD assertion \(negative behavioral\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the BAD editorial assertion example header', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^BAD assertion \(editorial — move to instructions\[\]\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the BAD code-prescription assertion example header', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^BAD assertion \(code prescription — move to instructions\[\]\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the BAD file-shape-prescription assertion example header', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^BAD assertion \(file-shape prescription\):$/mu,
      );
    });

    it('VALID: template => Step 12 header introduces Contract Dedup Reconciliation section', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^### Step 12: Contract Dedup Reconciliation$/mu,
      );
    });

    it('VALID: template => Step 12 names the dedup validator that triggers reconciliation', () => {
      const needle =
        'If your modify-quest call returns `success: false` with a failedCheck of name `quest-duplicate-contract-names`, another minion already declared a contract with the same name.';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 12 documents reconciliation option (a) remove the write', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^\*\*\(a\) Remove your contract write\.\*\* The other slice owns the contract\. Drop it from your contracts\[\] array and treat it as something your steps consume via inputContracts\. If you also need it materialized for the unresolved-step-contract-refs validator, add a `status: 'existing'` entry pointing at the same source the other minion used \(this is a no-op write — the upsert will collapse on name\)\.$/mu,
      );
    });

    it('VALID: template => Step 12 documents reconciliation option (b) adopt the existing source', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^\*\*\(b\) Adopt the existing source\.\*\* If the existing entry's source path is correct for your slice's needs \(e\.g\., it already lives in `packages\/shared\/\.\.\.` and you can consume it as-is\), change YOUR write's `source` field to match the existing entry's source\. The upsert collapses on name, so the net effect is one contract entry — but your write signals you're a consumer, not the author\.$/mu,
      );
    });

    it('VALID: template => Step 12 documents reconciliation option (c) promote to shared', () => {
      const needle =
        "**(c) Promote to shared.** If both slices legitimately need to own this contract and the existing entry's source is in another slice's package (a leak), change BOTH writes to point at a shared path";
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Channel-discipline bullet enforces assertions are behavioral only', () => {
      const needle = '- **`assertions[]` = behavioral predicates only.**';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet forbids banned jest matchers', () => {
      const needle =
        '- **Banned jest matchers in assertions** — no `.toContain`, `.toMatchObject`, `.toEqual`, `.toHaveProperty`, `.includes`, `expect.any`, `expect.objectContaining`.';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet enforces companion file completeness', () => {
      const needle =
        '- **Missing companion files** — `focusFile` steps must list their folder-type companions in `accompanyingFiles`';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => seek_walk → in_progress authoring reminder anchors every new contract', () => {
      const needle =
        "**Anchor every new contract.** Every `status: 'new'` contract you declare must be named in some step's `outputContracts`.";
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet forbids slice-prefix mismatch', () => {
      const needle = '- **Slice-prefix mismatch** — every step ID must start with ';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet forbids duplicate focusFile.path', () => {
      const needle =
        '- **Duplicate `focusFile.path`** — two of your steps cannot target the same file.';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 9 contains observable-satisfaction depth bullet', () => {
      const needle =
        "- **Observable-satisfaction depth.** Beyond confirming \"every `then[]` clause has at least one matching assertion,\" walk every clause and confirm each assertion's `input` actually exercises the observable's `when`, and each assertion's `expected` actually verifies the observable's `then`.";
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 9 contains novelty self-flag bullet', () => {
      const needle =
        '- **Novelty self-flag.** Walk every step you authored and identify any pattern picked WITHOUT clear sibling precedent in this package';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 9 contains same-slice cross-step constraint coherence bullet', () => {
      const needle =
        "- **Same-slice cross-step constraint coherence.** If step A's assertion assumes step B's removal already landed, step B's `instructions[]` MUST contain an explicit removal directive AND step A's `dependsOn` MUST include B's id.";
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Channel discipline forbids intra-file logic mechanics in instructions[]', () => {
      const needle = '- **`instructions[]` are NOT for intra-file logic mechanics.**';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 8 promotes cross-step state constraints to assertions, not mechanics', () => {
      const needle = '**Promote cross-step state constraints to assertions, not mechanics.**';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 9 contains shared-state lifecycle reconciliation bullet', () => {
      const needle =
        '- **Shared-state lifecycle reconciliation.** For every piece of runtime state your slice introduces';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 11 header declares mandatory unconditional readback', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(
        /^### Step 11: Verify Your Slice Landed \(Post-Commit Readback — Mandatory\)$/mu,
      );
    });

    it('VALID: template => Step 11 opener states the readback is mandatory and unconditional', () => {
      const needle =
        'This step is **mandatory and unconditional.** Every minion runs the readback every time, regardless of whether modify-quest returned a clean `success: true`.';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 15 final-message summary template includes Novelty flags', () => {
      const needle =
        'New contracts: [...]. Novelty flags: [list patterns picked without sibling precedent, or "none"].';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => mandates e2e/integration test steps be focusFile, never focusAction', () => {
      const needle =
        '**e2e / integration TEST steps MUST be `focusFile` — never `focusAction`.** Flowrider routing keys on the focusFile suffix:';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => requires .e2e.ts paths in the entry flow folder of the UI package', () => {
      const needle =
        "**`.e2e.ts` paths live in the entry flow's folder of the UI package.** e2e is Playwright exclusively, and each `.e2e.ts` colocates with the UI it tests";
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => forbids authoring a ward / quality-gate step', () => {
      const needle = '- **Never author a ward / quality-gate step.**';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => directs consolidating confirm-post-state checks into one focusAction step', () => {
      const needle = '**Consolidate confirm-post-state checks into ONE `focusAction` step.**';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => no longer offers "ward exit 0" as an operational predicate example', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template.indexOf('ward exit 0')).toBe(-1);
    });

    it('VALID: template => Step 2 batches discover/get-project-map/get-project-inventory/get-quest into the same ToolSearch load as the standards tools', () => {
      const needle =
        'Also load `discover`, `get-project-map`, `get-project-inventory`, and `get-quest` in this same `ToolSearch` batch';
      const { template } = pathseekerSurfaceMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Quest Context section ends with $ARGUMENTS placeholder', () => {
      expect(pathseekerSurfaceMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
    });
  });
});
