import { openHandleReportStatics } from './open-handle-report-statics';

describe('openHandleReportStatics', () => {
  describe('exported shape', () => {
    it('VALID: exported value => matches the full expected object', () => {
      expect(openHandleReportStatics).toStrictEqual({
        env: { pathVar: 'DUNGEONMASTER_OPEN_HANDLE_REPORT' },
        file: { prefix: 'ward-open-handles-', suffix: '.jsonl' },
      });
    });
  });
});
