import { e2eTestbedContract } from './e2e-testbed-contract';
import { E2ETestbedStub } from './e2e-testbed.stub';

describe('e2eTestbedContract', () => {
  it('VALID: {valid testbed data} => parses successfully', () => {
    const result = e2eTestbedContract.parse({
      projectPath: '/tmp/test-123',
      dungeonmasterPath: '/repo/path',
    });

    expect(result).toStrictEqual({
      projectPath: '/tmp/test-123',
      dungeonmasterPath: '/repo/path',
    });
  });

  it('INVALID: {missing projectPath} => throws ZodError', () => {
    expect(() =>
      e2eTestbedContract.parse({
        dungeonmasterPath: '/repo/path',
      }),
    ).toThrow('Required');
  });

  it('INVALID: {missing dungeonmasterPath} => throws ZodError', () => {
    expect(() =>
      e2eTestbedContract.parse({
        projectPath: '/tmp/test-123',
      }),
    ).toThrow('Required');
  });
});

describe('E2ETestbedStub', () => {
  it('VALID: {no args} => returns default testbed data', () => {
    const result = E2ETestbedStub();

    expect(result).toStrictEqual({
      projectPath: '/tmp/e2e-test-default',
      dungeonmasterPath: '/home/user/dungeonmaster',
    });
  });

  it('VALID: {partial overrides} => merges with defaults', () => {
    const result = E2ETestbedStub({ projectPath: '/custom/path' });

    expect(result).toStrictEqual({
      projectPath: '/custom/path',
      dungeonmasterPath: '/home/user/dungeonmaster',
    });
  });
});
