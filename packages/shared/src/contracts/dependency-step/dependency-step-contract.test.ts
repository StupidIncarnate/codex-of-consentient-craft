import { dependencyStepContract } from './dependency-step-contract';
import { DependencyStepStub } from './dependency-step.stub';

describe('dependencyStepContract', () => {
  it('VALID: {complete step} => parses successfully', () => {
    const step = DependencyStepStub({
      id: 'create-user-api',
      name: 'Create user API endpoint',
      description: 'Implement the REST endpoint for user creation',
      observablesSatisfied: ['login-redirects-to-dashboard'],
      dependsOn: [],
      filesToCreate: ['src/routes/users.ts'],
      filesToModify: ['src/routes/index.ts'],
    });

    expect(step).toStrictEqual({
      id: 'create-user-api',
      name: 'Create user API endpoint',
      description: 'Implement the REST endpoint for user creation',
      observablesSatisfied: ['login-redirects-to-dashboard'],
      dependsOn: [],
      filesToCreate: ['src/routes/users.ts'],
      filesToModify: ['src/routes/index.ts'],
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {empty arrays} => parses with empty arrays', () => {
    const step = DependencyStepStub({
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
    });

    expect(step).toStrictEqual({
      id: 'create-login-api',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {multiple dependsOn} => parses step dependencies', () => {
    const step = DependencyStepStub({
      dependsOn: ['setup-database', 'create-schema'],
    });

    expect(step).toStrictEqual({
      id: 'create-login-api',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: ['setup-database', 'create-schema'],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {multiple files} => parses file operations', () => {
    const step = DependencyStepStub({
      filesToCreate: ['src/controllers/user-controller.ts', 'src/models/user-model.ts'],
      filesToModify: ['src/app.ts', 'src/routes/index.ts'],
    });

    expect(step).toStrictEqual({
      id: 'create-login-api',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: ['src/controllers/user-controller.ts', 'src/models/user-model.ts'],
      filesToModify: ['src/app.ts', 'src/routes/index.ts'],
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const step = DependencyStepStub();

    expect(step).toStrictEqual({
      id: 'create-login-api',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {with exportName} => parses step with export name', () => {
    const step = DependencyStepStub({
      exportName: 'questExecuteBroker',
    });

    expect(step.exportName).toBe('questExecuteBroker');
  });

  it('VALID: {with inputContracts and outputContracts} => parses contract references', () => {
    const step = DependencyStepStub({
      inputContracts: ['LoginCredentials', 'AuthToken'],
      outputContracts: ['UserSession'],
    });

    expect(step).toStrictEqual({
      id: 'create-login-api',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: ['LoginCredentials', 'AuthToken'],
      outputContracts: ['UserSession'],
    });
  });

  it('VALID: {without new fields} => backward compat defaults to empty arrays and no exportName', () => {
    const step = dependencyStepContract.parse({
      id: 'legacy-step',
      name: 'Legacy Step',
      description: 'A step without new fields',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
    });

    expect(step).toStrictEqual({
      id: 'legacy-step',
      name: 'Legacy Step',
      description: 'A step without new fields',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('EDGE: {empty inputContracts, non-empty outputContracts} => parses mixed contract arrays', () => {
    const step = DependencyStepStub({
      inputContracts: [],
      outputContracts: ['LoginCredentials'],
    });

    expect(step).toStrictEqual({
      id: 'create-login-api',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      inputContracts: [],
      outputContracts: ['LoginCredentials'],
    });
  });

  it('INVALID_ID: {id: "Bad-Id"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      dependencyStepContract.parse({
        id: 'Bad-Id',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidId).toThrow(/invalid_string/u);
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    const parseEmptyName = (): unknown =>
      dependencyStepContract.parse({
        id: 'valid-step',
        name: '',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseEmptyName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_OBSERVABLES: {observablesSatisfied: ["Bad"]} => throws validation error', () => {
    const parseInvalidObservables = (): unknown =>
      dependencyStepContract.parse({
        id: 'valid-step',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: ['Bad'],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidObservables).toThrow(/invalid_string/u);
  });

  it('INVALID_DEPENDS_ON: {dependsOn: ["Bad"]} => throws validation error', () => {
    const parseInvalidDependsOn = (): unknown =>
      dependencyStepContract.parse({
        id: 'valid-step',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: ['Bad'],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidDependsOn).toThrow(/invalid_string/u);
  });
});
