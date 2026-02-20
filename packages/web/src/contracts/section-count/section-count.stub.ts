import { sectionCountContract } from './section-count-contract';
import type { SectionCount } from './section-count-contract';

export const SectionCountStub = ({ value }: { value?: number } = {}): SectionCount =>
  sectionCountContract.parse(value ?? 3);
