import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { openHandleReportPathTransformer } from './open-handle-report-path-transformer';

describe('openHandleReportPathTransformer', () => {
  describe('the path it builds', () => {
    it('VALID: {tmpdir: /tmp, unit, 4242} => returns the unit report path', () => {
      const result = openHandleReportPathTransformer({
        tmpdir: AbsoluteFilePathStub({ value: '/tmp' }),
        checkType: 'unit',
        processId: 4242,
      });

      expect(result).toBe('/tmp/ward-open-handles-4242-unit.jsonl');
    });

    it('VALID: {same pid, integration} => a different path from the unit one', () => {
      const unit = openHandleReportPathTransformer({
        tmpdir: AbsoluteFilePathStub({ value: '/tmp' }),
        checkType: 'unit',
        processId: 4242,
      });
      const integration = openHandleReportPathTransformer({
        tmpdir: AbsoluteFilePathStub({ value: '/tmp' }),
        checkType: 'integration',
        processId: 4242,
      });

      expect([unit, integration]).toStrictEqual([
        '/tmp/ward-open-handles-4242-unit.jsonl',
        '/tmp/ward-open-handles-4242-integration.jsonl',
      ]);
    });

    it('VALID: {a per-user scratch dir} => sits under that dir', () => {
      const result = openHandleReportPathTransformer({
        tmpdir: AbsoluteFilePathStub({ value: '/var/folders/9k/T' }),
        checkType: 'unit',
        processId: 7,
      });

      expect(result).toBe('/var/folders/9k/T/ward-open-handles-7-unit.jsonl');
    });

    it('VALID: {two different pids} => two different paths', () => {
      const first = openHandleReportPathTransformer({
        tmpdir: AbsoluteFilePathStub({ value: '/tmp' }),
        checkType: 'unit',
        processId: 1,
      });
      const second = openHandleReportPathTransformer({
        tmpdir: AbsoluteFilePathStub({ value: '/tmp' }),
        checkType: 'unit',
        processId: 2,
      });

      expect([first, second]).toStrictEqual([
        '/tmp/ward-open-handles-1-unit.jsonl',
        '/tmp/ward-open-handles-2-unit.jsonl',
      ]);
    });
  });
});
