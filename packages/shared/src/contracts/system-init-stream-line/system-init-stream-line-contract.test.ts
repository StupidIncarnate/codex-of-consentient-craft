import { systemInitStreamLineContract } from './system-init-stream-line-contract';
import { SystemInitStreamLineStub } from './system-init-stream-line.stub';

describe('systemInitStreamLineContract', () => {
  describe('valid stream lines', () => {
    it('VALID: {system init with session_id} => parses correctly', () => {
      const streamLine = SystemInitStreamLineStub();

      const result = systemInitStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'system',
        subtype: 'init',
        session_id: 'session-abc-123',
      });
    });

    it('VALID: {custom session_id} => parses with override', () => {
      const streamLine = SystemInitStreamLineStub({ session_id: 'custom-session-456' as never });

      const result = systemInitStreamLineContract.parse(streamLine);

      expect(result.session_id).toBe('custom-session-456');
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID: {type: "user"} => throws validation error', () => {
      expect(() => {
        systemInitStreamLineContract.parse({
          type: 'user',
          subtype: 'init',
          session_id: 'abc-123',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {subtype: "close"} => throws validation error', () => {
      expect(() => {
        systemInitStreamLineContract.parse({
          type: 'system',
          subtype: 'close',
          session_id: 'abc-123',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {missing session_id} => throws validation error', () => {
      expect(() => {
        systemInitStreamLineContract.parse({
          type: 'system',
          subtype: 'init',
        });
      }).toThrow(/Required/u);
    });
  });
});
