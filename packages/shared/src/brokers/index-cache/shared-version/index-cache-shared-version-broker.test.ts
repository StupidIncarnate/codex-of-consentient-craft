import { indexCacheSharedVersionBroker } from './index-cache-shared-version-broker';
import { indexCacheSharedVersionBrokerProxy } from './index-cache-shared-version-broker.proxy';

describe('indexCacheSharedVersionBroker', () => {
  it('VALID: {shared 0.2.0 installed under the root} => returns 0.2.0', () => {
    const proxy = indexCacheSharedVersionBrokerProxy();
    proxy.setupSharedVersion({ rootDir: '/repo', version: '0.2.0' });

    expect(indexCacheSharedVersionBroker({ rootDir: '/repo' })).toBe('0.2.0');
  });

  it('EMPTY: {no shared installed under the root} => returns empty text', () => {
    const proxy = indexCacheSharedVersionBrokerProxy();
    proxy.setupNoSharedInstalled({ rootDir: '/repo-bare' });

    expect(indexCacheSharedVersionBroker({ rootDir: '/repo-bare' })).toBe('');
  });
});
