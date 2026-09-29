import { ScrollReadingStub } from '../../../contracts/scroll-reading/scroll-reading.stub';
import { scrollStatics } from '../../../statics/scroll/scroll-statics';
import { stepScrollReadBroker } from './step-scroll-read-broker';
import { stepScrollReadBrokerProxy } from './step-scroll-read-broker.proxy';

describe('stepScrollReadBroker', () => {
  it('VALID: {page answers a geometry object} => returns the parsed reading and evaluated the read source', async () => {
    const proxy = stepScrollReadBrokerProxy();
    const { session, getEvaluateCalls } = proxy.session({
      answer: JSON.stringify(
        ScrollReadingStub({ scrollY: 400, scrollHeight: 900, viewportHeight: 500 }),
      ),
    });

    const result = await stepScrollReadBroker({ session });

    expect(getEvaluateCalls()).toStrictEqual([[{ source: scrollStatics.readSource }]]);
    expect(result).toStrictEqual({
      scrollX: 0,
      scrollY: 400,
      scrollWidth: 1280,
      scrollHeight: 900,
      viewportWidth: 1280,
      viewportHeight: 500,
    });
  });

  it.each(['', 'undefined', 'null'])(
    'EMPTY: {page answers %j} => returns null, no measurement',
    async (answer) => {
      const proxy = stepScrollReadBrokerProxy();
      const { session } = proxy.session({ answer });

      const result = await stepScrollReadBroker({ session });

      expect(result).toBe(null);
    },
  );

  it('ERROR: {page answers a malformed geometry} => throws the contract error', async () => {
    const proxy = stepScrollReadBrokerProxy();
    const { session } = proxy.session({ answer: '{"scrollX":-1}' });

    await expect(stepScrollReadBroker({ session })).rejects.toThrow(/Required/u);
  });
});
