import { urlSlugContract } from './url-slug-contract';
import type { UrlSlug } from './url-slug-contract';

export const UrlSlugStub = ({ value }: { value: string } = { value: 'my-guild' }): UrlSlug =>
  urlSlugContract.parse(value);
