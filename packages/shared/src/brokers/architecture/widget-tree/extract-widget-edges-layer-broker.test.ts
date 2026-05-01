import { extractWidgetEdgesLayerBroker } from './extract-widget-edges-layer-broker';
import { extractWidgetEdgesLayerBrokerProxy } from './extract-widget-edges-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

describe('extractWidgetEdgesLayerBroker', () => {
  describe('child widget edges', () => {
    it('VALID: {widget importing another widget} => child widget path returned', () => {
      const proxy = extractWidgetEdgesLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const widgetFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const childWidgetPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/chat/chat-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([childWidgetPath]);

      proxy.setupWidgetSource({
        content: ContentTextStub({
          value: `import { ChatWidget } from '../chat/chat-widget';`,
        }),
      });

      const result = extractWidgetEdgesLayerBroker({
        widgetFilePath,
        packageSrcPath,
        widgetFileSet,
      });

      expect(result).toStrictEqual({
        childWidgetPaths: ['/repo/packages/web/src/widgets/chat/chat-widget.tsx'],
        bindingNames: [],
      });
    });

    it('VALID: {widget importing binding} => binding name returned', () => {
      const proxy = extractWidgetEdgesLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const widgetFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>();

      proxy.setupWidgetSource({
        content: ContentTextStub({
          value: `import { useQuestBinding } from '../../bindings/quest/use-quest-binding';`,
        }),
      });

      const result = extractWidgetEdgesLayerBroker({
        widgetFilePath,
        packageSrcPath,
        widgetFileSet,
      });

      expect(result).toStrictEqual({
        childWidgetPaths: [],
        bindingNames: ['use-quest-binding'],
      });
    });

    it('EMPTY: {missing widget file} => returns empty edges', () => {
      const proxy = extractWidgetEdgesLayerBrokerProxy();
      proxy.setupMissingWidget();

      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const widgetFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/missing/missing-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>();

      const result = extractWidgetEdgesLayerBroker({
        widgetFilePath,
        packageSrcPath,
        widgetFileSet,
      });

      expect(result).toStrictEqual({
        childWidgetPaths: [],
        bindingNames: [],
      });
    });
  });

  describe('non-widget imports', () => {
    it('VALID: {widget importing npm package} => ignored, not in edges', () => {
      const proxy = extractWidgetEdgesLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src' });
      const widgetFilePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>();

      proxy.setupWidgetSource({
        content: ContentTextStub({
          value: `import React from 'react';`,
        }),
      });

      const result = extractWidgetEdgesLayerBroker({
        widgetFilePath,
        packageSrcPath,
        widgetFileSet,
      });

      expect(result).toStrictEqual({
        childWidgetPaths: [],
        bindingNames: [],
      });
    });
  });
});
