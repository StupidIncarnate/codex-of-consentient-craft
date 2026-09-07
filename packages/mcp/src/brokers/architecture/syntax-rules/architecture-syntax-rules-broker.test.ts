import { architectureSyntaxRulesBroker } from './architecture-syntax-rules-broker';
import { architectureSyntaxRulesBrokerProxy } from './architecture-syntax-rules-broker.proxy';

describe('architectureSyntaxRulesBroker', () => {
  it('VALID: {} => returns the fixed redirect naming get-architecture and get-testing-patterns', () => {
    architectureSyntaxRulesBrokerProxy();
    const result = architectureSyntaxRulesBroker();

    expect(result).toBe(
      '# Universal Syntax Rules\n' +
        '\n' +
        'These live in `get-architecture`, under **Writing a File**: filenames, exports, parameter and\n' +
        'return shape, the file header, types, control flow, error handling and CLI output.\n' +
        '\n' +
        'Call `get-architecture` instead. `get-testing-patterns` still owns assertions, the proxy pattern\n' +
        'and mocking.\n',
    );
  });
});
