/**
 * PURPOSE: Renders Mantine Notifications component with CSS side-effect import
 *
 * USAGE:
 * createElement(mantineNotificationsAdapter());
 * // Returns Mantine Notifications component with styles loaded
 */
import '@mantine/notifications/styles.css';

import { Notifications } from '@mantine/notifications';

export const mantineNotificationsAdapter = (): typeof Notifications => Notifications;
