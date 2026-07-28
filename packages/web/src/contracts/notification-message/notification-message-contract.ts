/**
 * PURPOSE: Defines a branded string type for user-facing toast/notification text raised via
 * mantineNotificationsShowAdapter — the branded return type ban-primitives requires for any
 * transformer that produces toast copy.
 *
 * USAGE:
 * notificationMessageContract.parse('Dropped 1 queued comment — its box no longer exists on the quest: login-flow / start');
 * // Returns: NotificationMessage branded string
 */

import { z } from 'zod';

export const notificationMessageContract = z.string().brand<'NotificationMessage'>();

export type NotificationMessage = z.infer<typeof notificationMessageContract>;
