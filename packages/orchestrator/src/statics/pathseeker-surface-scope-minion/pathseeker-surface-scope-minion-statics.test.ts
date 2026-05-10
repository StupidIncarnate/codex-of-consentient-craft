import { pathseekerSurfaceScopeMinionStatics } from './pathseeker-surface-scope-minion-statics';

describe('pathseekerSurfaceScopeMinionStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerSurfaceScopeMinionStatics).toStrictEqual({
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
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^You are a Pathseeker Surface Scope Minion\. Pathseeker has assigned you a slice of a quest spec\. Your job is to commit the steps\[\] and contracts\[\] for your slice directly to the quest via modify-quest\. You are the authority for your slice's step shape — you write the steps yourself\.$/mu,
      );
    });

    it('VALID: template => Constraints section opens with Scope bucket', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(/^\*\*Scope:\*\*$/mu);
    });

    it('VALID: template => Constraints/Scope bullet forbids cross-slice writes', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^- \*\*No cross-slice writes\.\*\* Do not set `dependsOn` entries that point at steps in other slices, and do not author step IDs outside your slice's prefix\. Pathseeker handles cross-slice DAG wiring in seek_walk Wave 2\.$/mu,
      );
    });

    it('VALID: template => Step 8 header introduces Assertions vs Instructions section', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^### Step 8: Assertions vs Instructions — the Boundary$/mu,
      );
    });

    it('VALID: template => Step 8 contains the GOOD behavioral assertion example header', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^GOOD assertion \(behavioral, compiles to expect\(\)\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the GOOD negative behavioral assertion example header', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^GOOD assertion \(negative behavioral\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the BAD editorial assertion example header', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^BAD assertion \(editorial — move to instructions\[\]\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the BAD code-prescription assertion example header', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^BAD assertion \(code prescription — move to instructions\[\]\):$/mu,
      );
    });

    it('VALID: template => Step 8 contains the BAD file-shape-prescription assertion example header', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^BAD assertion \(file-shape prescription\):$/mu,
      );
    });

    it('VALID: template => Step 12 header introduces Contract Dedup Reconciliation section', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^### Step 12: Contract Dedup Reconciliation$/mu,
      );
    });

    it('VALID: template => Step 12 names the dedup validator that triggers reconciliation', () => {
      const needle =
        'If your modify-quest call returns `success: false` with a failedCheck of name `quest-duplicate-contract-names`, another minion already declared a contract with the same name.';
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Step 12 documents reconciliation option (a) remove the write', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^\*\*\(a\) Remove your contract write\.\*\* The other slice owns the contract\. Drop it from your contracts\[\] array and treat it as something your steps consume via inputContracts\. If you also need it materialized for the unresolved-step-contract-refs validator, add a `status: 'existing'` entry pointing at the same source the other minion used \(this is a no-op write — the upsert will collapse on name\)\.$/mu,
      );
    });

    it('VALID: template => Step 12 documents reconciliation option (b) adopt the existing source', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(
        /^\*\*\(b\) Adopt the existing source\.\*\* If the existing entry's source path is correct for your slice's needs \(e\.g\., it already lives in `packages\/shared\/\.\.\.` and you can consume it as-is\), change YOUR write's `source` field to match the existing entry's source\. The upsert collapses on name, so the net effect is one contract entry — but your write signals you're a consumer, not the author\.$/mu,
      );
    });

    it('VALID: template => Step 12 documents reconciliation option (c) promote to shared', () => {
      const needle =
        "**(c) Promote to shared.** If both slices legitimately need to own this contract and the existing entry's source is in another slice's package (a leak), change BOTH writes to point at a shared path";
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Channel-discipline bullet enforces assertions are behavioral only', () => {
      const needle = '- **`assertions[]` = behavioral predicates only.**';
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet forbids banned jest matchers', () => {
      const needle =
        '- **Banned jest matchers in assertions** — no `.toContain`, `.toMatchObject`, `.toEqual`, `.toHaveProperty`, `expect.any`, `expect.objectContaining`.';
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet enforces companion file completeness', () => {
      const needle =
        '- **Missing companion files** — `focusFile` steps must list their folder-type companions in `accompanyingFiles`';
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => seek_plan authoring reminder anchors every new contract', () => {
      const needle =
        "**Anchor every new contract.** Every `status: 'new'` contract you declare must be named in some step's `outputContracts`.";
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet forbids slice-prefix mismatch', () => {
      const needle = '- **Slice-prefix mismatch** — every step ID must start with ';
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Constraints/Validator-tripping bullet forbids duplicate focusFile.path', () => {
      const needle =
        '- **Duplicate `focusFile.path`** — two of your steps cannot target the same file.';
      const { template } = pathseekerSurfaceScopeMinionStatics.prompt;
      const found = template.slice(
        template.indexOf(needle),
        template.indexOf(needle) + needle.length,
      );

      expect(found).toBe(needle);
    });

    it('VALID: template => Quest Context section ends with $ARGUMENTS placeholder', () => {
      expect(pathseekerSurfaceScopeMinionStatics.prompt.template).toMatch(/^\$ARGUMENTS$/mu);
    });
  });
});
