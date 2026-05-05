/**
 * PURPOSE: Splits an identifier into word tokens regardless of naming convention (camelCase, PascalCase, kebab-case, snake_case, SCREAMING_SNAKE_CASE, space-separated)
 *
 * USAGE:
 * identifierTokenizeTransformer({ identifier: 'OrchestrationEventType' });
 * // Returns ['Orchestration', 'Event', 'Type'] (as branded ContentText[])
 *
 * identifierTokenizeTransformer({ identifier: 'orchestration-event-type' });
 * // Returns ['orchestration', 'event', 'type']
 *
 * WHEN-TO-USE: Building cross-naming-convention regex matchers — same word stems should
 * match regardless of how the identifier is cased or separated on disk.
 */
import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const LOWER_OR_DIGIT_TO_UPPER_PATTERN = /([a-z\d])([A-Z])/gu;
const CAPS_RUN_TO_CAP_LOWER_PATTERN = /([A-Z]+)([A-Z][a-z])/gu;
const SEPARATOR_PATTERN = /[-_\s]+/gu;

export const identifierTokenizeTransformer = ({
  identifier,
}: {
  identifier: string;
}): readonly ContentText[] =>
  identifier
    .replace(LOWER_OR_DIGIT_TO_UPPER_PATTERN, '$1 $2')
    .replace(CAPS_RUN_TO_CAP_LOWER_PATTERN, '$1 $2')
    .replace(SEPARATOR_PATTERN, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length > 0)
    .map((token) => contentTextContract.parse(token));
