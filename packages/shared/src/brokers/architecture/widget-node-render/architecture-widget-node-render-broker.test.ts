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
    it('VALID: {isLast: true} => single line with last connector showing export name', () => {
      const proxy = architectureWidgetNodeRenderBrokerProxy();
      proxy.setupExportNamesMap({
        map: {
          'my-widget.tsx': ContentTextStub({ value: `export const MyWidget = () => null;` }),
        },
      });

      const node = WidgetNodeStub({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/my/my-widget.tsx',
        }),
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
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.last} MyWidget`,
      ]);
    });

    it('VALID: {isLast: false} => single line with branch connector showing export name', () => {
      const proxy = architectureWidgetNodeRenderBrokerProxy();
      proxy.setupExportNamesMap({
        map: {
          'my-widget.tsx': ContentTextStub({ value: `export const MyWidget = () => null;` }),
        },
      });

      const node = WidgetNodeStub({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/my/my-widget.tsx',
        }),
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
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.branch} MyWidget`,
      ]);
    });
  });

  describe('node with bindings', () => {
    it('VALID: {one binding, isLast: true} => widget line and bindings line use export names', () => {
      const proxy = architectureWidgetNodeRenderBrokerProxy();
      proxy.setupExportNamesMap({
        map: {
          'chat-widget.tsx': ContentTextStub({ value: `export const ChatWidget = () => null;` }),
          'use-quest-chat-binding.ts': ContentTextStub({
            value: `export const useQuestChat = () => null;`,
          }),
          'use-quest-chat.ts': ContentTextStub({
            value: `export const useQuestChat = () => null;`,
          }),
        },
      });

      const node = WidgetNodeStub({
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
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.last} ChatWidget`,
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.indent}bindings: useQuestChat`,
      ]);
    });
  });

  describe('node with child', () => {
    it('VALID: {one child, isLast: true} => child export name appears in output lines', () => {
      const proxy = architectureWidgetNodeRenderBrokerProxy();
      proxy.setupExportNamesMap({
        map: {
          'parent-widget.tsx': ContentTextStub({
            value: `export const ParentWidget = () => null;`,
          }),
          'child-widget.tsx': ContentTextStub({
            value: `export const ChildWidget = () => null;`,
          }),
        },
      });

      const child = WidgetNodeStub({
        bindingsAttached: [],
        children: [],
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/widgets/child/child-widget.tsx',
        }),
      });
      const node = WidgetNodeStub({
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
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.last} ParentWidget`,
        `${projectMapHeadlineFrontendReactStatics.treeConnectors.indent}${projectMapHeadlineFrontendReactStatics.treeConnectors.last} ChildWidget`,
      ]);
    });
  });
});
