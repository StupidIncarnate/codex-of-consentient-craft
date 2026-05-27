import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { ResolveSubagentIdentityLayerResponder } from './resolve-subagent-identity-layer-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';

describe('ResolveSubagentIdentityLayerResponder', () => {
  it('VALID: {meta has claudecode/toolUseId + monitorSession registered + matching meta.json} => returns identity from toolUseId path', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    const parentSessionId = 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671';
    const projectDir = '/home/user/.claude/projects/-home-user-proj';
    const realAgentId = 'ad0775d7695b4d4eb';
    const toolUseId = 'toolu_01KfM8kWZATagwS33eTq5fZS';

    proxy.setupRegisteredMonitorSession({ sessionId: parentSessionId, projectDir });
    proxy.setupToolUseIdMatch({
      files: [`agent-${realAgentId}.meta.json`],
      matchFilename: `agent-${realAgentId}.meta.json`,
      matchMetaContents: JSON.stringify({
        agentType: 'general-purpose',
        description: 'pathseeker-dedup dispatch',
        toolUseId,
      }),
    });

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': toolUseId, progressToken: 3 },
      workItemId: QuestWorkItemIdStub({ value: 'c6afab8f-ebdd-4e23-99cd-ea9aa67a5026' }),
    });

    expect(result).toStrictEqual({
      sessionId: parentSessionId,
      agentId: realAgentId,
    });
  });

  it('VALID: {meta absent} => falls back to mtime+workItemId path', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    const parentSessionId = '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402';
    const realAgentId = 'acd35f7b7763e33e8';
    const workItemId = QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' });

    proxy.setupParentSession({
      homedir: '/home/user',
      cwd: '/home/user/proj',
      sessionEntries: [{ name: `${parentSessionId}.jsonl`, mtimeMs: 1000 }],
    });
    proxy.setupSubagentMatch({
      files: [`agent-${realAgentId}.jsonl`],
      matchFilename: `agent-${realAgentId}.jsonl`,
      matchFirstLine: `{"type":"user","message":{"role":"user","content":"workItemId: \\"${String(workItemId)}\\""}}`,
    });

    const result = await ResolveSubagentIdentityLayerResponder({ workItemId });

    expect(result).toStrictEqual({
      sessionId: parentSessionId,
      agentId: realAgentId,
    });
  });

  it('VALID: {meta has toolUseId but monitorSession unregistered} => falls back to mtime+workItemId path', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    const parentSessionId = '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402';
    const realAgentId = 'acd35f7b7763e33e8';
    const workItemId = QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' });

    // No setupRegisteredMonitorSession — adapter returns null by default → toolUseId path
    // short-circuits to the fallback.
    proxy.setupParentSession({
      homedir: '/home/user',
      cwd: '/home/user/proj',
      sessionEntries: [{ name: `${parentSessionId}.jsonl`, mtimeMs: 1000 }],
    });
    proxy.setupSubagentMatch({
      files: [`agent-${realAgentId}.jsonl`],
      matchFilename: `agent-${realAgentId}.jsonl`,
      matchFirstLine: `{"type":"user","message":{"role":"user","content":"workItemId: \\"${String(workItemId)}\\""}}`,
    });

    const result = await ResolveSubagentIdentityLayerResponder({
      meta: { 'claudecode/toolUseId': 'toolu_01KfM8kWZATagwS33eTq5fZS' },
      workItemId,
    });

    expect(result).toStrictEqual({
      sessionId: parentSessionId,
      agentId: realAgentId,
    });
  });

  it('EMPTY: {meta absent AND no parent session resolvable} => returns undefined', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();

    proxy.setupParentSession({
      homedir: '/home/user',
      cwd: '/home/user/proj',
      sessionEntries: [],
    });

    const result = await ResolveSubagentIdentityLayerResponder({
      workItemId: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
    });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {meta absent AND parent session resolved BUT no matching subagent file} => returns undefined', async () => {
    const proxy = ResolveSubagentIdentityLayerResponderProxy();
    const parentSessionId = '18eb0c1b-5b9e-4ff0-aaea-9f9fe0bb6402';

    proxy.setupParentSession({
      homedir: '/home/user',
      cwd: '/home/user/proj',
      sessionEntries: [{ name: `${parentSessionId}.jsonl`, mtimeMs: 1000 }],
    });
    proxy.setupSubagentDirMissing();

    const result = await ResolveSubagentIdentityLayerResponder({
      workItemId: QuestWorkItemIdStub({ value: '875c3364-2d64-4606-b9e3-25dd365c7792' }),
    });

    expect(result).toBe(undefined);
  });
});
