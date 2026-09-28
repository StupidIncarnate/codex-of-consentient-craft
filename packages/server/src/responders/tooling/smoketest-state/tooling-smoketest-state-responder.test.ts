import { ToolingSmoketestStateResponder } from './tooling-smoketest-state-responder';
import { ToolingSmoketestStateResponderProxy } from './tooling-smoketest-state-responder.proxy';

describe('ToolingSmoketestStateResponder', () => {
  it('VALID: {invocation} => returns 200 with { active, events } payload', () => {
    const proxy = ToolingSmoketestStateResponderProxy();
    proxy.setupNoActiveRun();

    const result = ToolingSmoketestStateResponder();

    expect(result).toStrictEqual({ status: 200, data: { active: null, events: [] } });
  });
});
