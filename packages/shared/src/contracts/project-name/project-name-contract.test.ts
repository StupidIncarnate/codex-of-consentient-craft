import { projectNameContract } from './project-name-contract';
import { ProjectNameStub } from './project-name.stub';

describe('projectNameContract', () => {
  it('VALID: {value: "My Project"} => parses successfully', () => {
    const name = ProjectNameStub({ value: 'My Project' });

    expect(name).toBe('My Project');
  });

  it('VALID: {default value} => uses default name', () => {
    const name = ProjectNameStub();

    expect(name).toBe('My Project');
  });

  it('INVALID_NAME: {value: ""} => throws validation error', () => {
    expect(() => {
      return projectNameContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_NAME: {value: 101 chars} => throws validation error', () => {
    const tooLong = 'a'.repeat(101);

    expect(() => {
      return projectNameContract.parse(tooLong);
    }).toThrow(/String must contain at most 100 character/u);
  });
});
