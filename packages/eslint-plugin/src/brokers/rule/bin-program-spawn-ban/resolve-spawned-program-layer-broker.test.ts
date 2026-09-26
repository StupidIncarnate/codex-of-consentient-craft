import { resolveSpawnedProgramLayerBroker } from './resolve-spawned-program-layer-broker';
import { resolveSpawnedProgramLayerBrokerProxy } from './resolve-spawned-program-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('resolveSpawnedProgramLayerBroker', () => {
  describe('plain literal command', () => {
    it('VALID: {commandNode: Literal "git"} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('git');
    });

    it('EDGE: {commandNode: Literal "gitk"} => returns "gitk", never truncated to "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'gitk' });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('gitk');
    });
  });

  describe('template literal command', () => {
    it('VALID: {commandNode: a template literal, static leading segment "git "} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TsestreeStub({
        type: TsestreeNodeType.TemplateLiteral,
        quasis: [
          TsestreeStub({
            type: TsestreeNodeType.TemplateElement,
            value: { raw: 'git ', cooked: 'git ' },
          }),
        ],
        expressions: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'subcommand' })],
      });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('git');
    });
  });

  describe('sh -c as one combined string', () => {
    it('VALID: {commandNode: Literal "sh -c \'git status\'"} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TsestreeStub({
        type: TsestreeNodeType.Literal,
        value: "sh -c 'git status'",
      });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe('git');
    });
  });

  describe('sh -c split across command and args', () => {
    it('VALID: {command: "sh", args: ["-c", "git status"]} => returns "git"', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'sh' });
      const argsNode = TsestreeStub({
        type: TsestreeNodeType.ArrayExpression,
        elements: [
          TsestreeStub({ type: TsestreeNodeType.Literal, value: '-c' }),
          TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git status' }),
        ],
      });

      expect(resolveSpawnedProgramLayerBroker({ commandNode, argsNode, moduleBody: [] })).toBe(
        'git',
      );
    });

    it('EDGE: {command: "sh", args: ["--login"]} => returns "sh" when no "-c" script is present', () => {
      resolveSpawnedProgramLayerBrokerProxy();
      const commandNode = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'sh' });
      const argsNode = TsestreeStub({
        type: TsestreeNodeType.ArrayExpression,
        elements: [TsestreeStub({ type: TsestreeNodeType.Literal, value: '--login' })],
      });

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
      const commandNode = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      expect(
        resolveSpawnedProgramLayerBroker({ commandNode, argsNode: undefined, moduleBody: [] }),
      ).toBe(undefined);
    });
  });
});
