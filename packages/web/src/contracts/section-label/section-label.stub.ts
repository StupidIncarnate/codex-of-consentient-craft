import { sectionLabelContract } from './section-label-contract';
import type { SectionLabel } from './section-label-contract';

export const SectionLabelStub = ({ value }: { value?: string } = {}): SectionLabel =>
  sectionLabelContract.parse(value ?? 'OBJECTIVES');
