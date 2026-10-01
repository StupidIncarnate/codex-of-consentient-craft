import { GatewayNpmSkippedOwnCopyStub } from '../gateway-npm-skipped-own-copy/gateway-npm-skipped-own-copy.stub';
import { gatewayNpmSyncReportContract } from './gateway-npm-sync-report-contract';
import { GatewayNpmSyncReportStub } from './gateway-npm-sync-report.stub';

describe('gatewayNpmSyncReportContract', () => {
  it('VALID: {every list filled, a lockfile warning} => parses all of it', () => {
    const report = GatewayNpmSyncReportStub({
      copied: ['hono', 'hono__utils__http-status'],
      generated: ['left-pad', 'zod'],
      untyped: ['left-pad'],
      esmOnly: ['ink'],
      skippedOwnCopy: [GatewayNpmSkippedOwnCopyStub({ installed: '3.23.8', ours: '^4.6.5' })],
      lockfileWarning: 'lockfile not updated',
    });

    const result = gatewayNpmSyncReportContract.parse(report);

    expect(result).toStrictEqual({
      copied: ['hono', 'hono__utils__http-status'],
      generated: ['left-pad', 'zod'],
      untyped: ['left-pad'],
      esmOnly: ['ink'],
      skippedOwnCopy: [{ name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' }],
      lockfileWarning: 'lockfile not updated',
    });
  });

  it('EMPTY: {} => stub holds five empty lists and no lockfile warning', () => {
    expect(GatewayNpmSyncReportStub()).toStrictEqual({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
      skippedOwnCopy: [],
    });
  });

  it('INVALID: {copied: [""]} => throws a validation error', () => {
    expect(() =>
      gatewayNpmSyncReportContract.parse({
        copied: [''],
        generated: [],
        untyped: [],
        esmOnly: [],
        skippedOwnCopy: [],
      }),
    ).toThrow(/Too small/u);
  });
});
