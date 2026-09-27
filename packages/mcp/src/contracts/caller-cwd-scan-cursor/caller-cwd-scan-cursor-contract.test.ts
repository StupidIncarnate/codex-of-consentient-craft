import { callerCwdScanCursorContract } from './caller-cwd-scan-cursor-contract';
import { CallerCwdScanCursorStub } from './caller-cwd-scan-cursor.stub';

describe('callerCwdScanCursorContract', () => {
  it('VALID: {filepath, offsetBytes: 4096} => parses successfully', () => {
    const cursor = CallerCwdScanCursorStub({ offsetBytes: 4096 });

    const result = callerCwdScanCursorContract.parse(cursor);

    expect(result).toStrictEqual({
      filepath: '/home/tester/.claude/projects/-x/session.jsonl',
      offsetBytes: 4096,
    });
  });

  it('INVALID: {offsetBytes: -1} => throws', () => {
    expect(() =>
      callerCwdScanCursorContract.parse({
        filepath: '/home/tester/.claude/projects/-x/session.jsonl',
        offsetBytes: -1,
      }),
    ).toThrow(/to be >=0/u);
  });

  it('INVALID: {offsetBytes: 1.5} => throws', () => {
    expect(() =>
      callerCwdScanCursorContract.parse({
        filepath: '/home/tester/.claude/projects/-x/session.jsonl',
        offsetBytes: 1.5,
      }),
    ).toThrow(/Invalid input: expected int, received number/u);
  });
});
