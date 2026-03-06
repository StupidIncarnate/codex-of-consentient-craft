import { toolingRequirementContract } from './tooling-requirement-contract';
import { ToolingRequirementStub } from './tooling-requirement.stub';

describe('toolingRequirementContract', () => {
  it('VALID: {id, name, packageName, reason, requiredByObservables} => parses successfully', () => {
    const requirement = ToolingRequirementStub({
      id: 'postgresql-driver',
      name: 'PostgreSQL Driver',
      packageName: 'pg',
      reason: 'Required for database verification',
      requiredByObservables: ['login-redirects-to-dashboard'],
    });

    expect(requirement).toStrictEqual({
      id: 'postgresql-driver',
      name: 'PostgreSQL Driver',
      packageName: 'pg',
      reason: 'Required for database verification',
      requiredByObservables: ['login-redirects-to-dashboard'],
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
      requiredByObservables: ['login-redirects-to-dashboard', 'shows-error-on-failure'],
    });

    expect(requirement.requiredByObservables).toStrictEqual([
      'login-redirects-to-dashboard',
      'shows-error-on-failure',
    ]);
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const requirement = ToolingRequirementStub();

    expect(requirement).toStrictEqual({
      id: 'pg-driver',
      name: 'Test Tool',
      packageName: 'test-package',
      reason: 'Test reason for tooling requirement',
      requiredByObservables: [],
    });
  });

  it('INVALID_ID: {id: "Bad"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      toolingRequirementContract.parse({
        id: 'Bad',
        name: 'Test',
        packageName: 'test',
        reason: 'Test',
        requiredByObservables: [],
      });

    expect(parseInvalidId).toThrow(/invalid_string/u);
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    const parseEmptyName = (): unknown =>
      toolingRequirementContract.parse({
        id: 'valid-id',
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
        id: 'valid-id',
        name: 'Test',
        packageName: '',
        reason: 'Test',
        requiredByObservables: [],
      });

    expect(parseEmptyPackageName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_REQUIRED_BY: {requiredByObservables: ["Bad"]} => throws validation error', () => {
    const parseInvalidRequiredBy = (): unknown =>
      toolingRequirementContract.parse({
        id: 'valid-id',
        name: 'Test',
        packageName: 'test',
        reason: 'Test',
        requiredByObservables: ['Bad'],
      });

    expect(parseInvalidRequiredBy).toThrow(/invalid_string/u);
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
