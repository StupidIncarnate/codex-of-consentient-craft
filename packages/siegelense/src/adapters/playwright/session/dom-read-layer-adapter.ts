/**
 * PURPOSE: The `dom` step's page-side source generation and Node-side translation — generating the
 * `querySelectorAll` script that extracts raw DOM elements, applies own text vs textContent, captures
 * styles, rects, attributes, and values, bounded by `domStatics.limits.maxMatches`, and translating the
 * raw return into a validated `DomReading` with field projection and self-reporting cap warnings.
 *
 * USAGE:
 * const adapter = domReadLayerAdapter();
 * const source = adapter.readSource({ target: '[data-testid="QUEST_ROW"]', text: 'own' });
 * const raw = await page.evaluate(source);
 * const reading = adapter.toReading({ raw, fields: ['text', 'rect'] });
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { DomField } from '../../../contracts/dom-field/dom-field-contract';
import { domNodeContract } from '../../../contracts/dom-node/dom-node-contract';
import { domReadingContract } from '../../../contracts/dom-reading/dom-reading-contract';
import type { DomReading } from '../../../contracts/dom-reading/dom-reading-contract';
import type { DomTextMode } from '../../../contracts/dom-text-mode/dom-text-mode-contract';
import { rawDomReadingContract } from '../../../contracts/raw-dom-reading/raw-dom-reading-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import { domStatics } from '../../../statics/dom/dom-statics';

export const domReadLayerAdapter = (): {
  readSource: (params: { target: string; text: DomTextMode | null }) => ContentText;
  toReading: (params: { raw: unknown; fields: readonly DomField[] | null }) => DomReading;
} => ({
  readSource: ({
    target,
    text: textMode,
  }: {
    target: string;
    text: DomTextMode | null;
  }): ContentText => {
    const isFull = textMode === 'full';
    const source = `(() => {
  const elements = Array.from(document.querySelectorAll(${JSON.stringify(target)}));
  const count = elements.length;
  const nodes = elements.slice(0, ${String(domStatics.limits.maxMatches)}).map((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    let text = '';
    if (${JSON.stringify(isFull)} === true) {
      text = (element.textContent || '').slice(0, ${String(domStatics.limits.textChars)});
    } else {
      element.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
          text += node.nodeValue || '';
        }
      });
      text = text.split(/\\s+/u).join(' ').trim().slice(0, ${String(domStatics.limits.textChars)});
    }
    const attrs = Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));
    return {
      tagName: element.tagName.toLowerCase(),
      testId: element.getAttribute('data-testid'),
      className: element.getAttribute('class'),
      childCount: element.childElementCount,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      text: text,
      attrs: attrs,
      value: typeof element.value === 'string' ? element.value.slice(0, ${String(domStatics.limits.textChars)}) : null,
    };
  });
  return { count, nodes };
})()`;
    return contentTextContract.parse(source);
  },

  toReading: ({
    raw,
    fields,
  }: {
    raw: unknown;
    fields: readonly DomField[] | null;
  }): DomReading => {
    const parsedRaw = rawDomReadingContract.parse(raw);

    const { count } = parsedRaw;

    if (fields !== null && fields.length === 1 && fields[0] === 'count') {
      return domReadingContract.parse({ count });
    }

    const showing = readingCountContract.parse(parsedRaw.nodes.length);
    const capped = count > showing;
    const note = capped
      ? contentTextContract.parse(
          `count: ${String(count)}, showing ${String(showing)}, capped. Narrow this.`,
        )
      : null;

    const projectedNodes = parsedRaw.nodes.map((node) => {
      if (fields === null) {
        return node;
      }
      const filtered: Record<PropertyKey, unknown> = {};
      for (const field of fields) {
        if (field in node) {
          filtered[field] = node[field as keyof typeof node];
        }
      }
      return domNodeContract.parse(filtered);
    });

    return domReadingContract.parse({
      count,
      showing,
      capped,
      note,
      nodes: projectedNodes,
    });
  },
});
