import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 16 registrations with correct tool names', () => {
      const registrations = QuestFlow();

      const names = registrations.map(({ name }) => name);

      expect(names).toStrictEqual([
        'get-quest',
        'modify-quest',
        'start-quest',
        'get-quest-status',
        'list-quests',
        'list-guilds',
        'get-quest-planning-notes',
        'get-qa-checklist',
        'get-blight-checklist',
        'create-quest',
        'get-next-step',
        'run-ward',
        'run-riftcarver',
        'get-server-config',
        'reset-flow-signoffs',
        'get-quest-summary',
      ]);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = QuestFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual([
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
      ]);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = QuestFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'Retrieves a quest by its ID',
        'Modifies an existing quest using upsert semantics',
        'Starts orchestration for a quest by its ID. Returns a process ID for tracking.',
        'Gets the current status of an orchestration process by its process ID.',
        'Lists all quests in the .dungeonmaster-quests folder.',
        'Lists all registered guilds with their IDs, names, paths, and quest counts.',
        "Returns a quest's `planningNotes`: the `operationPlans` a planning sub-agent persisted, the per-unit `blightLedger` a reviewer writes, and the durable `questNotes` side channel. An operator calls this to read a plan back off the quest — a sub-agent returns a short pointer, never the plan body, so this is the only place the pieces themselves exist.",
        "Returns a quest's COMPLETE QA surface, enumerated deterministically from its flow graphs: every terminal, every labelled decision branch, every observable with its verbatim text and the surface to check it at, every off-map probe family, plus the walk paths — and which units are still outstanding. A Codeweaver, Flowrider or Siegemaster session — and the reviewer it summons — calls this instead of reading the spec and enumerating by hand. **Pass `operationItemId` — it IS the scope.** Everything the scope depends on already lives on that item (its role is the track, plus its flowIds and packageNames), so what comes back is the FULL set of units your track owns on this item, and REMAINING is the ones still carrying no sign-off on it. That is the work list, not a gate — nothing refuses your `done` over it. There is nothing else to pass and no way to widen it by accident. An item whose role has no sign-off track (spiritmender, warpgate) is told so plainly: its scope is the block already in its Operation Context. `flowId` alone is the un-scoped browse form for a caller that owns no operation item, and may never be combined with `operationItemId`.",
        "Returns a quest's COMPLETE blight review surface, computed deterministically from a git diff: every changed file crossed with each applicable standards concern, paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. The `scope` parameter chooses WHICH changes are measured — the uncommitted working tree, what is committed here but not yet pushed, the last commit alone, or the whole quest from its pinned baseRef. Those four are NOT interchangeable and answer four different questions: read `scope`'s own description for what each one measures, and pass the one YOUR prompt names. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring.",
        'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.',
        'Returns the next dispatch instruction for /dumpster-launch: spawn-agents | run-ward | idle. Long-polls internally up to ~25s.',
        'Runs `npm run ward` synchronously in changed or full mode and persists the result onto the named work item. Blocks until ward exits.',
        "Carves a quest its workspace: detects the base branch, creates the quest branch and git worktree, mirrors node_modules into it, and runs the preflight build to convergence — then persists the streamed log and applies the outcome to the ledger. Riftcarver is the FIRST item of every new quest's relay, so /dumpster-launch reaches it before any agent runs. It BLOCKS for minutes while the workspace is forged; AWAIT it and do not call get-next-step again until it returns. There is no mode — a carve has only one scope.",
        'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.',
        "Clears Siegemaster's walk sign-offs across ONE flow so the walk can be redone honestly: every observable, node, edge and off-map probe family on that flow loses its `siegemasterSignoff`. Flowrider's track is never touched. Call this after fixing a defect the walk exposed — the sign-offs already written measured a system that has changed underneath them. The flow must be declared by the calling work item's operation item, and a `walk-reset` note carrying your reason and the cleared count is appended to quest.planningNotes.questNotes.",
        'Returns what ACTUALLY happened on a quest, which `get-quest` and a status do not answer: per-flow, per-track sign-off coverage (confirmed / unconfirmable / outstanding); every observable added AFTER the user approved the spec, with the role that added it; every `unconfirmable` verdict with its evidence AND the question that would close it AND the work item that raised it; and the durable `questNotes` grouped by kind, open questions first. A quest reaches `complete` when its operations ledger drains, not when its three sign-off tracks (codeweaver, flowrider, siegemaster) finish — signing is a durable proof record, and `unconfirmable` signs a unit exactly as `confirmed` does, so a complete quest can still carry real holes, real unapproved scope and real unanswered questions, and this is the only surface that shows them. Call it when picking up a quest someone else worked, before a review, or before deciding what is left to do.',
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = QuestFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual([
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
      ]);
    });

    it('VALID: {get-blight-checklist} => inputSchema is the JSON schema generated from getBlightChecklistInputContract', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'get-blight-checklist');

      // The exact match proves the registration wired the get-blight-checklist input contract
      // (not some other contract, and not a hand-written stand-in schema) through zodToJsonSchema.
      // `scope` reaching the PUBLISHED schema is what makes the tool usable by the caller it exists
      // for: the contract is `.strict()`, and a reviewer-minion passes `scope: 'working-tree'` on
      // every call — so a schema without the property rejects every one of those calls outright.
      // THE DESCRIPTION IS THE ONLY THING THAT TELLS AN AGENT WHICH SCOPE IS ITS OWN, so it is pinned
      // in full rather than by a substring: it said `unpushed` for as long as worker-minions committed
      // their own chunks, and kept saying it after they stopped — by which point that range held the
      // planner's round-document commit and nothing else. There is deliberately NO id argument: the
      // round is simply what is uncommitted. `since-ref` is likewise absent from the enum — its only
      // caller is the server-side signal-back gate, and no agent can compute the work-item `startRef`
      // it measures from.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'The ID of the quest to enumerate the blight review surface for',
          },
          scope: {
            type: 'string',
            enum: ['quest', 'commit', 'working-tree', 'unpushed'],
            description:
              "Which diff to enumerate. 'working-tree' measures ONE ROUND — everything changed since HEAD and NOT YET COMMITTED, INCLUDING untracked files — and is the reviewer's scope: no sub-agent commits anything, so a pass reaches its reviewer entirely uncommitted and the reviewer commits once at the end. Enumerate before that commit, or this scope is empty. 'unpushed' measures what is committed in this worktree and not yet pushed (@{upstream}..HEAD); before a reviewer commits, that holds nothing from the pass it is grading. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's landed output, for a caller auditing history. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched, and is what a post-push re-review passes.",
          },
        },
        required: ['questId'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });

    it('VALID: {reset-flow-signoffs} => inputSchema advertises questId, workItemId, flowId AND reason, all required', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'reset-flow-signoffs');

      // `workItemId` reaching the published schema is what makes the tool callable at all: there is
      // no ambient caller identity over MCP stdio, so a schema that omitted it would leave the
      // orchestrator with no operation item to scope the reset against. The contract is `.strict()`,
      // so an unadvertised key would be a hard parse rejection rather than an ignored argument.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'The ID of the quest the flow belongs to',
          },
          workItemId: {
            type: 'string',
            minLength: 1,
            description:
              'The work item you were dispatched against. Its linked operation item is what declares which flows you may reset',
          },
          flowId: {
            type: 'string',
            minLength: 1,
            description:
              'The flow whose siegemasterSignoff values are cleared. Must be in your scope',
          },
          reason: {
            type: 'string',
            minLength: 1,
            description:
              'Why the walk is being reset — what changed underneath the sign-offs. Recorded verbatim as the walk-reset note detail',
          },
        },
        required: ['questId', 'workItemId', 'flowId', 'reason'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });

    it('VALID: {run-riftcarver} => inputSchema advertises questId and workItemId, and NO mode', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'run-riftcarver');

      // The absence of `mode` is the load-bearing half. The contract is `.strict()`, so a
      // /dumpster-launch loop that copied the run-ward call shape and passed a mode would be a hard
      // parse rejection rather than an ignored argument — and a rejection on the FIRST item of every
      // new quest's relay stalls the whole dispatcher.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'Quest whose branch, worktree and preflight build are carved',
          },
          workItemId: {
            type: 'string',
            format: 'uuid',
            description:
              'Work item the carve is being executed for — echo `result.workItemId` from the get-next-step step verbatim',
          },
        },
        required: ['questId', 'workItemId'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });

    it('VALID: {get-quest-summary} => inputSchema advertises questId and NOTHING else', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'get-quest-summary');

      // The summary is deliberately whole-quest: a caller cannot narrow to one flow or one track,
      // because the holes it exists to surface are exactly the ones the caller did not know to ask
      // for. The contract is `.strict()`, so an advertised narrowing key would be a hard parse
      // rejection rather than an ignored argument — and its absence here is what keeps it honest.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'The ID of the quest to summarize the verification state of',
          },
        },
        required: ['questId'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });

    it('VALID: {get-qa-checklist} => inputSchema advertises questId, operationItemId AND flowId, with no track or packageNames', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'get-qa-checklist');

      // What reaches the PUBLISHED schema is what makes the tool callable at all: the input contract
      // is `.strict()`, so a caller passing a key the schema never advertised is a hard parse
      // rejection rather than an ignored argument. `operationItemId` REPLACED `track` and
      // `packageNames` rather than joining them, so their ABSENCE here is the assertion that matters:
      // both were optional, so omitting either silently WIDENED the measurement to the whole quest
      // while the caller's own completion gate went on refusing `done` against the narrow set.
      // The contract also rejects flowId alongside operationItemId, but that lives in a superRefine,
      // which zod-to-json-schema cannot express and drops — so the pair is absent here by design and
      // is asserted in get-qa-checklist-input-contract.test.ts instead.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'The ID of the quest to enumerate the QA surface for',
          },
          operationItemId: {
            type: 'string',
            minLength: 1,
            description:
              "The operation item this work is for — the ONE argument that scopes this call. Everything the denominator depends on is already on that item (its role is the track, plus its flowIds and packageNames), and the server derives them with the same transformer every reader of this coverage uses, so what you read here is your track's work list. Pass it and REMAINING is your remainder. A role with no sign-off track (spiritmender, warpgate) is told so plainly: its denominator is the scope block in its Operation Context, not the flow graph.",
          },
          flowId: {
            type: 'string',
            minLength: 1,
            description:
              'Browse ONE flow with no track applied — for a caller that owns no operation item. Never pass it alongside operationItemId: the item already says which flows are in scope, and a hand-picked flow is how a session ends up measuring something other than what its coverage scope measures.',
          },
        },
        required: ['questId'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });
  });
});
