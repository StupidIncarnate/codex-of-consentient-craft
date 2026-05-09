import { dependencyStepContract } from './dependency-step-contract';
import { DependencyStepStub } from './dependency-step.stub';

describe('dependencyStepContract', () => {
  describe('valid steps', () => {
    it('VALID: {complete step} => parses successfully', () => {
      const step = DependencyStepStub({
        id: 'create-user-api',
        slice: 'backend',
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
        instructions: ['Update PURPOSE comment to mention the new guard logic'],
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
        slice: 'backend',
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
        instructions: ['Update PURPOSE comment to mention the new guard logic'],
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
        slice: 'backend',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        instructions: [],
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
        slice: 'backend',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        instructions: [],
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

    it('VALID: {uses and instructions default to []} => parses without uses or instructions field', () => {
      const step = dependencyStepContract.parse({
        id: 'create-login-api',
        slice: 'backend',
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
        slice: 'backend',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        instructions: [],
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
        slice: 'backend',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        instructions: [],
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

    it('VALID: {operational step with focusAction instead of focusFile} => parses successfully', () => {
      const step = dependencyStepContract.parse({
        id: 'run-ward-verification',
        slice: 'verification',
        name: 'Run ward and verify green',
        assertions: [
          {
            prefix: 'VALID',
            input: '{ward invocation}',
            expected: 'exits 0 with zero failures across lint, typecheck, unit',
          },
        ],
        observablesSatisfied: ['ward-green'],
        dependsOn: ['sweep-complete'],
        focusAction: {
          kind: 'verification',
          description: 'npm run ward and assert zero failures',
        },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['WardResult'],
      });

      expect(step).toStrictEqual({
        id: 'run-ward-verification',
        slice: 'verification',
        name: 'Run ward and verify green',
        assertions: [
          {
            prefix: 'VALID',
            input: '{ward invocation}',
            expected: 'exits 0 with zero failures across lint, typecheck, unit',
          },
        ],
        instructions: [],
        observablesSatisfied: ['ward-green'],
        dependsOn: ['sweep-complete'],
        focusAction: {
          kind: 'verification',
          description: 'npm run ward and assert zero failures',
        },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['WardResult'],
        uses: [],
      });
    });

    it('VALID: {multiple dependsOn} => parses step dependencies', () => {
      const step = DependencyStepStub({
        dependsOn: ['setup-database', 'create-schema'],
      });

      expect(step).toStrictEqual({
        id: 'create-login-api',
        slice: 'backend',
        name: 'Test Step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        instructions: [],
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
    it('INVALID: {assertions: []} => throws validation error for empty assertions', () => {
      const parseEmptyAssertions = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          slice: 'backend',
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

    it('INVALID: {missing slice} => throws validation error', () => {
      const parseMissingSlice = (): unknown =>
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
          outputContracts: ['Void'],
        });

      expect(parseMissingSlice).toThrow(/Required/u);
    });

    it('INVALID: {slice: "Not-Kebab"} => throws validation error', () => {
      const parseInvalidSlice = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          slice: 'Not-Kebab',
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

      expect(parseInvalidSlice).toThrow(/invalid_string/u);
    });

    it('VALID: {neither focusFile nor focusAction} => parses successfully (XOR enforced by quest-step-has-focus-target-guard)', () => {
      const step = dependencyStepContract.parse({
        id: 'valid-step',
        slice: 'backend',
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

      expect(step).toStrictEqual({
        id: 'valid-step',
        slice: 'backend',
        name: 'Test',
        assertions: [
          {
            prefix: 'VALID',
            input: '{input}',
            expected: 'result',
          },
        ],
        instructions: [],
        observablesSatisfied: [],
        dependsOn: [],
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      });
    });

    it('VALID: {both focusFile and focusAction} => parses successfully (XOR enforced by quest-step-has-focus-target-guard)', () => {
      const step = dependencyStepContract.parse({
        id: 'valid-step',
        slice: 'backend',
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
        focusAction: { kind: 'verification', description: 'Run ward' },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
      });

      expect(step).toStrictEqual({
        id: 'valid-step',
        slice: 'backend',
        name: 'Test',
        assertions: [
          {
            prefix: 'VALID',
            input: '{input}',
            expected: 'result',
          },
        ],
        instructions: [],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: { path: 'src/file.ts' },
        focusAction: { kind: 'verification', description: 'Run ward' },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      });
    });

    it('INVALID: {inputContracts: []} => throws validation error for empty array', () => {
      const parseEmptyInputContracts = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          slice: 'backend',
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

    it('INVALID: {outputContracts: []} => throws validation error for empty array', () => {
      const parseEmptyOutputContracts = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          slice: 'backend',
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

    it('INVALID: {id: "Bad-Id"} => throws validation error', () => {
      const parseInvalidId = (): unknown =>
        dependencyStepContract.parse({
          id: 'Bad-Id',
          slice: 'backend',
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

    it('INVALID: {name: ""} => throws validation error', () => {
      const parseEmptyName = (): unknown =>
        dependencyStepContract.parse({
          id: 'valid-step',
          slice: 'backend',
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
