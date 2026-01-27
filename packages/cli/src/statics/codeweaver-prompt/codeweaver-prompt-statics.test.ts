/**
 * PURPOSE: Tests for codeweaver prompt statics
 */

import { codeweaverPromptStatics } from './codeweaver-prompt-statics';

describe('codeweaverPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: {prompt.template} => has template property as string', () => {
      expect(typeof codeweaverPromptStatics.prompt.template).toBe('string');
    });

    it('VALID: {prompt.template} => is non-empty string', () => {
      expect(codeweaverPromptStatics.prompt.template.length).toBeGreaterThan(0);
    });

    it('VALID: {prompt.template} => includes $ARGUMENTS placeholder', () => {
      expect(codeweaverPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: {prompt.placeholders} => has arguments placeholder defined', () => {
      expect(codeweaverPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    describe('implementation agent role', () => {
      it('VALID: {prompt.template} => identifies Codeweaver as implementation agent', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Implementation Agent/u);
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Codeweaver/u);
      });

      it('VALID: {prompt.template} => mentions implementing quest steps', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/quest steps/u);
        expect(codeweaverPromptStatics.prompt.template).toMatch(/production code/u);
      });
    });

    describe('MCP tools usage', () => {
      it('VALID: {prompt.template} => mentions get-architecture MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/get-architecture/u);
      });

      it('VALID: {prompt.template} => mentions get-folder-detail MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/get-folder-detail/u);
      });

      it('VALID: {prompt.template} => mentions get-syntax-rules MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/get-syntax-rules/u);
      });

      it('VALID: {prompt.template} => mentions get-testing-patterns MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/get-testing-patterns/u);
      });

      it('VALID: {prompt.template} => mentions discover MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/discover/u);
      });

      it('VALID: {prompt.template} => mentions signal-back MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/signal-back/u);
      });

      it('VALID: {prompt.template} => mentions modify-quest MCP tool', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/modify-quest/u);
      });
    });

    describe('implementation gates', () => {
      it('VALID: {prompt.template} => mentions Gate 1 for Discovery', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 1.*Discovery/u);
      });

      it('VALID: {prompt.template} => mentions Gate 2 for Test Cases', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 2.*Test Cases/u);
      });

      it('VALID: {prompt.template} => mentions Gate 3 for Production Code', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 3.*Production Code/u);
      });

      it('VALID: {prompt.template} => mentions Gate 4 for Test Code', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 4.*Test Code/u);
      });

      it('VALID: {prompt.template} => mentions Gate 5 for Verification', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 5.*Verification/u);
      });

      it('VALID: {prompt.template} => mentions Gate 6 for Gap Discovery', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 6.*Gap Discovery/u);
      });

      it('VALID: {prompt.template} => mentions Gate 7 for Quality Check', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/Gate 7.*Quality Check/u);
      });
    });

    describe('testing requirements', () => {
      it('VALID: {prompt.template} => mentions 100% branch coverage', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/100%.*branch coverage/iu);
      });

      it('VALID: {prompt.template} => mentions verification command', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/npm run ward/u);
      });
    });

    describe('signal completion', () => {
      it('VALID: {prompt.template} => explains signaling complete', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/signal.*complete/iu);
      });

      it('VALID: {prompt.template} => explains signaling needs-user-input', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/needs-user-input/u);
      });

      it('VALID: {prompt.template} => explains signaling needs-role-followup', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/needs-role-followup/u);
      });
    });

    describe('scope boundaries', () => {
      it('VALID: {prompt.template} => mentions filesToCreate', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/filesToCreate/u);
      });

      it('VALID: {prompt.template} => mentions filesToModify', () => {
        expect(codeweaverPromptStatics.prompt.template).toMatch(/filesToModify/u);
      });
    });
  });
});
