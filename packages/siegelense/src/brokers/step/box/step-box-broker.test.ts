import { BoxReadingStub } from '../../../contracts/box-reading/box-reading.stub';
import { stepBoxBroker } from './step-box-broker';
import { stepBoxBrokerProxy } from './step-box-broker.proxy';

describe('stepBoxBroker', () => {
  it('VALID: {session, ref} => reads box geometry and returns rendered JSON', async () => {
    const proxy = stepBoxBrokerProxy();
    const reading = BoxReadingStub({
      ref: 26,
      x: 607,
      y: 472,
      width: 66,
      height: 27,
      viewport: {
        width: 1280,
        height: 720,
      },
      visible: true,
      inViewport: true,
    });
    const { session, getBoxCalls } = proxy.session({ reading });

    const result = await stepBoxBroker({ session, ref: 26 });

    expect(getBoxCalls()).toStrictEqual([[{ ref: 26 }]]);
    expect(result).toBe(
      '{"ref":26,"x":607,"y":472,"width":66,"height":27,"viewport":{"width":1280,"height":720},"visible":true,"inViewport":true}',
    );
  });
});
