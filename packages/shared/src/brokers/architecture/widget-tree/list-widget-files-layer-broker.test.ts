import { listWidgetFilesLayerBroker } from './list-widget-files-layer-broker';
import { listWidgetFilesLayerBrokerProxy } from './list-widget-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('listWidgetFilesLayerBroker', () => {
  describe('widget file collection', () => {
    it('VALID: {directory with widget files} => returns only widget files', () => {
      const proxy = listWidgetFilesLayerBrokerProxy();
      const widgetsDirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets' });

      proxy.setupFlatWidgetsDir({
        filePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/quest-chat-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/user-card-widget.tsx' }),
        ],
      });

      const result = listWidgetFilesLayerBroker({ widgetsDirPath });

      expect(result).toStrictEqual([
        '/repo/packages/web/src/widgets/quest-chat-widget.tsx',
        '/repo/packages/web/src/widgets/user-card-widget.tsx',
      ]);
    });

    it('VALID: {test and proxy files present} => filters them out', () => {
      const proxy = listWidgetFilesLayerBrokerProxy();
      const widgetsDirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets' });

      proxy.setupFlatWidgetsDir({
        filePaths: [
          AbsoluteFilePathStub({
            value: '/repo/packages/web/src/widgets/quest-chat-widget.test.tsx',
          }),
          AbsoluteFilePathStub({
            value: '/repo/packages/web/src/widgets/quest-chat-widget.proxy.tsx',
          }),
        ],
      });

      const result = listWidgetFilesLayerBroker({ widgetsDirPath });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty widgets directory} => returns empty array', () => {
      const proxy = listWidgetFilesLayerBrokerProxy();
      proxy.setupEmpty();

      const widgetsDirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets' });
      const result = listWidgetFilesLayerBroker({ widgetsDirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
