import { adapterCensusTotalsTransformer } from './adapter-census-totals-transformer';
import { PackageCensusStub } from '../../contracts/package-census/package-census.stub';
import { AdapterRecordStub } from '../../contracts/adapter-record/adapter-record.stub';
import { AdapterCallerStub } from '../../contracts/adapter-caller/adapter-caller.stub';
import { ProxyCatchAllStub } from '../../contracts/proxy-catch-all/proxy-catch-all.stub';

describe('adapterCensusTotalsTransformer', () => {
  it('EMPTY: {no packages} => every total is zero', () => {
    const result = adapterCensusTotalsTransformer({ packages: [] });

    expect(result).toStrictEqual({
      adapters: 0,
      passThrough: 0,
      logic: 0,
      productionCallers: 0,
      composingProxies: 0,
      catchAllProxies: 0,
    });
  });

  it('VALID: {two packages, mixed shapes} => counts adapters and shapes', () => {
    const result = adapterCensusTotalsTransformer({
      packages: [
        PackageCensusStub({
          adapters: [
            AdapterRecordStub({ shape: 'pass-through' }),
            AdapterRecordStub({ shape: 'logic' }),
          ],
        }),
        PackageCensusStub({ adapters: [AdapterRecordStub({ shape: 'logic' })] }),
      ],
    });

    expect(result).toStrictEqual({
      adapters: 3,
      passThrough: 1,
      logic: 2,
      productionCallers: 0,
      composingProxies: 0,
      catchAllProxies: 0,
    });
  });

  it('VALID: {callers sharing composing and catch-all proxies} => each proxy counts once', () => {
    const shared = 'packages/a/src/shared.proxy.ts' as never;
    const result = adapterCensusTotalsTransformer({
      packages: [
        PackageCensusStub({
          adapters: [
            AdapterRecordStub({
              productionCallers: [
                AdapterCallerStub({
                  composedBy: [shared, 'packages/a/src/one.proxy.ts' as never],
                  catchAll: [ProxyCatchAllStub({ file: shared })],
                }),
                AdapterCallerStub({
                  composedBy: [shared],
                  catchAll: [ProxyCatchAllStub({ file: shared })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    expect(result).toStrictEqual({
      adapters: 1,
      passThrough: 1,
      logic: 0,
      productionCallers: 2,
      composingProxies: 2,
      catchAllProxies: 1,
    });
  });
});
