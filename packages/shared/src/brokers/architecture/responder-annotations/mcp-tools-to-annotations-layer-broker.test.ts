import type { DirEntrySync } from '#gateway/node/fs';
import { mcpToolsToAnnotationsLayerBroker } from './mcp-tools-to-annotations-layer-broker';
import { mcpToolsToAnnotationsLayerBrokerProxy } from './mcp-tools-to-annotations-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const PACKAGE_ROOT = '/repo/packages/mcp';

const QUEST_HANDLE_RESPONDER_PATH = '/repo/packages/mcp/src/responders/quest/handle/quest-handle-responder.ts';

const makeFileDirent = ({ name }: { name: string }): DirEntrySync => ({ name, kind: 'file' });

describe('mcpToolsToAnnotationsLayerBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no flow files} => returns empty Map', () => {
      const proxy = mcpToolsToAnnotationsLayerBrokerProxy();
      proxy.setup({ packageRoot: PACKAGE_ROOT, flowEntries: [], flowFiles: [] });

      const result = mcpToolsToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('flow with tools', () => {
    it('VALID: {flow with 3 tools all → QuestHandleResponder} => annotation has [tools: a, b, c]', () => {
      const proxy = mcpToolsToAnnotationsLayerBrokerProxy();
      proxy.setup({
        packageRoot: PACKAGE_ROOT,
        flowEntries: [makeFileDirent({ name: 'quest-flow.ts' })],
        flowFiles: [
          {
            path: '/repo/packages/mcp/src/flows/quest-flow.ts',
            source: ContentTextStub({
              value: `import { QuestHandleResponder } from '../responders/quest/handle/quest-handle-responder';
const tools = [
  { name: 'get-quest' as never, handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest' as never, args }) },
  { name: 'modify-quest' as never, handler: async ({ args }) => QuestHandleResponder({ tool: 'modify-quest' as never, args }) },
  { name: 'start-quest' as never, handler: async ({ args }) => QuestHandleResponder({ tool: 'start-quest' as never, args }) },
];`,
            }),
          },
        ],
      });

      const result = mcpToolsToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        new Map([
          [
            QUEST_HANDLE_RESPONDER_PATH,
            {
              suffix: '[tools: get-quest, modify-quest, start-quest]',
              childLines: [],
            },
          ],
        ]),
      );
    });
  });
});
