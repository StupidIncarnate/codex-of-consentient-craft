import { pathseekerPromptStatics } from './pathseeker-prompt-statics';

describe('pathseekerPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(pathseekerPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: prompt template => length exceeds 5000 characters', () => {
    expect(pathseekerPromptStatics.prompt.template.length).toBeGreaterThan(5000);
  });

  it('VALID: seek_scope section => declares the section header', () => {
    const needle = '### Status: `seek_scope`';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_scope section => instructs to define formal slices', () => {
    const needle = 'Define formal slices';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_scope section => documents flowIds field on Slice shape', () => {
    const needle = 'flowIds: FlowNodeId[]';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_synth section => declares the section header', () => {
    const needle = '### Status: `seek_synth`';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_synth section => states minions commit their slice directly', () => {
    const needle = 'Each minion commits its slice';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_synth section => permits earlier correction once a minion has landed', () => {
    const needle = 'you may correct its slice immediately if you have certainty';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_synth section => defaults corrections to seek_walk Phase 2', () => {
    const needle = 'The default is to defer corrections to seek_walk Phase 2';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_synth section => describes Retry option on minion failure', () => {
    const needle = '**Retry.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_synth section => describes Fold option on minion failure', () => {
    const needle = '**Fold.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk section => declares the section header', () => {
    const needle = '### Status: `seek_walk`';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk section => contains Phase 1 cleanup minion dispatch', () => {
    const needle = '#### Phase 1 — Dispatch cleanup minions in parallel';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 1 => dispatches pathseeker-contract-dedup-minion', () => {
    const needle = "agent: 'pathseeker-contract-dedup-minion'";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 1 => dispatches pathseeker-assertion-correctness-minion', () => {
    const needle = "agent: 'pathseeker-assertion-correctness-minion'";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 1 => requires waiting for both minions before Phase 2', () => {
    const needle = 'Wait for both minions to signal';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk section => contains Phase 2 single full-flow sweep', () => {
    const needle = '#### Phase 2 — Single full-flow sweep';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => traces entry node to exit node', () => {
    const needle = 'Trace entry node → exit node';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => names upstream glue confirmation', () => {
    const needle = '**(a) Upstream glue.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => names downstream glue confirmation', () => {
    const needle = '**(b) Downstream glue.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => names requirement-reading correctness', () => {
    const needle = '**(c) Requirement-reading correctness.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => names CLAUDE.md / project-standards integrity check', () => {
    const needle = '**(d) CLAUDE.md / project-standards integrity**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => authors exploratory steps for novelty inline', () => {
    const needle = 'author an exploratory step directly in your final commit';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => adds missing steps the minion did not see', () => {
    const needle = "add a missing step the minion didn't see";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Phase 2 => allows whole-slice rewrite when a minion misunderstood', () => {
    const needle = 'Whole-slice rewrite (rare).';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk exit => transitions directly to in_progress', () => {
    const needle = 'status: "in_progress"';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk exit => walkFindings example uses filesRead field', () => {
    const needle = 'filesRead: [';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk exit => walkFindings example uses structuralIssuesFound field', () => {
    const needle = 'structuralIssuesFound: [';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk exit => walkFindings example uses planPatches field', () => {
    const needle = 'planPatches: [';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk exit => walkFindings example uses verifiedAt field', () => {
    const needle = 'verifiedAt:';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: status lifecycle preamble => collapses to three seek statuses', () => {
    const needle = 'seek_scope → seek_synth → seek_walk → in_progress';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: status lifecycle preamble => walkFindings required at seek_walk to in_progress transition', () => {
    const needle = 'REQUIRED at `seek_walk → in_progress` transition';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: pathseeker authority => declares authority over every step in every slice is unconditional', () => {
    const needle =
      "Pathseeker's authority over every step in every slice is unconditional and applies at every status";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: workflow paragraph => walks every flow end-to-end', () => {
    const needle = 'tracing each user flow entry→exit, confirming the parallel minions';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: boundaries section => permits correcting a landed slice at any phase', () => {
    const needle = 'Once a minion has landed, you may correct its slice at any phase.';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => contains Assertions vs Instructions section', () => {
    const needle = '## Assertions vs Instructions';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: assertions examples => contains GOOD behavioral example', () => {
    const needle = 'GOOD assertion (behavioral';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: assertions examples => contains GOOD negative behavioral example', () => {
    const needle = 'GOOD assertion (negative behavioral)';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: assertions examples => contains BAD editorial example', () => {
    const needle = 'BAD assertion (editorial';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: assertions examples => contains BAD code prescription example', () => {
    const needle = 'BAD assertion (code prescription';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: assertions examples => contains BAD file-shape prescription example', () => {
    const needle = 'BAD assertion (file-shape prescription)';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references slice prefix validator', () => {
    const needle = '**Slice prefix on step IDs.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references duplicate focusFile validator', () => {
    const needle = '**Duplicate `focusFile.path` across steps.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references contract name uniqueness validator', () => {
    const needle = '**Contract name uniqueness with source path.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references contract refs resolve validator', () => {
    const needle = '**Step `outputContracts` / `inputContracts` references must resolve.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references banned matchers validator', () => {
    const needle = '**Banned-matcher scan.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references orphan new contracts validator', () => {
    const needle = "**Every `status: 'new'` contract has a creating step.**";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references observables coverage validator', () => {
    const needle = '**Observables coverage.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => references companion file completeness validator', () => {
    const needle = '**Companion file completeness by folder type.**';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => splits into write-time validators subsection', () => {
    const needle = '### Write-time validators (every `modify-quest` call)';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: validators section => splits into completeness validators subsection', () => {
    const needle = '### Completeness validators (only at transition to `in_progress`)';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk exit => mentions completeness validators fire on transition', () => {
    const needle = 'completeness validators fire on this transition';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
