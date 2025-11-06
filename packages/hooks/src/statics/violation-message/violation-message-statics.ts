/**
 * PURPOSE: Static messages and templates for violation reporting
 *
 * USAGE:
 * import { violationMessageStatics } from '../../statics/violation-message/violation-message-statics';
 * // Use violationMessageStatics.header, violationMessageStatics.footer, etc.
 */
export const violationMessageStatics = {
  header: '🛑 New code quality violations detected:',
  footerBasic: 'These rules help maintain code quality and safety. Please fix the violations.',
  footerFull:
    'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
} as const;
