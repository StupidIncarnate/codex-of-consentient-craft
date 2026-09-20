/**
 * PURPOSE: Drives the `dom` step — Rung 4 of the reading ladder (siegelense-tooling.md line 634:
 * `look` → `look { within }` → `box` → `dom` → `eval`). The escape hatch before eval: queries raw DOM
 * nodes matching a CSS selector, projecting optional fields and text modes, bounded by a self-reporting
 * cap of 10 nodes. Renders the DomReading as ContentText JSON so a session reading results sees the
 * projected nodes or match count.
 *
 * USAGE:
 * await stepDomBroker({ session, target: '[data-testid="QUEST_ROW"]', fields: ['text', 'rect'], text: 'own' });
 * // Reads matching DOM nodes from the session and renders the reading
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { DomField } from '../../../contracts/dom-field/dom-field-contract';
import type { DomTextMode } from '../../../contracts/dom-text-mode/dom-text-mode-contract';
import { domReadingRenderTransformer } from '../../../transformers/dom-reading-render/dom-reading-render-transformer';

export const stepDomBroker = async ({
  session,
  target,
  fields,
  text,
}: {
  session: BrowserSession;
  target: string;
  fields: readonly DomField[] | null;
  text: DomTextMode | null;
}): Promise<ContentText> => {
  const reading = await session.readDom({ target, fields, text });
  return domReadingRenderTransformer({ reading });
};
