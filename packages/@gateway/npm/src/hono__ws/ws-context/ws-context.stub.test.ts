import { WSContext } from 'hono/ws';
import { WsContextStub } from './ws-context.stub';

describe('WsContextStub', () => {
  it('VALID: {} => a real open WSContext', () => {
    const ws = WsContextStub();

    expect({ isWsContext: ws instanceof WSContext, readyState: ws.readyState }).toStrictEqual({
      isWsContext: true,
      readyState: 1,
    });
  });

  it('VALID: {send} => ws.send hands the sent data to the given function', () => {
    const sent: (string | ArrayBuffer | Uint8Array)[] = [];
    const ws = WsContextStub({ send: (data) => sent.push(data) });

    ws.send('hello');

    expect(sent).toStrictEqual(['hello']);
  });

  it('VALID: {readyState: 3} => the context reports closed', () => {
    expect(WsContextStub({ readyState: 3 }).readyState).toBe(3);
  });
});
