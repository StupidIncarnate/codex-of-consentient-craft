import { BoxReadingStub } from '../../../contracts/box-reading/box-reading.stub';
import { PixelCoordinateStub } from '../../../contracts/pixel-coordinate/pixel-coordinate.stub';
import { PixelCountStub } from '../../../contracts/pixel-count/pixel-count.stub';
import { RefStub } from '../../../contracts/ref/ref.stub';
import { stepBoxBroker } from './step-box-broker';
import { stepBoxBrokerProxy } from './step-box-broker.proxy';

describe('stepBoxBroker', () => {
  it('VALID: {session, ref} => reads box geometry and returns rendered JSON', async () => {
    const proxy = stepBoxBrokerProxy();
    const reading = BoxReadingStub({
      ref: RefStub({ value: 26 }),
      x: PixelCoordinateStub({ value: 607 }),
      y: PixelCoordinateStub({ value: 472 }),
      width: PixelCountStub({ value: 66 }),
      height: PixelCountStub({ value: 27 }),
      viewport: {
        width: PixelCountStub({ value: 1280 }),
        height: PixelCountStub({ value: 720 }),
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
