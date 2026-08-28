import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { disclosureAnchorStateProxy } from '../../state/disclosure-anchor/disclosure-anchor-state.proxy';

const MOCK_FRAME_ID = 1;

export const useDisclosureAnchorBindingProxy = (): {
  setupReleased: () => void;
  isHeld: () => boolean;
  advanceFrame: () => void;
} => {
  const stateProxy = disclosureAnchorStateProxy();

  // jsdom really does run requestAnimationFrame, on its own ~16ms timer, and holdAnchor's nested
  // two-frame release (use-disclosure-anchor-binding.ts:56-:60) races that timer against
  // userEvent's 0ms inter-event await under whole-monorepo load. passthrough stays absent on
  // purpose — the real jsdom timer must never fire, or the release goes back to racing the clock.
  // The constructor-level catch-all records every call and hands back a frame id without invoking
  // the callback; advanceFrame below is the only thing that invokes a recorded one.
  const rafSpy: SpyOnHandle = registerSpyOn({
    object: globalThis,
    method: 'requestAnimationFrame',
  });
  rafSpy.calledWith([]).returns(MOCK_FRAME_ID);

  const drainedRef = { count: 0 };

  return {
    setupReleased: (): void => {
      stateProxy.setupReleased();
    },

    isHeld: (): boolean => stateProxy.isHeld(),

    // holdAnchor schedules an OUTER frame whose own callback schedules an INNER frame whose
    // callback releases the hold, so invoking the outer callback appends a NEW call to this
    // spy's record. callsMatching is a fresh snapshot per read, so each pass invokes only what an
    // earlier pass had not yet recorded — one pass advances one frame of the nested chain.
    advanceFrame: (): void => {
      const calls = [...rafSpy.callsMatching([])];
      const pending = calls.slice(drainedRef.count);
      drainedRef.count = calls.length;
      for (const call of pending) {
        (call[0] as () => void)();
      }
    },
  };
};
