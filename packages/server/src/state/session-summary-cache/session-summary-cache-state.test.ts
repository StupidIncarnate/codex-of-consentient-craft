import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { MtimeMsStub } from '../../contracts/mtime-ms/mtime-ms.stub';
import { SessionSummaryStub } from '../../contracts/session-summary/session-summary.stub';

import { sessionSummaryCacheState } from './session-summary-cache-state';
import { sessionSummaryCacheStateProxy } from './session-summary-cache-state.proxy';

describe('sessionSummaryCacheState', () => {
  describe('get', () => {
    it('EMPTY: {unknown sessionId} => returns hit: false', () => {
      const proxy = sessionSummaryCacheStateProxy();
      proxy.setupEmpty();
      const sessionId = SessionIdStub({ value: 'unknown-session' });

      const result = sessionSummaryCacheState.get({
        sessionId,
        mtimeMs: MtimeMsStub({ value: 1000 }),
      });

      expect(result).toStrictEqual({ hit: false });
    });

    it('VALID: {cached session} => returns hit: true with summary', () => {
      const proxy = sessionSummaryCacheStateProxy();
      proxy.setupEmpty();
      const sessionId = SessionIdStub({ value: 'cached-session' });
      const summary = SessionSummaryStub({ value: 'Built login page' });
      const mtimeMs = MtimeMsStub({ value: 1000 });
      sessionSummaryCacheState.set({ sessionId, mtimeMs, summary });

      const result = sessionSummaryCacheState.get({ sessionId, mtimeMs });

      expect(result).toStrictEqual({ hit: true, summary });
    });

    it('STALE: {mtimeMs mismatch} => returns hit: false', () => {
      const proxy = sessionSummaryCacheStateProxy();
      proxy.setupEmpty();
      const sessionId = SessionIdStub({ value: 'stale-session' });
      const summary = SessionSummaryStub({ value: 'Old summary' });
      sessionSummaryCacheState.set({ sessionId, mtimeMs: MtimeMsStub({ value: 1000 }), summary });

      const result = sessionSummaryCacheState.get({
        sessionId,
        mtimeMs: MtimeMsStub({ value: 2000 }),
      });

      expect(result).toStrictEqual({ hit: false });
    });

    it('VALID: {cached undefined summary} => returns hit: true with undefined', () => {
      const proxy = sessionSummaryCacheStateProxy();
      proxy.setupEmpty();
      const sessionId = SessionIdStub({ value: 'no-summary-session' });
      const mtimeMs = MtimeMsStub({ value: 1000 });
      sessionSummaryCacheState.set({ sessionId, mtimeMs, summary: undefined });

      const result = sessionSummaryCacheState.get({ sessionId, mtimeMs });

      expect(result).toStrictEqual({ hit: true, summary: undefined });
    });
  });

  describe('clear', () => {
    it('VALID: {populated cache} => removes all entries', () => {
      const proxy = sessionSummaryCacheStateProxy();
      proxy.setupEmpty();
      const sessionId1 = SessionIdStub({ value: 'session-1' });
      const sessionId2 = SessionIdStub({ value: 'session-2' });
      const summary = SessionSummaryStub({ value: 'Some summary' });
      const mtimeMs1 = MtimeMsStub({ value: 1000 });
      const mtimeMs2 = MtimeMsStub({ value: 2000 });
      sessionSummaryCacheState.set({ sessionId: sessionId1, mtimeMs: mtimeMs1, summary });
      sessionSummaryCacheState.set({ sessionId: sessionId2, mtimeMs: mtimeMs2, summary });

      sessionSummaryCacheState.clear();

      expect(
        sessionSummaryCacheState.get({ sessionId: sessionId1, mtimeMs: mtimeMs1 }),
      ).toStrictEqual({ hit: false });
      expect(
        sessionSummaryCacheState.get({ sessionId: sessionId2, mtimeMs: mtimeMs2 }),
      ).toStrictEqual({ hit: false });
    });
  });
});
