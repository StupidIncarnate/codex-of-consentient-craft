import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 17 registrations with correct tool names', () => {
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
        'get-blight-checklist',
        'create-quest',
        'get-next-step',
        'run-ward',
        'run-riftcarver',
        'get-server-config',
        'get-quest-summary',
        'create-worktree',
        'quest-work',
        'get-quest-work',
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
        "Returns a quest's COMPLETE blight review surface, computed deterministically from a git diff: every changed file crossed with each applicable standards concern, paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. The `scope` parameter chooses WHICH changes are measured — the uncommitted working tree, what is committed here but not yet pushed, the last commit alone, or the whole quest from its pinned baseRef. Those four are NOT interchangeable and answer four different questions: read `scope`'s own description for what each one measures, and pass the one YOUR prompt names. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring.",
        'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.',
        'Returns the next dispatch instruction for /dumpster-launch: spawn-agents | run-ward | idle. Long-polls internally up to ~25s.',
        'Runs `npm run ward` synchronously over the whole monorepo and persists the result onto the named work item. Blocks until ward exits.',
        "Carves a quest its workspace: detects the base branch, creates the quest branch and git worktree, mirrors node_modules into it, and runs a scoped `ward run --only typecheck` to convergence — then persists the streamed log and applies the outcome to the ledger. Riftcarver is the FIRST item of every new quest's relay, so /dumpster-launch reaches it before any agent runs. It BLOCKS for minutes while the workspace is forged; AWAIT it and do not call get-next-step again until it returns. There is no mode — a carve has only one scope.",
        'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.',
        'Returns what ACTUALLY happened on a quest, which `get-quest` and a status do not answer: per-flow, per-track sign-off coverage (confirmed / unconfirmable / outstanding); every observable added AFTER the user approved the spec, with the role that added it; every `unconfirmable` verdict with its evidence AND the question that would close it AND the work item that raised it; and the durable `questNotes` grouped by kind, open questions first. A quest reaches `complete` when its operations ledger drains, not when its three sign-off tracks (codeweaver, flowrider, siegemaster) finish — signing is a durable proof record, and `unconfirmable` signs a unit exactly as `confirmed` does, so a complete quest can still carry real holes, real unapproved scope and real unanswered questions, and this is the only surface that shows them. Call it when picking up a quest someone else worked, before a review, or before deciding what is left to do.',
        "Creates an isolated git worktree at `worktrees/<name>` and returns its absolute path. This is the ONLY sanctioned way to get a worktree, and the tree it returns has four properties a hand-rolled `git worktree add` silently lacks: it sits under the repo's own `worktrees/`, its `node_modules` is mirrored so every command inside it resolves the worktree's OWN packages, its compiled output is seeded so ward, the hooks and the CLI can run there at all, and every link in it is audited to prove none resolves back into the main checkout. A worktree missing any of those looks completely normal until a run comes back green against code it never saw. IDEMPOTENT: asking twice for one name verifies and hands back the same tree rather than carving a second, which also makes this the call that REPAIRS a half-built one. Claude Code's own worktree command is blocked in this repo and names this tool.",
        "The single write surface every LLM step calls, across six payload kinds carried on `payload.kind`: `plan` (a planner's batches of pieces plus plannerMarks), `observations` (per-unit met/cant-meet/unmet marks with evidence, replacing this work item's own set), `amendment` (a whole replacement plan, never a patch, when the run reveals the plan is wrong), `outcome` (the declared word — done/unmet/empty/wall — and its reason, legal ONLY on a step holding no assigned units; a step holding units has its outcome DERIVED from its marks instead), `invalidation` (a siege fixer's flowId and reason, re-opening every unit on that flow — the bulk lever `reset-flow-signoffs` was), and `request` (a step this work item is blocked on and why — must be `mintableOnRequest: true` in your own family graph). Every refusal THROWS with a message naming exactly what to fix; nothing is persisted on a refusal, so fix what the message names and call again.",
        "The ONE startup call every LLM step makes. Pass `workItemId` and you get EVERYTHING this session needs to start, in one shape: your family, your step and its role, your scope (the flow and packages this item covers, plus the operation item's own text), the units you were ASSIGNED and the ones your step is answerable for — each with its verbatim text, the surface to check it at, its graph anchor and whatever the record already says about it — your piece and its planner notes, the notes running sessions left, the mark that caused you to exist, your flow rendered, your walk paths, your uncommitted and committed paths, the failing ward result with its check types and paths, the carve log, your git context and your lane. No session runs git, reads a plan file or enumerates a flow for itself after this. Pass `operationItemId` instead and you get that item's whole PLAN as markdown — the batches in the order they will execute, each piece with the units it claims, and a coverage table naming every in-scope unit NO piece claims, which is the defect a planner most needs to see and the one a JSON plan cannot show. Never pass both: they answer different questions and the call is refused rather than resolved by precedence.",
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
            description: 'Quest whose branch, worktree and preflight typecheck are carved',
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
  });
});
