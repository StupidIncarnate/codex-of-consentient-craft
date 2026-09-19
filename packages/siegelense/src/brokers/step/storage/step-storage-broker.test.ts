import { StorageReadingStub } from '../../../contracts/storage-reading/storage-reading.stub';
import { stepStorageBroker } from './step-storage-broker';
import { stepStorageBrokerProxy } from './step-storage-broker.proxy';

describe('stepStorageBroker', () => {
  it('VALID: {prefix: "dm-"} => calls session.readStorage with prefix and returns rendered reading', async () => {
    const proxy = stepStorageBrokerProxy();
    const { session, getReadStorageCalls } = proxy.session();

    const result = await stepStorageBroker({ session, prefix: 'dm-' });

    expect(getReadStorageCalls()).toStrictEqual([[{ prefix: 'dm-' }]]);
    expect(result).toBe('{"origin":"http://localhost:3000","local":{},"session":{}}');
  });

  it('VALID: {custom reading} => returns rendered custom reading', async () => {
    const proxy = stepStorageBrokerProxy();
    const customReading = StorageReadingStub({
      origin: 'https://example.com',
      local: { 'dm-theme': 'dark' },
    });
    const { session, getReadStorageCalls } = proxy.session({ reading: customReading });

    const result = await stepStorageBroker({ session, prefix: 'dm-' });

    expect(getReadStorageCalls()).toStrictEqual([[{ prefix: 'dm-' }]]);
    expect(result).toBe(
      '{"origin":"https://example.com","local":{"dm-theme":"dark"},"session":{}}',
    );
  });
});
