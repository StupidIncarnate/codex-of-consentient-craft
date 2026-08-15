import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

describe('codeweaverPromptStatics', () => {
  it('VALID: prompt template => closes with a terminal gate that sequences spec, commit, signal', () => {
    const needle =
      '### Gate 9: Reconcile the Spec, Commit, and Signal (BLOCKING — do not end your turn before this)';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    // Spec writes must land BEFORE the commit so the message can cite real observable ids.
    expect(template.indexOf('**Push what you learned back into the spec.**')).toBeGreaterThan(-1);
    expect(template.indexOf('BEFORE you commit')).toBeGreaterThan(-1);
    expect(template.indexOf('**Signal exactly once.**')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => Gate 9 is the last gate and precedes the reference sections', () => {
    const { template } = codeweaverPromptStatics.prompt;

    expect(template.indexOf('### Gate 9: Reconcile the Spec')).toBeGreaterThan(
      template.indexOf('### Gate 8: Verify with Ward'),
    );
    expect(template.indexOf('## Codeweaver-Piece-Minion Delegation Protocol')).toBeGreaterThan(
      template.indexOf('### Gate 9: Reconcile the Spec'),
    );
    expect(template.indexOf('### Gate 10')).toBe(-1);
  });

  // The seams block reports where the OTHER half of a shared node stands, read off the ledger, and
  // the gate has to stay honest about all three answers. A blanket "verify it exists in committed
  // code and repair it if it does not" was unsatisfiable for the side that runs FIRST: the other
  // session had not run, so the only way to satisfy it was to build a package the item never
  // declared.
  it('VALID: prompt template => Gate 2.5 branches on the seam marker instead of demanding every half already exist', () => {
    const { template } = codeweaverPromptStatics.prompt;
    const needle = '### Gate 2.5: Read the Seams Block (BLOCKING)';
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(
      template.indexOf(
        '- **ALREADY BUILT** — that session has run and committed. Check every observable under it against',
      ),
    ).toBeGreaterThan(template.indexOf(needle));
    expect(
      template.indexOf(
        '- **NOT BUILT YET** — that session has not run. Those observables are NOT yours: building them puts',
      ),
    ).toBeGreaterThan(template.indexOf(needle));
    expect(
      template.indexOf(
        '- **NO SESSION OWNS IT** — the ledger holds no cell for that package on this flow.',
      ),
    ).toBeGreaterThan(template.indexOf(needle));
  });

  it('VALID: prompt template => turn-discipline and framing precede the gates', () => {
    const { template } = codeweaverPromptStatics.prompt;

    // The shared block opens with "READ FIRST" and its rules strand a work item when broken, so it
    // must precede both the doctrine and the gates.
    expect(template.indexOf('## Operating Rules — READ FIRST')).toBeGreaterThan(-1);
    expect(template.indexOf('## What Is Authoritative')).toBeGreaterThan(
      template.indexOf('## Operating Rules — READ FIRST'),
    );
    expect(template.indexOf('### Gate 1: Load Project Standards')).toBeGreaterThan(
      template.indexOf('## What Is Authoritative'),
    );
    expect(template.indexOf('## Scope')).toBeGreaterThan(
      template.indexOf('### Gate 1: Load Project Standards'),
    );
  });

  it('VALID: prompt template => the spec-adjustment sections sit in Scope beside the rule that permits them', () => {
    const { template } = codeweaverPromptStatics.prompt;

    // Mid-work decisions, not startup framing — they belong next to the additive-only mechanics.
    expect(
      template.indexOf('**You may write the spec itself, in one direction only.**'),
    ).toBeGreaterThan(template.indexOf('## Scope'));
    expect(template.indexOf('### When an observable cannot be met as written')).toBeGreaterThan(
      template.indexOf('**You may write the spec itself, in one direction only.**'),
    );
    expect(
      template.indexOf('### When the flow implies an outcome nobody wrote down'),
    ).toBeGreaterThan(template.indexOf('### When an observable cannot be met as written'));
    expect(template.indexOf('## Committing & Signaling')).toBeGreaterThan(
      template.indexOf('### When the flow implies an outcome nobody wrote down'),
    );
  });

  it('VALID: exported value => has expected keys with string values', () => {
    expect(codeweaverPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: prompt template => scopes tests by folder type, reserving only Playwright e2e for Groundstomper', () => {
    const needle = '**You test what you build, at whatever level the folder type demands.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(
      template.indexOf(
        '**The one boundary: Playwright `.e2e.ts` suites belong to Groundstomper, not you.**',
      ),
    ).toBeGreaterThan(-1);
    // Flowrider and Groundstomper are test writers only, so nobody downstream builds flow wiring —
    // Codeweaver owns it.
    expect(template.indexOf('**You own `flows/` and `startup/`.**')).toBeGreaterThan(-1);
    expect(template.indexOf('No later role writes implementation')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => never hands e2e to Flowrider, which writes no Playwright', () => {
    const { template } = codeweaverPromptStatics.prompt;

    // A Codeweaver reading the old boundary skips an `.e2e.ts` expecting Flowrider to write it.
    // Flowrider refuses Playwright, so the suite is one nobody downstream picks up.
    expect(template.indexOf('`.e2e.ts` suites belong to Flowrider')).toBe(-1);
    expect(template.indexOf('belongs to Flowrider')).toBe(-1);
    expect(
      template.indexOf(
        'Flowrider takes\neverything below the browser and writes no Playwright either',
      ),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => rule 9 sends Playwright e2e to Groundstomper', () => {
    const needle =
      '9. **Test what you build** — at the level the folder type demands; only Playwright `.e2e.ts`\n   belongs to Groundstomper';
    const { template } = codeweaverPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: prompt template => credits both authoring roles for turning an added observable into a test', () => {
    const needle =
      "- **Flowrider and Groundstomper write the test suites from the observables** — Flowrider below the\n  browser, Groundstomper's Playwright walk inside it.";
    const { template } = codeweaverPromptStatics.prompt;
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: prompt template => has the commit-before-signal section', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^## Committing & Signaling$/mu);
  });

  it('VALID: prompt template => carries the hard DO NOT STASH rule', () => {
    const needle = '**Hard rule — DO NOT STASH.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: prompt template => has a Tactical Plan & Delegation gate', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^### Gate 4: Tactical Plan & Delegation Partition \(BLOCKING — plan and partition up front\)$/mu,
    );
  });

  it('VALID: prompt template => forbids editing the operations ledger', () => {
    const needle = '**You do NOT edit the operations ledger.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => partitions the work into dependency-ordered minion tasks', () => {
    const needle = '**Partition into minion tasks and order them by dependency.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => builds the seams by sequencing dependent pieces', () => {
    const needle = '**Sequence the seams** — dependent pieces in order, one owner per seam';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => has a Dispatch & Sequence Minions gate', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^### Gate 5: Dispatch & Sequence Minions$/mu,
    );
  });

  it('VALID: prompt template => has a Read & Verify Every Piece gate', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^### Gate 6: Read & Verify Every Piece$/mu,
    );
  });

  it('VALID: prompt template => reserves hand-written code for fixing and integrating', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(/^### Gate 7: Fix & Integrate$/mu);
  });

  it('VALID: prompt template => has a Codeweaver-Piece-Minion Delegation Protocol section', () => {
    expect(codeweaverPromptStatics.prompt.template).toMatch(
      /^## Codeweaver-Piece-Minion Delegation Protocol$/mu,
    );
  });

  it('VALID: prompt template => summons codeweaver-piece-minions via minion-fetch get-agent-prompt', () => {
    const needle = "get-agent-prompt({ agent: 'codeweaver-piece-minion', questId: 'QUEST_ID' })";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => minion returns a distilled artifact, not a transcript', () => {
    const needle = '**It returns a distilled artifact, not a transcript**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => the minion loads its own project standards', () => {
    const needle = 'then load the project standards itself';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => pins subagent_type general-purpose on each Agent spawn', () => {
    const needle = 'subagent_type: "general-purpose"';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => recovery play pulls a struggling minion edits via git', () => {
    const needle = 'If a minion returns no artifact, pull its';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => verifies by reading files, not trusting the artifact summary', () => {
    const needle = 'do NOT trust the artifact summary alone';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => grants authority over interior implementation decisions', () => {
    const needle =
      'implementation decision, local approach choice, and interior discovery (a dependency that won';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => bounds scope by flow relevance rather than package or bucket boundary', () => {
    const needle = 'The limit is **relevance, not package or bucket boundary.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => forbids work no flow asks for, without forbidding upstream seam repair', () => {
    const needle = 'What is out of scope is work no flow asks for';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    // The prior blanket guardrail read as forbidding the cross-package seam repair the relay needs.
    expect(template.indexOf('Do not rewrite unrelated areas of the')).toBe(-1);
  });

  it('VALID: prompt template => ranks the user-approved flow above the observables that express it', () => {
    const needle = '**The flow graph is the north star.** The USER approved it.';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(
      template.indexOf(
        '**The observables are the best available expression of that intent — not gospel.**',
      ),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => allows the nearest achievable outcome only after genuine effort', () => {
    const needle = '### When an observable cannot be met as written';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(
      template.indexOf('**The bar is genuine effort, not first resistance.**'),
    ).toBeGreaterThan(-1);
    expect(template.indexOf('**Never silently drop it.**')).toBeGreaterThan(-1);
    expect(
      template.indexOf(
        'Do not retreat to something trivially true; retreat the\n   minimum distance.',
      ),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => requires adding outcomes the flow implies but no observable covers', () => {
    const needle = '### When the flow implies an outcome nobody wrote down';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('**Building the feature is what reveals the rest.**')).toBeGreaterThan(
      -1,
    );
    expect(
      template.indexOf('an observable you add is a constraint you\nput on YOURSELF'),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => carries distinct ADJUSTED and ADDED commit markers', () => {
    const { template } = codeweaverPromptStatics.prompt;

    expect(template.indexOf('ADJUSTED: <observable-id>')).toBeGreaterThan(-1);
    expect(template.indexOf('ADDED: <observable-id> on node <node-id>')).toBeGreaterThan(-1);
    expect(template.indexOf('"could not" and "chose not to" are different')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => grants additive-only spec writes and still forbids ledger writes', () => {
    const needle = '**You may write the spec itself, in one direction only.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('You may NOT write `operations`.')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => ranks flows over git over the ledger', () => {
    const needle = '## What Is Authoritative (read this before you trust anything)';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('**The flow graph is the north star.**')).toBeGreaterThan(-1);
    expect(template.indexOf('**Git is the authority log.**')).toBeGreaterThan(-1);
    expect(
      template.indexOf(
        '**The operations ledger is DERIVED from the spec, and its scope is exact.**',
      ),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => treats the derived partition as exact but not necessarily complete', () => {
    const needle = '**Exact is not the same as complete.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => sanctions repairing a gap an earlier bucket never built, not just a bug', () => {
    const needle = '**Repair is expected work, not scope creep.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('it was never there')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => requires declaring an out-of-bucket repair in the commit message', () => {
    const needle = '**If you repaired a gap another bucket left, say so explicitly**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
    expect(template.indexOf('REPAIR: item 4')).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => names consumed-by-repair as a third legitimate reason to signal partial', () => {
    const needle =
      'you found a gap so large that repairing\nit consumed the session and your own scope still remains';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => never instructs the nonexistent partially_complete signal value', () => {
    const { template } = codeweaverPromptStatics.prompt;

    // partially_complete is a web-side execution DISPLAY status, not a signal-back value.
    expect(template.indexOf('partially_complete')).toBe(-1);
  });

  it('VALID: prompt template => declares there is no failure, only moving forward', () => {
    const needle = '**There is no failure — only moving forward.**';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => signals complete with operationStatus done when scope is finished', () => {
    const needle =
      "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'done' })";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => signals complete with operationStatus partial when work remains', () => {
    const needle =
      "signal-back({ questId: 'QUEST_ID', workItemId: 'WORK_ITEM_ID', signal: 'complete', operationItemId: 'OPERATION_ITEM_ID', operationStatus: 'partial' })";
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: prompt template => rule 9 forbids ledger writes and failure signals', () => {
    const needle =
      '**No ledger writes, no failure signals** — outcome rides on signal-back as done|partial';
    const { template } = codeweaverPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });
});
