import { questmaestroConfigBroker } from './questmaestro-config-broker';

describe('questmaestroConfigBroker', () => {
  describe('create()', () => {
    it('VALID: => returns QuestMaestro ESLint config with plugins and rules', () => {
      const config = questmaestroConfigBroker();

      expect(config).toHaveProperty('plugins');
      expect(config).toHaveProperty('rules');
      expect(config.plugins).toHaveProperty('eslint-comments');
    });

    it('VALID: config includes currently enabled QuestMaestro rules', () => {
      const config = questmaestroConfigBroker();

      expect(config.rules).toHaveProperty(
        '@questmaestro/enforce-object-destructuring-params',
        'error',
      );
    });

    it('VALID: config includes TypeScript rules => returns config with TypeScript rules enabled', () => {
      const config = questmaestroConfigBroker();

      expect(config.rules).toHaveProperty('@typescript-eslint/no-explicit-any', 'error');
      expect(config.rules).toHaveProperty('@typescript-eslint/explicit-function-return-type');
    });

    it('VALID: config includes eslint-comments rules', () => {
      const config = questmaestroConfigBroker();

      expect(config.rules).toHaveProperty('eslint-comments/no-unlimited-disable', 'error');
      expect(config.rules).toHaveProperty('eslint-comments/no-use');
    });
  });
});
