import { RegistryDanglingLinkError } from './registry-dangling-link-error';

describe('RegistryDanglingLinkError', () => {
  describe('constructor()', () => {
    it('VALID: {ingredientName: "quest", linkTarget: "no-such-ingredient", registeredNames: [guild, quest, operation]} => names the dangling link and every registered name', () => {
      const error = new RegistryDanglingLinkError({
        ingredientName: 'quest',
        linkTarget: 'no-such-ingredient',
        registeredNames: ['guild', 'quest', 'operation'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RegistryDanglingLinkError',
        message:
          'ingredient "quest" links to "no-such-ingredient", which this registry does not hold. Registered ingredient names: guild, quest, operation',
      });
    });

    it('EDGE: {registeredNames: [guild]} => names the single registered ingredient', () => {
      const error = new RegistryDanglingLinkError({
        ingredientName: 'guild',
        linkTarget: 'no-such-ingredient',
        registeredNames: ['guild'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RegistryDanglingLinkError',
        message:
          'ingredient "guild" links to "no-such-ingredient", which this registry does not hold. Registered ingredient names: guild',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RegistryDanglingLinkError => returns true', () => {
      const error = new RegistryDanglingLinkError({
        ingredientName: 'quest',
        linkTarget: 'no-such-ingredient',
        registeredNames: ['guild'],
      });

      expect(error instanceof RegistryDanglingLinkError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RegistryDanglingLinkError({
        ingredientName: 'quest',
        linkTarget: 'no-such-ingredient',
        registeredNames: ['guild'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
