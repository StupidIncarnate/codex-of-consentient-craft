import { readSourceTextLayerBroker } from './read-source-text-layer-broker';
import { readSourceTextLayerBrokerProxy } from './read-source-text-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readSourceTextLayerBroker', () => {
  it('VALID: {file exists} => returns the file contents', () => {
    const proxy = readSourceTextLayerBrokerProxy();
    proxy.setupReturns({ content: ContentTextStub({ value: 'export const foo = 1;' }) });
    const filePath = AbsoluteFilePathStub({ value: '/repo/file.ts' });

    const result = readSourceTextLayerBroker({ filePath });

    expect(String(result)).toBe('export const foo = 1;');
  });

  it('EMPTY: {file missing} => returns undefined (swallows error)', () => {
    const proxy = readSourceTextLayerBrokerProxy();
    proxy.setupMissing();
    const filePath = AbsoluteFilePathStub({ value: '/repo/missing.ts' });

    const result = readSourceTextLayerBroker({ filePath });

    expect(result).toBe(undefined);
  });
});
