import { buildWidgetNodeLayerBroker } from './build-widget-node-layer-broker';
import { buildWidgetNodeLayerBrokerProxy } from './build-widget-node-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { WidgetEdgesStub } from '../../../contracts/widget-edges/widget-edges.stub';

type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

describe('buildWidgetNodeLayerBroker', () => {
  describe('leaf nodes', () => {
    it('VALID: {widget with no children} => returns node with empty children', () => {
      buildWidgetNodeLayerBrokerProxy();

      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([filePath]);
      const edgesMap = new Map([[filePath, WidgetEdgesStub()]]);
      const hubPaths = new Set<AbsoluteFilePath>();

      const result = buildWidgetNodeLayerBroker({
        filePath,
        widgetFileSet,
        edgesMap,
        hubPaths,
        visited: new Set<AbsoluteFilePath>(),
      });

      expect(result).toStrictEqual({
        widgetName: 'app-widget',
        filePath: '/repo/packages/web/src/widgets/app/app-widget.tsx',
        bindingsAttached: [],
        children: [],
      });
    });

    it('VALID: {widget with binding} => binding appears in bindingsAttached', () => {
      buildWidgetNodeLayerBrokerProxy();

      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([filePath]);
      const binding = ContentTextStub({ value: 'use-quest-binding' });
      const edgesMap = new Map([[filePath, WidgetEdgesStub({ bindingNames: [binding] })]]);
      const hubPaths = new Set<AbsoluteFilePath>();

      const result = buildWidgetNodeLayerBroker({
        filePath,
        widgetFileSet,
        edgesMap,
        hubPaths,
        visited: new Set<AbsoluteFilePath>(),
      });

      expect(result).toStrictEqual({
        widgetName: 'app-widget',
        filePath: '/repo/packages/web/src/widgets/app/app-widget.tsx',
        bindingsAttached: ['use-quest-binding'],
        children: [],
      });
    });
  });

  describe('child nesting', () => {
    it('VALID: {root with 3 children, none hubs} => tree has 3 nested nodes', () => {
      buildWidgetNodeLayerBrokerProxy();

      const rootPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const childA = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/panel/panel-widget.tsx',
      });
      const childB = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/header/header-widget.tsx',
      });
      const childC = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/footer/footer-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([rootPath, childA, childB, childC]);
      const edgesMap = new Map([
        [rootPath, WidgetEdgesStub({ childWidgetPaths: [childA, childB, childC] })],
        [childA, WidgetEdgesStub()],
        [childB, WidgetEdgesStub()],
        [childC, WidgetEdgesStub()],
      ]);
      const hubPaths = new Set<AbsoluteFilePath>();

      const result = buildWidgetNodeLayerBroker({
        filePath: rootPath,
        widgetFileSet,
        edgesMap,
        hubPaths,
        visited: new Set<AbsoluteFilePath>(),
      });

      expect(result).toStrictEqual({
        widgetName: 'app-widget',
        filePath: '/repo/packages/web/src/widgets/app/app-widget.tsx',
        bindingsAttached: [],
        children: [
          {
            widgetName: 'panel-widget',
            filePath: '/repo/packages/web/src/widgets/panel/panel-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
          {
            widgetName: 'header-widget',
            filePath: '/repo/packages/web/src/widgets/header/header-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
          {
            widgetName: 'footer-widget',
            filePath: '/repo/packages/web/src/widgets/footer/footer-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
      });
    });

    it('VALID: {hub widget as child} => hub appears as stub leaf (not expanded)', () => {
      buildWidgetNodeLayerBrokerProxy();

      const rootPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const hubPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/shared/shared-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([rootPath, hubPath]);
      const edgesMap = new Map([
        [rootPath, WidgetEdgesStub({ childWidgetPaths: [hubPath] })],
        [hubPath, WidgetEdgesStub()],
      ]);
      const hubPaths = new Set<AbsoluteFilePath>([hubPath]);

      const result = buildWidgetNodeLayerBroker({
        filePath: rootPath,
        widgetFileSet,
        edgesMap,
        hubPaths,
        visited: new Set<AbsoluteFilePath>(),
      });

      expect(result).toStrictEqual({
        widgetName: 'app-widget',
        filePath: '/repo/packages/web/src/widgets/app/app-widget.tsx',
        bindingsAttached: [],
        children: [
          {
            widgetName: 'shared-widget',
            filePath: '/repo/packages/web/src/widgets/shared/shared-widget.tsx',
            bindingsAttached: [],
            children: [],
          },
        ],
      });
    });

    it('VALID: {tree 4 levels deep} => fully expanded since the depth cap was removed', () => {
      buildWidgetNodeLayerBrokerProxy();

      const rootPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/app/app-widget.tsx',
      });
      const childPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/panel/panel-widget.tsx',
      });
      const grandchildPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/card/card-widget.tsx',
      });
      const deepPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/deep/deep-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([
        rootPath,
        childPath,
        grandchildPath,
        deepPath,
      ]);
      const edgesMap = new Map([
        [rootPath, WidgetEdgesStub({ childWidgetPaths: [childPath] })],
        [childPath, WidgetEdgesStub({ childWidgetPaths: [grandchildPath] })],
        [grandchildPath, WidgetEdgesStub({ childWidgetPaths: [deepPath] })],
        [deepPath, WidgetEdgesStub()],
      ]);
      const hubPaths = new Set<AbsoluteFilePath>();

      const result = buildWidgetNodeLayerBroker({
        filePath: rootPath,
        widgetFileSet,
        edgesMap,
        hubPaths,
        visited: new Set<AbsoluteFilePath>(),
      });

      expect(result).toStrictEqual({
        widgetName: 'app-widget',
        filePath: '/repo/packages/web/src/widgets/app/app-widget.tsx',
        bindingsAttached: [],
        children: [
          {
            widgetName: 'panel-widget',
            filePath: '/repo/packages/web/src/widgets/panel/panel-widget.tsx',
            bindingsAttached: [],
            children: [
              {
                widgetName: 'card-widget',
                filePath: '/repo/packages/web/src/widgets/card/card-widget.tsx',
                bindingsAttached: [],
                children: [
                  {
                    widgetName: 'deep-widget',
                    filePath: '/repo/packages/web/src/widgets/deep/deep-widget.tsx',
                    bindingsAttached: [],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe('cycle protection', () => {
    it('VALID: {widget A child includes widget A again via grandchild} => second visit renders as stub leaf without infinite loop', () => {
      buildWidgetNodeLayerBrokerProxy();

      const aPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/a/a-widget.tsx',
      });
      const bPath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/widgets/b/b-widget.tsx',
      });
      const widgetFileSet = new Set<AbsoluteFilePath>([aPath, bPath]);
      const edgesMap = new Map([
        [aPath, WidgetEdgesStub({ childWidgetPaths: [bPath] })],
        [bPath, WidgetEdgesStub({ childWidgetPaths: [aPath] })],
      ]);
      const hubPaths = new Set<AbsoluteFilePath>();

      const result = buildWidgetNodeLayerBroker({
        filePath: aPath,
        widgetFileSet,
        edgesMap,
        hubPaths,
        visited: new Set<AbsoluteFilePath>(),
      });

      expect(result).toStrictEqual({
        widgetName: 'a-widget',
        filePath: '/repo/packages/web/src/widgets/a/a-widget.tsx',
        bindingsAttached: [],
        children: [
          {
            widgetName: 'b-widget',
            filePath: '/repo/packages/web/src/widgets/b/b-widget.tsx',
            bindingsAttached: [],
            children: [
              {
                widgetName: 'a-widget',
                filePath: '/repo/packages/web/src/widgets/a/a-widget.tsx',
                bindingsAttached: [],
                children: [],
              },
            ],
          },
        ],
      });
    });
  });
});
