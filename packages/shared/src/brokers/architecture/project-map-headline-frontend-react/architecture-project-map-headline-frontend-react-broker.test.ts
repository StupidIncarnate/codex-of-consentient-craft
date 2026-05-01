import { architectureProjectMapHeadlineFrontendReactBroker } from './architecture-project-map-headline-frontend-react-broker';
import { architectureProjectMapHeadlineFrontendReactBrokerProxy } from './architecture-project-map-headline-frontend-react-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/web' });

// Widget paths are flat (no subdir) — matching how the proxy's setupFlatWidgetsDir
// mocks readdir to return filenames directly in the widgets/ folder
const QUEST_CHAT_WIDGET_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/widgets/quest-chat-widget.tsx',
});
const HOME_CONTENT_WIDGET_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/widgets/home-content-widget.tsx',
});
const PIXEL_BTN_WIDGET_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/widgets/pixel-btn-widget.tsx',
});

const RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/responders/app-home-responder.tsx',
});

const QUEST_CHAT_SOURCE = ContentTextStub({
  value: `import { useQuestChat } from '../bindings/use-quest-chat';
import { HomeContentWidget } from './home-content-widget';
export const QuestChatWidget = () => {};`,
});

const HOME_CONTENT_SOURCE = ContentTextStub({
  value: `import { PixelBtnWidget } from './pixel-btn-widget';
export const HomeContentWidget = () => {};`,
});

const PIXEL_BTN_SOURCE = ContentTextStub({
  value: `export const PixelBtnWidget = () => {};`,
});

const RESPONDER_SOURCE = ContentTextStub({
  value: `import { QuestChatWidget } from '../widgets/quest-chat-widget';
export const AppHomeResponder = () => {};`,
});

const SERVER_STATICS = ContentTextStub({
  value: `export const apiRoutesStatics = {
  quests: { list: '/api/quests' },
} as const;`,
});

const WEB_STATICS = ContentTextStub({
  value: `export const webConfigStatics = {
  api: { routes: { quests: '/api/quests' } },
} as const;`,
});

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});

const QUEST_BROKER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/brokers/quest/list/quest-list-broker.ts',
});

const QUEST_FLOW_SOURCE = ContentTextStub({
  value: `app.get(apiRoutesStatics.quests.list, async (c) => {});`,
});

const QUEST_BROKER_SOURCE = ContentTextStub({
  value: `fetchGetAdapter({ url: webConfigStatics.api.routes.quests });`,
});

const STATE_SOURCE_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/state/agent-output/agent-output-state.ts',
});

describe('architectureProjectMapHeadlineFrontendReactBroker', () => {
  describe('empty package (no widgets)', () => {
    it('EMPTY: {no widgets} => composition section header present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.compositionSectionHeader),
      ).toBe(true);
    });

    it('EMPTY: {no widgets} => composition section empty message present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.compositionSectionEmpty),
      ).toBe(true);
    });

    it('EMPTY: {no widgets} => hubs section header present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.hubsSectionHeader),
      ).toBe(true);
    });

    it('EMPTY: {no widgets} => exemplar section header present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarSectionHeader),
      ).toBe(true);
    });

    it('EMPTY: {no widgets} => exemplar omitted message present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();
      proxy.setupEmpty();

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarSectionEmpty),
      ).toBe(true);
    });
  });

  describe('single-root tree', () => {
    it('VALID: {single root widget with no children} => root widget name in flat list', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [ContentTextStub({ value: `export const QuestChatWidget = () => {};` })],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [
          ContentTextStub({
            value: `import { QuestChatWidget } from '../widgets/quest-chat-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'quest-chat-widget')).toBe(true);
    });
  });

  describe('multi-root tree renders separate per-root sections', () => {
    it('VALID: {two root widgets} => first root widget name in output', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH, HOME_CONTENT_WIDGET_PATH],
        widgetSources: [
          ContentTextStub({ value: `export const QuestChatWidget = () => {};` }),
          ContentTextStub({ value: `export const HomeContentWidget = () => {};` }),
        ],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [
          ContentTextStub({
            value: `import { QuestChatWidget } from '../widgets/quest-chat-widget';
import { HomeContentWidget } from '../widgets/home-content-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'quest-chat-widget')).toBe(true);
    });

    it('VALID: {two root widgets} => second root widget name in output', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH, HOME_CONTENT_WIDGET_PATH],
        widgetSources: [
          ContentTextStub({ value: `export const QuestChatWidget = () => {};` }),
          ContentTextStub({ value: `export const HomeContentWidget = () => {};` }),
        ],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [
          ContentTextStub({
            value: `import { QuestChatWidget } from '../widgets/quest-chat-widget';
import { HomeContentWidget } from '../widgets/home-content-widget';`,
          }),
        ],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === 'home-content-widget')).toBe(true);
    });
  });

  describe('bindings line per widget', () => {
    it('VALID: {root widget with binding} => bindings line contains use-quest-chat', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const bindingsLine = `${projectMapHeadlineFrontendReactStatics.bindingsPrefix}use-quest-chat`;

      expect(lines.some((l) => l === bindingsLine)).toBe(true);
    });
  });

  describe('hubs section omitted when no hubs', () => {
    it('VALID: {no widget with in-degree >= 5} => hubs empty message present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === projectMapHeadlineFrontendReactStatics.hubsSectionEmpty)).toBe(
        true,
      );
    });
  });

  describe('detailed exemplar trace', () => {
    it('VALID: {root with binding + HTTP edge} => exemplar click step label present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [{ path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE }],
        httpBrokerFiles: [{ path: QUEST_BROKER_PATH, source: QUEST_BROKER_SOURCE }],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.click),
      ).toBe(true);
    });

    it('VALID: {root with binding + HTTP edge} => exemplar broker step label present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [{ path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE }],
        httpBrokerFiles: [{ path: QUEST_BROKER_PATH, source: QUEST_BROKER_SOURCE }],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.broker),
      ).toBe(true);
    });

    it('VALID: {root with binding + HTTP edge} => exemplar HTTP wire step label present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [{ path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE }],
        httpBrokerFiles: [{ path: QUEST_BROKER_PATH, source: QUEST_BROKER_SOURCE }],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.httpWire),
      ).toBe(true);
    });

    it('VALID: {root with binding + HTTP edge} => boundary box line in output', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [{ path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE }],
        httpBrokerFiles: [{ path: QUEST_BROKER_PATH, source: QUEST_BROKER_SOURCE }],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');
      const { boundaryBoxLabel, boundaryBoxPadding } = projectMapHeadlineFrontendReactStatics;
      const boxWidth = boundaryBoxLabel.length + boundaryBoxPadding;
      const expectedTopLine = `  ╔${'═'.repeat(boxWidth)}╗`;

      expect(lines.some((l) => l === expectedTopLine)).toBe(true);
    });

    it('VALID: {root with binding} => derived broker name quest-chat-broker in exemplar output', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '  quest-chat-broker({ ... })')).toBe(true);
    });

    it('VALID: {state stores present} => state write step lists store name', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [{ path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE }],
        httpBrokerFiles: [{ path: QUEST_BROKER_PATH, source: QUEST_BROKER_SOURCE }],
        sourceFilePaths: [STATE_SOURCE_PATH],
        sourceContents: [ContentTextStub({ value: `agentOutputState.set({});` })],
        stateDirNames: ['agent-output'],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some(
          (l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.stateWrite,
        ),
      ).toBe(true);
    });

    it('VALID: {root with binding + HTTP edge} => rerender step label present', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [{ path: QUEST_FLOW_PATH, source: QUEST_FLOW_SOURCE }],
        httpBrokerFiles: [{ path: QUEST_BROKER_PATH, source: QUEST_BROKER_SOURCE }],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(
        lines.some((l) => l === projectMapHeadlineFrontendReactStatics.exemplarStepLabels.rerender),
      ).toBe(true);
    });
  });

  describe('child widgets in tree', () => {
    it('VALID: {root with child widget} => child widget name appears with tree connector', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH, HOME_CONTENT_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE, HOME_CONTENT_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '└─ home-content-widget')).toBe(true);
    });

    it('VALID: {root → child → grandchild} => grandchild widget name in output', () => {
      const proxy = architectureProjectMapHeadlineFrontendReactBrokerProxy();

      proxy.setup({
        widgetFilePaths: [QUEST_CHAT_WIDGET_PATH, HOME_CONTENT_WIDGET_PATH, PIXEL_BTN_WIDGET_PATH],
        widgetSources: [QUEST_CHAT_SOURCE, HOME_CONTENT_SOURCE, PIXEL_BTN_SOURCE],
        responderFilePaths: [RESPONDER_PATH],
        responderContents: [RESPONDER_SOURCE],
        flowFilePaths: [],
        flowContents: [],
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        httpFlowFiles: [],
        httpBrokerFiles: [],
        sourceFilePaths: [],
        sourceContents: [],
        stateDirNames: [],
      });

      const result = architectureProjectMapHeadlineFrontendReactBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      const lines = String(result).split('\n');

      expect(lines.some((l) => l === '   └─ pixel-btn-widget')).toBe(true);
    });
  });
});
