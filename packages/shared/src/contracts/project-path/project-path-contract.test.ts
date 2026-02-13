import { projectPathContract } from './project-path-contract';
import { ProjectPathStub } from './project-path.stub';

describe('projectPathContract', () => {
  it('VALID: {value: "/home/user/my-project"} => parses successfully', () => {
    const path = ProjectPathStub({ value: '/home/user/my-project' });

    expect(path).toBe('/home/user/my-project');
  });

  it('VALID: {default value} => uses default path', () => {
    const path = ProjectPathStub();

    expect(path).toBe('/home/user/my-project');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return projectPathContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });
});
