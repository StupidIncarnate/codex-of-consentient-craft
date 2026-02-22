import { tagItemContract } from './tag-item-contract';
import type { TagItem } from './tag-item-contract';

export const TagItemStub = ({ value }: { value?: string } = {}): TagItem =>
  tagItemContract.parse(value ?? 'typescript');
