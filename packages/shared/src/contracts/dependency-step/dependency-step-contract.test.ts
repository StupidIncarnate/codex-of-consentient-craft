import { dependencyStepContract } from './dependency-step-contract';
import { DependencyStepStub } from './dependency-step.stub';

describe('dependencyStepContract', () => {
  it('VALID: {complete step} => parses successfully', () => {
    const step = DependencyStepStub({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Create user API endpoint',
      description: 'Implement the REST endpoint for user creation',
      taskLinks: ['f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c'],
      observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      dependsOn: [],
      filesToCreate: ['src/routes/users.ts'],
      filesToModify: ['src/routes/index.ts'],
    });

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Create user API endpoint',
      description: 'Implement the REST endpoint for user creation',
      taskLinks: ['f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c'],
      observablesSatisfied: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
      dependsOn: [],
      filesToCreate: ['src/routes/users.ts'],
      filesToModify: ['src/routes/index.ts'],
    });
  });

  it('VALID: {empty arrays} => parses with empty arrays', () => {
    const step = DependencyStepStub({
      taskLinks: [],
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
    });

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      taskLinks: [],
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
    });
  });

  it('VALID: {multiple taskLinks} => parses many-to-many task relationship', () => {
    const step = DependencyStepStub({
      taskLinks: ['f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c', 'a7b8c9d0-e1f2-4a3b-c4d5-6e7f8a9b0c1d'],
    });

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      taskLinks: ['f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c', 'a7b8c9d0-e1f2-4a3b-c4d5-6e7f8a9b0c1d'],
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
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
      taskLinks: [],
      observablesSatisfied: [],
      dependsOn: ['b8c9d0e1-f2a3-4b4c-d5e6-7f8a9b0c1d2e', 'c9d0e1f2-a3b4-4c5d-e6f7-8a9b0c1d2e3f'],
      filesToCreate: [],
      filesToModify: [],
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
      taskLinks: [],
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: ['src/controllers/user-controller.ts', 'src/models/user-model.ts'],
      filesToModify: ['src/app.ts', 'src/routes/index.ts'],
    });
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const step = DependencyStepStub();

    expect(step).toStrictEqual({
      id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
      name: 'Test Step',
      description: 'A test dependency step',
      taskLinks: [],
      observablesSatisfied: [],
      dependsOn: [],
      filesToCreate: [],
      filesToModify: [],
    });
  });

  it('INVALID_ID: {id: "bad"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      dependencyStepContract.parse({
        id: 'bad',
        name: 'Test',
        description: 'Test',
        taskLinks: [],
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidId).toThrow(/Invalid uuid/u);
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    const parseEmptyName = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: '',
        description: 'Test',
        taskLinks: [],
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseEmptyName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_TASK_LINKS: {taskLinks: ["bad"]} => throws validation error', () => {
    const parseInvalidTaskLinks = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Test',
        description: 'Test',
        taskLinks: ['bad'],
        observablesSatisfied: [],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidTaskLinks).toThrow(/Invalid uuid/u);
  });

  it('INVALID_OBSERVABLES: {observablesSatisfied: ["bad"]} => throws validation error', () => {
    const parseInvalidObservables = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Test',
        description: 'Test',
        taskLinks: [],
        observablesSatisfied: ['bad'],
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidObservables).toThrow(/Invalid uuid/u);
  });

  it('INVALID_DEPENDS_ON: {dependsOn: ["bad"]} => throws validation error', () => {
    const parseInvalidDependsOn = (): unknown =>
      dependencyStepContract.parse({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Test',
        description: 'Test',
        taskLinks: [],
        observablesSatisfied: [],
        dependsOn: ['bad'],
        filesToCreate: [],
        filesToModify: [],
      });

    expect(parseInvalidDependsOn).toThrow(/Invalid uuid/u);
  });
});
