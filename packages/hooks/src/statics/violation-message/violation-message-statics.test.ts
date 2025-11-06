import { violationMessageStatics } from './violation-message-statics';

describe('violationMessageStatics', () => {
  it('VALID: header => contains expected message', () => {
    expect(violationMessageStatics.header).toContain('New code quality violations');
  });

  it('VALID: footerBasic => contains expected message', () => {
    expect(violationMessageStatics.footerBasic).toContain('maintain code quality');
    expect(violationMessageStatics.footerBasic).toContain('Please fix');
  });

  it('VALID: footerFull => contains expected message', () => {
    expect(violationMessageStatics.footerFull).toContain('maintain code quality');
    expect(violationMessageStatics.footerFull).toContain('blocked');
    expect(violationMessageStatics.footerFull).toContain('submit the correct change');
  });

  it('VALID: all properties => are strings', () => {
    expect(typeof violationMessageStatics.header).toStrictEqual('string');
    expect(typeof violationMessageStatics.footerBasic).toStrictEqual('string');
    expect(typeof violationMessageStatics.footerFull).toStrictEqual('string');
  });
});
