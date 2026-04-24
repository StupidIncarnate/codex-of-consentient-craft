import { webPresenceState } from '../../../state/web-presence/web-presence-state';
import { ExecutionQueueSetWebPresenceResponder } from './execution-queue-set-web-presence-responder';
import { ExecutionQueueSetWebPresenceResponderProxy } from './execution-queue-set-web-presence-responder.proxy';

describe('ExecutionQueueSetWebPresenceResponder', () => {
  it('VALID: {isPresent: true} => flips webPresenceState.getIsPresent to true, returns success', () => {
    ExecutionQueueSetWebPresenceResponderProxy();

    const result = ExecutionQueueSetWebPresenceResponder({ isPresent: true });

    expect({
      result,
      isPresent: webPresenceState.getIsPresent(),
    }).toStrictEqual({
      result: { success: true },
      isPresent: true,
    });
  });

  it('VALID: {isPresent: false after true} => flips webPresenceState.getIsPresent to false, returns success', () => {
    ExecutionQueueSetWebPresenceResponderProxy();
    ExecutionQueueSetWebPresenceResponder({ isPresent: true });

    const result = ExecutionQueueSetWebPresenceResponder({ isPresent: false });

    expect({
      result,
      isPresent: webPresenceState.getIsPresent(),
    }).toStrictEqual({
      result: { success: true },
      isPresent: false,
    });
  });
});
