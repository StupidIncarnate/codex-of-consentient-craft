import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { readFileOptionalLayerBroker } from './read-file-optional-layer-broker';

describe('readFileOptionalLayerBroker', () => {
  it('VALID: {filePath: existing file} => returns content', () => {
    const proxy = readFileOptionalLayerBrokerProxy();
    const content = ContentTextStub({ value: 'export const StartFoo = {};' });
    proxy.setupReturns({ content });

    const result = readFileOptionalLayerBroker({
      filePath: AbsoluteFilePathStub({ value: '/project/src/startup/start-foo.ts' }),
    });

    expect(result).toBe(content);
  });

  it('ERROR: {filePath: missing file} => returns undefined', () => {
    const proxy = readFileOptionalLayerBrokerProxy();
    proxy.setupMissing();

    const result = readFileOptionalLayerBroker({
      filePath: AbsoluteFilePathStub({ value: '/project/src/startup/start-foo.ts' }),
    });

    expect(result).toBe(undefined);
  });
});
