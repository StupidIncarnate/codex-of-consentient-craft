import { requestLogHarness } from '../../../test/harnesses/request-log/request-log.harness';

import { HealthFlow } from '../health/health-flow';
import { RequestLogFlow } from './request-log-flow';

describe('RequestLogFlow', () => {
  const requestLog = requestLogHarness();

  describe('request log enabled', () => {
    it('VALID: {GET /api/health} => answers 200 and writes the info line', async () => {
      requestLog.enable();
      const app = RequestLogFlow();
      app.route('', HealthFlow());

      const response = await app.request('/api/health');

      expect(response.status).toBe(200);
      expect(requestLog.writtenLines()).toStrictEqual(['[http] info GET /api/health 200 Nms\n']);
    });

    it('VALID: {GET unrouted path} => answers 404 and writes the warn line', async () => {
      requestLog.enable();
      const app = RequestLogFlow();
      app.route('', HealthFlow());

      const response = await app.request('/api/nope');

      expect(response.status).toBe(404);
      expect(requestLog.writtenLines()).toStrictEqual(['[http] warn GET /api/nope 404 Nms\n']);
    });

    it('ERROR: {handler answers 500 with an error body} => writes the error line carrying the body, client gets the body', async () => {
      requestLog.enable();
      const app = RequestLogFlow();
      app.get('/api/guilds', (c) => c.json({ error: 'Failed to list guilds' }, 500));

      const response = await app.request('/api/guilds');

      expect(response.status).toBe(500);
      await expect(response.text()).resolves.toBe('{"error":"Failed to list guilds"}');
      expect(requestLog.writtenLines()).toStrictEqual([
        '[http] error GET /api/guilds 500 Nms: {"error":"Failed to list guilds"}\n',
      ]);
    });

    it('ERROR: {handler throws} => answers 500 and writes the error line carrying the thrown message', async () => {
      requestLog.enable();
      const app = RequestLogFlow();
      app.post('/api/quests/q1/start', () => {
        throw new Error('quest not found');
      });

      const response = await app.request('/api/quests/q1/start', { method: 'POST' });

      expect(response.status).toBe(500);
      expect(requestLog.writtenLines()).toStrictEqual([
        '[http] error POST /api/quests/q1/start 500 Nms: quest not found\n',
      ]);
    });
  });

  describe('request log disabled', () => {
    it('VALID: {GET /api/health, switch unset} => answers 200 and writes nothing', async () => {
      requestLog.disable();
      const app = RequestLogFlow();
      app.route('', HealthFlow());

      const response = await app.request('/api/health');

      expect(response.status).toBe(200);
      expect(requestLog.writtenLines()).toStrictEqual([]);
    });
  });
});
