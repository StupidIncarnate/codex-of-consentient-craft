import { VideoActionStub } from '../../../contracts/video-action/video-action.stub';
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
      action: VideoActionStub({ value: 'start' }),
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
      action: VideoActionStub({ value: 'stop' }),
    });

    expect(getVideoActionCalls()).toStrictEqual([[{ action: 'stop' }]]);
    expect(result).toBe('video recording stopped — saved to /tmp/test-video.webm');
  });
});
