/**
 * PURPOSE: Converts display names to URL-safe kebab-case slugs
 *
 * USAGE:
 * nameToUrlSlugTransformer({ name: GuildNameStub({ value: 'My Cool Guild' }) });
 * // Returns: UrlSlug('my-cool-guild')
 */

import { urlSlugContract } from '../../contracts/url-slug/url-slug-contract';
import type { UrlSlug } from '../../contracts/url-slug/url-slug-contract';
import type { GuildName } from '../../contracts/guild-name/guild-name-contract';

const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gu;
const LEADING_TRAILING_HYPHENS_PATTERN = /^-+|-+$/gu;

export const nameToUrlSlugTransformer = ({ name }: { name: GuildName }): UrlSlug => {
  const slug = name
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, '-')
    .replace(LEADING_TRAILING_HYPHENS_PATTERN, '');

  return urlSlugContract.parse(slug);
};
