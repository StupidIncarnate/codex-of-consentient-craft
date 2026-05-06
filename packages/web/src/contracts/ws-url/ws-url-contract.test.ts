import { wsUrlContract } from './ws-url-contract';
import { WsUrlStub } from './ws-url.stub';

describe('wsUrlContract', () => {
  it('VALID: {ws scheme} => parses', () => {
    expect(wsUrlContract.parse('ws://localhost:3001/ws')).toBe(
      WsUrlStub({ value: 'ws://localhost:3001/ws' }),
    );
  });

  it('VALID: {wss scheme} => parses', () => {
    expect(wsUrlContract.parse('wss://example.com/socket')).toBe(
      WsUrlStub({ value: 'wss://example.com/socket' }),
    );
  });

  it('INVALID: {http scheme} => throws', () => {
    expect(() => wsUrlContract.parse('http://localhost/ws')).toThrow(/ws:/u);
  });

  it('INVALID: {empty} => throws', () => {
    expect(() => wsUrlContract.parse('')).toThrow(/ws:/u);
  });
});
