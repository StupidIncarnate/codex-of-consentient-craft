/**
 * PURPOSE: One of the five metric names `machineStatics.monitored` prints, derived from that
 * statics array rather than retyped here (spec line 1191: "`monitored` answers 'what can I even ask
 * about'. Without it a session guesses at metric names, and a guess that returns nothing reads
 * exactly like a metric that is zero"). Reach for this over a bare `ContentText` anywhere a value
 * is validated as belonging to `status`'s own vocabulary rather than merely shaped like a string.
 *
 * USAGE:
 * monitoredMetricContract.parse('free memory');
 * // Returns a branded MonitoredMetric
 */

import { z } from 'zod';

import { machineStatics } from '../../statics/machine/machine-statics';

export const monitoredMetricContract = z.enum(machineStatics.monitored).brand<'MonitoredMetric'>();

export type MonitoredMetric = z.infer<typeof monitoredMetricContract>;
