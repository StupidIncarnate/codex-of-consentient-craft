/**
 * PURPOSE: Tests for orchestratorSessionIdExtractorAdapter
 */
import { StreamJsonLineStub } from '@dungeonmaster/orchestrator/testing';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorSessionIdExtractorAdapter } from './orchestrator-session-id-extractor-adapter';
import { orchestratorSessionIdExtractorAdapterProxy } from './orchestrator-session-id-extractor-adapter.proxy';

describe('orchestratorSessionIdExtractorAdapter', () => {
  describe('successful extraction', () => {
    it('VALID: {line with session_id} => returns session id', () => {
      orchestratorSessionIdExtractorAdapterProxy();
      const sessionId = SessionIdStub({ value: 'abc-123' });
      const line = StreamJsonLineStub({ value: JSON.stringify({ session_id: sessionId }) });

      const result = orchestratorSessionIdExtractorAdapter({ line });

      expect(result).toBe(sessionId);
    });

    it('VALID: {line without session_id} => returns null', () => {
      orchestratorSessionIdExtractorAdapterProxy();
      const line = StreamJsonLineStub({ value: JSON.stringify({ type: 'text' }) });

      const result = orchestratorSessionIdExtractorAdapter({ line });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('EDGE: {invalid JSON line} => returns null', () => {
      orchestratorSessionIdExtractorAdapterProxy();
      const line = StreamJsonLineStub({ value: 'not-json' });

      const result = orchestratorSessionIdExtractorAdapter({ line });

      expect(result).toBeNull();
    });
  });
});
