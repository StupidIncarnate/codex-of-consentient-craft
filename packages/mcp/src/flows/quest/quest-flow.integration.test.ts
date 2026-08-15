import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 15 registrations with correct tool names', () => {
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
        "Returns PathSeeker's phased planningNotes for a quest (scope classification, surface reports, synthesis, walk findings, review report). Used by PathSeeker on resume to re-read already-committed phase artifacts.",
        "Returns a quest's COMPLETE QA surface, enumerated deterministically from its flow graphs: every terminal, every labelled decision branch, every observable with its verbatim text and the surface to check it at, every off-map probe family, plus the walk paths — and which units are still outstanding. Flowrider, Groundstomper and Siegemaster call this instead of reading the spec and enumerating by hand. Pass `track` ('flowrider' | 'groundstomper' | 'siegemaster') — the ROLE you were dispatched as, not the sign-off field you write — and REMAINING counts the units in YOUR denominator, which is exactly what the signal-back completion gate refuses `done` on. Flowrider and Groundstomper both write flowriderSignoff but are measured over DISJOINT package kinds, so the other's name returns the complement of your work; both also narrow to the quest's runtime flows, the only set they are measured over. Pass `packageNames` too when your operation item declares any, or you read a whole-quest remainder while your own gate clears at zero.",
        "Returns a quest's COMPLETE blight review surface, computed deterministically from the git diff against the quest's pinned baseRef: every changed file paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. Blightscout calls this instead of re-deriving the diff by hand. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring.",
        'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.',
        'Returns the next dispatch instruction for /dumpster-launch: spawn-agents | run-ward | idle. Long-polls internally up to ~25s.',
        'Runs `npm run ward` synchronously in changed or full mode and persists the result onto the named work item. Blocks until ward exits.',
        'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.',
        "Clears Siegemaster's walk sign-offs across ONE flow so the walk can be redone honestly: every observable, node, edge and off-map probe family on that flow loses its `siegemasterSignoff`. Flowrider's track is never touched. Call this after fixing a defect the walk exposed — the sign-offs already written measured a system that has changed underneath them. The flow must be declared by the calling work item's operation item, and a `walk-reset` note carrying your reason and the cleared count is appended to quest.planningNotes.questNotes.",
        'Returns what ACTUALLY happened on a quest, which `get-quest` and a status do not answer: per-flow, per-track sign-off coverage (confirmed / unconfirmable / outstanding); every observable added AFTER the user approved the spec, with the role that added it; every `unconfirmable` verdict with its evidence AND the question that would close it AND the work item that raised it; and the durable `questNotes` grouped by kind, open questions first. A quest reaches `complete` when both tracks have SIGNED every unit — and `unconfirmable` signs a unit exactly as `confirmed` does — so a green quest can carry real holes, real unapproved scope and real unanswered questions, and this is the only surface that shows them. Call it when picking up a quest someone else worked, before a review, or before deciding what is left to do.',
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
      ]);
    });

    it('VALID: {get-blight-checklist} => inputSchema is the JSON schema generated from getBlightChecklistInputContract', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'get-blight-checklist');

      // The exact match proves the registration wired the get-blight-checklist input contract
      // (not some other contract, and not a hand-written stand-in schema) through zodToJsonSchema.
      // `scope` reaching the PUBLISHED schema is what makes the tool usable by the role it exists
      // for: the contract is `.strict()`, Blightscout's prompt directs it to pass `scope: 'commit'`
      // on every call, and the signal-back completion gate quotes that same call back to it on a
      // refusal — so a schema without the property rejects every one of those calls outright.
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
            enum: ['quest', 'commit'],
            description:
              "Which diff to enumerate. 'commit' measures the LAST COMMIT alone (HEAD~1...HEAD) — one session's output, which is what a Blightscout item is dispatched against and what its signal-back completion gate recomputes. 'quest' (the default) measures the whole quest diff from the pinned baseRef, every file every session has touched.",
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

    it('VALID: {get-qa-checklist} => inputSchema advertises questId, flowId, the THREE-member track enum AND packageNames', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'get-qa-checklist');

      // What reaches the PUBLISHED schema is what makes the tool callable at all: the input contract
      // is `.strict()`, so a caller passing a key the schema never advertised is a hard parse
      // rejection rather than an ignored argument. Both of the additions here are that failure
      // measured — `groundstomper` missing from the enum left the one role that needs its own
      // denominator unable to name itself, and `packageNames` missing left a session holding a
      // sliced operation item reading a whole-quest remainder its own gate never computes.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'The ID of the quest to enumerate the QA surface for',
          },
          flowId: {
            type: 'string',
            minLength: 1,
            description:
              'Optional flow id. Omit to enumerate every flow on the quest; pass one to scope the checklist to the flow this session owns.',
          },
          track: {
            type: 'string',
            enum: ['flowrider', 'groundstomper', 'siegemaster'],
            description:
              "Your verification track — the ROLE you were dispatched as, not the sign-off field you write. Pass it and REMAINING counts the units in YOUR denominator still carrying no sign-off, which is exactly what the signal-back completion gate will refuse `done` on. 'flowrider' and 'groundstomper' both write flowriderSignoff but are measured over DISJOINT package kinds (groundstomper: the browser-reachable ones), so passing the other role's name returns the complement of your own work. Both also narrow the flow set to the quest's runtime flows, the only set they are measured over. Omit it to list every flow with no track applied.",
          },
          packageNames: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            description:
              'The package names your operation item declares, if it declares any. Pass them and REMAINING is narrowed to your slice the same way the completion gate narrows it — a per-package flowrider item owns the units whose node tags exactly its one package, and the seam item owns the glue. Omit them when your item declares none, and nothing is narrowed.',
          },
        },
        required: ['questId'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });
  });
});
