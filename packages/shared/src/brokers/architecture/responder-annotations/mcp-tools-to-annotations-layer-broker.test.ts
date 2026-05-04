import { mcpToolsToAnnotationsLayerBroker } from './mcp-tools-to-annotations-layer-broker';
import { mcpToolsToAnnotationsLayerBrokerProxy } from './mcp-tools-to-annotations-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';

type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0];

const PACKAGE_ROOT = AbsoluteFilePathStub({ value: '/repo/packages/mcp' });

const QUEST_HANDLE_RESPONDER_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/responders/quest/handle/quest-handle-responder.ts',
});

const makeFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

describe('mcpToolsToAnnotationsLayerBroker', () => {
  describe('empty package', () => {
    it('EMPTY: {no flow files} => returns empty Map', () => {
      const proxy = mcpToolsToAnnotationsLayerBrokerProxy();
      proxy.setup({ flowEntries: [], flowFiles: [] });

      const result = mcpToolsToAnnotationsLayerBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('flow with tools', () => {
    it('VALID: {flow with 3 tools all → QuestHandleResponder} => annotation has [tools: a, b, c]', () => {
      const proxy = mcpToolsToAnnotationsLayerBrokerProxy();
      proxy.setup({
        flowEntries: [makeFileDirent({ name: 'quest-flow.ts' })],
        flowFiles: [
          {
            path: AbsoluteFilePathStub({ value: '/repo/packages/mcp/src/flows/quest-flow.ts' }),
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
