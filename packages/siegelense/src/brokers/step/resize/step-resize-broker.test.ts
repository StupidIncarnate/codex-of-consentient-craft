import { stepResizeBroker } from './step-resize-broker';
import { stepResizeBrokerProxy } from './step-resize-broker.proxy';

describe('stepResizeBroker', () => {
  it('VALID: {width: 1280, height: 720} => calls session.setViewport and returns rendered reading', async () => {
    const proxy = stepResizeBrokerProxy();
    const { session, getSetViewportCalls } = proxy.session();

    const result = await stepResizeBroker({ session, width: 1280, height: 720 });

    expect(getSetViewportCalls()).toStrictEqual([[{ width: 1280, height: 720 }]]);
    expect(result).toBe('resized to 1280x720');
  });

  it('VALID: {width: 375, height: 667} => calls session.setViewport with mobile dimensions', async () => {
    const proxy = stepResizeBrokerProxy();
    const { session, getSetViewportCalls } = proxy.session();

    const result = await stepResizeBroker({ session, width: 375, height: 667 });

    expect(getSetViewportCalls()).toStrictEqual([[{ width: 375, height: 667 }]]);
    expect(result).toBe('resized to 375x667');
  });
});
