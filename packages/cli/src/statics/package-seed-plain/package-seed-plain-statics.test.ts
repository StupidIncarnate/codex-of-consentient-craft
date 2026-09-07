import { packageSeedPlainStatics } from './package-seed-plain-statics';

describe('packageSeedPlainStatics', () => {
  describe('library', () => {
    it('VALID: {type: library} => scalar fields match the plain-seed shape', () => {
      const { library } = packageSeedPlainStatics;

      expect({
        barrel: library.barrel,
        dependencies: library.dependencies,
        bin: library.bin,
        compilerOptions: library.compilerOptions,
        extraInclude: library.extraInclude,
        buildRootDir: library.buildRootDir,
        jestKind: library.jestKind,
        e2eEligible: library.e2eEligible,
        exportsDot: library.exportsDot,
      }).toStrictEqual({
        barrel: {
          fileName: 'statics.ts',
          exportPaths: ['./src/statics/__NAME__/__NAME__-statics'],
        },
        dependencies: {},
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
      });
    });

    it('VALID: {type: library} => seeds exactly the statics file and its test, since the fallback detector has no positive file signal', () => {
      const { library } = packageSeedPlainStatics;

      expect(library.files.map((file) => file.path)).toStrictEqual([
        'src/statics/__NAME__/__NAME__-statics.ts',
        'src/statics/__NAME__/__NAME__-statics.test.ts',
      ]);
    });
  });

  describe('programmatic-service', () => {
    it('VALID: {type: programmatic-service} => scalar fields match the plain-seed shape', () => {
      const programmaticService = packageSeedPlainStatics['programmatic-service'];

      expect({
        barrel: programmaticService.barrel,
        dependencies: programmaticService.dependencies,
        bin: programmaticService.bin,
        compilerOptions: programmaticService.compilerOptions,
        extraInclude: programmaticService.extraInclude,
        buildRootDir: programmaticService.buildRootDir,
        jestKind: programmaticService.jestKind,
        e2eEligible: programmaticService.e2eEligible,
        exportsDot: programmaticService.exportsDot,
      }).toStrictEqual({
        barrel: {
          fileName: 'flows.ts',
          exportPaths: ['./src/flows/__NAME__/__NAME__-flow'],
        },
        dependencies: { '__SCOPE__/shared': '*' },
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
      });
    });

    it('VALID: {type: programmatic-service} => seeds src/state/, src/responders/, src/flows/ and src/startup/ files in write order', () => {
      const programmaticService = packageSeedPlainStatics['programmatic-service'];

      expect(programmaticService.files.map((file) => file.path)).toStrictEqual([
        'src/state/__NAME__/__NAME__-state.ts',
        'src/state/__NAME__/__NAME__-state.proxy.ts',
        'src/state/__NAME__/__NAME__-state.test.ts',
        'src/responders/__NAME__/run/__NAME__-run-responder.ts',
        'src/responders/__NAME__/run/__NAME__-run-responder.proxy.ts',
        'src/responders/__NAME__/run/__NAME__-run-responder.test.ts',
        'src/flows/__NAME__/__NAME__-flow.ts',
        'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
        'src/startup/start-__NAME__.ts',
        'src/startup/start-__NAME__.integration.test.ts',
      ]);
    });

    it('VALID: {type: programmatic-service} => the startup file path is src/startup/start-__NAME__.ts', () => {
      const STARTUP_FILE_INDEX = 8;

      expect(packageSeedPlainStatics['programmatic-service'].files[STARTUP_FILE_INDEX].path).toBe(
        'src/startup/start-__NAME__.ts',
      );
    });

    it('VALID: {type: programmatic-service} => the startup file is an async-namespace object, which is what the detector regex keys on', () => {
      const STARTUP_FILE_INDEX = 8;
      const ASYNC_NAMESPACE_PATTERN = /export\s+const\s+\w+\s*=\s*\{[\s\S]*?\basync\s+\(/u;

      expect(
        ASYNC_NAMESPACE_PATTERN.test(
          packageSeedPlainStatics['programmatic-service'].files[STARTUP_FILE_INDEX].contents,
        ),
      ).toBe(true);
    });
  });

  describe('eslint-plugin', () => {
    it('VALID: {type: eslint-plugin} => scalar fields match the plain-seed shape', () => {
      const eslintPlugin = packageSeedPlainStatics['eslint-plugin'];

      expect({
        barrel: eslintPlugin.barrel,
        dependencies: eslintPlugin.dependencies,
        bin: eslintPlugin.bin,
        compilerOptions: eslintPlugin.compilerOptions,
        extraInclude: eslintPlugin.extraInclude,
        buildRootDir: eslintPlugin.buildRootDir,
        jestKind: eslintPlugin.jestKind,
        e2eEligible: eslintPlugin.e2eEligible,
        exportsDot: eslintPlugin.exportsDot,
      }).toStrictEqual({
        barrel: null,
        dependencies: { '__SCOPE__/shared': '*' },
        bin: {},
        compilerOptions: {},
        extraInclude: [],
        buildRootDir: './src',
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: true,
      });
    });

    it('VALID: {type: eslint-plugin} => seeds src/brokers/rule/, src/responders/config/create/ and src/index files', () => {
      const eslintPlugin = packageSeedPlainStatics['eslint-plugin'];

      expect(eslintPlugin.files.map((file) => file.path)).toStrictEqual([
        'src/brokers/rule/__NAME__/rule-__NAME__-broker.ts',
        'src/brokers/rule/__NAME__/rule-__NAME__-broker.proxy.ts',
        'src/brokers/rule/__NAME__/rule-__NAME__-broker.test.ts',
        'src/responders/config/create/config-create-responder.ts',
        'src/responders/config/create/config-create-responder.proxy.ts',
        'src/responders/config/create/config-create-responder.test.ts',
        'src/index.ts',
        'src/index.test.ts',
      ]);
    });

    it('VALID: {type: eslint-plugin} => seeds a src/brokers/rule/ file and a src/responders/config/create/ file, which is what the detector keys on (bin is already asserted empty above)', () => {
      const eslintPlugin = packageSeedPlainStatics['eslint-plugin'];
      const RULE_BROKER_FILE_INDEX = 0;
      const CREATE_RESPONDER_FILE_INDEX = 3;

      expect({
        ruleBrokerPath: eslintPlugin.files[RULE_BROKER_FILE_INDEX].path,
        createResponderPath: eslintPlugin.files[CREATE_RESPONDER_FILE_INDEX].path,
      }).toStrictEqual({
        ruleBrokerPath: 'src/brokers/rule/__NAME__/rule-__NAME__-broker.ts',
        createResponderPath: 'src/responders/config/create/config-create-responder.ts',
      });
    });
  });

  describe('hook-handlers', () => {
    it('VALID: {type: hook-handlers} => scalar fields match the plain-seed shape', () => {
      const hookHandlers = packageSeedPlainStatics['hook-handlers'];

      expect({
        barrel: hookHandlers.barrel,
        dependencies: hookHandlers.dependencies,
        bin: hookHandlers.bin,
        compilerOptions: hookHandlers.compilerOptions,
        extraInclude: hookHandlers.extraInclude,
        buildRootDir: hookHandlers.buildRootDir,
        jestKind: hookHandlers.jestKind,
        e2eEligible: hookHandlers.e2eEligible,
        exportsDot: hookHandlers.exportsDot,
      }).toStrictEqual({
        barrel: null,
        dependencies: { '__SCOPE__/shared': '*' },
        bin: {
          '__NAME__-pre-tool-use': './dist/bin/__NAME__-pre-tool-use.js',
          '__NAME__-session-start': './dist/bin/__NAME__-session-start.js',
        },
        compilerOptions: {},
        extraInclude: ['bin/**/*'],
        buildRootDir: null,
        jestKind: 'node',
        e2eEligible: false,
        exportsDot: false,
      });
    });

    it('VALID: {type: hook-handlers} => seeds src/responders/hook/ and two bin/ files', () => {
      const hookHandlers = packageSeedPlainStatics['hook-handlers'];

      expect(hookHandlers.files.map((file) => file.path)).toStrictEqual([
        'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.ts',
        'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.proxy.ts',
        'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.test.ts',
        'bin/__NAME__-pre-tool-use.ts',
        'bin/__NAME__-session-start.ts',
      ]);
    });

    it('VALID: {type: hook-handlers} => both bin files carry the literal process.argv the detector keys on (bin entry count is already asserted above)', () => {
      const hookHandlers = packageSeedPlainStatics['hook-handlers'];
      const PRE_TOOL_USE_BIN_INDEX = 3;
      const SESSION_START_BIN_INDEX = 4;

      expect({
        preToolUseHasProcessArgv:
          hookHandlers.files[PRE_TOOL_USE_BIN_INDEX].contents.includes('process.argv'),
        sessionStartHasProcessArgv:
          hookHandlers.files[SESSION_START_BIN_INDEX].contents.includes('process.argv'),
      }).toStrictEqual({
        preToolUseHasProcessArgv: true,
        sessionStartHasProcessArgv: true,
      });
    });
  });
});
