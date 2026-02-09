import { dependencyStepContract } from './dependency-step-contract';
import { DependencyStepStub } from './dependency-step.stub';

describe('dependencyStepContract', () => {
  it('VALID: {complete step} => parses successfully', () => {
    const step = DependencyStepStub({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Create user API endpoint',
      description: 'Implement the REST endpoint for user creation',
      observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      dependsOn: [],
      filesToCreate: ['src/routes/users.ts'],
      filesToModify: ['src/routes/index.ts'],
      status: 'in_progress',
    });

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Create user API endpoint',
      description: 'Implement the REST endpoint for user creation',
      observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      dependsOn: [],
      filesToCreate: ['src/routes/users.ts'],
      filesToModify: ['src/routes/index.ts'],
      status: 'in_progress',
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
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {multiple dependsOn} => parses step dependencies', () => {
    const step = DependencyStepStub({
      dependsOn: ['b8c9d0e1-f2a3-4b4c-d5e6-7f8a9b0c1d2e', 'c9d0e1f2-a3b4-4c5d-e6f7-8a9b0c1d2e3f'],
    });

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: ['b8c9d0e1-f2a3-4b4c-d5e6-7f8a9b0c1d2e', 'c9d0e1f2-a3b4-4c5d-e6f7-8a9b0c1d2e3f'],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
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
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: ['src/controllers/user-controller.ts', 'src/models/user-model.ts'],
      filesToModify: ['src/app.ts', 'src/routes/index.ts'],
      status: 'pending',
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const step = DependencyStepStub();

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
      inputContracts: [],
      outputContracts: [],
    });
  });

  it('VALID: {with new status fields} => parses status tracking fields', () => {
    const step = DependencyStepStub({
      status: 'blocked',
      startedAt: '2024-01-15T10:00:00.000Z',
      blockingReason: 'Waiting for role followup',
      blockingType: 'needs_role_followup',
    });

    expect(step.status).toBe('blocked');
    expect(step.startedAt).toBe('2024-01-15T10:00:00.000Z');
    expect(step.blockingReason).toBe('Waiting for role followup');
    expect(step.blockingType).toBe('needs_role_followup');
  });

  it('VALID: {with currentSession} => parses session tracking', () => {
    const step = DependencyStepStub({
      status: 'in_progress',
      currentSession: {
        sessionId: 'session-123',
        agentRole: 'codeweaver',
        startedAt: '2024-01-15T10:00:00.000Z',
      },
    });

    expect(step.currentSession).toStrictEqual({
      sessionId: 'session-123',
      agentRole: 'codeweaver',
      startedAt: '2024-01-15T10:00:00.000Z',
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
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
      inputContracts: ['LoginCredentials', 'AuthToken'],
      outputContracts: ['UserSession'],
    });
  });

  it('VALID: {without new fields} => backward compat defaults to empty arrays and no exportName', () => {
    const step = dependencyStepContract.parse({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Legacy Step',
      description: 'A step without new fields',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
    });

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Legacy Step',
      description: 'A step without new fields',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
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
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
      status: 'pending',
      inputContracts: [],
      outputContracts: ['LoginCredentials'],
    });
  });

  it('INVALID_ID: {id: "bad"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      dependencyStepContract.parse({
        id: 'bad',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
        status: 'pending',
      });

    expect(parseInvalidId).toThrow(/Invalid uuid/u);
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    const parseEmptyName = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: '',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
        status: 'pending',
      });

    expect(parseEmptyName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_OBSERVABLES: {observablesSatisfied: ["bad"]} => throws validation error', () => {
    const parseInvalidObservables = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: ['bad'],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
        status: 'pending',
      });

    expect(parseInvalidObservables).toThrow(/Invalid uuid/u);
  });

  it('INVALID_DEPENDS_ON: {dependsOn: ["bad"]} => throws validation error', () => {
    const parseInvalidDependsOn = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: ['bad'],
        filesToCreate: [],
        filesToModify: [],
        status: 'pending',
      });

    expect(parseInvalidDependsOn).toThrow(/Invalid uuid/u);
  });

  it('INVALID_STATUS: {status: "invalid"} => throws validation error', () => {
    const parseInvalidStatus = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Test',
        description: 'Test',
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
        status: 'invalid',
      });

    expect(parseInvalidStatus).toThrow(/Invalid enum value/u);
  });
});
