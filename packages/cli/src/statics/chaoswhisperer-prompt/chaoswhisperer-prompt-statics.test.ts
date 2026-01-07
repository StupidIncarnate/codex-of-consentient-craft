/**
 * PURPOSE: Tests for chaoswhisperer prompt statics
 */

import { chaoswhispererPromptStatics } from './chaoswhisperer-prompt-statics';

describe('chaoswhispererPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: {prompt.template} => has template property as string', () => {
      expect(typeof chaoswhispererPromptStatics.prompt.template).toBe('string');
    });

    it('VALID: {prompt.template} => is non-empty string', () => {
      expect(chaoswhispererPromptStatics.prompt.template.length).toBeGreaterThan(0);
    });

    it('VALID: {prompt.template} => includes $ARGUMENTS placeholder', () => {
      expect(chaoswhispererPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: {prompt.placeholders} => has arguments placeholder defined', () => {
      expect(chaoswhispererPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });

    describe('BDD architect role', () => {
      it('VALID: {prompt.template} => identifies ChaosWhisperer as BDD architect', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/BDD/u);
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/ChaosWhisperer/u);
      });

      it('VALID: {prompt.template} => mentions Socratic dialogue', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/Socratic/u);
      });
    });

    describe('MCP tools usage', () => {
      it('VALID: {prompt.template} => mentions add-quest MCP tool', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/add-quest/u);
      });

      it('VALID: {prompt.template} => mentions modify-quest MCP tool', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/modify-quest/u);
      });

      it('VALID: {prompt.template} => mentions get-quest MCP tool', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/get-quest/u);
      });
    });

    describe('context creation', () => {
      it('VALID: {prompt.template} => explains context creation (WHERE)', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/context/iu);
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/WHERE/u);
      });
    });

    describe('observable creation with BDD structure', () => {
      it('VALID: {prompt.template} => mentions GIVEN (context)', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/GIVEN/u);
      });

      it('VALID: {prompt.template} => mentions WHEN (trigger)', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/WHEN/u);
      });

      it('VALID: {prompt.template} => mentions THEN (outcomes)', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/THEN/u);
      });

      it('VALID: {prompt.template} => explains observable structure', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/observable/iu);
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/trigger/iu);
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/outcome/iu);
      });
    });

    describe('task creation', () => {
      it('VALID: {prompt.template} => explains task creation with observable links', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/task/iu);
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/observableIds/u);
      });

      it('VALID: {prompt.template} => mentions task types', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/discovery/u);
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/implementation/u);
      });
    });

    describe('tooling requirements', () => {
      it('VALID: {prompt.template} => explains tooling requirement identification', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/tooling/iu);
      });
    });

    describe('responsibilities not included', () => {
      it('VALID: {prompt.template} => does NOT include file mapping instructions', () => {
        expect(chaoswhispererPromptStatics.prompt.template).not.toMatch(/File Mapping Agent/u);
      });

      it('VALID: {prompt.template} => does NOT include step creation', () => {
        expect(chaoswhispererPromptStatics.prompt.template).not.toMatch(/filesToCreate/u);
        expect(chaoswhispererPromptStatics.prompt.template).not.toMatch(/filesToModify/u);
        expect(chaoswhispererPromptStatics.prompt.template).not.toMatch(/dependsOn/u);
      });

      it('VALID: {prompt.template} => mentions PathSeeker handles file mapping', () => {
        expect(chaoswhispererPromptStatics.prompt.template).toMatch(/PathSeeker/u);
      });
    });
  });
});
