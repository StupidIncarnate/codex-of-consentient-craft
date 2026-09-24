/**
 * PURPOSE: Renders a `DocsAnswer` as formatted Markdown — the document title, an ABOUT block ONLY
 * when `about` carries lines (the bare-call overview; `docsAnswerComposeTransformer` leaves it
 * empty for a named scope, since a role page stands alone), and one block per scope with headings,
 * audience, summary, and bulleted sections. A line starting `{ "step":` is fenced as JSON — every
 * such line in `docsStatics` is valid JSON, double-quoted keys and strings, so a reader can parse it
 * straight off the page. Reach for this over `siegelenseHelpRenderTransformer`, which renders a
 * different document: that one is a call's flag reference, this one is a role's page of rules. The
 * two share no section order on purpose, because a reader looking for a flag and a reader looking
 * for a rule are not scanning for the same shape.
 *
 * USAGE:
 * docsAnswerRenderTransformer({ answer: docsAnswerComposeTransformer({ scope: null }) });
 * // Returns the whole manual as formatted Markdown, one trailing newline
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { DocsAnswer } from '../../contracts/docs-answer/docs-answer-contract';

const BLOCK_GAP = '\n\n';
const DOCUMENT_TITLE = '# Siegelense Documentation';
const ABOUT_HEADING = '## About';

export const docsAnswerRenderTransformer = ({ answer }: { answer: DocsAnswer }): ContentText => {
  const blocks = [DOCUMENT_TITLE];

  if (answer.about.length > 0) {
    blocks.push([ABOUT_HEADING, answer.about.map((line) => `- ${line}`).join('\n')].join('\n\n'));
  }

  for (const document of answer.scopes) {
    blocks.push(`## ${document.scope} — ${document.audience}\n\n${document.summary}`);

    for (const section of document.sections) {
      if (section.lines.length === 0) {
        blocks.push(`### ${section.heading}`);
        continue;
      }

      const renderedLines = section.lines
        .map((line) => {
          if (line.startsWith('{ "step":')) {
            return `\n\`\`\`json\n${line}\n\`\`\`\n`;
          }
          if (
            line.startsWith('dungeonmaster siegelense ') &&
            !line.includes(' — ') &&
            !line.includes(', ') &&
            !line.endsWith('.')
          ) {
            return `\n\`\`\`bash\n${line}\n\`\`\`\n`;
          }
          const [prefix, ...rest] = line.split(' — ');
          if (prefix !== undefined && rest.length > 0 && !prefix.includes('.')) {
            return `- **${prefix}** — ${rest.join(' — ')}`;
          }
          return `- ${line}`;
        })
        .join('\n')
        .replace(/\n{3,}/gu, '\n\n')
        .trim();

      blocks.push(`### ${section.heading}\n\n${renderedLines}`);
    }
  }

  return contentTextContract.parse(`${blocks.join(BLOCK_GAP)}\n`);
};
