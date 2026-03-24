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
    it('INVALID_DIRECTION: {direction: "unknown"} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({
          direction: 'unknown',
          data: 'test',
          elapsedMs: 0,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_DATA: {data: number} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({
          direction: 'received',
          data: 123 as never,
          elapsedMs: 0,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_ELAPSED: {elapsedMs: -1} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({
          direction: 'received',
          data: 'test',
          elapsedMs: -1,
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        return wsLogEntryContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
