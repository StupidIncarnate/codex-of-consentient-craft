/**
 * PURPOSE: A real `AbortController`, optionally already aborted — for a caller that needs a
 * genuine controller and signal rather than a hand-typed stand-in.
 *
 * USAGE:
 * const controller = AbortControllerStub();
 * const stopped = AbortControllerStub({ aborted: true });
 */
import { AbortController } from './AbortController';

export const AbortControllerStub = ({
  aborted = false,
}: { aborted?: boolean } = {}): AbortController => {
  const controller = new AbortController();

  if (aborted) {
    controller.abort();
  }

  return controller;
};
