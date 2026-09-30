import { readSourceTextLayerBroker } from './read-source-text-layer-broker';
import { readSourceTextLayerBrokerProxy } from './read-source-text-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readSourceTextLayerBroker', () => {
  it('VALID: {file exists} => returns the file contents', () => {
    const proxy = readSourceTextLayerBrokerProxy();
    const filePath = '/repo/file.ts';
    proxy.setupReturns({ filePath, content: ContentTextStub({ value: 'export const foo = 1;' }) });

    const result = readSourceTextLayerBroker({ filePath });

    expect(String(result)).toBe('export const foo = 1;');
  });

  it('EMPTY: {file missing} => returns undefined (swallows error)', () => {
    const proxy = readSourceTextLayerBrokerProxy();
    const filePath = '/repo/missing.ts';
    proxy.setupMissing({ filePath });

    const result = readSourceTextLayerBroker({ filePath });

    expect(result).toBe(undefined);
  });
});
