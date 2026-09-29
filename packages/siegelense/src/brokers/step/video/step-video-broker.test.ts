import { VideoResultStub } from '../../../contracts/video-result/video-result.stub';
import { stepVideoBroker } from './step-video-broker';
import { stepVideoBrokerProxy } from './step-video-broker.proxy';

describe('stepVideoBroker', () => {
  it('VALID: {action: "start"} => calls session.videoAction and returns rendered reading', async () => {
    const proxy = stepVideoBrokerProxy();
    const { session, getVideoActionCalls } = proxy.session({
      result: VideoResultStub({ status: 'started', path: null }),
    });

    const result = await stepVideoBroker({
      session,
      action: 'start',
    });

    expect(getVideoActionCalls()).toStrictEqual([[{ action: 'start' }]]);
    expect(result).toBe('video recording started');
  });

  it('VALID: {action: "stop"} => calls session.videoAction and returns stopped reading with path', async () => {
    const proxy = stepVideoBrokerProxy();
    const { session, getVideoActionCalls } = proxy.session({
      result: VideoResultStub({
        status: 'stopped',
        path: '/tmp/test-video.webm',
      }),
    });

    const result = await stepVideoBroker({
      session,
      action: 'stop',
    });

    expect(getVideoActionCalls()).toStrictEqual([[{ action: 'stop' }]]);
    expect(result).toBe('video recording stopped — saved to /tmp/test-video.webm');
  });

  describe('DEF-80: the repo-local alias', () => {
    it('VALID: {action: "stop", the repo symlink exists} => reports the repo-local path, not the resolved home path', async () => {
      const proxy = stepVideoBrokerProxy();
      proxy.stageRepoLinkPresent();
      const { session } = proxy.session({
        result: VideoResultStub({
          status: 'stopped',
          path: '/home/default/.dungeonmaster/siegelense/guilds/g1/instances/inst_1/video/abc.webm',
        }),
      });

      const result = await stepVideoBroker({
        session,
        action: 'stop',
      });

      expect(result).toBe(
        'video recording stopped — saved to /default/cwd/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/video/abc.webm',
      );
    });
  });
});
