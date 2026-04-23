import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';
import { SmoketestStateResponder } from './smoketest-state-responder';
import { SmoketestStateResponderProxy } from './smoketest-state-responder.proxy';

describe('SmoketestStateResponder', () => {
  it('VALID: {no active run} => returns active=null and events=[]', () => {
    SmoketestStateResponderProxy();
    smoketestRunState.end();

    expect(SmoketestStateResponder()).toStrictEqual({ active: null, events: [] });
  });
});
