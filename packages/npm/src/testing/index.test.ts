import * as ourModule from './index';

describe('@dungeonmaster/npm/testing', () => {
  it('VALID: {module} => globProxy returns its full scenario-staging surface', () => {
    expect(ourModule.globProxy()).toStrictEqual({
      returns: expect.any(Function),
      throws: expect.any(Function),
      returnsMatchingTail: expect.any(Function),
      throwsMatchingTail: expect.any(Function),
      getOptionsFor: expect.any(Function),
      getCallsFor: expect.any(Function),
    });
  });

  it('VALID: {module} => renderProxy returns an empty proxy', () => {
    expect(ourModule.renderProxy()).toStrictEqual({});
  });

  it('VALID: {module} => parseXmlProxy returns an empty proxy', () => {
    expect(ourModule.parseXmlProxy()).toStrictEqual({});
  });

  it('VALID: {module} => decodePngProxy returns an empty proxy', () => {
    expect(ourModule.decodePngProxy()).toStrictEqual({});
  });
});
