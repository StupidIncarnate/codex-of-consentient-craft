/**
 * PURPOSE: Branded string type for the server uptime duration token shown in the app
 * header's health badge, like '45s' / '12m' / '1h2m'
 *
 * USAGE:
 * uptimeLabelContract.parse('12m');
 * // Returns: branded UptimeLabel
 */
import { z } from 'zod';

export const uptimeLabelContract = z.string().min(1).brand<'UptimeLabel'>();

export type UptimeLabel = z.infer<typeof uptimeLabelContract>;
