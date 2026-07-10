import { configIndexContract } from './config-index-contract';
import type { ConfigIndex } from './config-index-contract';

export const ConfigIndexStub = ({ value }: { value?: number } = { value: 0 }): ConfigIndex =>
  configIndexContract.parse(value ?? 0);
