import { httpEdgesToAnnotationsLayerBroker } from './http-edges-to-annotations-layer-broker';
import { httpEdgesToAnnotationsLayerBrokerProxy } from './http-edges-to-annotations-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });
const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/server' });

const SERVER_STATICS = ContentTextStub({
  value: `export const apiRoutesStatics = {
  quests: {
    start: '/api/quests/:questId/start',
  },
} as const;`,
});

const WEB_STATICS = ContentTextStub({
  value: `export const webConfigStatics = {
  api: { routes: { questStart: '/api/quests/:questId/start' } },
} as const;`,
});

const QUEST_FLOW_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
});
const QUEST_START_RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
});
const QUEST_START_BROKER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/brokers/quest/start/quest-start-broker.ts',
});

describe('httpEdgesToAnnotationsLayerBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no flows in package} => returns empty Map', () => {
      const proxy = httpEdgesToAnnotationsLayerBrokerProxy();
      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [],
        brokerFiles: [],
      });

      const result = httpEdgesToAnnotationsLayerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('single route with consumer', () => {
    it('VALID: {one POST route paired with web broker} => annotation has suffix and ← childLine', () => {
      const proxy = httpEdgesToAnnotationsLayerBrokerProxy();
      proxy.setup({
        serverStaticsSource: SERVER_STATICS,
        webStaticsSource: WEB_STATICS,
        flowFiles: [
          {
            path: QUEST_FLOW_PATH,
            source: ContentTextStub({
              value: `import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';
app.post(apiRoutesStatics.quests.start, async (c) => {
  const result = await QuestStartResponder({ args: c.req });
  return c.json(result);
});`,
            }),
          },
        ],
        brokerFiles: [
          {
            path: QUEST_START_BROKER_PATH,
            source: ContentTextStub({
              value: `export const questStartBroker = async () => {
  await fetchPostAdapter({ url: webConfigStatics.api.routes.questStart });
};`,
            }),
          },
        ],
      });

      const result = httpEdgesToAnnotationsLayerBroker({
        projectRoot: PROJECT_ROOT,
        packageRoot: PACKAGE_ROOT,
      });

      expect(result).toStrictEqual(
        new Map([
          [
            QUEST_START_RESPONDER_PATH,
            {
              suffix: '[POST /api/quests/:questId/start]',
              childLines: ['← packages/web (questStartBroker)'],
            },
          ],
        ]),
      );
    });
  });
});
