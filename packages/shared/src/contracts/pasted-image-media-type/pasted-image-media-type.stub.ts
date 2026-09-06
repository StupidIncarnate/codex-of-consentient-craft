/**
 * PURPOSE: Stub factory for PastedImageMediaType branded string type
 *
 * USAGE:
 * const mediaType = PastedImageMediaTypeStub({ value: 'image/png' });
 * // Returns branded PastedImageMediaType
 */
import {
  pastedImageMediaTypeContract,
  type PastedImageMediaType,
} from './pasted-image-media-type-contract';

export const PastedImageMediaTypeStub = (
  { value }: { value: string } = { value: 'image/png' },
): PastedImageMediaType => pastedImageMediaTypeContract.parse(value);
