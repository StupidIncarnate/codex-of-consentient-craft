/**
 * PURPOSE: Builds the page-side expression one `scroll` step runs through `evaluateSource` — an
 * element brought into view (by `ref` from the page's ref registry, or by a CSS `target`), the
 * window moved by an amount, or the window sent to the top or bottom. Every move is `instant`, so
 * the reading taken right after it sees the final position rather than one frame of a smooth scroll.
 *
 * USAGE:
 * scrollSourceBuildTransformer({ target: null, within: null, ref: null, by: 400, byX: null, to: null });
 * // Returns the source of a self-invoked function calling window.scrollBy({ top: 400, left: 0, behavior: 'instant' })
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { refStatics } from '../../statics/ref/ref-statics';
import { scrollStatics } from '../../statics/scroll/scroll-statics';

const INTO_VIEW = "{ block: 'center', inline: 'center', behavior: 'instant' }";

export const scrollSourceBuildTransformer = ({
  target,
  within,
  ref,
  by,
  byX,
  to,
}: {
  target: string | null;
  within: string | null;
  ref: number | null;
  by: number | null;
  byX: number | null;
  to: string | null;
}): ContentText => {
  if (ref !== null) {
    return contentTextContract.parse(`(() => {
  const registry = window.${refStatics.registry.globalName}.${refStatics.registry.arrayName};
  registry[${String(ref - 1)}].scrollIntoView(${INTO_VIEW});
  return true;
})()`);
  }

  if (target !== null) {
    const scoped = within === null ? target : `${within} ${target}`;
    return contentTextContract.parse(`(() => {
  const found = document.querySelectorAll(${JSON.stringify(scoped)});
  if (found.length !== 1) {
    throw new Error('scroll: ' + String(found.length) + ' elements match ' + ${JSON.stringify(scoped)} + ' — a scroll target must be a CSS selector matching exactly one');
  }
  found[0].scrollIntoView(${INTO_VIEW});
  return true;
})()`);
  }

  if (to === scrollStatics.edges.top) {
    return contentTextContract.parse(`(() => {
  window.scrollTo({ top: 0, left: window.scrollX, behavior: 'instant' });
  return true;
})()`);
  }

  if (to === scrollStatics.edges.bottom) {
    return contentTextContract.parse(`(() => {
  window.scrollTo({ top: document.documentElement.scrollHeight, left: window.scrollX, behavior: 'instant' });
  return true;
})()`);
  }

  return contentTextContract.parse(`(() => {
  window.scrollBy({ top: ${String(by ?? 0)}, left: ${String(byX ?? 0)}, behavior: 'instant' });
  return true;
})()`);
};
