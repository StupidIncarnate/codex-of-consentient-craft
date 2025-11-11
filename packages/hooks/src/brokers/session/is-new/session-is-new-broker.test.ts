import { sessionIsNewBroker } from './session-is-new-broker';
import { sessionIsNewBrokerProxy } from './session-is-new-broker.proxy';
import { SessionStartHookStub } from '../../../contracts/session-start-hook-data/session-start-hook-data.stub';

describe('sessionIsNewBroker', () => {
  describe('valid input', () => {
    it('VALID: {transcriptPath: small file} => returns true', async () => {
      const proxy = sessionIsNewBrokerProxy();
      const { transcript_path: transcriptPath } = SessionStartHookStub({
        transcript_path: '/path/to/transcript.jsonl',
      });

      proxy.setupFileExists({ size: 500 });

      const result = await sessionIsNewBroker({ transcriptPath });

      expect(result).toBe(true);
    });

    it('VALID: {transcriptPath: large file} => returns false', async () => {
      const proxy = sessionIsNewBrokerProxy();
      const { transcript_path: transcriptPath } = SessionStartHookStub({
        transcript_path: '/path/to/transcript.jsonl',
      });

      proxy.setupFileExists({ size: 5000 });

      const result = await sessionIsNewBroker({ transcriptPath });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {transcriptPath: empty file} => returns true', async () => {
      const proxy = sessionIsNewBrokerProxy();
      const { transcript_path: transcriptPath } = SessionStartHookStub({
        transcript_path: '/path/to/transcript.jsonl',
      });

      proxy.setupFileExists({ size: 0 });

      const result = await sessionIsNewBroker({ transcriptPath });

      expect(result).toBe(true);
    });

    it('EDGE: {transcriptPath: exactly 1KB} => returns false', async () => {
      const proxy = sessionIsNewBrokerProxy();
      const { transcript_path: transcriptPath } = SessionStartHookStub({
        transcript_path: '/path/to/transcript.jsonl',
      });

      proxy.setupFileExists({ size: 1024 });

      const result = await sessionIsNewBroker({ transcriptPath });

      expect(result).toBe(false);
    });

    it('EDGE: {transcriptPath: just under 1KB} => returns true', async () => {
      const proxy = sessionIsNewBrokerProxy();
      const { transcript_path: transcriptPath } = SessionStartHookStub({
        transcript_path: '/path/to/transcript.jsonl',
      });

      proxy.setupFileExists({ size: 1023 });

      const result = await sessionIsNewBroker({ transcriptPath });

      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('ERROR: {transcriptPath: nonexistent file} => returns true', async () => {
      const proxy = sessionIsNewBrokerProxy();
      const { transcript_path: transcriptPath } = SessionStartHookStub({
        transcript_path: '/nonexistent/path/transcript.jsonl',
      });

      proxy.setupFileNotFound();

      const result = await sessionIsNewBroker({ transcriptPath });

      expect(result).toBe(true);
    });
  });
});
