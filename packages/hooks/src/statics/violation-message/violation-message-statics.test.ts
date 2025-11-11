import { violationMessageStatics } from './violation-message-statics';

describe('violationMessageStatics', () => {
  it('VALID: header => returns exact header message', () => {
    expect(violationMessageStatics.header).toBe('🛑 New code quality violations detected:');
  });

  it('VALID: footerBasic => returns exact footer message', () => {
    expect(violationMessageStatics.footerBasic).toBe(
      'These rules help maintain code quality and safety. Please fix the violations.',
    );
  });

  it('VALID: footerFull => returns exact full footer message', () => {
    expect(violationMessageStatics.footerFull).toBe(
      'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
    );
  });

  it('VALID: all properties => are strings', () => {
    expect(typeof violationMessageStatics.header).toBe('string');
    expect(typeof violationMessageStatics.footerBasic).toBe('string');
    expect(typeof violationMessageStatics.footerFull).toBe('string');
  });
});
