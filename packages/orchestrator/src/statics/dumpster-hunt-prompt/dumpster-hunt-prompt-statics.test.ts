import { dumpsterHuntPromptStatics } from './dumpster-hunt-prompt-statics';

// PROSE COMPARES IGNORE WRAPPING. `template` is bound with every whitespace run — spaces,
// newlines, indent — collapsed to a single space, so a needle written on ONE line finds its
// sentence however the prompt happens to wrap. Re-flowing a paragraph in the statics file then
// reds nothing that is still true, which is why no needle below carries an escaped newline. The
// line-anchored `toMatch` assertions read `dumpsterHuntPromptStatics.prompt.template` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const template = dumpsterHuntPromptStatics.prompt.template.replace(WHITESPACE_RUN, ' ');

describe('dumpsterHuntPromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(dumpsterHuntPromptStatics).toStrictEqual({
      prompt: {
        template: expect.stringMatching(/^.+$/su),
        placeholders: {
          arguments: '$ARGUMENTS',
          questId: '$QUEST_ID',
          questBootstrap: '$QUEST_BOOTSTRAP',
          clarifyInstruction: '$CLARIFY_INSTRUCTION',
        },
      },
      questBootstrap: {
        mint: expect.stringMatching(/^.+$/su),
        preCreated: expect.stringMatching(/^.+$/su),
      },
      clarifyInstructions: {
        native: expect.stringMatching(/^.+$/su),
        mcp: expect.stringMatching(/^.+$/su),
      },
    });
  });

  it('VALID: mint bootstrap => instructs create-quest with questType bug-hunt', () => {
    const needle = "questType: 'bug-hunt'";
    const { mint } = dumpsterHuntPromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);

    expect(mint.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: preCreated bootstrap => forbids minting a second quest', () => {
    const needle = 'Do NOT call `mcp__dungeonmaster__create-quest`';
    const { preCreated } = dumpsterHuntPromptStatics.questBootstrap;
    const foundIndex = preCreated.indexOf(needle);

    expect(preCreated.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: mint bootstrap => opens the spec view without suppressing the chat panel', () => {
    const { mint } = dumpsterHuntPromptStatics.questBootstrap;

    // The intake session's transcript streams into the browser chat panel, so hiding the panel
    // would throw away the conversation the user opened the page to watch.
    expect(mint.indexOf('chat=hidden')).toBe(-1);
  });

  it('VALID: template => routes the fix to the codeweaver session that owns the package it lands in', () => {
    const needle = 'the codeweaver session that owns the package the fix lands in';
    const foundIndex = template.indexOf(needle);

    expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  describe('one flow per bug', () => {
    // A mirrored actual-state/expected-state PAIR duplicates the whole repro path across two
    // flows, hides which step diverges, and gives a two-bug report four flows the reader has to
    // pair up by name. One flow per bug, forking at the divergence, is the shape the codeweaver
    // session that owns the package the fix lands in reads.
    it('VALID: template => headlines ONE flow per bug', () => {
      const needle =
        'You capture a reported bug as a small, testable specification: **ONE flow per bug**.';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => splits a multi-defect report into one flow each', () => {
      const needle = 'Each defect gets its OWN flow — never one flow carrying two';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => forbids capturing two bugs in one flow', () => {
      const needle = '- NEVER capture two bugs in one flow. One flow per bug';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => no longer instructs capturing the bug as two flows', () => {
      expect(template.indexOf('Capture the bug as TWO flows')).toBe(-1);
      expect(template.indexOf('Expected-state flow')).toBe(-1);
      expect(template.indexOf('Actual-state flow')).toBe(-1);
    });
  });

  describe('ACTUAL / EXPECTED terminal nodes', () => {
    // There is no contract field for actual-vs-expected — `flowNodeContract` carries id/label/
    // type/packages/observables and nothing else — so the LABEL prefix is the whole indicator, and
    // the codeweaver session that owns the package the fix lands in greps for exactly these two
    // strings.
    it('VALID: template => names the two terminal labels as the actual/expected indicator', () => {
      const needle =
        '**The two terminal LABELS are the actual/expected indicator.** There is no field for it. Prefix them verbatim: `ACTUAL: ` on the terminal describing what the user sees today, `EXPECTED: ` on the terminal describing what should happen.';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => labels the fork edges today and after fix', () => {
      const needle = '**Label those two edges `today` and `after fix`.**';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => the example flow carries both prefixed terminal labels', () => {
      expect(
        template.indexOf('"label": "ACTUAL: the expanded row body is empty", "type": "terminal"'),
      ).toBeGreaterThan(-1);
      expect(
        template.indexOf(
          '"label": "EXPECTED: the expanded row shows the GET-QUEST tool result text", "type": "terminal"',
        ),
      ).toBeGreaterThan(-1);
    });
  });

  describe('observables sit on the EXPECTED side only', () => {
    it('VALID: template => anchors the observables on the EXPECTED terminal', () => {
      const needle =
        '**Where they go.** On the `EXPECTED:` terminal, and on any node between the entry point and the divergence whose behavior must also change for the fix to be real. NEVER on an `ACTUAL:` node';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    // An observable is a positive expectation and the codeweaver session that owns the package the
    // fix lands in turns each one into a test, so one on the broken branch asks for a test that
    // asserts the bug.
    it('VALID: template => forbids an observable on an ACTUAL node, with the reason', () => {
      const needle =
        '- NEVER put an observable on an `ACTUAL:` node. An observable is a positive expectation and the codeweaver session that owns the package the fix lands in turns each one into a test, so an observable on the broken branch asks for a test that asserts the bug.';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });
  });

  describe('flat observable shape', () => {
    // `flowObservableContract` is {id, type, description, package} — it has no given/when/then
    // block at all, so BDD keys are dropped on save and everything the author meant by them ends
    // up crammed into one `description` paragraph.
    it('VALID: template => forbids given/when/then on an observable', () => {
      const needle =
        '- NEVER write `given` / `when` / `then` on an observable. An observable is FLAT';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => states the flat shape has no given/when/then block', () => {
      const needle =
        'It has no `given`/`when`/`then` block; the flow already carries the precondition';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => never instructs writing a then[] array', () => {
      expect(template.indexOf('`then[]`')).toBe(-1);
      expect(template.indexOf('- `given`:')).toBe(-1);
      expect(template.indexOf('- `when`:')).toBe(-1);
    });

    it('VALID: template => documents id, type and description as the observable fields', () => {
      expect(template.indexOf('- `id`: kebab-case identifier')).toBeGreaterThan(-1);
      expect(template.indexOf('- `type`: the outcome type tag')).toBeGreaterThan(-1);
      expect(template.indexOf('- `description`: ONE concrete, testable outcome')).toBeGreaterThan(
        -1,
      );
    });
  });

  describe('structured flow rules', () => {
    it('VALID: template => lists the four node types', () => {
      expect(template.indexOf('**Node types:**')).toBeGreaterThan(-1);
      expect(
        template.indexOf('- `state` — resting states, UI pages, waiting points'),
      ).toBeGreaterThan(-1);
      expect(
        template.indexOf('- `decision` — branching points, conditionals, the divergence fork'),
      ).toBeGreaterThan(-1);
      expect(
        template.indexOf('- `action` — operations, API calls, processing steps'),
      ).toBeGreaterThan(-1);
      expect(template.indexOf('- `terminal` — end states, exit points')).toBeGreaterThan(-1);
    });

    it('VALID: template => forbids raw mermaid, since the diagram is generated', () => {
      const needle =
        '- NEVER write raw mermaid — the diagram is generated from your nodes and edges.';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });
  });

  describe('multiple observables', () => {
    // An intake that embeds a single observable crams the whole corrected behavior into one
    // then[] as a paragraph of "AND [ui-state] ..." clauses. The codeweaver session that owns the
    // package the fix lands in cannot turn that into one failing test and the user cannot approve
    // its parts separately, so the prompt must ask for one observable per outcome.
    it('VALID: template => instructs writing as many observables as the behavior has', () => {
      const needle = '**Write as many observables as the corrected behavior actually has.**';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => instructs splitting multi-part outcomes instead of cramming', () => {
      const needle = '**Split, do not cram.**';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => never instructs embedding exactly one observable', () => {
      expect(template.indexOf('embed ONE observable')).toBe(-1);
    });
  });

  describe('node package tagging', () => {
    it('VALID: template => instructs tagging every node with packages as it is created', () => {
      const needle = 'Tag every node with `packages: PackageName[]` as you create it';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => states the seam-rule invariant for every edge A -> B', () => {
      const needle =
        '> For every edge `A -> B`, `A.packages` and `B.packages` must share at least one package. An edge > whose endpoints share none is a boundary crossed with nothing spanning it.';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => instructs fixing a failing edge by widening an endpoint or inserting a node', () => {
      const needle =
        'Fix a failing edge by **widening one endpoint** — add the missing package to whichever side is the natural seam; that endpoint now IS the glue node — or by **inserting a node** carrying both when neither existing endpoint is the right seam.';
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => explore_flows completion requires both terminals, every node tagged, tags present in packagesAffected, and no unglued seams', () => {
      const needle =
        "**Exit:** when every bug has its flow — each with an `ACTUAL:` and an `EXPECTED:` terminal, every node tagged with `packages`, every tag it carries present in `packagesAffected`, every edge satisfying the seam rule — transition `status: 'review_flows'`";
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => does not instruct inferring node packages from observable types', () => {
      expect(template.indexOf("we'll infer it for you")).toBe(-1);
      expect(template.indexOf('automatically infer')).toBe(-1);
    });
  });

  describe('observable package attribution', () => {
    it('VALID: template => lists package among the observable fields with the resolve-on-save rule', () => {
      const needle =
        "- `package`: the ONE package this outcome is read in, drawn from the owning node's `packages`. **Omit it when that node tags exactly one package** — the save resolves it from the node, so there is nothing for you to restate. On a node tagging MORE than one there is nothing to inherit and an omission is refused: name the side of the seam this outcome sits on, and name one the node already tags.";
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });

    it('VALID: template => states the seam-coverage rule with its edge-forced waiver', () => {
      const needle =
        "A seam node's observables must between them cover every package it tags, unless the edge set already forces one (dropping it would leave an incident edge with nothing spanning it).";
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });
  });

  describe('packagesAffected entry object shape', () => {
    it('VALID: template => packagesAffected entries use the object shape with the ./ location prefix', () => {
      const needle =
        "a `packagesAffected` entry for every package a node is tagged with — `{ name, location, changeType, packageType, usedBy? }`, `location` written WITH the `./` prefix (`'./packages/<name>'`, never the bare `'packages/<name>'`), `usedBy` required only when `changeType: 'new'`";
      const foundIndex = template.indexOf(needle);

      expect(template.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
    });
  });
});
