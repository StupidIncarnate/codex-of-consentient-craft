import { dungeonmasterConfigContract } from './dungeonmaster-config-contract';
import { DungeonmasterConfigStub } from './dungeonmaster-config.stub';

describe('dungeonmasterConfigContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questFolder: "quest", wardCommands: {}} => parses minimal config', () => {
      const config = DungeonmasterConfigStub({
        questFolder: 'quest',
        wardCommands: {},
      });

      const parsed = dungeonmasterConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: {},
      });
    });

    it('VALID: {with wardCommands} => parses with ward commands', () => {
      const config = DungeonmasterConfigStub({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });

      const parsed = dungeonmasterConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });
    });

    it('VALID: {with extra fields} => parses and passes through additional properties', () => {
      const config = DungeonmasterConfigStub({
        questFolder: 'quest',
        wardCommands: { test: 'jest' },
        extraField: 'extra value',
        anotherField: 123,
      });

      const parsed = dungeonmasterConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: { test: 'jest' },
        extraField: 'extra value',
        anotherField: 123,
      });
    });

    it('VALID: {wardCommands with complex values} => parses with nested objects', () => {
      const config = DungeonmasterConfigStub({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: { command: 'eslint', flags: ['--fix'] },
          test: { command: 'jest', coverage: true },
        },
      });

      const parsed = dungeonmasterConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: { command: 'eslint', flags: ['--fix'] },
          test: { command: 'jest', coverage: true },
        },
      });
    });

    it('EDGE: {empty wardCommands} => parses with empty object', () => {
      const config = DungeonmasterConfigStub({
        questFolder: 'quest',
        wardCommands: {},
      });

      const parsed = dungeonmasterConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: {},
      });
    });

    it('EDGE: {questFolder with path} => parses folder path', () => {
      const config = DungeonmasterConfigStub({
        questFolder: 'src/dungeonmaster',
        wardCommands: {},
      });

      const parsed = dungeonmasterConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'src/dungeonmaster',
        wardCommands: {},
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_FOLDER: {questFolder: 123} => throws validation error for non-string', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          questFolder: 123 as never,
          wardCommands: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_QUEST_FOLDER: {questFolder: null} => throws validation error for null', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          questFolder: null as never,
          wardCommands: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_WARD_COMMANDS: {wardCommands: "commands"} => throws validation error for non-object', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          questFolder: 'quest',
          wardCommands: 'commands' as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_WARD_COMMANDS: {wardCommands: null} => throws validation error for null', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          questFolder: 'quest',
          wardCommands: null as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_WARD_COMMANDS: {wardCommands: []} => throws validation error for array', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          questFolder: 'quest',
          wardCommands: [] as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_MULTIPLE: {missing questFolder} => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          wardCommands: {},
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {missing wardCommands} => throws validation error', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({
          questFolder: 'quest',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {empty object} => throws validation error for all fields', () => {
      expect(() => {
        return dungeonmasterConfigContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
