/**
 * PURPOSE: A real notification id, minted by actually calling `@mantine/notifications`'s own
 * imperative `notifications.show()` against its real in-memory store — never a hand-typed id
 * string.
 *
 * USAGE:
 * const id = NotificationIdStub();
 * // Returns the real id notifications.show() assigned, e.g. 'mantine-p8yprb7n9'
 */
import { notifications } from '@mantine/notifications';

export const NotificationIdStub = ({
  message = 'gateway-stub-message',
}: { message?: string } = {}): string => notifications.show({ message });
