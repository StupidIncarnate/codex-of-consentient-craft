import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { announcedParentSessionState } from './announced-parent-session-state';

describe('announcedParentSessionState', () => {
  it('VALID: {fresh state} => get returns null', () => {
    announcedParentSessionState.clear();

    expect(announcedParentSessionState.get()).toBe(null);
  });

  it('VALID: {set then get} => returns the stored sessionId', () => {
    const parentSessionId = SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' });
    announcedParentSessionState.clear();
    announcedParentSessionState.set({ parentSessionId });
    const observed = announcedParentSessionState.get();
    announcedParentSessionState.clear();

    expect(observed).toBe(parentSessionId);
  });

  it('VALID: {set then clear} => get returns null', () => {
    announcedParentSessionState.clear();
    announcedParentSessionState.set({
      parentSessionId: SessionIdStub({ value: 'c2f964f7-31b7-4ac6-88f7-e7a985d8c671' }),
    });
    announcedParentSessionState.clear();

    expect(announcedParentSessionState.get()).toBe(null);
  });

  it('VALID: {set twice} => second set overwrites first', () => {
    const first = SessionIdStub({ value: '11111111-1111-1111-1111-111111111111' });
    const second = SessionIdStub({ value: '22222222-2222-2222-2222-222222222222' });
    announcedParentSessionState.clear();
    announcedParentSessionState.set({ parentSessionId: first });
    announcedParentSessionState.set({ parentSessionId: second });
    const observed = announcedParentSessionState.get();
    announcedParentSessionState.clear();

    expect(observed).toBe(second);
  });
});
