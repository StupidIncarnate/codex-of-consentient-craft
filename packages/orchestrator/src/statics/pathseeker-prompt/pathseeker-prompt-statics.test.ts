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

  it('VALID: seek_synth section => defaults corrections to seek_walk Wave 3', () => {
    const needle = 'The default is to defer corrections to seek_walk Wave 3';
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

  it('VALID: seek_walk section => contains Sweep 1 semantic similarity', () => {
    const needle = '#### Sweep 1 — Semantic similarity';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk section => contains Sweep 2 cross-slice glue review', () => {
    const needle = '#### Sweep 2 — Cross-slice glue review';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk section => contains Sweep 3 build-the-map header', () => {
    const needle = '#### Sweep 3 — Build the map';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Sweep 3 => walks every step in every slice', () => {
    const needle = 'Walk every step in every slice';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Wave 3 => declares pathseeker authority over every step in every slice is unconditional', () => {
    const needle =
      "Pathseeker's authority over every step in every slice is unconditional and applies at every status";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Sweep 3 => names within-slice channel discipline as a minion self-check', () => {
    const needle = 'Within-slice channel discipline';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Sweep 3 => adds missing steps the minion did not see', () => {
    const needle = "add a missing step the minion didn't see";
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_walk Sweep 3 => allows whole-slice rewrite when a minion misunderstood', () => {
    const needle = 'Whole-slice rewrite (rare).';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: workflow paragraph => walks every slice while building institutional memory', () => {
    const needle =
      'you walk every slice — building the institutional memory of every focus file, every cross-slice connection, every architectural surprise';
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

  it('VALID: seek_plan section => declares the section header', () => {
    const needle = '### Status: `seek_plan`';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_plan section => spawns the new pathseeker-verify-minion', () => {
    const needle = 'pathseeker-verify-minion';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_plan section => states verify-minion runs once', () => {
    const needle = 'It runs ONCE';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_plan section => forbids spawning a second verify-minion', () => {
    const needle = 'Do NOT spawn a second verify-minion';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_plan section => handles noveltyConcerns', () => {
    const needle = 'noveltyConcerns';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_plan section => references recommendsExploratory flag', () => {
    const needle = 'recommendsExploratory';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: seek_plan section => spawns Explore subagent for novelty research', () => {
    const needle = 'subagent_type: "Explore"';
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

  it('VALID: seek_plan section => mentions completeness validators fire on transition', () => {
    const needle = 'completeness validators fire on this call';
    const { template } = pathseekerPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
