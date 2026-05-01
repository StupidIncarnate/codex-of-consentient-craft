import { architectureWidgetTreeBroker } from './architecture-widget-tree-broker';
import { architectureWidgetTreeBrokerProxy } from './architecture-widget-tree-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureWidgetTreeBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {package with no widget files} => returns empty roots and hubs', () => {
      const proxy = architectureWidgetTreeBrokerProxy();
      proxy.setupEmpty();

      const result = architectureWidgetTreeBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toStrictEqual({ roots: [], hubs: [] });
    });
  });

  describe('test and proxy file filtering', () => {
    it('VALID: {test/proxy/stub widget files only} => all filtered, returns empty tree', () => {
      const proxy = architectureWidgetTreeBrokerProxy();
      proxy.setupPackage({
        widgetFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.test.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.proxy.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.stub.ts' }),
        ],
        widgetSources: [],
        responderFilePaths: [],
        responderContents: [],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = architectureWidgetTreeBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toStrictEqual({ roots: [], hubs: [] });
    });
  });

  describe('layer file handling', () => {
    it('VALID: {layer widget alongside entry widget} => layer file not in tree as sibling', () => {
      const proxy = architectureWidgetTreeBrokerProxy();
      // app-widget.tsx is entry widget; content-layer-widget.tsx is its layer file
      proxy.setupPackage({
        widgetFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.tsx' }),
          AbsoluteFilePathStub({
            value: '/repo/packages/web/src/widgets/content-layer-widget.tsx',
          }),
        ],
        widgetSources: [
          // app-widget source: no widget imports
          ContentTextStub({ value: `import React from 'react';` }),
          // content-layer-widget source: no widget imports (layer file, not a root)
          ContentTextStub({ value: `import React from 'react';` }),
        ],
        responderFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders/app-responder.ts' }),
        ],
        responderContents: [
          ContentTextStub({
            value: `import { AppWidget } from '../widgets/app-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = architectureWidgetTreeBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      // Only app-widget appears as root; content-layer-widget is excluded
      expect(result).toStrictEqual({
        roots: [
          {
            widgetName: 'app-widget',
            filePath: '/repo/packages/web/src/widgets/app-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
        hubs: [],
      });
    });
  });

  describe('single root with no children', () => {
    it('VALID: {one root widget imported by responder, no child widgets} => tree with one node', () => {
      const proxy = architectureWidgetTreeBrokerProxy();
      proxy.setupPackage({
        widgetFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.tsx' }),
        ],
        widgetSources: [ContentTextStub({ value: `import React from 'react';` })],
        responderFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders/app-responder.ts' }),
        ],
        responderContents: [
          ContentTextStub({
            value: `import { AppWidget } from '../widgets/app-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = architectureWidgetTreeBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toStrictEqual({
        roots: [
          {
            widgetName: 'app-widget',
            filePath: '/repo/packages/web/src/widgets/app-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
        hubs: [],
      });
    });
  });

  describe('bindings in widget', () => {
    it('VALID: {widget imports binding} => binding name in bindingsAttached', () => {
      const proxy = architectureWidgetTreeBrokerProxy();
      proxy.setupPackage({
        widgetFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/data-widget.tsx' }),
        ],
        widgetSources: [
          ContentTextStub({
            value: `import { useQuestBinding } from '../bindings/quest/use-quest-binding';`,
          }),
        ],
        responderFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders/app-responder.ts' }),
        ],
        responderContents: [
          ContentTextStub({
            value: `import { DataWidget } from '../widgets/data-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = architectureWidgetTreeBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toStrictEqual({
        roots: [
          {
            widgetName: 'data-widget',
            filePath: '/repo/packages/web/src/widgets/data-widget.tsx',
            bindingsAttached: ['use-quest-binding'],
            children: [],
          },
        ],
        hubs: [],
      });
    });
  });

  describe('hub detection', () => {
    it('VALID: {widget with in-degree >= 5} => appears in hubs list, not nested in tree', () => {
      const proxy = architectureWidgetTreeBrokerProxy();
      // 5 different widgets all import shared-widget → in-degree 5 → hub
      proxy.setupPackage({
        widgetFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/panel-a-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/panel-b-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/panel-c-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/panel-d-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/panel-e-widget.tsx' }),
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/shared-widget.tsx' }),
        ],
        widgetSources: [
          // app-widget: no imports
          ContentTextStub({ value: `import React from 'react';` }),
          // panel-a imports shared-widget (sibling in widgets/)
          ContentTextStub({
            value: `import { SharedWidget } from './shared-widget';`,
          }),
          // panel-b imports shared-widget (sibling in widgets/)
          ContentTextStub({
            value: `import { SharedWidget } from './shared-widget';`,
          }),
          // panel-c imports shared-widget (sibling in widgets/)
          ContentTextStub({
            value: `import { SharedWidget } from './shared-widget';`,
          }),
          // panel-d imports shared-widget (sibling in widgets/)
          ContentTextStub({
            value: `import { SharedWidget } from './shared-widget';`,
          }),
          // panel-e imports shared-widget (sibling in widgets/)
          ContentTextStub({
            value: `import { SharedWidget } from './shared-widget';`,
          }),
          // shared-widget: no imports
          ContentTextStub({ value: `import React from 'react';` }),
        ],
        responderFilePaths: [
          AbsoluteFilePathStub({ value: '/repo/packages/web/src/responders/app-responder.ts' }),
        ],
        responderContents: [
          ContentTextStub({
            value: `import { AppWidget } from '../widgets/app-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
      });

      const result = architectureWidgetTreeBroker({
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      // app-widget is the root (not a hub, in-degree=0)
      // shared-widget has in-degree=5 → hub
      expect(result).toStrictEqual({
        roots: [
          {
            widgetName: 'app-widget',
            filePath: '/repo/packages/web/src/widgets/app-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
        hubs: ['shared-widget'],
      });
    });
  });
});
