/**
 * PURPOSE: Converts display names to URL-safe kebab-case slugs
 *
 * USAGE:
 * nameToUrlSlugTransformer({ name: GuildNameStub({ value: 'My Cool Guild' }) });
 * // Returns: UrlSlug('my-cool-guild')
 */

import { guildContract } from '../../contracts/guild/guild-contract';
import type { Guild } from '../../contracts/guild/guild-contract';

const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gu;
const LEADING_TRAILING_HYPHENS_PATTERN = /^-+|-+$/gu;

export const nameToUrlSlugTransformer = ({
  name,
}: {
  name: string;
}): NonNullable<Guild['urlSlug']> => {
  const slug = name
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, '-')
    .replace(LEADING_TRAILING_HYPHENS_PATTERN, '');

  return guildContract.shape.urlSlug.unwrap().parse(slug);
};
