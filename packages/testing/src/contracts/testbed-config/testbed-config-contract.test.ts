import { testbedConfigContract } from './testbed-config-contract';
import { TestbedConfigStub } from './testbed-config.stub';

describe('testbedConfigContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questFolder: "quest", wardCommands: {}} => parses minimal config', () => {
      const config = TestbedConfigStub({
        questFolder: 'quest',
        wardCommands: {},
      });

      const parsed = testbedConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: {},
      });
    });

    it('VALID: {with wardCommands} => parses with ward commands', () => {
      const config = TestbedConfigStub({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });

      const parsed = testbedConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });
    });

    it('VALID: {with extra fields} => parses and passes through additional properties', () => {
      const config = TestbedConfigStub({
        questFolder: 'quest',
        wardCommands: { test: 'jest' },
        extraField: 'extra value',
        anotherField: 123,
      });

      const parsed = testbedConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: { test: 'jest' },
        extraField: 'extra value',
        anotherField: 123,
      });
    });

    it('VALID: {wardCommands with complex values} => parses with nested objects', () => {
      const config = TestbedConfigStub({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: { command: 'eslint', flags: ['--fix'] },
          test: { command: 'jest', coverage: true },
        },
      });

      const parsed = testbedConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'dungeonmaster',
        wardCommands: {
          lint: { command: 'eslint', flags: ['--fix'] },
          test: { command: 'jest', coverage: true },
        },
      });
    });

    it('EDGE: {empty wardCommands} => parses with empty object', () => {
      const config = TestbedConfigStub({
        questFolder: 'quest',
        wardCommands: {},
      });

      const parsed = testbedConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'quest',
        wardCommands: {},
      });
    });

    it('EDGE: {questFolder with path} => parses folder path', () => {
      const config = TestbedConfigStub({
        questFolder: 'src/dungeonmaster',
        wardCommands: {},
      });

      const parsed = testbedConfigContract.parse(config);

      expect(parsed).toStrictEqual({
        questFolder: 'src/dungeonmaster',
        wardCommands: {},
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questFolder: 123} => throws validation error for non-string', () => {
      expect(() => {
        return testbedConfigContract.parse({
          questFolder: 123 as never,
          wardCommands: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {questFolder: null} => throws validation error for null', () => {
      expect(() => {
        return testbedConfigContract.parse({
          questFolder: null as never,
          wardCommands: {},
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {wardCommands: "commands"} => throws validation error for non-object', () => {
      expect(() => {
        return testbedConfigContract.parse({
          questFolder: 'quest',
          wardCommands: 'commands' as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID: {wardCommands: null} => throws validation error for null', () => {
      expect(() => {
        return testbedConfigContract.parse({
          questFolder: 'quest',
          wardCommands: null as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID: {wardCommands: []} => throws validation error for array', () => {
      expect(() => {
        return testbedConfigContract.parse({
          questFolder: 'quest',
          wardCommands: [] as never,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID: {missing questFolder} => throws validation error', () => {
      expect(() => {
        return testbedConfigContract.parse({
          wardCommands: {},
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {missing wardCommands} => throws validation error', () => {
      expect(() => {
        return testbedConfigContract.parse({
          questFolder: 'quest',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {empty object} => throws validation error for all fields', () => {
      expect(() => {
        return testbedConfigContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
