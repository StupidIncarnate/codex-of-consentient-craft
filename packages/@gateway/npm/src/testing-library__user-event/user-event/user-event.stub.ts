/**
 * PURPOSE: A real `UserEvent` instance, built through the real `userEvent.setup()` — for a caller
 * staging this subpath's own value instead of hand-typing a fake one. `@testing-library/user-event`
 * reads `navigator` at property-access time (see this subpath's own `.integration.test.ts`), so
 * this stub's own companion test needs both `@jest-environment jsdom` and the
 * `.stub.integration.test.ts` suffix.
 *
 * USAGE:
 * const user = UserEventStub();
 * // Returns a real UserEvent, ready to drive a real jsdom element
 */
import userEvent from '@testing-library/user-event';

export const UserEventStub = (): ReturnType<typeof userEvent.setup> => userEvent.setup();
