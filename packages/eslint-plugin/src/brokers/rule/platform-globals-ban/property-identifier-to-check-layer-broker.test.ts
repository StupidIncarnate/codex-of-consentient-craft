import { propertyIdentifierToCheckLayerBroker } from './property-identifier-to-check-layer-broker';
import { propertyIdentifierToCheckLayerBrokerProxy } from './property-identifier-to-check-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

// Every branch here keys on object IDENTITY (`parent.property === node`, `parent.object === node`),
// which `tsestreeContract.parse` cannot preserve through a stub — a real ESLint-parsed AST always
// shares one object between a MemberExpression's `property` and the node the visitor receives.
// That is covered by rule-platform-globals-ban-broker's own RuleTester integration test instead,
// against real parsed code (`process.stdout.write`, `globalThis.fetch`, computed access). The one
// branch this function has that needs NO identity is "no parent at all" — a bare reference outside
// any member access — tested here.
describe('propertyIdentifierToCheckLayerBroker', () => {
  it('VALID: {no parent} => returns the same node', () => {
    propertyIdentifierToCheckLayerBrokerProxy();
    const node = TsestreeStub({ type: TsestreeNodeType.Identifier, parent: null });

    const result = propertyIdentifierToCheckLayerBroker({ node });

    expect(result).toBe(node);
  });
});
