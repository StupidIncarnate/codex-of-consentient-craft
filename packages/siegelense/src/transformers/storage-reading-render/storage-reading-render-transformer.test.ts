import { StorageReadingStub } from '../../contracts/storage-reading/storage-reading.stub';
import { storageReadingRenderTransformer } from './storage-reading-render-transformer';

describe('storageReadingRenderTransformer', () => {
  it('VALID: {default stub} => serializes to ContentText JSON string', () => {
    const reading = StorageReadingStub();

    const result = storageReadingRenderTransformer({ reading });

    expect(result).toBe('{"origin":"http://localhost:3000","local":{},"session":{}}');
  });

  it('VALID: {reading with entries} => serializes full storage reading to ContentText JSON string', () => {
    const reading = StorageReadingStub({
      origin: 'https://example.com',
      local: { 'dm-theme': 'dark' },
      session: { 'dm-session': 'active' },
    });

    const result = storageReadingRenderTransformer({ reading });

    expect(result).toBe(
      '{"origin":"https://example.com","local":{"dm-theme":"dark"},"session":{"dm-session":"active"}}',
    );
  });
});
