/**
 * PURPOSE: Drives the `dom` step — Rung 4 of the reading ladder (siegelense-tooling.md line 634:
 * `look` → `look { within }` → `box` → `dom` → `eval`). The escape hatch before eval: queries raw DOM
 * nodes matching a CSS selector, projecting optional fields and text modes, bounded by a self-reporting
 * cap of 10 nodes. Renders the DomReading as ContentText JSON so a session reading results sees the
 * projected nodes or match count. A zero-match answer never comes back bare: `count: 0` alone reads as
 * "nothing happened" rather than "nobody matched THIS selector", so this broker fills `note` with
 * `domStatics.notes.noMatch` whenever the session answered `count: 0` and left it unset — the same
 * never-silent-empty rule `instanceStateContract`'s own header states for `pruned`/`unknown`.
 *
 * USAGE:
 * await stepDomBroker({ session, target: '[data-testid="QUEST_ROW"]', fields: ['text', 'rect'], text: 'own' });
 * // Reads matching DOM nodes from the session and renders the reading
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { domReadingContract } from '../../../contracts/dom-reading/dom-reading-contract';
import type { DomField } from '../../../contracts/dom-field/dom-field-contract';
import type { DomTextMode } from '../../../contracts/dom-text-mode/dom-text-mode-contract';
import { domStatics } from '../../../statics/dom/dom-statics';
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

  const notedReading =
    reading.count === 0 && (reading.note === null || reading.note === undefined)
      ? domReadingContract.parse({
          ...reading,
          note: contentTextContract.parse(domStatics.notes.noMatch.replace('{target}', target)),
        })
      : reading;

  return domReadingRenderTransformer({ reading: notedReading });
};
