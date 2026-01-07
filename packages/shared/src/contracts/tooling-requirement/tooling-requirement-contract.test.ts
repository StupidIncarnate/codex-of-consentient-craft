import { toolingRequirementContract } from './tooling-requirement-contract';
import { ToolingRequirementStub } from './tooling-requirement.stub';

describe('toolingRequirementContract', () => {
  it('VALID: {id, name, packageName, reason, requiredByObservables} => parses successfully', () => {
    const requirement = ToolingRequirementStub({
      id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
      name: 'PostgreSQL Driver',
      packageName: 'pg',
      reason: 'Required for database verification',
      requiredByObservables: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
    });

    expect(requirement).toStrictEqual({
      id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
      name: 'PostgreSQL Driver',
      packageName: 'pg',
      reason: 'Required for database verification',
      requiredByObservables: ['a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'],
    });
  });

  it('VALID: {empty requiredByObservables} => parses with empty array', () => {
    const requirement = ToolingRequirementStub({
      requiredByObservables: [],
    });

    expect(requirement.requiredByObservables).toStrictEqual([]);
  });

  it('VALID: {multiple requiredByObservables} => parses with multiple observables', () => {
    const requirement = ToolingRequirementStub({
      requiredByObservables: [
        'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
      ],
    });

    expect(requirement.requiredByObservables).toStrictEqual([
      'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    ]);
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const requirement = ToolingRequirementStub();

    expect(requirement).toStrictEqual({
      id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
      name: 'Test Tool',
      packageName: 'test-package',
      reason: 'Test reason for tooling requirement',
      requiredByObservables: [],
    });
  });

  it('INVALID_ID: {id: "bad"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      toolingRequirementContract.parse({
        id: 'bad',
        name: 'Test',
        packageName: 'test',
        reason: 'Test',
        requiredByObservables: [],
      });

    expect(parseInvalidId).toThrow(/Invalid uuid/u);
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    const parseEmptyName = (): unknown =>
      toolingRequirementContract.parse({
        id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
        name: '',
        packageName: 'test',
        reason: 'Test',
        requiredByObservables: [],
      });

    expect(parseEmptyName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_PACKAGE_NAME: {packageName: ""} => throws validation error', () => {
    const parseEmptyPackageName = (): unknown =>
      toolingRequirementContract.parse({
        id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
        name: 'Test',
        packageName: '',
        reason: 'Test',
        requiredByObservables: [],
      });

    expect(parseEmptyPackageName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_REQUIRED_BY: {requiredByObservables: ["bad"]} => throws validation error', () => {
    const parseInvalidRequiredBy = (): unknown =>
      toolingRequirementContract.parse({
        id: 'd4e5f6a7-b8c9-4d0e-a1f2-3b4c5d6e7f8a',
        name: 'Test',
        packageName: 'test',
        reason: 'Test',
        requiredByObservables: ['bad'],
      });

    expect(parseInvalidRequiredBy).toThrow(/Invalid uuid/u);
  });

  it('VALID: database driver => parses pg package', () => {
    const requirement = ToolingRequirementStub({
      name: 'PostgreSQL Driver',
      packageName: 'pg',
      reason: 'Database query verification',
    });

    expect(requirement.packageName).toBe('pg');
  });

  it('VALID: queue client => parses bullmq package', () => {
    const requirement = ToolingRequirementStub({
      name: 'BullMQ Client',
      packageName: 'bullmq',
      reason: 'Queue message verification',
    });

    expect(requirement.packageName).toBe('bullmq');
  });
});
