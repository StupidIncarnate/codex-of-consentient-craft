import { QuestGetServerConfigResponderProxy } from './quest-get-server-config-responder.proxy';

describe('QuestGetServerConfigResponder', () => {
  it('VALID: {DUNGEONMASTER_PORT=3737} => returns { baseUrl, port }', () => {
    const proxy = QuestGetServerConfigResponderProxy();
    proxy.setPort({ value: '3737' });

    const result = proxy.callResponder();

    expect(result).toStrictEqual({
      baseUrl: 'http://dungeonmaster.localhost:3737',
      port: 3737,
    });
  });
});
