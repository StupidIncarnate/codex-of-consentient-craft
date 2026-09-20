import { storageReadLayerAdapter } from './storage-read-layer-adapter';
import { storageReadLayerAdapterProxy } from './storage-read-layer-adapter.proxy';

describe('storageReadLayerAdapter', () => {
  it('VALID: {page, prefix: "dm-"} => calls page.evaluate and returns parsed StorageReading', async () => {
    const proxy = storageReadLayerAdapterProxy();
    const { page, getEvaluateCalls } = proxy.page({
      result: {
        origin: 'http://localhost:3000',
        local: { 'dm-theme': 'dark' },
        session: { 'dm-token': 'abc' },
      },
    });

    const result = await storageReadLayerAdapter({ page, prefix: 'dm-' });

    expect(getEvaluateCalls()).toStrictEqual([
      {
        fn: expect.any(Function),
        arg: 'dm-',
      },
    ]);
    expect(result).toStrictEqual({
      origin: 'http://localhost:3000',
      local: { 'dm-theme': 'dark' },
      session: { 'dm-token': 'abc' },
    });
  });

  it('VALID: {page, prefix: ""} => calls page.evaluate with empty prefix', async () => {
    const proxy = storageReadLayerAdapterProxy();
    const { page, getEvaluateCalls } = proxy.page({
      result: {
        origin: 'https://example.com',
        local: {},
        session: {},
      },
    });

    const result = await storageReadLayerAdapter({ page, prefix: '' });

    expect(getEvaluateCalls()).toStrictEqual([
      {
        fn: expect.any(Function),
        arg: '',
      },
    ]);
    expect(result).toStrictEqual({
      origin: 'https://example.com',
      local: {},
      session: {},
    });
  });
});
