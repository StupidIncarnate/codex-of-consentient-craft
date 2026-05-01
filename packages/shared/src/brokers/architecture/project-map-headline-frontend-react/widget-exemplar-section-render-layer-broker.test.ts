import { widgetExemplarSectionRenderLayerBroker } from './widget-exemplar-section-render-layer-broker';
import { widgetExemplarSectionRenderLayerBrokerProxy } from './widget-exemplar-section-render-layer-broker.proxy';
import { WidgetTreeResultStub } from '../../../contracts/widget-tree-result/widget-tree-result.stub';
import { WidgetNodeStub } from '../../../contracts/widget-node/widget-node.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { HttpEdgeStub } from '../../../contracts/http-edge/http-edge.stub';
import { StateWritesResultStub } from '../../../contracts/state-writes-result/state-writes-result.stub';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/web' });

const QUEST_CHAT_NODE = WidgetNodeStub({
  widgetName: ContentTextStub({ value: 'quest-chat-widget' }),
  bindingsAttached: [ContentTextStub({ value: 'use-quest-chat' })],
  children: [],
  filePath: AbsoluteFilePathStub({
    value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
  }),
});

const EMPTY_STATE = StateWritesResultStub();

// HTTP edge whose webBrokerFile is under /repo/packages/web — matches the package root
const MATCHED_EDGE = HttpEdgeStub({
  method: ContentTextStub({ value: 'GET' }),
  urlPattern: ContentTextStub({ value: '/api/quests' }),
  webBrokerFile: AbsoluteFilePathStub({
    value: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
  }),
  paired: true,
});

describe('widgetExemplarSectionRenderLayerBroker', () => {
  describe('no root with bindings', () => {
    it('EMPTY: {no roots with bindings} => exemplar section header present', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarSectionHeader),
      ).toBe(true);
    });

    it('EMPTY: {no roots with bindings} => exemplar empty message present', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarSectionEmpty),
      ).toBe(true);
    });
  });

  describe('root with bindings, no HTTP edge for package', () => {
    it('VALID: {root with binding, no matching HTTP edge} => click step label present', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.click),
      ).toBe(true);
    });

    it('VALID: {root with binding, no matching HTTP edge} => derived broker name in output', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  quest-chat-broker({ ... })')).toBe(true);
    });

    it('VALID: {root with binding, no matching HTTP edge} => no HTTP edge message in output', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  (no HTTP edge found for this package)')).toBe(true);
    });

    it('VALID: {root with binding, no matching HTTP edge} => re-render step label present', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.rerender),
      ).toBe(true);
    });
  });

  describe('root with bindings and matching HTTP edge', () => {
    it('VALID: {matching HTTP edge for package} => boundary box top line in output', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [MATCHED_EDGE],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const { boundaryBoxLabel, boundaryBoxPadding } = projectMapHeadlineFrontendReactStatics;
      const boxWidth = boundaryBoxLabel.length + boundaryBoxPadding;
      const expectedTopLine = `  ╔${'═'.repeat(boxWidth)}╗`;

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === expectedTopLine)).toBe(true);
    });

    it('VALID: {matching HTTP edge for package} => state write step label present', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [MATCHED_EDGE],
        stateResult: EMPTY_STATE,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.stateWrite,
        ),
      ).toBe(true);
    });
  });

  describe('state writes present', () => {
    it('VALID: {in-memory store} => store name in state write line', () => {
      widgetExemplarSectionRenderLayerBrokerProxy();
      const widgetTree = WidgetTreeResultStub({ roots: [QUEST_CHAT_NODE], hubs: [] });
      const stateWithStore = StateWritesResultStub({
        inMemoryStores: [ContentTextStub({ value: 'agent-output' })],
      });

      const result = widgetExemplarSectionRenderLayerBroker({
        widgetTree,
        httpEdges: [],
        stateResult: stateWithStore,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  in-memory: agent-output')).toBe(true);
    });
  });
});
