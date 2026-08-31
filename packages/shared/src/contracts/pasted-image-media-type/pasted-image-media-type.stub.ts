import { pastedImageMediaTypeContract } from './pasted-image-media-type-contract';
import type { PastedImageMediaType } from './pasted-image-media-type-contract';

export const PastedImageMediaTypeStub = (
  { value }: { value: string } = { value: 'image/png' },
): PastedImageMediaType => pastedImageMediaTypeContract.parse(value);
