/**
 * PURPOSE: Names a bare-variable path argument so a writer and a reader that bind the same path to
 * DIFFERENT variable names still share one key. A variable initialised from
 * `locationsStatics.<group>.<key>` resolves to that reference; any other variable keeps its own name.
 * Reach for this over reading the variable name alone whenever two call sites must be joined.
 *
 * USAGE:
 * filePathArgResolveTransformer({
 *   source: contentTextContract.parse('const outboxPath = join(home, locationsStatics.dungeonmasterHome.eventOutbox);'),
 *   variableName: contentTextContract.parse('outboxPath'),
 * });
 * // Returns '<computed: locationsStatics.dungeonmasterHome.eventOutbox>'
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const STATICS_REFERENCE_PATTERN = /\blocationsStatics(?:\.\w+)+/u;

export const filePathArgResolveTransformer = ({
  source,
  variableName,
}: {
  source: ContentText;
  variableName: ContentText;
}): ContentText => {
  const name = String(variableName);
  const declarationPattern = new RegExp(`\\b(?:const|let)\\s+${name}\\b[^=]*=([^;]*);`, 'u');
  const initializer = declarationPattern.exec(String(source))?.[1] ?? '';
  const [staticsReference] = STATICS_REFERENCE_PATTERN.exec(initializer) ?? [];

  return contentTextContract.parse(`<computed: ${staticsReference ?? name}>`);
};
