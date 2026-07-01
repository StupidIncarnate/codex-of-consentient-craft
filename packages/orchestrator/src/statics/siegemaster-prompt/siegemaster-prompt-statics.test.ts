import { agentOperatingRulesStatics } from '../agent-operating-rules/agent-operating-rules-statics';

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

describe('siegemasterPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(siegemasterPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
        },
      },
    });
  });

  it('VALID: template => length exceeds 2000 characters', () => {
    expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(2000);
  });

  it('VALID: template => titles the role a manual QA gate', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^# Siegemaster - Manual QA Gate$/mu);
  });

  it('VALID: template => declares it changes no files', () => {
    const needle = '**You change NO files.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => states failed triggers a Spiritmender fix then a fresh Siegemaster', () => {
    const needle =
      'dispatches a **Spiritmender** to fix the implementation/test and then a **fresh Siegemaster** to re-verify';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => instructs to report, not repair', () => {
    const needle = "**Report, don't repair.**";
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => demands observation over inspection (a green suite is not an observation)', () => {
    const principle = '**Verification means OBSERVATION, not inspection.**';
    const claimVsObservation =
      'a green test suite is a claim about the system, not an observation of it';
    const { template } = siegemasterPromptStatics.prompt;
    const foundPrinciple = template.slice(
      template.indexOf(principle),
      template.indexOf(principle) + principle.length,
    );
    const foundClaim = template.slice(
      template.indexOf(claimVsObservation),
      template.indexOf(claimVsObservation) + claimVsObservation.length,
    );

    expect({ foundPrinciple, foundClaim }).toStrictEqual({
      foundPrinciple: principle,
      foundClaim: claimVsObservation,
    });
  });

  it('VALID: template => bridges the operating rules to this no-write role (signal-back still binds)', () => {
    const needle = '**You change no files, but every Operating Rule above still binds you**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => an incomplete/unbuilt path is a failed finding, not built by Siege', () => {
    const principle = 'not a wall you stop at, and not yours to build.';
    const findingSection = 'INCOMPLETE / UNWALKABLE:';
    const { template } = siegemasterPromptStatics.prompt;
    const foundPrinciple = template.slice(
      template.indexOf(principle),
      template.indexOf(principle) + principle.length,
    );
    const foundSection = template.slice(
      template.indexOf(findingSection),
      template.indexOf(findingSection) + findingSection.length,
    );

    expect({ foundPrinciple, foundSection }).toStrictEqual({
      foundPrinciple: principle,
      foundSection: findingSection,
    });
  });

  it('VALID: template => frames the flow as a map to walk', () => {
    const needle = '**The flow in your Flow Context is a map.**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => declares observables are not just I/O (custom = behavioral invariant)', () => {
    const notJustIo = '**Observables hang off the nodes — and they are NOT just I/O.**';
    const customInvariant = 'is a behavioral invariant, not an I/O surface';
    const { template } = siegemasterPromptStatics.prompt;
    const foundNotJustIo = template.slice(
      template.indexOf(notJustIo),
      template.indexOf(notJustIo) + notJustIo.length,
    );
    const foundCustom = template.slice(
      template.indexOf(customInvariant),
      template.indexOf(customInvariant) + customInvariant.length,
    );

    expect({ foundNotJustIo, foundCustom }).toStrictEqual({
      foundNotJustIo: notJustIo,
      foundCustom: customInvariant,
    });
  });

  it('VALID: template => checks out-of-band artifacts (db/disk/logs) outside the browser, including sad-path side-effects', () => {
    const outsideBrowser = 'the browser cannot show you a database write or a file on disk.';
    const noUnwantedWrite = 'confirm the failure left NO unwanted side-effect';
    const { template } = siegemasterPromptStatics.prompt;
    const foundOutside = template.slice(
      template.indexOf(outsideBrowser),
      template.indexOf(outsideBrowser) + outsideBrowser.length,
    );
    const foundNoWrite = template.slice(
      template.indexOf(noUnwantedWrite),
      template.indexOf(noUnwantedWrite) + noUnwantedWrite.length,
    );

    expect({ foundOutside, foundNoWrite }).toStrictEqual({
      foundOutside: outsideBrowser,
      foundNoWrite: noUnwantedWrite,
    });
  });

  it('VALID: template => resets state between branch walks (established Gate 2, applied before every walk)', () => {
    const establish = '**Establish how you RESET state between walks — before you start walking.**';
    const apply =
      "**Each branch walk owns its state — reset to the path's precondition before EVERY walk (happy, sad, or off-map).**";
    const { template } = siegemasterPromptStatics.prompt;
    const foundEstablish = template.slice(
      template.indexOf(establish),
      template.indexOf(establish) + establish.length,
    );
    const foundApply = template.slice(
      template.indexOf(apply),
      template.indexOf(apply) + apply.length,
    );

    expect({ foundEstablish, foundApply }).toStrictEqual({
      foundEstablish: establish,
      foundApply: apply,
    });
  });

  it('VALID: template => opens the gate block with a sequential, exit-criteria header', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^## Manual QA Gates$/mu);
  });

  it('VALID: template => declares gates are sequential with exit criteria and no skipping', () => {
    const needle = 'Gates are sequential. Each has exit criteria. Do not skip.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries exactly one Exit Criteria per gate (seven gates)', () => {
    const exitCriteriaCount =
      siegemasterPromptStatics.prompt.template.split('**Exit Criteria:**').length - 1;

    expect(exitCriteriaCount).toBe(7);
  });

  it('VALID: template => Gate 1 loads standards and maps the flow, BLOCKING first', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 1: Load Standards & Map the Flow \(MCP — BLOCKING, do this FIRST\)$/mu,
    );
  });

  it('VALID: template => Gate 2 stands up the real system and picks the verification surface', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 2: Stand Up the Real System & Pick Your Surface$/mu,
    );
  });

  it('VALID: template => a backend (API/CLI/queue) flow is driven by curl, not a browser', () => {
    const needle =
      'That IS the manual QA for a backend flow, NOT a fallback — do not open a browser for it.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 3 walks the happy paths for real', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 3: Walk the Happy Paths \(run it for real\)$/mu,
    );
  });

  it('VALID: template => confirms the happy path first before trying to break anything', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^This is your first active phase — exploration the automated tests are blind to\. \*\*Confirm the happy path works BEFORE you try to break anything\.\*\*$/mu,
    );
  });

  it('VALID: template => Gate 4 walks the sad paths the graph draws', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 4: Walk the Sad Paths \(every drawn error\/skip branch\)$/mu,
    );
  });

  it('VALID: template => requires reaching every terminal for real, happy and sad', () => {
    const needle = 'Every terminal on the map, success or error, must be reached for real.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Gate 5 goes off the map for missed paths and breakage pockets', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 5: Go Off the Map — Missed Paths & Breakage Pockets$/mu,
    );
  });

  it('VALID: template => Gate 6 audits the suite read-only for false-positive greens', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^### Gate 6: Audit the Suite for False-Positive Greens$/mu,
    );
  });

  it('VALID: template => Gate 7 signals', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(/^### Gate 7: Signal$/mu);
  });

  it('VALID: template => signals once for the whole flow, not once per walk-path', () => {
    const needle = 'You signal ONCE for the whole flow';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => Signaling warns against FAILED OBSERVABLES in complete summary', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^\*\*Warning:\*\* Do NOT include the literal string `FAILED OBSERVABLES:` in any complete-signal summary\.$/mu,
    );
  });

  it('VALID: template => failure-summary guidance references Nodes block for observable-id placeholder', () => {
    const needle =
      'Use observable IDs from the Nodes block when populating `{observable-id}` placeholders.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => audits the existing suite scoped, path-agnostic (no hardcoded package)', () => {
    const needle = 'npm run ward -- --only e2e,integration -- <ui-package>/src/flows/<route>';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => carries no .spec.ts references (e2e renamed to .e2e.ts)', () => {
    expect(siegemasterPromptStatics.prompt.template.indexOf('.spec.ts')).toBe(-1);
  });

  it('VALID: template => leads with operating rules read first', () => {
    expect(siegemasterPromptStatics.prompt.template).toMatch(
      /^## Operating Rules — READ FIRST \(ignoring these wedges the whole quest\)$/mu,
    );
  });

  it('VALID: template => forbids ending the turn waiting for a background task', () => {
    const needle = 'NEVER end your turn waiting for a background task, and NEVER poll for one.';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => defines manual QA as driving the real browser via the Claude-in-Chrome MCP', () => {
    const needle = 'drive the actual browser via the **Claude-in-Chrome MCP**';
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(
      template.indexOf(needle),
      template.indexOf(needle) + needle.length,
    );

    expect(found).toBe(needle);
  });

  it('VALID: template => embeds the shared agent operating rules', () => {
    const rules = agentOperatingRulesStatics.markdown;
    const { template } = siegemasterPromptStatics.prompt;
    const found = template.slice(template.indexOf(rules), template.indexOf(rules) + rules.length);

    expect(found).toBe(rules);
  });

  it('VALID: template => hardcodes no UI package path', () => {
    expect(siegemasterPromptStatics.prompt.template.indexOf('packages/web')).toBe(-1);
  });
});
