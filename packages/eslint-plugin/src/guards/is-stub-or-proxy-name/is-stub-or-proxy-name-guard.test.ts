import { isStubOrProxyNameGuard } from './is-stub-or-proxy-name-guard';

describe('isStubOrProxyNameGuard', () => {
  it('VALID: {name: "QuestStub"} => returns true', () => {
    const result = isStubOrProxyNameGuard({ name: 'QuestStub' });

    expect(result).toBe(true);
  });

  it('VALID: {name: "questGetBrokerProxy"} => returns true', () => {
    const result = isStubOrProxyNameGuard({ name: 'questGetBrokerProxy' });

    expect(result).toBe(true);
  });

  it('VALID: {name: "StartOrchestratorProxy"} => returns true', () => {
    const result = isStubOrProxyNameGuard({ name: 'StartOrchestratorProxy' });

    expect(result).toBe(true);
  });

  it('VALID: {name: "questContract"} => returns false', () => {
    const result = isStubOrProxyNameGuard({ name: 'questContract' });

    expect(result).toBe(false);
  });

  it('VALID: {name: "StubbedThing"} => returns false', () => {
    const result = isStubOrProxyNameGuard({ name: 'StubbedThing' });

    expect(result).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    const result = isStubOrProxyNameGuard({});

    expect(result).toBe(false);
  });
});
