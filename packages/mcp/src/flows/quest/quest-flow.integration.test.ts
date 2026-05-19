import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 11 registrations with correct tool names', () => {
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
      ]);
    });
  });
});
