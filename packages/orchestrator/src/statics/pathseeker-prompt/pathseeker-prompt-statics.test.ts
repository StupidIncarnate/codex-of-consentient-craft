import { pathseekerPromptStatics } from './pathseeker-prompt-statics';

describe('pathseekerPromptStatics', () => {
  describe('prompt', () => {
    it('VALID: template => contains pathseeker agent identity', () => {
      expect(pathseekerPromptStatics.prompt.template).toMatch(/^---\nname: quest-path-seeker/u);
    });

    it('VALID: template => contains PathSeeker role', () => {
      expect(pathseekerPromptStatics.prompt.template).toMatch(/PathSeeker/u);
    });

    it('VALID: template => contains step creation process', () => {
      expect(pathseekerPromptStatics.prompt.template).toMatch(/modify-quest/u);
      expect(pathseekerPromptStatics.prompt.template).toMatch(/observablesSatisfied/u);
    });

    it('VALID: template => contains dependency rules', () => {
      expect(pathseekerPromptStatics.prompt.template).toMatch(/Step Dependency Rules/u);
    });

    it('VALID: template => contains $ARGUMENTS placeholder', () => {
      expect(pathseekerPromptStatics.prompt.template).toMatch(/\$ARGUMENTS/u);
    });

    it('VALID: placeholders.arguments => returns $ARGUMENTS', () => {
      expect(pathseekerPromptStatics.prompt.placeholders.arguments).toBe('$ARGUMENTS');
    });
  });
});
