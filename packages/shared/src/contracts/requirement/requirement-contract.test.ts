import { requirementContract } from './requirement-contract';
import { RequirementStub } from './requirement.stub';

describe('requirementContract', () => {
  it('VALID: {all fields} => parses successfully', () => {
    const requirement = RequirementStub();

    expect(requirement.id).toBe('b12ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(requirement.name).toBe('CLI Interactive Mode');
    expect(requirement.description).toBe('Support interactive CLI prompts for user input');
    expect(requirement.scope).toBe('packages/cli');
  });

  it('VALID: {with status} => parses with status', () => {
    const requirement = RequirementStub({ status: 'approved' });

    expect(requirement.status).toBe('approved');
  });

  it('VALID: {without status} => status is undefined', () => {
    const requirement = RequirementStub();

    expect(requirement.status).toBeUndefined();
  });

  it('VALID: {status: deferred} => parses deferred status', () => {
    const requirement = RequirementStub({ status: 'deferred' });

    expect(requirement.status).toBe('deferred');
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    expect(() => {
      return requirementContract.parse({
        id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479',
        name: '',
        description: 'desc',
        scope: 'scope',
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID_ID: {id: "not-uuid"} => throws validation error', () => {
    expect(() => {
      return requirementContract.parse({
        id: 'not-uuid',
        name: 'Name',
        description: 'desc',
        scope: 'scope',
      });
    }).toThrow(/Invalid uuid/u);
  });
});
