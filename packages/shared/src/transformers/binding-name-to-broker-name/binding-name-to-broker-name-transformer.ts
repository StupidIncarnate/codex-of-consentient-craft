/**
 * PURPOSE: Derives a plausible broker display name from a binding name by stripping the
 * "use-" prefix and appending "-broker", e.g. "use-quest-chat" → "quest-chat-broker".
 *
 * USAGE:
 * bindingNameToBrokerNameTransformer({ bindingName: contentTextContract.parse('use-quest-chat') });
 * // Returns ContentText 'quest-chat-broker'
 *
 * WHEN-TO-USE: Frontend-react exemplar trace renderer deriving a broker label from a binding name
 * WHEN-NOT-TO-USE: When you need a real import-resolved broker name (this is a display heuristic)
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const USE_PREFIX = 'use-';
const BINDING_SUFFIX = '-binding';
const BROKER_SUFFIX = '-broker';

export const bindingNameToBrokerNameTransformer = ({
  bindingName,
}: {
  bindingName: ContentText;
}): ContentText => {
  let name = String(bindingName);

  if (name.startsWith(USE_PREFIX)) {
    name = name.slice(USE_PREFIX.length);
  }

  if (name.endsWith(BINDING_SUFFIX)) {
    name = name.slice(0, -BINDING_SUFFIX.length);
  }

  return contentTextContract.parse(`${name}${BROKER_SUFFIX}`);
};
