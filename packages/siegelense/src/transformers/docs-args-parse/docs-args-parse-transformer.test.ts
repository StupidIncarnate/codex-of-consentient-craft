import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';

import { docsArgsParseTransformer } from './docs-args-parse-transformer';

describe('docsArgsParseTransformer', () => {
  describe('the accepted forms', () => {
    it.each(siegelenseCallStatics.docs.scopes)(
      'VALID: {args: ["--for", "%s"]} => returns that one scope',
      (scope) => {
        const result = docsArgsParseTransformer({ args: ['--for', scope] });

        expect(result).toStrictEqual({ scope, isJson: false });
      },
    );

    it('VALID: {args: ["--for", "walking", "--json"]} => one scope with isJson flag', () => {
      const result = docsArgsParseTransformer({ args: ['--for', 'walking', '--json'] });

      expect(result).toStrictEqual({ scope: 'walking', isJson: true });
    });
  });

  describe('refusals', () => {
    it('INVALID: {args: []} => refuses missing --for flag, listing valid scopes', () => {
      expect(() => docsArgsParseTransformer({ args: [] })).toThrow(
        '--for <scope> is required: specify the role whose instructions to read.\n\n' +
          'Accepted scopes: operating, planning, walking, attacking, fixing, driving, operational\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["--human"]} => refuses --human as an unknown flag', () => {
      expect(() => docsArgsParseTransformer({ args: ['--human'] })).toThrow(
        'Unknown flag: --human\n\n' +
          'Accepted flags: --for, --json\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["--json"]} => refuses missing --for flag when only flags present', () => {
      expect(() => docsArgsParseTransformer({ args: ['--json'] })).toThrow(
        '--for <scope> is required: specify the role whose instructions to read.\n\n' +
          'Accepted scopes: operating, planning, walking, attacking, fixing, driving, operational\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["--for", "reader"]} => refuses by name and lists the seven scopes that exist', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', 'reader'] })).toThrow(
        'Unknown docs scope: reader\n\n' +
          'docs serves one scope per tool-using role. The scopes that exist are: operating, planning, walking, attacking, fixing, driving, operational.\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["--for", "start"]} => a call name is refused as a scope, listing the scopes', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', 'start'] })).toThrow(
        'Unknown docs scope: start\n\n' +
          'docs serves one scope per tool-using role. The scopes that exist are: operating, planning, walking, attacking, fixing, driving, operational.\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["--for"]} => a --for with no value refuses naming --for', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for'] })).toThrow(
        '--for is required: it cannot be missing, and the value cannot itself start with "--".',
      );
    });

    it('INVALID: {args: ["--for", "--json"]} => the next token being a flag is not this flag\'s value', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', '--json'] })).toThrow(
        '--for is required: it cannot be missing, and the value cannot itself start with "--".',
      );
    });

    it('INVALID: {args: ["--for", "walking", "--for", "fixing"]} => a repeated flag refuses rather than picking one', () => {
      expect(() =>
        docsArgsParseTransformer({ args: ['--for', 'walking', '--for', 'fixing'] }),
      ).toThrow(
        '--for was given twice: a repeated flag is ambiguous, and this refuses rather than silently choosing the first or the last value.',
      );
    });

    it('INVALID: {args: ["--instance", "inst_7f3a9c21"]} => refuses a flag docs does not take, naming the accepted set', () => {
      expect(() => docsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21'] })).toThrow(
        'Unknown flag: --instance\n\n' +
          'Accepted flags: --for, --json\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["walking"]} => a bare scope name refuses, naming the flag it belongs to', () => {
      expect(() => docsArgsParseTransformer({ args: ['walking'] })).toThrow(
        'Unexpected positional argument: walking\n\n' +
          'docs names its scope with --for, so a bare word here belongs to no flag.\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('INVALID: {args: ["--for", "walking", "extra"]} => a positional after a consumed value still refuses', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', 'walking', 'extra'] })).toThrow(
        'Unexpected positional argument: extra\n\n' +
          'docs names its scope with --for, so a bare word here belongs to no flag.\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });
  });
});
