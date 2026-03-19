import { WardFlow } from './ward-flow';

describe('WardFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 1 registration with correct tool name', () => {
      const registrations = WardFlow();

      const names = registrations.map(({ name }) => name);

      expect(registrations).toHaveLength(1);
      expect(names).toStrictEqual(['ward-detail']);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = WardFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual(['function']);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = WardFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'Show detailed errors for a file in a ward run. Supports per-package path via packagePath.',
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = WardFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual(['object']);
    });
  });
});
