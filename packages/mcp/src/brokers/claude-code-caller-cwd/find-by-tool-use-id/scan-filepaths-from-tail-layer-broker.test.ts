import { scanFilepathsFromTailLayerBroker } from './scan-filepaths-from-tail-layer-broker';
import { scanFilepathsFromTailLayerBrokerProxy } from './scan-filepaths-from-tail-layer-broker.proxy';

const TOOL_USE_ID = 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts';
const TOOL_USE_ID_TOKEN = `"id":"${TOOL_USE_ID}"`;

const LINE_WITH_MATCH_SIEGELENSE = JSON.stringify({
  type: 'assistant',
  cwd: '/repo/worktrees/siegelense',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: TOOL_USE_ID, name: 'mcp__dungeonmaster__discover' }],
  },
});
const LINE_WITH_MATCH_OTHER = JSON.stringify({
  type: 'assistant',
  cwd: '/repo/worktrees/other',
  message: {
    role: 'assistant',
    content: [{ type: 'tool_use', id: TOOL_USE_ID, name: 'mcp__dungeonmaster__discover' }],
  },
});
const FILLER_LINES = Array.from({ length: 50 }, (_unused, index) =>
  JSON.stringify({
    type: 'assistant',
    cwd: '/irrelevant',
    message: {
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: `toolu_filler_${String(index)}`,
          name: 'mcp__dungeonmaster__discover',
        },
      ],
    },
  }),
);

describe('scanFilepathsFromTailLayerBroker', () => {
  it('VALID: {match in the FIRST file} => returns its cwd and a cursor at that file, without reading the second file', async () => {
    const proxy = scanFilepathsFromTailLayerBrokerProxy();
    proxy.setupFile({ filepath: '/a.jsonl', contents: LINE_WITH_MATCH_SIEGELENSE });
    // No setup for /b.jsonl — an unstaged read throws, so if this broker read it anyway the
    // test would fail with that thrown error instead of returning a result.

    const result = await scanFilepathsFromTailLayerBroker({
      filepaths: ['/a.jsonl', '/b.jsonl'],
      toolUseIdString: TOOL_USE_ID,
      toolUseIdToken: TOOL_USE_ID_TOKEN,
    });

    expect(result).toStrictEqual({
      cwd: '/repo/worktrees/siegelense',
      cursor: { filepath: '/a.jsonl', offsetBytes: LINE_WITH_MATCH_SIEGELENSE.length },
    });
  });

  it('VALID: {match only in the SECOND file} => falls through to it and returns its cwd', async () => {
    const proxy = scanFilepathsFromTailLayerBrokerProxy();
    proxy.setupFile({ filepath: '/a.jsonl', contents: '' });
    proxy.setupFile({ filepath: '/b.jsonl', contents: LINE_WITH_MATCH_OTHER });

    const result = await scanFilepathsFromTailLayerBroker({
      filepaths: ['/a.jsonl', '/b.jsonl'],
      toolUseIdString: TOOL_USE_ID,
      toolUseIdToken: TOOL_USE_ID_TOKEN,
    });

    expect(result).toStrictEqual({
      cwd: '/repo/worktrees/other',
      cursor: { filepath: '/b.jsonl', offsetBytes: LINE_WITH_MATCH_OTHER.length },
    });
  });

  it('VALID: {the match line is near the TAIL of a multi-line file} => is found without needing a forward scan', async () => {
    const proxy = scanFilepathsFromTailLayerBrokerProxy();
    const contents = [...FILLER_LINES, LINE_WITH_MATCH_SIEGELENSE].join('\n');
    proxy.setupFile({ filepath: '/a.jsonl', contents });

    const result = await scanFilepathsFromTailLayerBroker({
      filepaths: ['/a.jsonl'],
      toolUseIdString: TOOL_USE_ID,
      toolUseIdToken: TOOL_USE_ID_TOKEN,
    });

    expect(result).toStrictEqual({
      cwd: '/repo/worktrees/siegelense',
      cursor: { filepath: '/a.jsonl', offsetBytes: contents.length },
    });
  });

  it('EMPTY: {empty filepaths list} => returns undefined', async () => {
    scanFilepathsFromTailLayerBrokerProxy();

    const result = await scanFilepathsFromTailLayerBroker({
      filepaths: [],
      toolUseIdString: TOOL_USE_ID,
      toolUseIdToken: TOOL_USE_ID_TOKEN,
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {no file matches} => returns undefined', async () => {
    const proxy = scanFilepathsFromTailLayerBrokerProxy();
    proxy.setupFile({ filepath: '/a.jsonl', contents: '' });

    const result = await scanFilepathsFromTailLayerBroker({
      filepaths: ['/a.jsonl'],
      toolUseIdString: TOOL_USE_ID,
      toolUseIdToken: TOOL_USE_ID_TOKEN,
    });

    expect(result).toBe(undefined);
  });
});
