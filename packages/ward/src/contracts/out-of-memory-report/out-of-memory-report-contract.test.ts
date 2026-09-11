import { outOfMemoryReportContract } from './out-of-memory-report-contract';
import { OutOfMemoryReportStub } from './out-of-memory-report.stub';

describe('outOfMemoryReportContract', () => {
  describe('valid reports', () => {
    it('VALID: {a rendered report line} => parses to the same string', () => {
      expect(String(OutOfMemoryReportStub({ value: '  web  SIGKILL  killed from outside' }))).toBe(
        '  web  SIGKILL  killed from outside',
      );
    });

    it('VALID: {no argument} => defaults to a heap-limit line', () => {
      expect(String(OutOfMemoryReportStub())).toBe(
        '  ward  exit 134  V8 heap limit — the check printed "JavaScript heap out of memory" and aborted',
      );
    });
  });

  describe('invalid reports', () => {
    it('INVALID: {value: 134} => throws validation error', () => {
      expect(() => outOfMemoryReportContract.parse(134)).toThrow(
        /Expected string, received number/u,
      );
    });
  });
});
