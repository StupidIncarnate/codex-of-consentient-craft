import { ToolingFlow } from './tooling-flow';

describe('ToolingFlow', () => {
  it('VALID: {invocation} => returns a Hono app with 2 routes registered', () => {
    const app = ToolingFlow();

    expect(app.routes.length).toBeGreaterThanOrEqual(2);
  });
});
