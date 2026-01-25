/**
 * PURPOSE: Tests for pathseeker prompt statics
 */

import { pathseekerPromptStatics } from './pathseeker-prompt-statics';

describe('pathseekerPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: {prompt.template} => has template property as string', () => {
      expect(typeof pathseekerPromptStatics.prompt.template).toBe('string');
    });

    it('VALID: {prompt.template} => includes $ARGUMENTS placeholder', () => {
      expect(pathseekerPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: {prompt.placeholders} => has arguments placeholder defined', () => {
      expect(pathseekerPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    describe('file mapping focus', () => {
      it('VALID: {prompt.template} => identifies PathSeeker as file mapping agent', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/File Mapping Agent/u);
      });

      it('VALID: {prompt.template} => mentions reading quest from ChaosWhisperer', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/ChaosWhisperer/u);
        expect(pathseekerPromptStatics.prompt.template).toMatch(/contexts/u);
        expect(pathseekerPromptStatics.prompt.template).toMatch(/observables/u);
      });

      it('VALID: {prompt.template} => mentions MCP discover tools for repo analysis', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/discover/u);
        expect(pathseekerPromptStatics.prompt.template).toMatch(/MCP/u);
      });

      it('VALID: {prompt.template} => explains dependency step structure', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/observablesSatisfied/u);
        expect(pathseekerPromptStatics.prompt.template).toMatch(/dependsOn/u);
        expect(pathseekerPromptStatics.prompt.template).toMatch(/filesToCreate/u);
        expect(pathseekerPromptStatics.prompt.template).toMatch(/filesToModify/u);
      });

      it('VALID: {prompt.template} => mentions modify-quest MCP tool', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/modify-quest/u);
      });
    });

    describe('responsibilities not included', () => {
      it('VALID: {prompt.template} => does NOT include user dialogue instructions', () => {
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Socratic/u);
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/User Dialogue/iu);
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Interactive Q&A Process/u);
      });

      it('VALID: {prompt.template} => does NOT include context definition', () => {
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Context Definition/u);
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(
          /Define reusable environments/u,
        );
      });

      it('VALID: {prompt.template} => does NOT include observable creation', () => {
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Observable.*Creation/iu);
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/GIVEN.*WHEN.*THEN/u);
      });

      it('VALID: {prompt.template} => does NOT include task creation', () => {
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Task Definition/u);
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Task Types:/u);
      });

      it('VALID: {prompt.template} => does NOT include tooling requirements identification', () => {
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/Tooling Assessment/u);
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/toolingRequirements/u);
      });

      it('VALID: {prompt.template} => does NOT mention add-quest tool', () => {
        expect(pathseekerPromptStatics.prompt.template).not.toMatch(/add-quest/u);
      });
    });

    describe('step examples', () => {
      it('VALID: {prompt.template} => includes example of step with observablesSatisfied array', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/observablesSatisfied.*\[/u);
      });

      it('VALID: {prompt.template} => includes example of step with status field', () => {
        expect(pathseekerPromptStatics.prompt.template).toMatch(/status.*pending/u);
      });
    });
  });
});
