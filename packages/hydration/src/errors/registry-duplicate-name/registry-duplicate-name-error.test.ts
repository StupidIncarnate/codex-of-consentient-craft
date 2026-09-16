import { RegistryDuplicateNameError } from './registry-duplicate-name-error';

describe('RegistryDuplicateNameError', () => {
  describe('constructor()', () => {
    it('VALID: {firstRegistryKey: "quests", secondRegistryKey: "tasks", ingredientName: "quest"} => names both keys and the shared name', () => {
      const error = new RegistryDuplicateNameError({
        firstRegistryKey: 'quests',
        secondRegistryKey: 'tasks',
        ingredientName: 'quest',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RegistryDuplicateNameError',
        message: 'registry keys "quests" and "tasks" both declare the ingredient name "quest"',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RegistryDuplicateNameError => returns true', () => {
      const error = new RegistryDuplicateNameError({
        firstRegistryKey: 'quests',
        secondRegistryKey: 'tasks',
        ingredientName: 'quest',
      });

      expect(error instanceof RegistryDuplicateNameError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RegistryDuplicateNameError({
        firstRegistryKey: 'quests',
        secondRegistryKey: 'tasks',
        ingredientName: 'quest',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
