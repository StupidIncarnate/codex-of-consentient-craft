import { MessageEventStub } from './message-event.stub';

describe('MessageEventStub', () => {
  it('VALID: {} => a real MessageEvent whose data JSON-parses to the default payload', () => {
    const event = MessageEventStub();

    expect({
      isMessageEvent: event instanceof MessageEvent,
      type: event.type,
      parsed: JSON.parse(String(event.data)) as unknown,
    }).toStrictEqual({ isMessageEvent: true, type: 'message', parsed: { type: 'ping' } });
  });

  it('VALID: {payload} => a real MessageEvent carrying the given payload', () => {
    const event = MessageEventStub({ payload: { type: 'subscribe-quest', questId: 'q1' } });

    expect(JSON.parse(String(event.data)) as unknown).toStrictEqual({
      type: 'subscribe-quest',
      questId: 'q1',
    });
  });
});
