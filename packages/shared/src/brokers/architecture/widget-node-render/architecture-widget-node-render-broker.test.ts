import { architectureWidgetNodeRenderBroker } from './architecture-widget-node-render-broker';
import { architectureWidgetNodeRenderBrokerProxy } from './architecture-widget-node-render-broker.proxy';
import { WidgetNodeStub } from '../../../contracts/widget-node/widget-node.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

const EMPTY_PREFIX = ContentTextStub({ value: '' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/web' });
const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

describe('architectureWidgetNodeRenderBroker', () => {
  describe('leaf node (no children, no bindings)', () => {
    it('VALID: {isLast: true} => single line with last connector', () => {
      architectureWidgetNodeRenderBrokerProxy();
      const node = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'my-widget' }),
        bindingsAttached: [],
        children: [],
      });

      const lines = architectureWidgetNodeRenderBroker({
        node,
        prefix: EMPTY_PREFIX,
        isLast: true,
        httpEdges: [],
        wsEdges: [],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      expect(lines.map(String)).toStrictEqual([
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.last} my-widget`,
      ]);
    });

    it('VALID: {isLast: false} => single line with branch connector', () => {
      architectureWidgetNodeRenderBrokerProxy();
      const node = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'my-widget' }),
        bindingsAttached: [],
        children: [],
      });

      const lines = architectureWidgetNodeRenderBroker({
        node,
        prefix: EMPTY_PREFIX,
        isLast: false,
        httpEdges: [],
        wsEdges: [],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      expect(lines.map(String)).toStrictEqual([
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.branch} my-widget`,
      ]);
    });
  });

  describe('node with bindings', () => {
    it('VALID: {one binding, isLast: true} => widget line and bindings line present', () => {
      architectureWidgetNodeRenderBrokerProxy();
      const node = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'chat-widget' }),
        bindingsAttached: [ContentTextStub({ value: 'use-quest-chat' })],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/chat/chat-widget.tsx',
        }),
      });

      const lines = architectureWidgetNodeRenderBroker({
        node,
        prefix: EMPTY_PREFIX,
        isLast: true,
        httpEdges: [],
        wsEdges: [],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      expect(lines.map(String)).toStrictEqual([
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.last} chat-widget`,
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.indent}bindings: use-quest-chat`,
      ]);
    });
  });

  describe('node with child', () => {
    it('VALID: {one child, isLast: true} => child name appears in output lines', () => {
      architectureWidgetNodeRenderBrokerProxy();
      const child = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'child-widget' }),
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/child/child-widget.tsx',
        }),
      });
      const node = WidgetNodeStub({
        widgetName: ContentTextStub({ value: 'parent-widget' }),
        bindingsAttached: [],
        children: [child],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/parent/parent-widget.tsx',
        }),
      });

      const lines = architectureWidgetNodeRenderBroker({
        node,
        prefix: EMPTY_PREFIX,
        isLast: true,
        httpEdges: [],
        wsEdges: [],
        packageRoot: PACKAGE_ROOT,
        projectRoot: PROJECT_ROOT,
      });

      expect(lines.map(String)).toStrictEqual([
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.last} parent-widget`,
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.indent}${projectMapHeadlineFrontendReactStatics.treeConnectors.last} child-widget`,
      ]);
    });
  });
});
