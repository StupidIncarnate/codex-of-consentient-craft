import { GatewayNpmSkippedOwnCopyStub } from '../../contracts/gateway-npm-skipped-own-copy/gateway-npm-skipped-own-copy.stub';
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

  it('VALID: {skipped for version, both versions known} => names the installed version and our range', () => {
    const report = GatewayNpmSyncReportStub({
      generated: ['zod'],
      skippedOwnCopy: [
        GatewayNpmSkippedOwnCopyStub({
          name: 'zod',
          reason: 'version',
          installed: '3.23.8',
          ours: '^4.6.5',
        }),
      ],
    });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual([
      'generated: zod',
      'passthrough instead of our wrapper: zod (installed 3.23.8, ours ^4.6.5)',
    ]);
  });

  it('VALID: {skipped for version, nothing installed and no range of ours} => says so for both sides', () => {
    const report = GatewayNpmSyncReportStub({
      skippedOwnCopy: [GatewayNpmSkippedOwnCopyStub({ name: 'zod', reason: 'version' })],
    });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual([
      'passthrough instead of our wrapper: zod (not installed, ours not declared)',
    ]);
  });

  it('VALID: {skipped for compile, esm-only and unresolved-import} => one line per package, each naming its reason', () => {
    const report = GatewayNpmSyncReportStub({
      skippedOwnCopy: [
        GatewayNpmSkippedOwnCopyStub({
          name: 'msw',
          reason: 'compile',
          installed: '2.0.0',
          ours: '^2.12.10',
          detail:
            "packages/@gateway/npm/src/msw/msw.ts(1): TS2305: Module 'msw' has no exported member 'http'.",
        }),
        GatewayNpmSkippedOwnCopyStub({ name: 'ink', reason: 'esm-only' }),
        GatewayNpmSkippedOwnCopyStub({
          name: '@hono/node-ws',
          reason: 'unresolved-import',
        }),
      ],
    });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual([
      "passthrough instead of our wrapper: msw (our wrapper does not compile against installed 2.0.0: packages/@gateway/npm/src/msw/msw.ts(1): TS2305: Module 'msw' has no exported member 'http'.)",
      'passthrough instead of our wrapper: ink (our wrapper imports an ESM-only package)',
      'passthrough instead of our wrapper: @hono/node-ws (our wrapper imports a package this repo does not declare)',
    ]);
  });

  it('VALID: {packages with no root export} => names them on one line', () => {
    const report = GatewayNpmSyncReportStub({ noRootExport: ['sub-only-lib', '@acme/tools'] });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual([
      'no root export; wrap a subpath by hand: sub-only-lib, @acme/tools',
    ]);
  });

  it('VALID: {lockfile warning} => prints it as the last line', () => {
    const report = GatewayNpmSyncReportStub({
      generated: ['left-pad'],
      lockfileWarning:
        'lockfile not updated (npm install exited 1: npm error code E404); run npm install yourself to update package-lock.json',
    });

    const result = gatewayNpmSyncReportLinesTransformer({ report });

    expect(result).toStrictEqual([
      'generated: left-pad',
      'lockfile not updated (npm install exited 1: npm error code E404); run npm install yourself to update package-lock.json',
    ]);
  });
});
