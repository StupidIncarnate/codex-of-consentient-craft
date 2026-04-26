import { wsEventDataContract } from './ws-event-data-contract';
import { WsEventDataStub } from './ws-event-data.stub';

describe('wsEventDataContract', () => {
  describe('valid inputs', () => {
    it('VALID: {data: "..."} => parses successfully', () => {
      const result = WsEventDataStub({ data: 'hello' });

      expect(result.data).toBe('hello');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: not an object => throws validation error', () => {
      expect(() => {
        wsEventDataContract.parse('hello');
      }).toThrow(/Expected object/u);
    });
  });
});
