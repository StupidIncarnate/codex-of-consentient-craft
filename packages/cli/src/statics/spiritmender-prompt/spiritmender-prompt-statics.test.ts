/**
 * PURPOSE: Tests for spiritmender prompt statics
 */

import { spiritmenderPromptStatics } from './spiritmender-prompt-statics';

describe('spiritmenderPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: {prompt.template} => has template property as string', () => {
      expect(typeof spiritmenderPromptStatics.prompt.template).toBe('string');
    });

    it('VALID: {prompt.template} => is non-empty string', () => {
      expect(spiritmenderPromptStatics.prompt.template.length).toBeGreaterThan(0);
    });

    it('VALID: {prompt.template} => includes $ARGUMENTS placeholder', () => {
      expect(spiritmenderPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: {prompt.placeholders} => has arguments placeholder defined', () => {
      expect(spiritmenderPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    describe('error resolution agent role', () => {
      it('VALID: {prompt.template} => identifies Spiritmender as error resolution agent', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Error Resolution Agent/u);
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Spiritmender/u);
      });

      it('VALID: {prompt.template} => mentions healing failures', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/healing.*failures/iu);
      });
    });

    describe('MCP tools usage', () => {
      it('VALID: {prompt.template} => mentions get-architecture MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/get-architecture/u);
      });

      it('VALID: {prompt.template} => mentions get-folder-detail MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/get-folder-detail/u);
      });

      it('VALID: {prompt.template} => mentions get-syntax-rules MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/get-syntax-rules/u);
      });

      it('VALID: {prompt.template} => mentions get-testing-patterns MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/get-testing-patterns/u);
      });

      it('VALID: {prompt.template} => mentions discover MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/discover/u);
      });

      it('VALID: {prompt.template} => mentions signal-back MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/signal-back/u);
      });

      it('VALID: {prompt.template} => mentions modify-quest MCP tool', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/modify-quest/u);
      });
    });

    describe('error types handled', () => {
      it('VALID: {prompt.template} => mentions build errors', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/build errors/iu);
      });

      it('VALID: {prompt.template} => mentions type errors', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/type errors/iu);
      });

      it('VALID: {prompt.template} => mentions lint violations', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/lint.*violations/iu);
      });

      it('VALID: {prompt.template} => mentions test failures', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/test failures/iu);
      });

      it('VALID: {prompt.template} => mentions integration issues', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/integration issues/iu);
      });

      it('VALID: {prompt.template} => mentions architectural conflicts', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/architectural conflicts/iu);
      });
    });

    describe('error resolution process', () => {
      it('VALID: {prompt.template} => mentions Error Analysis step', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Error Analysis/u);
      });

      it('VALID: {prompt.template} => mentions Categorize Errors step', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Categorize Errors/u);
      });

      it('VALID: {prompt.template} => mentions Systematic Fixing step', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Systematic Fixing/u);
      });

      it('VALID: {prompt.template} => mentions Verification step', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Verification/u);
      });
    });

    describe('error prioritization', () => {
      it('VALID: {prompt.template} => mentions Compilation errors priority', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Compilation errors/u);
      });

      it('VALID: {prompt.template} => mentions Type errors priority', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Type errors/u);
      });

      it('VALID: {prompt.template} => mentions Import errors priority', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Import errors/u);
      });

      it('VALID: {prompt.template} => mentions Test failures priority', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Test failures/u);
      });

      it('VALID: {prompt.template} => mentions Lint errors priority', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/Lint errors/u);
      });
    });

    describe('important guidelines', () => {
      it('VALID: {prompt.template} => mentions no shortcuts or any types', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/any.*types/iu);
      });

      it('VALID: {prompt.template} => mentions root cause focus', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/root cause/iu);
      });

      it('VALID: {prompt.template} => mentions maintain compatibility', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/compatibility/iu);
      });
    });

    describe('verification command', () => {
      it('VALID: {prompt.template} => mentions npm run ward', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/npm run ward/u);
      });
    });

    describe('signal completion', () => {
      it('VALID: {prompt.template} => explains signaling complete', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/signal.*complete/iu);
      });

      it('VALID: {prompt.template} => explains routing to pathseeker for architectural issues', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/targetRole.*pathseeker/u);
      });

      it('VALID: {prompt.template} => explains signaling needs-user-input', () => {
        expect(spiritmenderPromptStatics.prompt.template).toMatch(/needs-user-input/u);
      });
    });
  });
});
