import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';

import { docsArgsParseTransformer } from './docs-args-parse-transformer';

describe('docsArgsParseTransformer', () => {
  describe('the accepted forms', () => {
    it('EMPTY: {args: []} => returns the whole surface as JSON', () => {
      const result = docsArgsParseTransformer({ args: [] });

      expect(result).toStrictEqual({ scope: null, human: false });
    });

    it.each(siegelenseCallStatics.docs.scopes)(
      'VALID: {args: ["--for", "%s"]} => returns that one scope',
      (scope) => {
        const result = docsArgsParseTransformer({ args: ['--for', scope] });

        expect(result).toStrictEqual({ scope, human: false });
      },
    );

    it('VALID: {args: ["--human"]} => the whole surface, rendered as text', () => {
      const result = docsArgsParseTransformer({ args: ['--human'] });

      expect(result).toStrictEqual({ scope: null, human: true });
    });

    it('VALID: {args: ["--for", "walking", "--human"]} => one scope, rendered as text', () => {
      const result = docsArgsParseTransformer({ args: ['--for', 'walking', '--human'] });

      expect(result).toStrictEqual({ scope: 'walking', human: true });
    });

    it('VALID: {args: ["--json"]} => the explicit default parses to the same thing as the bare call', () => {
      const result = docsArgsParseTransformer({ args: ['--json'] });

      expect(result).toStrictEqual({ scope: null, human: false });
    });
  });

  describe('refusals', () => {
    it('INVALID: {args: ["--for", "reader"]} => refuses by name and lists the seven scopes that exist', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', 'reader'] })).toThrow(
        'Unknown docs scope: reader\n\n' +
          'docs serves one scope per tool-using role. The scopes that exist are: operating, planning, walking, attacking, fixing, driving, operational.\n\n' +
          'Omit --for to get all of them.\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json] [--human]',
      );
    });

    it('INVALID: {args: ["--for", "start"]} => a call name is refused as a scope, listing the scopes', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', 'start'] })).toThrow(
        'Unknown docs scope: start\n\n' +
          'docs serves one scope per tool-using role. The scopes that exist are: operating, planning, walking, attacking, fixing, driving, operational.\n\n' +
          'Omit --for to get all of them.\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json] [--human]',
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
          'Accepted flags: --for, --json, --human\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json] [--human]',
      );
    });

    it('INVALID: {args: ["walking"]} => a bare scope name refuses, naming the flag it belongs to', () => {
      expect(() => docsArgsParseTransformer({ args: ['walking'] })).toThrow(
        'Unexpected positional argument: walking\n\n' +
          'docs names its scope with --for, so a bare word here belongs to no flag.\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json] [--human]',
      );
    });

    it('INVALID: {args: ["--for", "walking", "extra"]} => a positional after a consumed value still refuses', () => {
      expect(() => docsArgsParseTransformer({ args: ['--for', 'walking', 'extra'] })).toThrow(
        'Unexpected positional argument: extra\n\n' +
          'docs names its scope with --for, so a bare word here belongs to no flag.\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json] [--human]',
      );
    });
  });
});
