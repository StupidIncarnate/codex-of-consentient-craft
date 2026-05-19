import { MonitorSessionAnnounceResponderProxy } from './monitor-session-announce-responder.proxy';

describe('MonitorSessionAnnounceResponder', () => {
  it('VALID: {CLAUDE_CODE_SESSION_ID set} => writes one announce file', async () => {
    const proxy = MonitorSessionAnnounceResponderProxy();
    process.env.CLAUDE_CODE_SESSION_ID = 'parent-test';

    const result = await proxy.callResponder();

    Reflect.deleteProperty(process.env, 'CLAUDE_CODE_SESSION_ID');

    const writtenFiles = proxy.getAllWrittenFiles();
    const writeCount = writtenFiles.length;

    expect(result).toStrictEqual({ success: true });
    expect(writeCount).toBe(1);
  });

  it('EMPTY: {CLAUDE_CODE_SESSION_ID unset, no jsonl on disk} => skips writing', async () => {
    const proxy = MonitorSessionAnnounceResponderProxy();
    Reflect.deleteProperty(process.env, 'CLAUDE_CODE_SESSION_ID');

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
  });

  it('VALID: {CLAUDE_CODE_SESSION_ID unset, resolver finds jsonl} => writes one announce file', async () => {
    const proxy = MonitorSessionAnnounceResponderProxy();
    Reflect.deleteProperty(process.env, 'CLAUDE_CODE_SESSION_ID');
    proxy.setupResolvedSessionId({ sessionId: 'fallback-session' });

    const result = await proxy.callResponder();
    const writeCount = proxy.getAllWrittenFiles().length;

    expect(result).toStrictEqual({ success: true });
    expect(writeCount).toBe(1);
  });
});
