/**
 * PURPOSE: Renders a `DocsAnswer` as the plain-text manual `--human` prints — the ABOUT block, then
 * one block per scope, each headed by its scope name and audience and indented by section. Reach
 * for this over `siegelenseHelpRenderTransformer`, which renders a different document: that one is
 * a call's flag reference, this one is a role's page of rules. The two share no section order on
 * purpose, because a reader looking for a flag and a reader looking for a rule are not scanning for
 * the same shape.
 *
 * USAGE:
 * docsAnswerRenderTransformer({ answer: docsAnswerComposeTransformer({ scope }) });
 * // Returns the manual as indented text, one trailing newline
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { DocsAnswer } from '../../contracts/docs-answer/docs-answer-contract';

const BLOCK_GAP = '\n\n';
const ABOUT_HEADING = 'ABOUT';

export const docsAnswerRenderTransformer = ({ answer }: { answer: DocsAnswer }): ContentText => {
  const aboutBlock = [ABOUT_HEADING, ...answer.about.map((line) => `  ${line}`)].join('\n');

  const scopeBlocks = answer.scopes.flatMap((document) => [
    [`${document.scope} — ${document.audience}`, `  ${document.summary}`].join('\n'),
    ...document.sections.map((section) =>
      [`  ${section.heading}`, ...section.lines.map((line) => `    ${line}`)].join('\n'),
    ),
  ]);

  return contentTextContract.parse(`${[aboutBlock, ...scopeBlocks].join(BLOCK_GAP)}\n`);
};
