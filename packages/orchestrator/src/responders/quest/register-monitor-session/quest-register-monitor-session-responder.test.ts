import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { QuestRegisterMonitorSessionResponderProxy } from './quest-register-monitor-session-responder.proxy';

describe('QuestRegisterMonitorSessionResponder', () => {
  it('VALID: {sessionFilePath, no guilds} => registers and returns status + orphansReset 0', async () => {
    const proxy = QuestRegisterMonitorSessionResponderProxy();
    proxy.setupEmptyMonitorSession();
    proxy.setupEmptyActiveQuest();
    proxy.setupEmptyOrchestrationEvents();
    proxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });
    proxy.setupProjectDir({
      result: FilePathStub({ value: '/home/user/.claude/projects/-home-user-proj' }),
    });

    const result = await proxy.callResponder({
      sessionFilePath: FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      }),
    });

    expect(result).toStrictEqual({
      status: 'registered',
      orphansReset: 0,
    });
  });
});
