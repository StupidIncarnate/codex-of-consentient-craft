import { openHandleReportBroker } from './open-handle-report-broker';
import { openHandleReportBrokerProxy } from './open-handle-report-broker.proxy';
import { openHandleTrackingBroker } from '../tracking/open-handle-tracking-broker';

describe('openHandleReportBroker', () => {
  describe('findings it returns', () => {
    it('VALID: {un-cleared interval} => returns one finding naming the suite and the kind', () => {
      openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const findings = openHandleReportBroker({ testPath: 'packages/a/src/poll.test.ts' });
      clearInterval(interval);

      expect(findings.map((finding) => [finding.kind, finding.testPath])).toStrictEqual([
        ['setInterval', 'packages/a/src/poll.test.ts'],
      ]);
    });

    it('VALID: {nothing left running} => returns no findings', () => {
      openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      clearInterval(setInterval(() => undefined, 60_000));
      const findings = openHandleReportBroker({ testPath: 'packages/a/src/clean.test.ts' });

      expect(findings).toStrictEqual([]);
    });

    it('VALID: {finding} => carries the stack that armed the timer', () => {
      openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const findings = openHandleReportBroker({ testPath: 'packages/a/src/poll.test.ts' });
      clearInterval(interval);

      expect(
        findings
          .flatMap((finding) => finding.stack.split('\n').slice(0, 1))
          .map((frame) => /open-handle-report-broker\.test\.ts:\d+:\d+\)$/u.test(frame)),
      ).toStrictEqual([true]);
    });
  });

  describe('the report file', () => {
    it('VALID: {reportPath, one finding} => appends one JSON line to that path', () => {
      const proxy = openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const findings = openHandleReportBroker({
        testPath: 'packages/a/src/poll.test.ts',
        reportPath: '/tmp/handles.jsonl',
      });
      clearInterval(interval);

      expect(proxy.getAppended()).toStrictEqual([
        ['/tmp/handles.jsonl', `${JSON.stringify(findings[0])}\n`],
      ]);
    });

    it('VALID: {reportPath, nothing left running} => writes nothing at all', () => {
      const proxy = openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      clearInterval(setInterval(() => undefined, 60_000));
      openHandleReportBroker({
        testPath: 'packages/a/src/clean.test.ts',
        reportPath: '/tmp/handles.jsonl',
      });

      expect(proxy.getAppended()).toStrictEqual([]);
    });

    it('EMPTY: {no reportPath} => writes nothing, and still returns the findings', () => {
      const proxy = openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const findings = openHandleReportBroker({ testPath: 'packages/a/src/poll.test.ts' });
      clearInterval(interval);

      expect([proxy.getAppended(), findings.map((finding) => finding.kind)]).toStrictEqual([
        [],
        ['setInterval'],
      ]);
    });
  });

  describe('one suite does not inherit another suite timers', () => {
    it('VALID: {report twice, one interval armed} => the second report is empty', () => {
      openHandleReportBrokerProxy();
      openHandleTrackingBroker.watch();
      openHandleTrackingBroker.clear();

      const interval = setInterval(() => undefined, 60_000);
      const first = openHandleReportBroker({ testPath: 'packages/a/src/first.test.ts' });
      const second = openHandleReportBroker({ testPath: 'packages/a/src/second.test.ts' });
      clearInterval(interval);

      expect([first.length, second.length]).toStrictEqual([1, 0]);
    });
  });
});
