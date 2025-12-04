/**
 * PURPOSE: Stub factory for ContentText branded string type
 *
 * USAGE:
 * const text = ContentTextStub({ value: 'Result text' });
 * // Returns branded ContentText string
 */
import { contentTextContract, type ContentText } from './content-text-contract';

export const ContentTextStub = (
  { value }: { value: string } = { value: 'stub content text' },
): ContentText => contentTextContract.parse(value);
