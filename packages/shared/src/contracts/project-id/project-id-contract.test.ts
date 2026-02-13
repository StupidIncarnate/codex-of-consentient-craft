import { projectIdContract } from './project-id-contract';
import { ProjectIdStub } from './project-id.stub';

describe('projectIdContract', () => {
  it('VALID: {value: uuid} => parses successfully', () => {
    const id = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {default value} => uses default uuid', () => {
    const id = ProjectIdStub();

    expect(id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_ID: {value: "not-a-uuid"} => throws validation error', () => {
    expect(() => {
      return projectIdContract.parse('not-a-uuid');
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return projectIdContract.parse('');
    }).toThrow(/Invalid uuid/u);
  });
});
