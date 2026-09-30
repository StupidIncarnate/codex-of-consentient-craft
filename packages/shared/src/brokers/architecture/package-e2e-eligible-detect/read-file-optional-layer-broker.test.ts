import { readFileOptionalLayerBrokerProxy } from './read-file-optional-layer-broker.proxy';
import { readFileOptionalLayerBroker } from './read-file-optional-layer-broker';

describe('readFileOptionalLayerBroker', () => {
  it('VALID: {filePath: existing file} => returns content', () => {
    const proxy = readFileOptionalLayerBrokerProxy();
    const filePath = '/project/package.json';
    const content = '{"dependencies":{"react":"18.2.0"}}';
    proxy.setupReturns({ filePath, content });

    const result = readFileOptionalLayerBroker({ filePath });

    expect(result).toBe(content);
  });

  it('ERROR: {filePath: missing file} => returns undefined', () => {
    const proxy = readFileOptionalLayerBrokerProxy();
    const filePath = '/project/package.json';
    proxy.setupMissing({ filePath });

    const result = readFileOptionalLayerBroker({ filePath });

    expect(result).toBe(undefined);
  });
});
