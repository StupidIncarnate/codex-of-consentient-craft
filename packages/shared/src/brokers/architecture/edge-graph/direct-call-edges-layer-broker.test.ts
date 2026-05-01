import { directCallEdgesLayerBroker } from './direct-call-edges-layer-broker';
import { directCallEdgesLayerBrokerProxy } from './direct-call-edges-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

const SERVER_PKG = ContentTextStub({ value: 'server' });
const ORCHESTRATOR_PKG = ContentTextStub({ value: 'orchestrator' });
const WEB_PKG = ContentTextStub({ value: 'web' });
const SHARED_PKG = ContentTextStub({ value: 'shared' });

const GET_QUEST_ADAPTER = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts',
});
const ADD_QUEST_ADAPTER = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.ts',
});
const PROXY_ADAPTER = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy.ts',
});
const TEST_ADAPTER = AbsoluteFilePathStub({
  value:
    '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.test.ts',
});

describe('directCallEdgesLayerBroker', () => {
  describe('single wrapper folder', () => {
    it('VALID: {one adapter folder with one file} => produces one DirectCallEdge', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ORCHESTRATOR_PKG,
            files: [
              {
                path: GET_QUEST_ADAPTER,
                source: ContentTextStub({
                  value: 'return StartOrchestrator.getQuest({ questId });',
                }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          callerPackage: 'server',
          calleePackage: 'orchestrator',
          adapterFiles: [GET_QUEST_ADAPTER],
          methodNames: ['getQuest'],
        },
      ]);
    });
  });

  describe('multiple wrappers across different callee packages', () => {
    it('VALID: {two adapter folders for different callees} => produces two separate edges', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      const webSharedAdapter = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/adapters/shared/config/web-shared-config-adapter.ts',
      });

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG, WEB_PKG, SHARED_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ORCHESTRATOR_PKG,
            files: [
              {
                path: GET_QUEST_ADAPTER,
                source: ContentTextStub({
                  value: 'return StartOrchestrator.getQuest({ questId });',
                }),
              },
            ],
          },
          {
            callerPackage: WEB_PKG,
            calleePackage: SHARED_PKG,
            files: [
              {
                path: webSharedAdapter,
                source: ContentTextStub({
                  value: 'return SharedConfig.getConfig();',
                }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      // Order depends on Map iteration (insertion order) — we match by callerPackage
      const serverEdge = result.find((e) => String(e.callerPackage) === 'server');
      const webEdge = result.find((e) => String(e.callerPackage) === 'web');

      expect(serverEdge).toStrictEqual({
        callerPackage: 'server',
        calleePackage: 'orchestrator',
        adapterFiles: [GET_QUEST_ADAPTER],
        methodNames: ['getQuest'],
      });

      expect(webEdge).toStrictEqual({
        callerPackage: 'web',
        calleePackage: 'shared',
        adapterFiles: [webSharedAdapter],
        methodNames: ['getConfig'],
      });

      expect(result).toStrictEqual([serverEdge, webEdge]);
    });
  });

  describe('method name extraction', () => {
    it('VALID: {StartOrchestrator.getQuest( pattern} => extracts "getQuest"', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ORCHESTRATOR_PKG,
            files: [
              {
                path: GET_QUEST_ADAPTER,
                source: ContentTextStub({
                  value:
                    'export const orchestratorGetQuestAdapter = async ({ questId }) => StartOrchestrator.getQuest({ questId });',
                }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          callerPackage: 'server',
          calleePackage: 'orchestrator',
          adapterFiles: [GET_QUEST_ADAPTER],
          methodNames: ['getQuest'],
        },
      ]);
    });

    it('VALID: {multiple adapter files for same edge} => aggregates all method names', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ORCHESTRATOR_PKG,
            files: [
              {
                path: GET_QUEST_ADAPTER,
                source: ContentTextStub({
                  value: 'return StartOrchestrator.getQuest({ questId });',
                }),
              },
              {
                path: ADD_QUEST_ADAPTER,
                source: ContentTextStub({
                  value: 'return StartOrchestrator.addQuest({ data });',
                }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([
        {
          callerPackage: 'server',
          calleePackage: 'orchestrator',
          adapterFiles: [GET_QUEST_ADAPTER, ADD_QUEST_ADAPTER],
          methodNames: ['getQuest', 'addQuest'],
        },
      ]);
    });
  });

  describe('unknown subfolder name', () => {
    it('VALID: {subfolder name not matching any package} => produces no edge', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      const unknownAdapter = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/adapters/hono/serve/hono-serve-adapter.ts',
      });

      // hono is NOT in the packages list, so its adapter subfolder should be ignored
      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ContentTextStub({ value: 'hono' }),
            files: [
              {
                path: unknownAdapter,
                source: ContentTextStub({ value: 'serve(app);' }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('test/proxy/stub file filtering', () => {
    it('VALID: {proxy file in adapter folder} => filtered out, not included in adapterFiles', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ORCHESTRATOR_PKG,
            files: [
              {
                path: PROXY_ADAPTER,
                source: ContentTextStub({
                  value: 'return StartOrchestrator.getQuest({ questId });',
                }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {test file in adapter folder} => filtered out, produces no edge', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [
          {
            callerPackage: SERVER_PKG,
            calleePackage: ORCHESTRATOR_PKG,
            files: [
              {
                path: TEST_ADAPTER,
                source: ContentTextStub({
                  value: 'expect(StartOrchestrator.getQuest).toBeCalled();',
                }),
              },
            ],
          },
        ],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no packages} => returns empty array', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [],
        adapterFolders: [],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {packages but no adapter folders} => returns empty array', () => {
      const proxy = directCallEdgesLayerBrokerProxy();

      proxy.setup({
        projectRoot: PROJECT_ROOT,
        packages: [SERVER_PKG, ORCHESTRATOR_PKG],
        adapterFolders: [],
      });

      const result = directCallEdgesLayerBroker({ projectRoot: PROJECT_ROOT });

      expect(result).toStrictEqual([]);
    });
  });
});
