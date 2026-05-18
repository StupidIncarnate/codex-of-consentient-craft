import { monitorSessionAnnounceBroker } from './monitor-session-announce-broker';
import { monitorSessionAnnounceBrokerProxy } from './monitor-session-announce-broker.proxy';

describe('monitorSessionAnnounceBroker', () => {
  it('VALID: {parentSessionId set} => writes the announce file with parent id, projectDir, registeredAt', async () => {
    const proxy = monitorSessionAnnounceBrokerProxy();

    const result = await monitorSessionAnnounceBroker({
      parentSessionId: 'parent-abc',
      projectDir: '/repo/example',
      nowIso: '2026-05-14T12:00:00.000Z',
      homeDir: '/home/user/.dungeonmaster',
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getWrittenContent()).toBe(
      JSON.stringify(
        {
          parentSessionId: 'parent-abc',
          projectDir: '/repo/example',
          registeredAt: '2026-05-14T12:00:00.000Z',
        },
        null,
        2,
      ),
    );
  });

  it('EMPTY: {parentSessionId undefined} => skips writing the announce file', async () => {
    const proxy = monitorSessionAnnounceBrokerProxy();

    const result = await monitorSessionAnnounceBroker({
      parentSessionId: undefined,
      projectDir: '/repo/example',
      nowIso: '2026-05-14T12:00:00.000Z',
      homeDir: '/home/user/.dungeonmaster',
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
  });

  it('EMPTY: {parentSessionId empty string} => skips writing the announce file', async () => {
    const proxy = monitorSessionAnnounceBrokerProxy();

    const result = await monitorSessionAnnounceBroker({
      parentSessionId: '',
      projectDir: '/repo/example',
      nowIso: '2026-05-14T12:00:00.000Z',
      homeDir: '/home/user/.dungeonmaster',
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
  });
});
