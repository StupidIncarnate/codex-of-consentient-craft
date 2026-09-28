import { censusTableRenderTransformer } from './census-table-render-transformer';
import { AdapterCensusStub } from '../../contracts/adapter-census/adapter-census.stub';
import { PackageCensusStub } from '../../contracts/package-census/package-census.stub';
import { AdapterRecordStub } from '../../contracts/adapter-record/adapter-record.stub';
import { AdapterCallerStub } from '../../contracts/adapter-caller/adapter-caller.stub';
import { ProxyCatchAllStub } from '../../contracts/proxy-catch-all/proxy-catch-all.stub';
import { adapterCensusTotalsTransformer } from '../adapter-census-totals/adapter-census-totals-transformer';

describe('censusTableRenderTransformer', () => {
  it('EMPTY: {no packages} => says no adapters were found', () => {
    const result = censusTableRenderTransformer({ census: AdapterCensusStub() });

    expect(result).toBe('Adapter census (scope @acme)\nNo adapters found under src/adapters/.\n');
  });

  it('EMPTY: {scope: null} => the heading says none', () => {
    const result = censusTableRenderTransformer({ census: AdapterCensusStub({ scope: null }) });

    expect(result).toBe('Adapter census (scope none)\nNo adapters found under src/adapters/.\n');
  });

  it('VALID: {one package with a pass-through and a logic adapter} => aligned columns and totals', () => {
    const packages = [
      PackageCensusStub({
        adapters: [
          AdapterRecordStub({
            productionCallers: [
              AdapterCallerStub({
                composedBy: ['packages/example/src/top.proxy.ts' as never],
                catchAll: [
                  ProxyCatchAllStub({ file: 'packages/example/src/top.proxy.ts' as never }),
                ],
              }),
            ],
            testFiles: ['packages/example/src/adapters/fs/read-file/x.test.ts' as never],
          }),
          AdapterRecordStub({
            file: 'packages/example/src/adapters/net/check/net-check-adapter.ts' as never,
            shape: 'logic',
            reasons: ['no-gateway-export', 'try-catch'],
            gateway: [],
          }),
        ],
      }),
    ];
    const census = AdapterCensusStub({
      packages,
      totals: adapterCensusTotalsTransformer({ packages }),
    });

    const result = censusTableRenderTransformer({ census });

    expect(result).toBe(
      [
        'Adapter census (scope @acme)',
        '',
        'packages/example (@acme/example): 2 adapters',
        '  adapter                               shape         gateway           prod  test  proxies  catch-all  why',
        '  fs/read-file/fs-read-file-adapter.ts  pass-through  readFile (exact)  1     1     1        1',
        '  net/check/net-check-adapter.ts        logic         -                 0     0     0        0          no-gateway-export,try-catch',
        '',
        'Totals: 2 adapters, 1 pass-through, 1 logic; 1 production callers; 1 composing proxies, 1 of them staging a catch-all.',
        '',
      ].join('\n'),
    );
  });
});
