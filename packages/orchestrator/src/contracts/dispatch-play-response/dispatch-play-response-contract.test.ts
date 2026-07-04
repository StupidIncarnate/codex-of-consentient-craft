import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchPlayResponseContract } from './dispatch-play-response-contract';
import { DispatchPlayResponseStub } from './dispatch-play-response.stub';

describe('dispatchPlayResponseContract', () => {
  it('VALID: {allowed: true, state} => parses accepted response', () => {
    const result = dispatchPlayResponseContract.parse({
      allowed: true,
      state: DispatchStateStub({ mode: 'node-playing' }),
    });

    expect(result).toStrictEqual({
      allowed: true,
      state: DispatchStateStub({ mode: 'node-playing' }),
    });
  });

  it('VALID: {allowed: false, reason, state} => parses refusal with reason', () => {
    const result = DispatchPlayResponseStub({
      allowed: false,
      reason: 'A /dumpster-launch loop is active',
    });

    expect(result).toStrictEqual({
      allowed: false,
      reason: 'A /dumpster-launch loop is active',
      state: DispatchStateStub(),
    });
  });

  it('INVALID: {state missing} => throws Required', () => {
    expect(() => dispatchPlayResponseContract.parse({ allowed: true })).toThrow(/Required/u);
  });
});
