import { MonitorSessionAnnounceFlow } from './monitor-session-announce-flow';

describe('MonitorSessionAnnounceFlow', () => {
  it('VALID: {} => returns an AdapterResult with success: true (CLAUDE_CODE_SESSION_ID unset => skip path)', async () => {
    Reflect.deleteProperty(process.env, 'CLAUDE_CODE_SESSION_ID');

    const result = await MonitorSessionAnnounceFlow();

    expect(result).toStrictEqual({ success: true });
  });
});
