import { uptimeLabelContract } from './uptime-label-contract';
import type { UptimeLabel } from './uptime-label-contract';

export const UptimeLabelStub = ({ value }: { value: string } = { value: '12m' }): UptimeLabel =>
  uptimeLabelContract.parse(value);
