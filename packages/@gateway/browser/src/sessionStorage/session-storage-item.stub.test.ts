import { SessionStorageItemStub } from './session-storage-item.stub';

describe('SessionStorageItemStub', () => {
  it('VALID: {} => writes and reads back the default key/value through the real sessionStorage', () => {
    expect(SessionStorageItemStub()).toBe('gateway-stub-value');
  });

  it('VALID: {key, value} => writes and reads back the given key/value', () => {
    expect(SessionStorageItemStub({ key: 'draft', value: 'hello' })).toBe('hello');
  });
});
