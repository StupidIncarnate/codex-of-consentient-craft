import { openHandleReportParseTransformer } from './open-handle-report-parse-transformer';
import { TestingOpenHandleFindingStub } from '../../contracts/testing-open-handle-finding/testing-open-handle-finding.stub';

describe('openHandleReportParseTransformer', () => {
  describe('lines it accepts', () => {
    it('VALID: {one finding} => returns one handle naming the kind and the suite', () => {
      const finding = TestingOpenHandleFindingStub({
        kind: 'setInterval',
        testPath: 'packages/a/src/poll.test.ts',
        stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
      });

      const result = openHandleReportParseTransformer({ content: JSON.stringify(finding) });

      expect(result).toStrictEqual([
        {
          name: 'setInterval',
          message: 'setInterval still armed when packages/a/src/poll.test.ts finished',
          stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
        },
      ]);
    });

    it('VALID: {two findings, trailing newline} => returns both, in file order', () => {
      const first = TestingOpenHandleFindingStub({ kind: 'setInterval', stack: 'at a (a.ts:1:1)' });
      const second = TestingOpenHandleFindingStub({ kind: 'setTimeout', stack: 'at b (b.ts:2:2)' });

      const result = openHandleReportParseTransformer({
        content: `${JSON.stringify(first)}\n${JSON.stringify(second)}\n`,
      });

      expect(result.map((handle) => [handle.name, handle.stack])).toStrictEqual([
        ['setInterval', 'at a (a.ts:1:1)'],
        ['setTimeout', 'at b (b.ts:2:2)'],
      ]);
    });
  });

  describe('lines it drops', () => {
    it('EDGE: {a line missing testPath} => drops that line and keeps the rest', () => {
      const good = TestingOpenHandleFindingStub({ kind: 'setInterval' });

      const result = openHandleReportParseTransformer({
        content: `{"kind":"setTimeout","stack":"at x"}\n${JSON.stringify(good)}`,
      });

      expect(result.map((handle) => handle.name)).toStrictEqual(['setInterval']);
    });

    it('EDGE: {blank lines between findings} => ignores them', () => {
      const finding = TestingOpenHandleFindingStub({ kind: 'setImmediate' });

      const result = openHandleReportParseTransformer({
        content: `\n${JSON.stringify(finding)}\n\n`,
      });

      expect(result.map((handle) => handle.name)).toStrictEqual(['setImmediate']);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {content: ""} => returns no handles', () => {
      expect(openHandleReportParseTransformer({ content: '' })).toStrictEqual([]);
    });

    it('EMPTY: {content: undefined} => returns no handles', () => {
      expect(openHandleReportParseTransformer({})).toStrictEqual([]);
    });
  });
});
