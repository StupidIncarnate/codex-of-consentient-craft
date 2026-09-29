import { TemplateLiteralStub } from '#gateway/npm/typescript-eslint__utils/template-literal/template-literal.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { ArrayExpressionStub } from '#gateway/npm/typescript-eslint__utils/array-expression/array-expression.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { resolveSpawnedProgramLayerBroker } from './resolve-spawned-program-layer-broker';
import { resolveSpawnedProgramLayerBrokerProxy } from './resolve-spawned-program-layer-broker.proxy';

describe('resolveSpawnedProgramLayerBroker', () => {
  describe('plain literal command', () => {
    it('VALID: {commandNode: Literal "git"} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = LiteralStub({ code: 'const l = "git";' });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('git');
    });

    it('EDGE: {commandNode: Literal "gitk"} => returns "gitk", never truncated to "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = LiteralStub({ code: 'const l = "gitk";' });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('gitk');
    });
  });

  describe('template literal command', () => {
    it('VALID: {commandNode: a template literal, static leading segment "git "} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TemplateLiteralStub({ code: `const t = \`git \${subcommand}\`;` });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('git');
    });
  });

  describe('sh -c as one combined string', () => {
    it('VALID: {commandNode: Literal "sh -c \'git status\'"} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = LiteralStub({ code: 'const l = "sh -c \'git status\'";' });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('git');
    });
  });

  describe('sh -c split across command and args', () => {
    it('VALID: {command: "sh", args: ["-c", "git status"]} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = LiteralStub({ code: 'const l = "sh";' });
      const argsNode = ArrayExpressionStub({ code: 'const a = ["-c", "git status"];' });

      expect(resolveSpawnedProgramLayerBroker({ commandNode, argsNode, moduleBody: [] })).toBe(
        'git',
      );
    });

    it('EDGE: {command: "sh", args: ["--login"]} => returns "sh" when no "-c" script is present', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = LiteralStub({ code: 'const l = "sh";' });
      const argsNode = ArrayExpressionStub({ code: 'const a = ["--login"];' });

      expect(resolveSpawnedProgramLayerBroker({ commandNode, argsNode, moduleBody: [] })).toBe(
        'sh',
      );
    });
  });

  describe('unresolvable command', () => {
    it('EMPTY: {commandNode: undefined} => returns undefined', () => {
      resolveSpawnedProgramLayerBrokerProxy();

      expect(
        resolveSpawnedProgramLayerBroker({
          commandNode: undefined,
          argsNode: undefined,
          moduleBody: [],
        }),
      ).toBe(undefined);
    });

    it('INVALID: {commandNode: a runtime-computed CallExpression} => returns undefined, failing open', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = CallExpressionStub({ code: 'f();' });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe(undefined);
    });
  });
});
