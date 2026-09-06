import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { imagePromptTrailerTransformer } from './image-prompt-trailer-transformer';
import { imagePromptTrailerTransformerProxy } from './image-prompt-trailer-transformer.proxy';

describe('imagePromptTrailerTransformer', () => {
  describe('text carrying one image token', () => {
    it('VALID: {promptText: text with one image token} => appends the sentinel + instruction trailer', () => {
      imagePromptTrailerTransformerProxy();
      const promptText = 'Look at ![Pasted Image 1](/tmp/a.png) and tell me what you see';

      const result = imagePromptTrailerTransformer({ promptText });

      expect(result).toBe(
        `Look at ![Pasted Image 1](/tmp/a.png) and tell me what you see\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
      );
    });
  });

  describe('text carrying two image tokens', () => {
    it('VALID: {promptText: text with two image tokens} => appends the sentinel exactly once', () => {
      imagePromptTrailerTransformerProxy();
      const promptText = 'Compare ![Pasted Image 1](/tmp/a.png) with ![Pasted Image 2](/tmp/b.png)';

      const result = imagePromptTrailerTransformer({ promptText });

      expect(result).toBe(
        `Compare ![Pasted Image 1](/tmp/a.png) with ![Pasted Image 2](/tmp/b.png)\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
      );
    });
  });

  describe('text carrying no image token', () => {
    it('VALID: {promptText: plain text with no image token} => returns the text unchanged', () => {
      imagePromptTrailerTransformerProxy();
      const promptText = 'Just a plain follow-up message with no images';

      const result = imagePromptTrailerTransformer({ promptText });

      expect(result).toBe(promptText);
    });
  });

  describe('text already carrying the trailer', () => {
    it('EDGE: {promptText: text already ending with the sentinel + instruction} => returns the text unchanged, no second trailer', () => {
      imagePromptTrailerTransformerProxy();
      const promptText = `Look at ![Pasted Image 1](/tmp/a.png)\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      const result = imagePromptTrailerTransformer({ promptText });

      expect(result).toBe(promptText);
    });
  });
});
