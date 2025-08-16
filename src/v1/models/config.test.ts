import { QuestmaestroConfig, DEFAULT_CONFIG, isValidConfig } from './config';

describe('config model', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.questFolder).toBe('questmaestro');
      expect(DEFAULT_CONFIG.discoveryComplete).toBe(false);
    });
  });

  describe('isValidConfig', () => {
    it('should return true for valid minimal config', () => {
      const config = {};
      expect(isValidConfig(config)).toBe(true);
    });

    it('should return true for valid full config', () => {
      const config: QuestmaestroConfig = {
        questFolder: 'custom-quests',
        discoveryComplete: true,
        wardCommands: {
          all: 'npm run validate',
          lint: 'npm run lint',
          typecheck: 'npm run typecheck',
          test: 'npm test',
          build: 'npm run build',
        },
        project: {
          name: 'my-project',
          type: 'web',
          technologies: ['react', 'typescript'],
          conventions: {
            testPattern: '*.spec.ts',
            sourcePaths: ['src', 'lib'],
          },
        },
      };
      expect(isValidConfig(config)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidConfig(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidConfig(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isValidConfig('string')).toBe(false);
      expect(isValidConfig(123)).toBe(false);
      expect(isValidConfig(true)).toBe(false);
      expect(isValidConfig([])).toBe(false);
    });

    it('should return false for invalid questFolder type', () => {
      const config = { questFolder: 123 };
      expect(isValidConfig(config)).toBe(false);
    });

    it('should return false for invalid discoveryComplete type', () => {
      const config = { discoveryComplete: 'true' };
      expect(isValidConfig(config)).toBe(false);
    });

    it('should return false for invalid wardCommands type', () => {
      const config = { wardCommands: 'invalid' };
      expect(isValidConfig(config)).toBe(false);
    });

    it('should return false for invalid ward command field types', () => {
      const config = {
        wardCommands: {
          all: 123, // Should be string
        },
      };
      expect(isValidConfig(config)).toBe(false);
    });

    it('should allow partial ward commands', () => {
      const config = {
        wardCommands: {
          lint: 'npm run lint',
          // Other commands are optional
        },
      };
      expect(isValidConfig(config)).toBe(true);
    });

    it('should allow empty ward commands object', () => {
      const config = { wardCommands: {} };
      expect(isValidConfig(config)).toBe(true);
    });

    it('should handle null wardCommands', () => {
      const config = { wardCommands: null };
      expect(isValidConfig(config)).toBe(false);
    });
  });

  describe('TypeScript types', () => {
    it('should allow valid configs to be typed', () => {
      // This is a compile-time test - if it compiles, it passes
      const config: QuestmaestroConfig = {
        questFolder: 'quests',
        discoveryComplete: false,
        wardCommands: {
          all: 'npm run ward:all',
        },
      };
      expect(config).toBeDefined();
    });

    it('should handle optional fields', () => {
      const config: QuestmaestroConfig = {};
      expect(config).toBeDefined();
    });
  });
});
