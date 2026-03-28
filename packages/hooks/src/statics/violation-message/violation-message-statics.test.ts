import { violationMessageStatics } from './violation-message-statics';

describe('violationMessageStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(violationMessageStatics).toStrictEqual({
      header: '🛑 New code quality violations detected:',
      footerBasic: 'These rules help maintain code quality and safety. Please fix the violations.',
      footerFull:
        'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
    });
  });
});
