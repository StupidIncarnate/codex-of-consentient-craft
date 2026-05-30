import { wardDetailLineContract } from './ward-detail-line-contract';
import type { WardDetailLine } from './ward-detail-line-contract';

export const WardDetailLineStub = ({ value }: { value?: string } = {}): WardDetailLine =>
  wardDetailLineContract.parse(value ?? 'lint: packages/web/src/index.ts:10 — Unexpected any');
