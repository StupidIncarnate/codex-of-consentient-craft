import { GatewayNpmSyncReportStub } from '../../contracts/gateway-npm-sync-report/gateway-npm-sync-report.stub';
import { gatewayNpmSyncReportLinesTransformer } from './gateway-npm-sync-report-lines-transformer';

describe('gatewayNpmSyncReportLinesTransformer', () => {
  it('EMPTY: {report: every list empty} => returns no lines', () => {
    const result = gatewayNpmSyncReportLinesTransformer({ report: GatewayNpmSyncReportStub() });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {report: every list filled} => returns one line per list, in copied/generated/untyped/esm-only order', () => {
    const report = GatewayNpmSyncReportStub({
      copied: ['zod', 'hono__utils__http-status'],
      generated: ['left-pad', 'lodash', 'ink'],
      untyped: ['left-pad'],
      esmOnly: ['ink'],
    });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual([
      'copied: zod, hono__utils__http-status',
      'generated: left-pad, lodash, ink',
      'untyped: left-pad',
      'esm-only (types only; wrap runtime values with import()): ink',
    ]);
  });

  it('VALID: {report: only generated} => returns only the generated line', () => {
    const report = GatewayNpmSyncReportStub({ generated: ['left-pad'] });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual(['generated: left-pad']);
  });
});
