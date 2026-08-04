import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 13 registrations with correct tool names', () => {
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
        "Returns a quest's COMPLETE QA surface, enumerated deterministically from its flow graphs: every terminal, every labelled decision branch, every observable with its verbatim text and the surface to check it at, every off-map probe family, plus the walk paths — and which units still carry no disposition in the QA ledger. Siegemaster calls this instead of reading the spec and enumerating by hand. `remainingItemIds` empty is the only state in which a siegemaster item may signal done.",
        "Returns a quest's COMPLETE blight review surface, computed deterministically from the git diff against the quest's pinned baseRef: every changed file paired with its per-unit disposition in quest.planningNotes.blightLedger — and which units still carry no disposition. Blightwarden calls this instead of re-deriving the diff by hand. A quest with no pinned baseRef, or an empty diff, states that plainly rather than erroring.",
        'Creates a new quest seeded with the supplied userRequest and returns { questId, guildSlug }. ChaosWhisperer at /dumpster-create startup calls this as its first action; the user never types a quest id, but the caller MUST pass the original user request text so it is captured on the quest from the moment of creation.',
        'Returns the next dispatch instruction for /dumpster-launch: spawn-agents | run-ward | idle. Long-polls internally up to ~25s.',
        'Runs `npm run ward` synchronously in changed or full mode and persists the result onto the named work item. Blocks until ward exits.',
        'Returns the dungeonmaster server config { baseUrl, port } so slash commands can point the browser at the running server.',
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
      ]);
    });

    it('VALID: {get-blight-checklist} => inputSchema is the JSON schema generated from getBlightChecklistInputContract', () => {
      const registrations = QuestFlow();

      const registration = registrations.find(({ name }) => name === 'get-blight-checklist');

      // The exact match proves the registration wired the get-blight-checklist input contract
      // (not some other contract, and not a hand-written stand-in schema) through zodToJsonSchema:
      // questId is the only property, required, and the object rejects unknown keys.
      expect(registration?.inputSchema).toStrictEqual({
        type: 'object',
        properties: {
          questId: {
            type: 'string',
            minLength: 1,
            description: 'The ID of the quest to enumerate the blight review surface for',
          },
        },
        required: ['questId'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      });
    });
  });
});
