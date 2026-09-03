import { normalizedPasteMediaTypeContract } from './normalized-paste-media-type-contract';
import type { NormalizedPasteMediaType } from './normalized-paste-media-type-contract';

export const NormalizedPasteMediaTypeStub = ({
  value,
}: {
  value?: string;
} = {}): NormalizedPasteMediaType => normalizedPasteMediaTypeContract.parse(value ?? 'image/png');
