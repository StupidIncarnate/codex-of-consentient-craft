import { flowReturnsToolRegistrationGuard } from './flow-returns-tool-registration-guard';

describe('flowReturnsToolRegistrationGuard', () => {
  describe('true cases', () => {
    it('VALID: content imports ToolRegistration with type keyword => returns true', () => {
      const result = flowReturnsToolRegistrationGuard({
        flowFileContent: "import type { ToolRegistration } from '../contracts/tool-registration';",
      });

      expect(result).toBe(true);
    });

    it('VALID: content imports ToolRegistration without type keyword => returns true', () => {
      const result = flowReturnsToolRegistrationGuard({
        flowFileContent: "import { ToolRegistration, OtherThing } from '../contracts';",
      });

      expect(result).toBe(true);
    });
  });

  describe('false cases', () => {
    it('INVALID: content does not import ToolRegistration => returns false', () => {
      const result = flowReturnsToolRegistrationGuard({
        flowFileContent: "import { someOtherType } from '../contracts';",
      });

      expect(result).toBe(false);
    });

    it('INVALID: content mentions ToolRegistration only in a comment => returns false', () => {
      const result = flowReturnsToolRegistrationGuard({
        flowFileContent: '// This returns ToolRegistration[]\nexport const myFlow = () => [];',
      });

      expect(result).toBe(false);
    });

    it('EMPTY: flowFileContent is empty string => returns false', () => {
      const result = flowReturnsToolRegistrationGuard({ flowFileContent: '' });

      expect(result).toBe(false);
    });

    it('EMPTY: flowFileContent is undefined => returns false', () => {
      const result = flowReturnsToolRegistrationGuard({});

      expect(result).toBe(false);
    });
  });
});
