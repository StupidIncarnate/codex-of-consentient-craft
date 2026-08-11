import { dumpsterCreatePromptStatics } from './dumpster-create-prompt-statics';

describe('dumpsterCreatePromptStatics', () => {
  it('VALID: exported value => has expected keys with string values', () => {
    expect(dumpsterCreatePromptStatics).toStrictEqual({
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

  it('VALID: prompt template => length exceeds 30000 characters', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.length).toBeGreaterThan(30000);
  });

  it('VALID: prompt template => Phase 5 no longer instructs calling validate-spec MCP tool', () => {
    const removedNeedle = 'Run validate-spec first';
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.indexOf(removedNeedle)).toBe(-1);
  });

  it('VALID: prompt template => documents modify-quest validation layers', () => {
    const needle = '`modify-quest` validates on every call.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => requires packagesAffected[] declaration before approval', () => {
    const needle = '**Declare `packagesAffected[]`**';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => documents packagesAffected as context every implementation session reads', () => {
    const needle = 'it is context every implementation session reads';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => requires authoring the operations ledger before approval', () => {
    const needle =
      '**Author the operations ledger (REQUIRED — the approval gate refuses `approved` without it).**';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => documents ChaosWhisperer as the only agent that authors operation items', () => {
    const needle = 'You are the ONLY agent that authors these items';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => forbids authoring the operations ledger before flows are approved', () => {
    const needle = '- NEVER author the operations ledger before flows are approved.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => requires reconciling the operations ledger before every review_observables transition', () => {
    const needle =
      '**Reconcile the operations ledger against the spec as it stands right now.** This is the LAST thing you do before every transition to `review_observables`';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => requires stating ledger freshness when asking for observable approval', () => {
    const needle =
      'Never present a ledger you have not re-checked since the last thing the user said.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => instructs setting flowIds as a non-binding pointer, not an assignment', () => {
    const needle =
      '**Set `flowIds` on each item: the flows that item lands on.** This is a NON-BINDING pointer, not an assignment';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => permits an empty flowIds on a foundational item and many-to-many mapping', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.indexOf('Flows and items are many-to-many in BOTH directions')).toBeGreaterThan(
      -1,
    );
    expect(template.indexOf('carries `flowIds: []`')).toBeGreaterThan(-1);
    expect(
      template.indexOf('Items are units of construction; flows are units of behavior.'),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => no longer instructs the unadvertised format param on get-quest', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    // The advertised get-quest schema is generated from the shared contract, which has no `format`.
    expect(template.indexOf("format: 'text'")).toBe(-1);
    expect(
      template.indexOf(
        'AND the `operations` ledger — so one call covers both the spine and the plan',
      ),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => documents operations can only be written during explore_observables', () => {
    const needle = '`operations` can only be written during `explore_observables`';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: mint bootstrap => instructs ChaosWhisperer to create the quest as its first action', () => {
    const needle = 'call `mcp__dungeonmaster__create-quest` to create the new quest';
    const { mint } = dumpsterCreatePromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);
    const foundSlice = mint.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: mint bootstrap => instructs passing the user request verbatim as the userRequest arg to create-quest', () => {
    const needle = "passing the user's original request verbatim as the `userRequest` argument";
    const { mint } = dumpsterCreatePromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);
    const foundSlice = mint.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: mint bootstrap => opens the spec view without suppressing the chat panel', () => {
    const { mint } = dumpsterCreatePromptStatics.questBootstrap;

    // The intake session's transcript streams into the browser chat panel (the quest-driven
    // watcher tails spec-phase quests), so hiding the panel would throw away what the user
    // opened the page to watch.
    expect(mint.indexOf('chat=hidden')).toBe(-1);
  });

  it('VALID: mint bootstrap => instructs opening the plain spec view URL after quest creation', () => {
    const needle = '`<baseUrl>/<guildSlug>/quest/<questId>`';
    const { mint } = dumpsterCreatePromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);

    expect(mint.slice(foundIndex, foundIndex + needle.length)).toBe(needle);
  });

  it('VALID: mint bootstrap => instructs calling get-server-config before opening the URL', () => {
    const needle = 'mcp__dungeonmaster__get-server-config()';
    const { mint } = dumpsterCreatePromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);
    const foundSlice = mint.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: mint bootstrap => instructs opening the URL via xdg-open / open Bash fallback', () => {
    const needle = 'xdg-open <url> 2>/dev/null || open <url> 2>/dev/null || true';
    const { mint } = dumpsterCreatePromptStatics.questBootstrap;
    const foundIndex = mint.indexOf(needle);
    const foundSlice = mint.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => defers the quest bootstrap to a $QUEST_BOOTSTRAP placeholder', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.indexOf('$QUEST_BOOTSTRAP')).toBeGreaterThan(-1);
    expect(
      template.indexOf('call `mcp__dungeonmaster__create-quest` to create the new quest'),
    ).toBe(-1);
  });

  it('VALID: preCreated bootstrap => forbids create-quest and loads the pre-created quest by $QUEST_ID', () => {
    const { preCreated } = dumpsterCreatePromptStatics.questBootstrap;
    const forbidNeedle = 'Do NOT call `mcp__dungeonmaster__create-quest`';
    const forbidIndex = preCreated.indexOf(forbidNeedle);

    expect(preCreated.slice(forbidIndex, forbidIndex + forbidNeedle.length)).toBe(forbidNeedle);
    expect(preCreated.indexOf('get-quest` with `questId: $QUEST_ID')).toBeGreaterThan(-1);
    expect(
      preCreated.indexOf('call `mcp__dungeonmaster__create-quest` to create the new quest'),
    ).toBe(-1);
  });

  it('VALID: prompt template => defers the clarify tool choice to a $CLARIFY_INSTRUCTION placeholder', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;
    const { native, mcp } = dumpsterCreatePromptStatics.clarifyInstructions;

    expect(template.indexOf('$CLARIFY_INSTRUCTION')).toBeGreaterThan(-1);
    expect(native.indexOf('AskUserQuestion')).toBeGreaterThan(-1);
    expect(native.indexOf('mcp__dungeonmaster__ask-user-question')).toBe(-1);
    expect(mcp.indexOf('mcp__dungeonmaster__ask-user-question')).toBeGreaterThan(-1);
  });

  it('VALID: native clarify instruction => reads AskUserQuestion answers synchronously from the tool result', () => {
    const needle =
      'Answers come back synchronously as the tool result — read them directly from the result before continuing.';
    const { native } = dumpsterCreatePromptStatics.clarifyInstructions;
    const foundIndex = native.indexOf(needle);
    const foundSlice = native.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: mcp clarify instruction => tells the agent the answers arrive as the next user message on resume', () => {
    const needle = 'their answers arrive as your NEXT user message when the session resumes';
    const { mcp } = dumpsterCreatePromptStatics.clarifyInstructions;
    const foundIndex = mcp.indexOf(needle);
    const foundSlice = mcp.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => explains design decisions are captured from clarification answers in both flows', () => {
    const needle =
      'a `PostToolUse` hook captures native `AskUserQuestion` answers in the interactive flow, and the clarify-answer handler captures the browser answers in the headless flow.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => forbids authoring a redundant "ward passes" observable', () => {
    const needle = '**Ward is automatic — do NOT author a "ward passes" observable.**';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => no longer ships a "ward exits 0" example observable', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    expect(template.indexOf('Ward result: `{ type: "process-state"')).toBe(-1);
  });

  it('VALID: prompt template => explains that option label and description become the persisted rationale text', () => {
    const needle =
      'The option `label` and `description` values you write become the persisted `rationale` text on each design decision.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  describe('node package tagging', () => {
    it('VALID: prompt template => instructs tagging every node with packages as it is created', () => {
      const needle =
        'Tag every node with `packages: PackageName[]` as you create it — see "Node package tagging" in Structured Flow Rules for how to choose them and the seam rule every edge must satisfy.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => requires every edge to satisfy the seam rule', () => {
      const needle =
        "Every edge must satisfy the seam rule: its two endpoints' `packages` must share at least one package.";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => rejects an untagged node at persist time', () => {
      const needle =
        'Every node must carry `packages` (at least one) before it can be saved — the contract rejects an untagged node.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => explore_flows exit criteria require every node tagged, every tag in packagesAffected, and no unglued seams', () => {
      const needle =
        '**Exit:** Once flows and design decisions are persisted, every node is tagged with `packages`, every tag it carries appears in `packagesAffected`, and every edge satisfies the seam rule (no edge whose endpoints share zero packages — see "Node package tagging"), call `modify-quest` with `status: \'review_flows\'`';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => states the seam-rule invariant for every edge A -> B', () => {
      const needle =
        '**For every edge `A -> B`, `A.packages` and `B.packages` must share at least one package.** An edge whose endpoints share no package is a boundary crossed with nothing spanning it.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => instructs fixing a failing edge by widening an endpoint or inserting a glue node', () => {
      const needle =
        'Fix a failing edge by **widening one endpoint** — add the missing package to whichever side is the natural seam; that endpoint now IS the glue node — or by **inserting a node** carrying both packages when neither existing endpoint is the right seam.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => permits fanning node tagging out to the chaoswhisperer-gap-minion sub-agent pattern', () => {
      const needle =
        'On a large flow graph, fan the tagging work out to sub-agents (the `chaoswhisperer-gap-minion` Agent-tool pattern) over disjoint node batches';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => does not instruct inferring node packages from observable types', () => {
      const { template } = dumpsterCreatePromptStatics.prompt;

      expect(template.indexOf("we'll infer it for you")).toBe(-1);
      expect(template.indexOf('automatically infer')).toBe(-1);
    });

    it('VALID: prompt template => the "does NOT map observables to file paths" boundary is unchanged and not contradicted', () => {
      const needle =
        '**Does NOT:**\n- Map observables to file paths (Codeweavers decide files at build time)\n- Write actual code\n- Read files directly (exploration sub-agents only)\n- Define file names, folder structure, or code organization\n- Write raw mermaid diagrams (mermaid is auto-generated from structured nodes/edges)';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: web login example flow => tags every node with packages and marks the two glue nodes with both web and server', () => {
      const needle =
        '{ "id": "server-validates", "label": "Server validates?", "type": "decision", "packages": ["web", "server"] },\n    { "id": "set-cookie", "label": "Set auth cookie", "type": "action", "packages": ["web", "server"] },';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: CLI init example flow => tags every node with the single cli package', () => {
      const needle =
        'A single-package operational flow has no seam — every node carries the same one-element `packages` array, so the seam rule is trivially satisfied on every edge.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });
  });

  describe('packagesAffected entry object shape', () => {
    it('VALID: prompt template => packagesAffected entries are objects, not bare strings', () => {
      const needle =
        '4. **Declare `packagesAffected[]`** - Before the final approval gate, you MUST call `modify-quest` with `packagesAffected` populated with one ENTRY per package the implementation will touch — it is context every implementation session reads, and it is the set every node\'s `packages` tag (see "Node package tagging") must draw from. Each entry is an object, not a bare string:';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => location must be written with the ./ prefix, never bare', () => {
      const needle =
        "`location`: the package's repo-relative root, written WITH the `./` prefix — `'./packages/web'`, never the bare `'packages/web'` (the path contract rejects a bare relative path with no leading `./` or `../`).";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => usedBy is required and non-empty only when changeType is new', () => {
      const needle =
        "`usedBy` — REQUIRED and non-empty, ONLY when `changeType: 'new'`: the packages that will depend on this one once it exists. A brand-new package has no `package.json` on disk yet, so its reverse edges have no other source — you are the only place they can come from.";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => packagesAffected can open as early as explore_flows', () => {
      const needle =
        'You can open `packagesAffected` as early as `explore_flows`, one gate before observables';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });
  });
});
