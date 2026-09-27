/**
 * PURPOSE: A real react-dom `Root`, built through the real `createRoot()` against a real (but
 * detached, caller-owned) DOM element — for a caller staging this subpath's own value instead of
 * hand-typing a fake root. Needs a real `document`, hence `@jest-environment jsdom` on this stub's
 * own companion test — this package's default Jest environment is `node`.
 *
 * USAGE:
 * const root = RootStub({ container: document.createElement('div') });
 * // Returns a real react-dom Root mounted on the given container
 */
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

export const RootStub = ({
  container = document.createElement('div'),
}: {
  container?: HTMLElement;
} = {}): Root => createRoot(container);
