import { readWidgetSourceLayerBroker } from './read-widget-source-layer-broker';
import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readWidgetSourceLayerBroker', () => {
  describe('successful reads', () => {
    it('VALID: {existing file} => returns file content', () => {
      const proxy = readWidgetSourceLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
      });
      const content = ContentTextStub({
        value: "import { useQuestBinding } from './use-quest-binding';",
      });
      proxy.setupReturns({ content });

      const result = readWidgetSourceLayerBroker({ filePath });

      expect(result).toBe("import { useQuestBinding } from './use-quest-binding';");
    });
  });

  describe('missing files', () => {
    it('EMPTY: {missing file} => returns undefined instead of throwing', () => {
      const proxy = readWidgetSourceLayerBrokerProxy();
      proxy.setupMissing();

      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/missing/missing-widget.tsx',
      });
      const result = readWidgetSourceLayerBroker({ filePath });

      expect(result).toBe(undefined);
    });
  });
});
