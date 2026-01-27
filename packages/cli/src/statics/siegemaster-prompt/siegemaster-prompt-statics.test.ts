/**
 * PURPOSE: Tests for siegemaster prompt statics
 */

import { siegemasterPromptStatics } from './siegemaster-prompt-statics';

describe('siegemasterPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: {prompt.template} => has template property as string', () => {
      expect(typeof siegemasterPromptStatics.prompt.template).toBe('string');
    });

    it('VALID: {prompt.template} => is non-empty string', () => {
      expect(siegemasterPromptStatics.prompt.template.length).toBeGreaterThan(0);
    });

    it('VALID: {prompt.template} => includes $ARGUMENTS placeholder', () => {
      expect(siegemasterPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: {prompt.placeholders} => has arguments placeholder defined', () => {
      expect(siegemasterPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    describe('integration test agent role', () => {
      it('VALID: {prompt.template} => identifies Siegemaster as integration test agent', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Integration Test Agent/u);
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Siegemaster/u);
      });

      it('VALID: {prompt.template} => mentions observable behaviors', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/observable behaviors/iu);
      });

      it('VALID: {prompt.template} => mentions end-to-end testing', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/end-to-end/iu);
      });
    });

    describe('MCP tools usage', () => {
      it('VALID: {prompt.template} => mentions get-architecture MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/get-architecture/u);
      });

      it('VALID: {prompt.template} => mentions get-folder-detail MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/get-folder-detail/u);
      });

      it('VALID: {prompt.template} => mentions get-syntax-rules MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/get-syntax-rules/u);
      });

      it('VALID: {prompt.template} => mentions get-testing-patterns MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/get-testing-patterns/u);
      });

      it('VALID: {prompt.template} => mentions discover MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/discover/u);
      });

      it('VALID: {prompt.template} => mentions signal-back MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/signal-back/u);
      });

      it('VALID: {prompt.template} => mentions modify-quest MCP tool', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/modify-quest/u);
      });
    });

    describe('integration test focus', () => {
      it('VALID: {prompt.template} => mentions User Actions', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/User Actions/u);
      });

      it('VALID: {prompt.template} => mentions Data Flow', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Data Flow/u);
      });

      it('VALID: {prompt.template} => mentions System Integration', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/System Integration/u);
      });

      it('VALID: {prompt.template} => mentions Observable Outcomes', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Observable Outcomes/u);
      });

      it('VALID: {prompt.template} => mentions Error Recovery', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Error Recovery/u);
      });
    });

    describe('integration test what NOT to do', () => {
      it('VALID: {prompt.template} => mentions NOT testing isolated units', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/NOT.*isolated units/isu);
      });

      it('VALID: {prompt.template} => mentions NOT mocking internal code', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/NOT.*mock.*internal/isu);
      });
    });

    describe('test patterns', () => {
      it('VALID: {prompt.template} => includes Testing User Flows section', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Testing User Flows/u);
      });

      it('VALID: {prompt.template} => includes Testing Error Scenarios section', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Testing Error Scenarios/u);
      });

      it('VALID: {prompt.template} => includes Testing Data Flow section', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/Testing Data Flow/u);
      });
    });

    describe('signal completion', () => {
      it('VALID: {prompt.template} => explains signaling complete', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/signal.*complete/iu);
      });

      it('VALID: {prompt.template} => explains routing to codeweaver for incomplete implementation', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/targetRole.*codeweaver/u);
      });

      it('VALID: {prompt.template} => explains routing to chaoswhisperer for missing requirements', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/targetRole.*chaoswhisperer/u);
      });

      it('VALID: {prompt.template} => explains routing to spiritmender for bugs', () => {
        expect(siegemasterPromptStatics.prompt.template).toMatch(/targetRole.*spiritmender/u);
      });
    });
  });
});
