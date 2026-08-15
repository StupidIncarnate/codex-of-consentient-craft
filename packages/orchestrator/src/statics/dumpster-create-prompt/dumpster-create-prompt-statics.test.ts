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

  it('VALID: prompt template => forbids writing operations at any status, since the implementation ledger is derived rather than authored', () => {
    const needle =
      '- NEVER write `operations`. You do not author the implementation ledger and there is no call that would let you: `operations` is not on the modify-quest allowlist at any status you occupy.';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => requires re-checking the two derived-ledger inputs (node tags, contract sources) as the last explore_observables step', () => {
    const needle =
      '**Re-check the two derived-ledger inputs, LAST, against the spec as it stands right now.**';
    const { template } = dumpsterCreatePromptStatics.prompt;
    const foundIndex = template.indexOf(needle);
    const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

    expect(foundSlice).toBe(needle);
  });

  it('VALID: prompt template => no longer instructs the unadvertised format param on get-quest', () => {
    const { template } = dumpsterCreatePromptStatics.prompt;

    // The advertised get-quest schema is generated from the shared contract, which has no `format`.
    expect(template.indexOf("format: 'text'")).toBe(-1);
    expect(
      template.indexOf('so one call covers the whole spine, including the step-13 re-check'),
    ).toBeGreaterThan(-1);
  });

  it('VALID: prompt template => documents operations is not writable at any status, since the ledger is derived rather than authored', () => {
    const needle = '`operations` is not writable at ANY status you occupy';
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

    it('VALID: web login example flow => tags every node with packages and marks the two glue nodes with both sides of the seam', () => {
      const needle =
        '{ "id": "server-validates", "label": "Server validates?", "type": "decision", "packages": ["<ui-package>", "<api-package>"] },\n    { "id": "set-cookie", "label": "Set auth cookie", "type": "action", "packages": ["<ui-package>", "<api-package>"] },';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: worked example flows => name packages with fill-in placeholders, never a real package of the repo the prompt was authored in', () => {
      const { template } = dumpsterCreatePromptStatics.prompt;

      // A concrete name in the example is a name an LLM copies into a quest for a repo that has no
      // such package — which lands as a node tag absent from `packagesAffected`, the exact write
      // `flows_approved` refuses. The slot spelling is what makes "substitute your own" unmissable.
      expect({
        authoringRepoUiName: template.indexOf('"packages": ["web"]'),
        authoringRepoApiName: template.indexOf('"packages": ["server"]'),
        authoringRepoSeamPair: template.indexOf('"packages": ["web", "server"]'),
        authoringRepoCliName: template.indexOf('"packages": ["cli"]'),
        uiSlotPresent: template.includes('"packages": ["<ui-package>"]'),
        cliSlotPresent: template.includes('"packages": ["<cli-package>"]'),
      }).toStrictEqual({
        authoringRepoUiName: -1,
        authoringRepoApiName: -1,
        authoringRepoSeamPair: -1,
        authoringRepoCliName: -1,
        uiSlotPresent: true,
        cliSlotPresent: true,
      });
    });

    it('VALID: web login example flow => says the package names are slots filled from packagesAffected', () => {
      const needle =
        '**Example flow (web login):** every value below is real example data EXCEPT the package names — `<ui-package>` and `<api-package>` are slots, and you write the actual names from this quest';
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
        "`location`: the package's repo-relative root, written WITH the `./` prefix — `'./packages/<name>'`, never the bare `'packages/<name>'` (the path contract rejects a bare relative path with no leading `./` or `../`).";
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

    it('VALID: prompt template => the name example is a package-role name, not one of the repo the prompt was authored in', () => {
      const needle =
        "`name`: the package's directory name as it is spelled on disk under the workspace root — kebab-case, never the scoped npm name (`'auth-service'`, not `'@acme/auth-service'`).";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });
  });

  // The implementation ledger is no longer authored by ChaosWhisperer at spec time — the
  // orchestrator DERIVES it at Start from the flow nodes' `packages` tags and the contracts'
  // `source` paths (one codeweaver item per (package, flow) cell plus a foundation item per
  // package). There is no `packageNames`/`flowIds` gate for ChaosWhisperer to satisfy anymore;
  // its remaining job is keeping those two derived-from inputs accurate.
  describe('derived implementation ledger', () => {
    it('VALID: prompt template => explains the ledger is derived from node package tags and contract source paths at Start', () => {
      const needle =
        'At Start the orchestrator DERIVES the implementation ledger from the node tags and contract sources — one codeweaver item per (package, flow) cell plus a foundation item per package, ordered dependencies-first — appends the verify tail after it, and Codeweaver sessions relay through the items one at a time.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => tells the user how the derived ledger will slice the work before the observables approval gate', () => {
      const needle =
        '**Say how the work will be sliced** - The user does not see an implementation plan at this gate, because there is not one yet: the ledger is derived at Start.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => names the two derived-ledger inputs ChaosWhisperer is responsible for keeping accurate', () => {
      const needle =
        '**Make the two inputs the implementation ledger is derived from correct.** You do not author that ledger — the orchestrator computes it at Start — but it is computed from YOUR spec, so its quality is entirely yours:';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    // A contract's `source` is one path and a contract is one-to-many, so a property whose real
    // file sits in another package needs its own. Without that, the whole contract routes to the
    // package its own path names — and for a deliverable no observable mentions, the contract was
    // the only carrier, so nobody ever sees it.
    it('VALID: prompt template => tells the author a property may carry its own source when the contract spans packages, and why', () => {
      const needle =
        "**A contract's `source` is one path, but a contract is often one-to-many:** when one of its properties describes a file in a DIFFERENT package, give that property its own `source` — otherwise the whole contract routes to the package its own path names, and a property whose file lives elsewhere reaches no session at all.";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => says a seam node lands in BOTH packages’ cells, so a missing tag loses that half', () => {
      const needle =
        "A node tagging TWO packages lands in BOTH their cells — a seam has two halves and each side builds its own, in build-order — so a package you leave off a seam node loses its half of that node entirely, and the observables you attributed to it reach no session's scope.";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });
  });

  describe('observable package attribution', () => {
    it('VALID: prompt template => lists package among the observable fields with the resolve-on-save rule', () => {
      const needle =
        "- `package`: the ONE package this outcome is read in, drawn from the owning node's `packages`. **Omit it when that node tags exactly one package** — the save resolves it from the node, so there is nothing for you to restate. On a node tagging MORE than one there is nothing to inherit and an omission is refused: name the side of the seam this observable sits on, and name one the node already tags.";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => states the approved-gate attribution rule with its seam-forced waiver and zero-observable exemption', () => {
      const needle =
        "A seam node's observables must also cover the seam it declares. At `approved`, every package a multi-package node tags has to be either **observed** (some observable on that node names it) or **seam-forced** (dropping it would leave an incident edge with nothing spanning it — the edge set already asserts it, so it owes no observable of its own). A package that is neither is rejected by name. Nodes carrying zero observables are exempt entirely, so a decision node may carry any number of packages.";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: Observable Format => the single-package example omits package and says the save fills it in', () => {
      const needle =
        'On a node tagging exactly ONE package, leave `package` out — the save fills it in from the node:\n```json\n{\n  "id": "check-login-api-called",\n  "type": "api-call",\n  "description": "POST /api/auth/login called with credentials"\n}\n```';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: Observable Format => the seam-node example carries an explicit package on every observable', () => {
      const needle =
        '"observables": [\n  { "id": "check-login-api-called", "type": "api-call", "description": "POST /api/auth/login called with credentials", "package": "<api-package>" },\n  { "id": "check-redirect-dashboard", "type": "ui-state", "description": "redirected to /dashboard", "package": "<ui-package>" }\n]';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });
  });

  describe('e2e ownership in the type-tag routing', () => {
    it('VALID: prompt template => routes ui-state to Groundstomper Playwright and to the Siegemaster hand-walk', () => {
      const needle =
        "- `ui-state` — Visual/DOM changes (→ widgets, → Groundstomper Playwright, → Siegemaster's hand-walk)";
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => routes api-call to the Flowrider integration harness or Groundstomper Playwright', () => {
      const needle =
        '- `api-call` — HTTP requests/responses (→ responders, adapters, → Flowrider integration harness, or Groundstomper Playwright when the call is observed through the browser)';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => splits the authoring roles on whether the outcome is visible through a browser', () => {
      const needle =
        '**The two authoring roles split on whether the outcome is visible through a browser.** Groundstomper owns Playwright and only Playwright; Flowrider owns the integration and unit suites below the browser.';
      const { template } = dumpsterCreatePromptStatics.prompt;
      const foundIndex = template.indexOf(needle);
      const foundSlice = template.slice(foundIndex, foundIndex + needle.length);

      expect(foundSlice).toBe(needle);
    });

    it('VALID: prompt template => never routes Playwright to Siegemaster', () => {
      const { template } = dumpsterCreatePromptStatics.prompt;

      expect(template.indexOf('Siegemaster Playwright')).toBe(-1);
      expect(template.indexOf('tells Siegemaster to run Playwright')).toBe(-1);
    });
  });
});
