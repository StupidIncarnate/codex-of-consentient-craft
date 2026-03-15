import { relatedDataItemContract } from './related-data-item-contract';

type RelatedDataItem = ReturnType<typeof relatedDataItemContract.parse>;

export const RelatedDataItemStub = (
  { value }: { value: string } = { value: 'steps/f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): RelatedDataItem => relatedDataItemContract.parse(value);
