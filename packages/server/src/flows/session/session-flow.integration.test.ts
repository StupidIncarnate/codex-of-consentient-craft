import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { SessionFlow } from './session-flow';

describe('SessionFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/guilds/:guildId/sessions', () => {
    it('VALID: {guildId} => delegates to SessionListResponder and returns response', async () => {
      const app = SessionFlow();
      const guildId = GuildIdStub();

      const response = await app.request(`/api/guilds/${guildId}/sessions`);
      const body: unknown = await response.json();

      expect(harness.toPlain(body)).toStrictEqual({
        error: expect.stringMatching(/^(?:Guild not found: .+|Failed to read file at .+)$/u),
      });
    });
  });
});
