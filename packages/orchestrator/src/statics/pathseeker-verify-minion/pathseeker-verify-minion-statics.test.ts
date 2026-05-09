import { pathseekerVerifyMinionStatics } from './pathseeker-verify-minion-statics';

describe('pathseekerVerifyMinionStatics', () => {
  it('VALID: exported value => has expected keys with string template', () => {
    expect(pathseekerVerifyMinionStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => names the Pathseeker Verify Minion role on the opening line', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^You are the Pathseeker Verify Minion\. Your purpose is to perform ONE pass of semantic review on a quest whose steps and contracts have already been authored by surface-scope minions and reconciled across slices by Pathseeker\. Deterministic save-time validators have already cleared the plan of mechanical errors before you run — your job is the LLM-judgment work the validators cannot do\. You write a structured `reviewReport` directly to the quest's `planningNotes\.reviewReport` field and signal back ONCE\.$/mu,
    );
  });

  it('VALID: template => declares single-pass discipline (no retry loop) line', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^\*\*Single-pass discipline:\*\* You run exactly ONE pass\. There is no retry loop for verification\. After you signal back, Pathseeker will read your report\. If you raise critical items, Pathseeker fixes them in place — the deterministic validators re-run on every fix, which is sufficient\. There is no second LLM verification pass\. Be thorough on this pass\.$/mu,
    );
  });

  it('VALID: template => Step 1 loads quest at implementation stage', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^### Step 1: Load Quest at Implementation Stage$/mu,
    );
  });

  it('VALID: template => Step 2 observable satisfaction walk header', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^### Step 2: Observable Satisfaction Walk$/mu,
    );
  });

  it('VALID: template => Step 3 cross-slice dependency walk header', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^### Step 3: Cross-Slice Dependency Walk$/mu,
    );
  });

  it('VALID: template => Step 4 sibling-pattern fit (sample) header', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^### Step 4: Sibling-Pattern Fit \(Sample\)$/mu,
    );
  });

  it('VALID: template => Step 5 novelty scan header', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(/^### Step 5: Novelty Scan$/mu);
  });

  it('VALID: template => documents noveltyConcerns array shape with recommendsExploratory boolean', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^- `noveltyConcerns` — array of objects with shape `\{ area: 'tech' \| 'testing' \| 'pattern', description: string, recommendsExploratory: boolean \}`\. One entry per Novelty finding from Step 5\.$/mu,
    );
  });

  it('VALID: template => Step 8 signal-back ONCE header', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^### Step 8: Signal Back ONCE$/mu,
    );
  });

  it('VALID: template => closing ONE-pass invariant line', () => {
    expect(pathseekerVerifyMinionStatics.prompt.template).toMatch(
      /^This is your ONE signal-back\. You do not run again on this quest\.$/mu,
    );
  });
});
