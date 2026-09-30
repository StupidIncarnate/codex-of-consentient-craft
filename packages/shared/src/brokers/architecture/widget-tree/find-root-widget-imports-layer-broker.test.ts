import { findRootWidgetImportsLayerBroker } from './find-root-widget-imports-layer-broker';
import { findRootWidgetImportsLayerBrokerProxy } from './find-root-widget-imports-layer-broker.proxy';

describe('findRootWidgetImportsLayerBroker', () => {
  describe('root detection', () => {
    it('VALID: {responder imports widget} => widget is included in roots', () => {
      const proxy = findRootWidgetImportsLayerBrokerProxy();
      const packageSrcPath = '/repo/packages/web/src';
      const widgetPath = '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx';
      const responderFilePath = '/repo/packages/web/src/responders/app-responder.ts';

      proxy.setupRootSources({
        packageSrcPath,
        responderFilePaths: [responderFilePath],
        responderContents: [
          `import { QuestChatWidget } from '../widgets/quest-chat/quest-chat-widget';`,
        ],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = findRootWidgetImportsLayerBroker({
        packageSrcPath,
        widgetFilePaths: [widgetPath],
      });

      expect(result).toStrictEqual([
        '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
      ]);
    });

    it('VALID: {no responder imports widget} => widget not in roots', () => {
      const proxy = findRootWidgetImportsLayerBrokerProxy();
      const packageSrcPath = '/repo/packages/web/src';
      const widgetPath = '/repo/packages/web/src/widgets/hidden/hidden-widget.tsx';
      const responderFilePath = '/repo/packages/web/src/responders/app-responder.ts';

      proxy.setupRootSources({
        packageSrcPath,
        responderFilePaths: [responderFilePath],
        responderContents: [
          `import { OtherWidget } from '../widgets/other/other-widget';`,
        ],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = findRootWidgetImportsLayerBroker({
        packageSrcPath,
        widgetFilePaths: [widgetPath],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no widget files} => returns empty array', () => {
      const proxy = findRootWidgetImportsLayerBrokerProxy();
      const packageSrcPath = '/repo/packages/web/src';
      proxy.setupEmpty({ packageSrcPath });

      const result = findRootWidgetImportsLayerBroker({
        packageSrcPath,
        widgetFilePaths: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no responders or flows} => returns empty array', () => {
      const proxy = findRootWidgetImportsLayerBrokerProxy();
      const packageSrcPath = '/repo/packages/web/src';
      proxy.setupEmpty({ packageSrcPath });

      const widgetPath = '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx';

      const result = findRootWidgetImportsLayerBroker({
        packageSrcPath,
        widgetFilePaths: [widgetPath],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
