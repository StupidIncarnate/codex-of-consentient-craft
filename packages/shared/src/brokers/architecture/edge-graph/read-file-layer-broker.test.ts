import { readFileLayerBroker } from './read-file-layer-broker';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readFileLayerBroker', () => {
  it('VALID: {existing file} => returns file contents', () => {
    const proxy = readFileLayerBrokerProxy();
    const filePath = AbsoluteFilePathStub({
      value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
    });
    const content = ContentTextStub({
      value: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
    });

    proxy.setupReturns({ content });

    const result = readFileLayerBroker({ filePath });

    expect(result).toBe(content);
  });

  it('EMPTY: {missing file} => returns undefined', () => {
    const proxy = readFileLayerBrokerProxy();
    const filePath = AbsoluteFilePathStub({
      value: '/repo/packages/server/src/flows/missing/missing-flow.ts',
    });

    proxy.setupMissing();

    const result = readFileLayerBroker({ filePath });

    expect(result).toBe(undefined);
  });
});
