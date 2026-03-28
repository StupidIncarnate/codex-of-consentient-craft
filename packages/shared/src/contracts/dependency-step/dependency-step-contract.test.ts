import { dependencyStepContract } from './dependency-step-contract';
import { DependencyStepStub } from './dependency-step.stub';

describe('dependencyStepContract', () => {
  describe('valid steps', () => {
    it('VALID: {complete step} => parses successfully', () => {
      const step = DependencyStepStub({
        id: 'create-user-api',
        name: 'Create user API endpoint',
        assertions: [
          {
            prefix: 'VALID',
            input: '{user: validUser}',
            expected: 'creates user successfully',
          },
          {
            prefix: 'INVALID',
            field: 'email',
            input: '{email: "bad"}',
            expected: 'throws validation error',
          },
        ],
        observablesSatisfied: ['login-redirects-to-dashboard'],
        dependsOn: ['setup-database'],
        focusFile: {
          path: 'src/brokers/user/create/user-create-broker.ts',
        },
        accompanyingFiles: [
          {
            path: 'src/brokers/user/create/user-create-broker.test.ts',
          },
          {
            path: 'src/brokers/user/create/user-create-broker.proxy.ts',
          },
        ],
        exportName: 'userCreateBroker',
        inputContracts: ['LoginCredentials'],
        outputContracts: ['UserSession'],
        uses: ['userContract', 'sessionContract'],
      });

      expect(step).toStrictEqual({
        id: 'create-user-api',
        name: 'Create user API endpoint',
        assertions: [
          {
            prefix: 'VALID',
            input: '{user: validUser}',
            expected: 'creates user successfully',
          },
          {
            prefix: 'INVALID',
            field: 'email',
            input: '{email: "bad"}',
            expected: 'throws validation error',
          },
        ],
        observablesSatisfied: ['login-redirects-to-dashboard'],
        dependsOn: ['setup-database'],
        focusFile: {
          path: 'src/brokers/user/create/user-create-broker.ts',
        },
        accompanyingFiles: [
          {
            path: 'src/brokers/user/create/user-create-broker.test.ts',
          },
          {
            path: 'src/brokers/user/create/user-create-broker.proxy.ts',
          },
        ],
        exportName: 'userCreateBroker',
        inputContracts: ['LoginCredentials'],
        outputContracts: ['UserSession'],
        uses: ['userContract', 'sessionContract'],
      });
    });

    it('VALID: {stub defaults} => uses default values', () => {
      const step = DependencyStepStub();

      expect(step).toStrictEqual({
        id: 'create-login-api',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: {
          path: 'src/brokers/login/create/login-create-broker.ts',
        },
        accompanyingFiles: [
          {
            path: 'src/brokers/login/create/login-create-broker.test.ts',
          },
          {
            path: 'src/brokers/login/create/login-create-broker.proxy.ts',
          },
        ],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      });
    });

    it('VALID: {inputContracts: ["Void"], outputContracts: ["UserSession"]} => parses void input with real output', () => {
      const step = DependencyStepStub({
        inputContracts: ['Void'],
        outputContracts: ['UserSession'],
      });

      expect(step).toStrictEqual({
        id: 'create-login-api',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: {
          path: 'src/brokers/login/create/login-create-broker.ts',
        },
        accompanyingFiles: [
          {
            path: 'src/brokers/login/create/login-create-broker.test.ts',
          },
          {
            path: 'src/brokers/login/create/login-create-broker.proxy.ts',
          },
        ],
        inputContracts: ['Void'],
        outputContracts: ['UserSession'],
        uses: [],
      });
    });

    it('VALID: {uses defaults to []} => parses without uses field', () => {
      const step = dependencyStepContract.parse({
        id: 'create-login-api',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: {
          path: 'src/brokers/login/create/login-create-broker.ts',
        },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
      });

      expect(step).toStrictEqual({
        id: 'create-login-api',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: {
          path: 'src/brokers/login/create/login-create-broker.ts',
        },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      });
    });

    it('VALID: {with exportName} => parses step with export name', () => {
      const step = DependencyStepStub({
        exportName: 'questExecuteBroker',
      });

      expect(step).toStrictEqual({
        id: 'create-login-api',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: {
          path: 'src/brokers/login/create/login-create-broker.ts',
        },
        accompanyingFiles: [
          {
            path: 'src/brokers/login/create/login-create-broker.test.ts',
          },
          {
            path: 'src/brokers/login/create/login-create-broker.proxy.ts',
          },
        ],
        exportName: 'questExecuteBroker',
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      });
    });

    it('VALID: {without exportName} => parses step without export name', () => {
      const step = DependencyStepStub();

      expect('exportName' in step).toBe(false);
    });

    it('VALID: {multiple dependsOn} => parses step dependencies', () => {
      const step = DependencyStepStub({
        dependsOn: ['setup-database', 'create-schema'],
      });

      expect(step).toStrictEqual({
        id: 'create-login-api',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: ['setup-database', 'create-schema'],
        focusFile: {
          path: 'src/brokers/login/create/login-create-broker.ts',
        },
        accompanyingFiles: [
          {
            path: 'src/brokers/login/create/login-create-broker.test.ts',
          },
          {
            path: 'src/brokers/login/create/login-create-broker.proxy.ts',
          },
        ],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      });
    });
  });

  describe('invalid steps', () => {
    it('INVALID_ASSERTIONS: {assertions: []} => throws validation error for empty assertions', () => {
      const parseEmptyAssertions = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          name: 'Test',
          assertions: [],
          observablesSatisfied: [],
          dependsOn: [],
          focusFile: { path: 'src/file.ts' },
          accompanyingFiles: [],
          inputContracts: ['Void'],
          outputContracts: ['Void'],
        });

      expect(parseEmptyAssertions).toThrow(/Array must contain at least 1 element/u);
    });

    it('INVALID_FOCUS_FILE: {missing focusFile} => throws validation error', () => {
      const parseMissingFocusFile = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          name: 'Test',
          assertions: [
            {
              prefix: 'VALID',
              input: '{input}',
              expected: 'result',
            },
          ],
          observablesSatisfied: [],
          dependsOn: [],
          accompanyingFiles: [],
          inputContracts: ['Void'],
          outputContracts: ['Void'],
        });

      expect(parseMissingFocusFile).toThrow(/Required/u);
    });

    it('INVALID_INPUT_CONTRACTS: {inputContracts: []} => throws validation error for empty array', () => {
      const parseEmptyInputContracts = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          name: 'Test',
          assertions: [
            {
              prefix: 'VALID',
              input: '{input}',
              expected: 'result',
            },
          ],
          observablesSatisfied: [],
          dependsOn: [],
          focusFile: { path: 'src/file.ts' },
          accompanyingFiles: [],
          inputContracts: [],
          outputContracts: ['Void'],
        });

      expect(parseEmptyInputContracts).toThrow(/Array must contain at least 1 element/u);
    });

    it('INVALID_OUTPUT_CONTRACTS: {outputContracts: []} => throws validation error for empty array', () => {
      const parseEmptyOutputContracts = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          name: 'Test',
          assertions: [
            {
              prefix: 'VALID',
              input: '{input}',
              expected: 'result',
            },
          ],
          observablesSatisfied: [],
          dependsOn: [],
          focusFile: { path: 'src/file.ts' },
          accompanyingFiles: [],
          inputContracts: ['Void'],
          outputContracts: [],
        });

      expect(parseEmptyOutputContracts).toThrow(/Array must contain at least 1 element/u);
    });

    it('INVALID_ID: {id: "Bad-Id"} => throws validation error', () => {
      const parseInvalidId = (): unknown =>
        dependencyStepContract.parse({
          id: 'Bad-Id',
          name: 'Test',
          assertions: [
            {
              prefix: 'VALID',
              input: '{input}',
              expected: 'result',
            },
          ],
          observablesSatisfied: [],
          dependsOn: [],
          focusFile: { path: 'src/file.ts' },
          accompanyingFiles: [],
          inputContracts: ['Void'],
          outputContracts: ['Void'],
        });

      expect(parseInvalidId).toThrow(/invalid_string/u);
    });

    it('INVALID_NAME: {name: ""} => throws validation error', () => {
      const parseEmptyName = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          name: '',
          assertions: [
            {
              prefix: 'VALID',
              input: '{input}',
              expected: 'result',
            },
          ],
          observablesSatisfied: [],
          dependsOn: [],
          focusFile: { path: 'src/file.ts' },
          accompanyingFiles: [],
          inputContracts: ['Void'],
          outputContracts: ['Void'],
        });

      expect(parseEmptyName).toThrow(/String must contain at least 1 character/u);
    });
  });
});
