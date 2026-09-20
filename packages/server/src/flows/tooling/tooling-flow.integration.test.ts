import { apiRoutesStatics } from '../../statics/api-routes/api-routes-statics';

import { ToolingFlow } from './tooling-flow';

describe('ToolingFlow', () => {
  describe('GET /api/tooling/smoketest/state', () => {
    it('VALID: {invocation, TOOLING_SMOKETEST_HTTP unset} => delegates to ToolingSmoketestStateResponder and returns 200', async () => {
      Reflect.deleteProperty(process.env, 'TOOLING_SMOKETEST_HTTP');
      const app = ToolingFlow();

      const response = await app.request(apiRoutesStatics.tooling.smoketestState);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/tooling/smoketest/run (env-gated)', () => {
    it('VALID: {TOOLING_SMOKETEST_HTTP unset} => 404, route not registered so an ordinary dungeonmaster start never exposes a real-subprocess-spawning endpoint', async () => {
      Reflect.deleteProperty(process.env, 'TOOLING_SMOKETEST_HTTP');
      const app = ToolingFlow();

      const response = await app.request(apiRoutesStatics.tooling.smoketestRun, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suite: 'mcp' }),
      });

      expect(response.status).toBe(404);
    });

    it('ERROR: {TOOLING_SMOKETEST_HTTP=1, body missing suite} => 500, route registered, responder validates before the orchestrator call', async () => {
      process.env.TOOLING_SMOKETEST_HTTP = '1';
      const app = ToolingFlow();

      const response = await app.request(apiRoutesStatics.tooling.smoketestRun, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      Reflect.deleteProperty(process.env, 'TOOLING_SMOKETEST_HTTP');

      expect(response.status).toBe(500);
    });

    // Mirrors quest-flow.ts's non-JSON-body tests: tooling-flow.ts degrades a body that is not
    // JSON at all to an empty object (`.catch(() => ({}))`) so the responder's own validation
    // produces the error, rather than an unhandled parse error escaping the route handler as
    // Hono's generic, non-JSON "Internal Server Error" 500.
    it('ERROR: {TOOLING_SMOKETEST_HTTP=1, non-JSON body} => reaches the responder 500 rather than throwing out of the route', async () => {
      process.env.TOOLING_SMOKETEST_HTTP = '1';
      const app = ToolingFlow();

      const response = await app.request(apiRoutesStatics.tooling.smoketestRun, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json at all',
      });

      Reflect.deleteProperty(process.env, 'TOOLING_SMOKETEST_HTTP');

      expect(response.status).toBe(500);
    });
  });
});
