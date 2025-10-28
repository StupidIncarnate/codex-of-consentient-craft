import { AbsolutePathStub } from './absolute-path.stub';

describe('absolutePathContract', () => {
  it('VALID: {value: "/home/user/project"} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/home/user/project' });

    expect(result).toBe('/home/user/project');
  });

  it('VALID: {value: "/tmp"} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/tmp' });

    expect(result).toBe('/tmp');
  });

  it('VALID: {value: "/var/www"} => parses successfully', () => {
    const result = AbsolutePathStub({ value: '/var/www' });

    expect(result).toBe('/var/www');
  });
});
