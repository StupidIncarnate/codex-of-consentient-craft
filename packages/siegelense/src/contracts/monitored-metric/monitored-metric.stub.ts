import type { z } from 'zod';

import { monitoredMetricContract } from './monitored-metric-contract';
import type { MonitoredMetric } from './monitored-metric-contract';

type MonitoredMetricInput = z.input<typeof monitoredMetricContract>;

export const MonitoredMetricStub = ({
  value,
}: { value?: MonitoredMetricInput } = {}): MonitoredMetric =>
  monitoredMetricContract.parse(value ?? 'free memory');
