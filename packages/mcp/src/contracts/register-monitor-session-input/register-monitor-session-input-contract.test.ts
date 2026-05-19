import { registerMonitorSessionInputContract } from './register-monitor-session-input-contract';
import { RegisterMonitorSessionInputStub } from './register-monitor-session-input.stub';

describe('registerMonitorSessionInputContract', () => {
  it('VALID: {sessionFilePath} default stub => parses successfully', () => {
    const result = registerMonitorSessionInputContract.parse(RegisterMonitorSessionInputStub());

    expect(result).toStrictEqual({
      sessionFilePath: '/home/user/.claude/projects/-home-user-project/abc-123.jsonl',
    });
  });

  it('VALID: {custom sessionFilePath} => parses successfully', () => {
    const result = registerMonitorSessionInputContract.parse({
      sessionFilePath: '/tmp/custom-session.jsonl',
    });

    expect(result).toStrictEqual({
      sessionFilePath: '/tmp/custom-session.jsonl',
    });
  });

  it('INVALID: {missing sessionFilePath} => throws Required', () => {
    expect(() => registerMonitorSessionInputContract.parse({})).toThrow(/Required/u);
  });

  it('INVALID: {sessionFilePath: 42} => throws expected string', () => {
    expect(() =>
      registerMonitorSessionInputContract.parse({ sessionFilePath: 42 } as never),
    ).toThrow(/Expected string/u);
  });

  it('INVALID: {unknown key} => throws Unrecognized key error', () => {
    expect(() =>
      registerMonitorSessionInputContract.parse({
        sessionFilePath: '/tmp/x.jsonl',
        questId: 'q1',
      } as never),
    ).toThrow(/Unrecognized key/u);
  });
});
