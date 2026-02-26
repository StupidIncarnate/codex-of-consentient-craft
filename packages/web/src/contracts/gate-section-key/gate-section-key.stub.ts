import { gateSectionKeyContract } from './gate-section-key-contract';
import type { GateSectionKey } from './gate-section-key-contract';

export const GateSectionKeyStub = ({ value }: { value?: string } = {}): GateSectionKey =>
  gateSectionKeyContract.parse(value ?? 'flows');
