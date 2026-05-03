/**
 * PURPOSE: Extracts react-router-dom &lt;Route&gt; metadata (path + element symbol) from a TSX source string
 *
 * USAGE:
 * const routes = routeMetadataExtractTransformer({
 *   source: contentTextContract.parse('<Route path="/" element={<Home />} />'),
 * });
 * // Returns [{ path: '/', responderSymbol: 'Home' }]
 *
 * WHEN-TO-USE: Static extraction of react-router-dom routing metadata for project-map rendering
 * WHEN-NOT-TO-USE: Sources without &lt;Route&gt; JSX — returns [] safely so callers can invoke unconditionally
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import {
  routeMetadataContract,
  type RouteMetadata,
} from '../../contracts/route-metadata/route-metadata-contract';

const ROUTE_JSX_PATTERN = /<Route\b([^>]*?)\/?>/gu;
const PATH_ATTR_PATTERN = /\bpath\s*=\s*"([^"]*)"/u;
const ELEMENT_ATTR_PATTERN = /\belement\s*=\s*\{\s*<\s*([A-Za-z_$][\w$]*)\b/u;
const BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//gu;
const LINE_COMMENT_PATTERN = /\/\/[^\n]*/gu;

export const routeMetadataExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): RouteMetadata[] => {
  const sourceStr = String(source)
    .replace(BLOCK_COMMENT_PATTERN, '')
    .replace(LINE_COMMENT_PATTERN, '');
  if (!sourceStr.includes('<Route')) {
    return [];
  }

  const result: RouteMetadata[] = [];
  ROUTE_JSX_PATTERN.lastIndex = 0;
  let match = ROUTE_JSX_PATTERN.exec(sourceStr);
  while (match !== null) {
    const attrs = match[1] ?? '';
    const elementMatch = ELEMENT_ATTR_PATTERN.exec(attrs);
    if (elementMatch?.[1] !== undefined) {
      const responderSymbol = contentTextContract.parse(elementMatch[1]);
      const pathMatch = PATH_ATTR_PATTERN.exec(attrs);
      const path = pathMatch?.[1] === undefined ? null : contentTextContract.parse(pathMatch[1]);
      result.push(routeMetadataContract.parse({ path, responderSymbol }));
    }
    match = ROUTE_JSX_PATTERN.exec(sourceStr);
  }

  return result;
};
