/**
 * PURPOSE: Turns a piece of source text into the one-line snippet the census prints beside a
 * catch-all site: whitespace runs collapse to a single space and the text is cut to the snippet
 * limit, so a multi-line staging call stays readable in a table and stable in a diff.
 *
 * USAGE:
 * codeSnippetNormalizeTransformer({ text: 'handle\n  .calledWith([])' });
 * // Returns 'handle .calledWith([])' as a branded CodeSnippet
 */
import { catchAllSiteContract } from '../../contracts/catch-all-site/catch-all-site-contract';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { CatchAllSite } from '../../contracts/catch-all-site/catch-all-site-contract';

export const codeSnippetNormalizeTransformer = ({
  text,
}: {
  text: string;
}): CatchAllSite['snippet'] =>
  catchAllSiteContract.shape.snippet.parse(
    text.replace(/\s+/gu, ' ').slice(0, censusLayoutStatics.snippetMaxLength),
  );
