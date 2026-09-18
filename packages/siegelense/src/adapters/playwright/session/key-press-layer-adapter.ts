/**
 * PURPOSE: The `key` step's page-side source generation and Node-side translation — generating the
 * script that inspects `document.activeElement`, checks `window.__siege?.refs` for a matching ref,
 * extracts tag, testId, role, id, and value/text (capped to 100 chars), and translating the raw return
 * into a validated `KeyReading`.
 *
 * USAGE:
 * const adapter = keyPressLayerAdapter();
 * const source = adapter.focusReadSource();
 * const raw = await page.evaluate(source);
 * const reading = adapter.toReading({ press: 'Enter', rawFocused: raw });
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { focusedElementContract } from '../../../contracts/focused-element/focused-element-contract';
import { keyReadingContract } from '../../../contracts/key-reading/key-reading-contract';
import type { KeyReading } from '../../../contracts/key-reading/key-reading-contract';
import { refStatics } from '../../../statics/ref/ref-statics';

const FOCUS_READ_SOURCE = `(() => {
  const element = document.activeElement;
  if (element === null || element === undefined || element === document.body) {
    return null;
  }
  let ref = null;
  const globalObj = window.${refStatics.registry.globalName};
  const registry = globalObj === undefined ? null : globalObj.${refStatics.registry.arrayName};
  if (Array.isArray(registry)) {
    const idx = registry.indexOf(element);
    if (idx !== -1) {
      ref = idx + 1;
    }
  }
  const tag = element.tagName.toLowerCase();
  const testId = element.getAttribute('data-testid');
  const role = element.getAttribute('role');
  const domId = element.getAttribute('id');
  let text = null;
  if (typeof element.value === 'string' && element.value.length > 0) {
    text = element.value.slice(0, 100);
  } else if (element.childNodes && element.childNodes.length > 0) {
    let own = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        own += node.nodeValue || '';
      }
    });
    own = own.split(/\\s+/u).join(' ').trim().slice(0, 100);
    if (own.length > 0) {
      text = own;
    }
  }
  return {
    tag,
    testId: testId === null || testId === '' ? null : testId,
    role: role === null || role === '' ? null : role,
    domId: domId === null || domId === '' ? null : domId,
    text,
    ref,
  };
})()`;

export const keyPressLayerAdapter = (): {
  focusReadSource: () => ContentText;
  toReading: (params: { press: string; rawFocused: unknown }) => KeyReading;
} => ({
  focusReadSource: (): ContentText => contentTextContract.parse(FOCUS_READ_SOURCE),

  toReading: ({ press, rawFocused }: { press: string; rawFocused: unknown }): KeyReading => {
    const validatedPress = contentTextContract.parse(press);
    if (rawFocused === null || rawFocused === undefined) {
      return keyReadingContract.parse({ press: validatedPress, focused: null });
    }
    const focused = focusedElementContract.parse(rawFocused);
    return keyReadingContract.parse({ press: validatedPress, focused });
  },
});
