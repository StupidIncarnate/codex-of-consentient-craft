import { FocusedElementStub } from '../../../contracts/focused-element/focused-element.stub';
import { KeyReadingStub } from '../../../contracts/key-reading/key-reading.stub';
import { stepKeyBroker } from './step-key-broker';
import { stepKeyBrokerProxy } from './step-key-broker.proxy';

describe('stepKeyBroker', () => {
  it('VALID: {press: "Enter", nothing focused} => calls session.pressKey and returns rendered result', async () => {
    const proxy = stepKeyBrokerProxy();
    const { session, getPressKeyCalls, setKeyReading } = proxy.session();
    setKeyReading(
      KeyReadingStub({
        press: 'Enter',
        focused: null,
      }),
    );

    const result = await stepKeyBroker({ session, press: 'Enter' });

    expect(getPressKeyCalls()).toStrictEqual([[{ press: 'Enter' }]]);
    expect(result).toBe('pressed "Enter" — nothing focused');
  });

  it('VALID: {press: "Tab", active element focused} => calls session.pressKey and returns rendered result with element', async () => {
    const proxy = stepKeyBrokerProxy();
    const { session, getPressKeyCalls, setKeyReading } = proxy.session();
    setKeyReading(
      KeyReadingStub({
        press: 'Tab',
        focused: FocusedElementStub({
          tag: 'input',
          testId: 'NAME_INPUT',
          text: 'alice',
          ref: 14,
        }),
      }),
    );

    const result = await stepKeyBroker({ session, press: 'Tab' });

    expect(getPressKeyCalls()).toStrictEqual([[{ press: 'Tab' }]]);
    expect(result).toBe(
      'pressed "Tab" — focused: input[data-testid="NAME_INPUT"] "alice" (ref 14)',
    );
  });
});
