import { gatewayNpmSyncReportContract } from './gateway-npm-sync-report-contract';
import { GatewayNpmSyncReportStub } from './gateway-npm-sync-report.stub';

describe('gatewayNpmSyncReportContract', () => {
  it('VALID: {copied, generated, untyped, esmOnly} => parses all four lists', () => {
    const report = GatewayNpmSyncReportStub({
      copied: ['hono', 'hono__utils__http-status'],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: ['ink'],
    });

    const result = gatewayNpmSyncReportContract.parse(report);

    expect(result).toStrictEqual({
      copied: ['hono', 'hono__utils__http-status'],
      generated: ['left-pad'],
      untyped: ['left-pad'],
      esmOnly: ['ink'],
    });
  });

  it('EMPTY: {} => stub holds four empty lists', () => {
    expect(GatewayNpmSyncReportStub()).toStrictEqual({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
    });
  });

  it('INVALID: {copied: [""]} => throws a validation error', () => {
    expect(() =>
      gatewayNpmSyncReportContract.parse({ copied: [''], generated: [], untyped: [], esmOnly: [] }),
    ).toThrow(/Too small/u);
  });
});
