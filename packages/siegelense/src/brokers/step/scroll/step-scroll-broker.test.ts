import { ScrollReadingStub } from '../../../contracts/scroll-reading/scroll-reading.stub';
import { scrollStatics } from '../../../statics/scroll/scroll-statics';
import { stepScrollBroker } from './step-scroll-broker';
import { stepScrollBrokerProxy } from './step-scroll-broker.proxy';

describe('stepScrollBroker', () => {
  it('VALID: {by: 400} => runs the scrollBy move, then reports the position the page ended at', async () => {
    const proxy = stepScrollBrokerProxy();
    const { session, getEvaluateCalls } = proxy.session({
      reading: ScrollReadingStub({ scrollY: 400, scrollHeight: 900, viewportHeight: 500 }),
    });

    const result = await stepScrollBroker({
      session,
      target: null,
      within: null,
      ref: null,
      by: 400,
      byX: null,
      to: null,
    });

    expect(getEvaluateCalls()).toStrictEqual([
      [
        {
          source: `(() => {
  window.scrollBy({ top: 400, left: 0, behavior: 'instant' });
  return true;
})()`,
        },
      ],
      [{ source: scrollStatics.readSource }],
    ]);
    expect(result).toBe(
      'scroll position x=0 y=400; page 1280x900; viewport 1280x500; max scroll x=0 y=400',
    );
  });

  it('VALID: {to: bottom} => reports the bottom edge with max scroll equal to the position', async () => {
    const proxy = stepScrollBrokerProxy();
    const { session } = proxy.session({
      reading: ScrollReadingStub({ scrollY: 660, scrollHeight: 900, viewportHeight: 240 }),
    });

    const result = await stepScrollBroker({
      session,
      target: null,
      within: null,
      ref: null,
      by: null,
      byX: null,
      to: 'bottom',
    });

    expect(result).toBe(
      'scroll position x=0 y=660; page 1280x900; viewport 1280x240; max scroll x=0 y=660',
    );
  });

  it('VALID: {ref: 26} => moves the registry element into view and reports the new position', async () => {
    const proxy = stepScrollBrokerProxy();
    const { session, getEvaluateCalls } = proxy.session({
      reading: ScrollReadingStub({ scrollY: 300, scrollHeight: 900, viewportHeight: 500 }),
    });

    const result = await stepScrollBroker({
      session,
      target: null,
      within: null,
      ref: 26,
      by: null,
      byX: null,
      to: null,
    });

    expect(getEvaluateCalls().at(0)).toStrictEqual([
      {
        source: `(() => {
  const registry = window.__siege.refs;
  registry[25].scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  return true;
})()`,
      },
    ]);
    expect(result).toBe(
      'scroll position x=0 y=300; page 1280x900; viewport 1280x500; max scroll x=0 y=400',
    );
  });

  it('ERROR: {the page answers no geometry after the move} => throws naming the unknown position', async () => {
    const proxy = stepScrollBrokerProxy();
    const { session } = proxy.session({ reading: null });

    await expect(
      stepScrollBroker({
        session,
        target: null,
        within: null,
        ref: null,
        by: 10,
        byX: null,
        to: null,
      }),
    ).rejects.toThrow(
      /^step-scroll-broker: the page answered no scroll geometry after the move, so the new position is unknown$/u,
    );
  });
});
