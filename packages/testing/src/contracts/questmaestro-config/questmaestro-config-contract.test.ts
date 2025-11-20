import { questmaestroConfigContract } from './questmaestro-config-contract';
import { QuestmaestroConfigStub } from './questmaestro-config.stub';

describe('questmaestroConfigContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questFolder: "quest", wardCommands: {}} => parses minimal config', () => {
      const config = QuestmaestroConfigStub({
        questFolder: 'quest',
        wardCommands: {},
      });

      const parsed = questmaestroConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: {},
      });
    });

    it('VALID: {with wardCommands} => parses with ward commands', () => {
      const config = QuestmaestroConfigStub({
        questFolder: 'questmaestro',
        wardCommands: {
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });

      const parsed = questmaestroConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'questmaestro',
        wardCommands: {
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });
    });

    it('VALID: {with extra fields} => parses and passes through additional properties', () => {
      const config = QuestmaestroConfigStub({
        questFolder: 'quest',
        wardCommands: { test: 'jest' },
        extraField: 'extra value',
        anotherField: 123,
      });

      const parsed = questmaestroConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: { test: 'jest' },
        extraField: 'extra value',
        anotherField: 123,
      });
    });

    it('VALID: {wardCommands with complex values} => parses with nested objects', () => {
      const config = QuestmaestroConfigStub({
        questFolder: 'questmaestro',
        wardCommands: {
          lint: { command: 'eslint', flags: ['--fix'] },
          test: { command: 'jest', coverage: true },
        },
      });

      const parsed = questmaestroConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'questmaestro',
        wardCommands: {
          lint: { command: 'eslint', flags: ['--fix'] },
          test: { command: 'jest', coverage: true },
        },
      });
    });

    it('EDGE: {empty wardCommands} => parses with empty object', () => {
      const config = QuestmaestroConfigStub({
        questFolder: 'quest',
        wardCommands: {},
      });

      const parsed = questmaestroConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: {},
      });
    });

    it('EDGE: {questFolder with path} => parses folder path', () => {
      const config = QuestmaestroConfigStub({
        questFolder: 'src/questmaestro',
        wardCommands: {},
      });

      const parsed = questmaestroConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'src/questmaestro',
        wardCommands: {},
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_FOLDER: {questFolder: 123} => throws validation error for non-string', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          questFolder: 123 as never,
          wardCommands: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_QUEST_FOLDER: {questFolder: null} => throws validation error for null', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          questFolder: null as never,
          wardCommands: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_WARD_COMMANDS: {wardCommands: "commands"} => throws validation error for non-object', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          questFolder: 'quest',
          wardCommands: 'commands' as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_WARD_COMMANDS: {wardCommands: null} => throws validation error for null', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          questFolder: 'quest',
          wardCommands: null as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_WARD_COMMANDS: {wardCommands: []} => throws validation error for array', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          questFolder: 'quest',
          wardCommands: [] as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_MULTIPLE: {missing questFolder} => throws validation error', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          wardCommands: {},
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {missing wardCommands} => throws validation error', () => {
      expect(() => {
        return questmaestroConfigContract.parse({
          questFolder: 'quest',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {empty object} => throws validation error for all fields', () => {
      expect(() => {
        return questmaestroConfigContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
