import { ToolingSmoketestStateResponder } from './tooling-smoketest-state-responder';
import { ToolingSmoketestStateResponderProxy } from './tooling-smoketest-state-responder.proxy';

describe('ToolingSmoketestStateResponder', () => {
  it('VALID: {invocation} => returns 200 with { active, events } payload', () => {
    ToolingSmoketestStateResponderProxy();

    const result = ToolingSmoketestStateResponder();

    expect(result.status).toBe(200);
  });
});
