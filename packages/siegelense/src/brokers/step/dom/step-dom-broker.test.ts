import { DomReadingStub } from '../../../contracts/dom-reading/dom-reading.stub';
import { stepDomBroker } from './step-dom-broker';
import { stepDomBrokerProxy } from './step-dom-broker.proxy';

describe('stepDomBroker', () => {
  it('VALID: {session, target, fields, text} => reads DOM nodes and returns rendered JSON', async () => {
    const proxy = stepDomBrokerProxy();
    const reading = DomReadingStub();
    const { session, getReadDomCalls } = proxy.session({ reading });

    const result = await stepDomBroker({
      session,
      target: 'button',
      fields: ['text', 'rect'],
      text: 'own',
    });

    expect(getReadDomCalls()).toStrictEqual([
      [{ target: 'button', fields: ['text', 'rect'], text: 'own' }],
    ]);
    expect(result).toBe(
      '{"count":1,"showing":1,"capped":false,"note":null,"nodes":[{"tagName":"button","testId":"SUBMIT_BTN","className":"btn primary","childCount":0,"display":"inline-block","visibility":"visible","opacity":"1","rect":{"x":10,"y":20,"width":100,"height":50},"text":"Submit","attrs":[],"value":null}]}',
    );
  });
});
