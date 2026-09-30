/**
 * PURPOSE: Makes every expand/collapse in the transcript obey one rule — the control you clicked
 * stays exactly where you clicked it. Mount this on any header or toggle whose click changes how
 * much content is on the page; the two halves it owns are the halves a caller cannot do alone.
 *
 * The first half is the arithmetic: remember the control's offset inside its scrollport, and after
 * React commits, put the scrollport wherever it needs to be for the control to sit back at that
 * offset. Collapsing a row the reader scrolled deep into is the case that motivates it — the row's
 * header is pinned at the top of the scrollport while it is open, so restoring that offset is
 * literally "take me back to the thing I just collapsed".
 *
 * The second half is telling `useAutoScrollBinding` to stand down, via `disclosureAnchorState`. Its
 * `ResizeObserver` cannot tell a reader opening a chain from a new message arriving, so without the
 * hold it jumps to the bottom and undoes the anchoring before anyone sees it.
 *
 * USAGE:
 * const { anchorRef, holdAnchor } = useDisclosureAnchorBinding();
 * <Box ref={anchorRef} onClick={() => { holdAnchor(); setExpanded(!expanded); }} />
 */

import { useCallback, useLayoutEffect, useRef } from '#gateway/npm/react';

import { requestAnimationFrame } from '#gateway/browser/requestAnimationFrame';
import { window } from '#gateway/browser/window';
import { disclosureAnchorState } from '../../state/disclosure-anchor/disclosure-anchor-state';
import { computeAnchorScrollTopTransformer } from '../../transformers/compute-anchor-scroll-top/compute-anchor-scroll-top-transformer';

const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

export const useDisclosureAnchorBinding = (): {
  anchorRef: (node: HTMLElement | null) => void;
  holdAnchor: () => void;
} => {
  const nodeRef = useRef<HTMLElement | null>(null);
  const scrollportRef = useRef<HTMLElement | null>(null);
  const heldOffsetRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  // A callback ref rather than a RefObject, so one binding serves a Mantine `Box` (HTMLDivElement)
  // and an `UnstyledButton` (HTMLButtonElement) without either call site casting.
  const anchorRef = useCallback((node: HTMLElement | null): void => {
    nodeRef.current = node;
  }, []);

  const holdAnchor = useCallback((): void => {
    disclosureAnchorState.hold();
    pendingRef.current = true;

    // Released two frames on, and scheduled HERE rather than in the layout effect below, for two
    // separate reasons. Two frames: a `ResizeObserver` callback for this mutation runs after the
    // layout effects AND after the first rAF of that same frame, so anything sooner hands the
    // auto-scroll the very resize this hold exists to suppress. Here: a component unmounted by its
    // own toggle never runs the effect, and a hold nothing releases disables the auto-scroll for
    // the rest of the session.
    requestAnimationFrame((): void => {
      requestAnimationFrame((): void => {
        disclosureAnchorState.release();
      });
    });

    const anchor = nodeRef.current;
    let scrollport = anchor === null ? null : anchor.parentElement;

    while (scrollport !== null) {
      const { overflowY } = window.getComputedStyle(scrollport);
      if (SCROLLABLE_OVERFLOW.has(overflowY)) break;
      scrollport = scrollport.parentElement;
    }

    if (anchor === null || scrollport === null) {
      scrollportRef.current = null;
      heldOffsetRef.current = null;
      return;
    }

    scrollportRef.current = scrollport;
    heldOffsetRef.current = (anchor.getBoundingClientRect().top - scrollport.getBoundingClientRect().top);
  }, []);

  // Deliberately a LAYOUT effect and deliberately un-deped: it has to run after React commits the
  // size change and before the browser paints, or the reader sees one frame at the wrong scroll
  // position. The pending flag is what keeps it inert on the renders it has nothing to do.
  useLayoutEffect((): void => {
    if (!pendingRef.current) return;
    pendingRef.current = false;

    const scrollport = scrollportRef.current;
    const heldOffset = heldOffsetRef.current;
    const anchor = nodeRef.current;

    scrollportRef.current = null;
    heldOffsetRef.current = null;

    if (scrollport === null || heldOffset === null || anchor === null) return;

    scrollport.scrollTop = Number(
      computeAnchorScrollTopTransformer({
        currentScrollTop: Math.max(scrollport.scrollTop, 0),
        anchorOffset: anchor.getBoundingClientRect().top - scrollport.getBoundingClientRect().top,
        heldOffset,
        maxScrollTop: Math.max(scrollport.scrollHeight - scrollport.clientHeight, 0),
      }),
    );
  });

  return { anchorRef, holdAnchor };
};
