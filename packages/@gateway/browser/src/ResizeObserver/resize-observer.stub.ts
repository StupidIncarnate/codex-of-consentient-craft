/**
 * PURPOSE: A real `ResizeObserver` instance, built through the real constructor `#gateway/browser/ResizeObserver`
 * passes through (this package's jsdom test environment polyfills the global with the same no-op
 * shape `@dungeonmaster/web`'s own jsdom setup uses, since jsdom implements no ResizeObserver at
 * all) — for a caller staging this subpath's own value without hand-typing a fake one.
 *
 * USAGE:
 * const observer = ResizeObserverStub();
 * observer.observe(element);
 */
import { ResizeObserver } from './ResizeObserver';

export const ResizeObserverStub = (): ResizeObserver =>
  new ResizeObserver(() => {
    // Real observer callback, intentionally empty — this stub is for callers that need an
    // instance to hold, not one that ever actually reports a resize.
  });
