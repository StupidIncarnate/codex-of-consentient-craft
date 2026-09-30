/**
 * PURPOSE: Converts display names to URL-safe kebab-case slugs
 *
 * USAGE:
 * nameToUrlSlugTransformer({ name: GuildNameStub({ value: 'My Cool Guild' }) });
 * // Returns: UrlSlug('my-cool-guild')
 */


const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gu;
const LEADING_TRAILING_HYPHENS_PATTERN = /^-+|-+$/gu;

export const nameToUrlSlugTransformer = ({ name }: { name: string | string }): string => {
  const slug = name
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, '-')
    .replace(LEADING_TRAILING_HYPHENS_PATTERN, '');

  return slug;
};
