/**
 * PURPOSE: Tests for lawbringer prompt statics
 */

import { lawbringerPromptStatics } from './lawbringer-prompt-statics';

describe('lawbringerPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: {prompt.template} => has template property as string', () => {
      expect(typeof lawbringerPromptStatics.prompt.template).toBe('string');
    });

    it('VALID: {prompt.template} => is non-empty string', () => {
      expect(lawbringerPromptStatics.prompt.template.length).toBeGreaterThan(0);
    });

    it('VALID: {prompt.template} => includes $ARGUMENTS placeholder', () => {
      expect(lawbringerPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: {prompt.placeholders} => has arguments placeholder defined', () => {
      expect(lawbringerPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    describe('code review agent role', () => {
      it('VALID: {prompt.template} => identifies Lawbringer as code review agent', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Code Review Agent/u);
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Lawbringer/u);
      });

      it('VALID: {prompt.template} => mentions reviewing implementation and test file pairs', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(
          /implementation.*test file pairs/iu,
        );
      });
    });

    describe('MCP tools usage', () => {
      it('VALID: {prompt.template} => mentions get-architecture MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/get-architecture/u);
      });

      it('VALID: {prompt.template} => mentions get-folder-detail MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/get-folder-detail/u);
      });

      it('VALID: {prompt.template} => mentions get-syntax-rules MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/get-syntax-rules/u);
      });

      it('VALID: {prompt.template} => mentions get-testing-patterns MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/get-testing-patterns/u);
      });

      it('VALID: {prompt.template} => mentions discover MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/discover/u);
      });

      it('VALID: {prompt.template} => mentions signal-back MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/signal-back/u);
      });

      it('VALID: {prompt.template} => mentions modify-quest MCP tool', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/modify-quest/u);
      });
    });

    describe('review checklist', () => {
      it('VALID: {prompt.template} => mentions Architecture Compliance', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Architecture Compliance/u);
      });

      it('VALID: {prompt.template} => mentions Code Quality', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Code Quality/u);
      });

      it('VALID: {prompt.template} => mentions Test Quality', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Test Quality/u);
      });

      it('VALID: {prompt.template} => mentions Coverage Verification', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Coverage Verification/u);
      });

      it('VALID: {prompt.template} => mentions Security & Anti-Patterns', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Security.*Anti-Patterns/u);
      });
    });

    describe('code quality checks', () => {
      it('VALID: {prompt.template} => mentions object destructuring for parameters', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/object destructuring/u);
      });

      it('VALID: {prompt.template} => mentions no any types', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/any.*types/iu);
      });

      it('VALID: {prompt.template} => mentions toStrictEqual', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/toStrictEqual/u);
      });

      it('VALID: {prompt.template} => mentions proxy pattern', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/proxy pattern/iu);
      });
    });

    describe('review process', () => {
      it('VALID: {prompt.template} => mentions Read Implementation Files', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Read Implementation Files/u);
      });

      it('VALID: {prompt.template} => mentions Read Test Files', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Read Test Files/u);
      });

      it('VALID: {prompt.template} => mentions Cross-Reference', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Cross-Reference/u);
      });

      it('VALID: {prompt.template} => mentions Run Verification', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Run Verification/u);
      });

      it('VALID: {prompt.template} => mentions Make Decision', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/Make Decision/u);
      });
    });

    describe('signal review result', () => {
      it('VALID: {prompt.template} => explains signaling complete for approval', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/signal.*complete/iu);
      });

      it('VALID: {prompt.template} => explains routing to codeweaver for changes', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/targetRole.*codeweaver/u);
      });

      it('VALID: {prompt.template} => explains routing to spiritmender for lint errors', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/targetRole.*spiritmender/u);
      });
    });

    describe('verification command', () => {
      it('VALID: {prompt.template} => mentions npm run ward', () => {
        expect(lawbringerPromptStatics.prompt.template).toMatch(/npm run ward/u);
      });
    });
  });
});
