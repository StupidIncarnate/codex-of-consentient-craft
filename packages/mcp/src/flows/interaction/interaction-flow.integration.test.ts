import { InteractionFlow } from './interaction-flow';

describe('InteractionFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 2 registrations with correct tool names', () => {
      const registrations = InteractionFlow();

      const names = registrations.map(({ name }) => name);

      expect(names).toStrictEqual(['signal-back', 'ask-user-question']);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = InteractionFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual(['function', 'function']);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = InteractionFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'Signals the CLI with step completion status, progress, or blocking conditions',
        "Ask the user clarifying questions with structured options. Fire-and-forget: returns immediately. The user's answers arrive as the next user message in the session.",
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = InteractionFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual(['object', 'object']);
    });
  });
});
