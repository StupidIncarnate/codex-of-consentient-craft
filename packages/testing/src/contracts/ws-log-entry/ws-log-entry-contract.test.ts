import { wsLogEntryContract } from './ws-log-entry-contract';
import { WsLogEntryStub } from './ws-log-entry.stub';

describe('wsLogEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {direction: "received", data, elapsedMs} => parses successfully', () => {
      const entry = WsLogEntryStub({
        direction: 'received',
        data: '{"type":"quest-modified"}',
        elapsedMs: 45,
      });

      const parsed = wsLogEntryContract.parse(entry);

      expect(parsed).toStrictEqual({
        direction: 'received',
        data: '{"type":"quest-modified"}',
        elapsedMs: 45,
      });
    });

    it('VALID: {direction: "sent"} => parses sent direction', () => {
      const entry = WsLogEntryStub({
        direction: 'sent',
        data: '{"type":"ping"}',
        elapsedMs: 0,
      });

      const parsed = wsLogEntryContract.parse(entry);

      expect(parsed).toStrictEqual({
        direction: 'sent',
        data: '{"type":"ping"}',
        elapsedMs: 0,
      });
    });

    it('VALID: {elapsedMs: 0} => parses zero elapsed time', () => {
      const entry = WsLogEntryStub({ elapsedMs: 0 });

      const parsed = wsLogEntryContract.parse(entry);

      expect(parsed.elapsedMs).toBe(0);
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {direction: "unknown"} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({
          direction: 'unknown',
          data: 'test',
          elapsedMs: 0,
        });
      }).toThrow(/Invalid option/u);
    });

    it('INVALID: {data: number} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({
          direction: 'received',
          data: 123,
          elapsedMs: 0,
        });
      }).toThrow(/expected string/u);
    });

    it('INVALID: {elapsedMs: -1} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({
          direction: 'received',
          data: 'test',
          elapsedMs: -1,
        });
      }).toThrow(/expected number to be >=0/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({});
      }).toThrow(/received undefined/u);
    });
  });
});
