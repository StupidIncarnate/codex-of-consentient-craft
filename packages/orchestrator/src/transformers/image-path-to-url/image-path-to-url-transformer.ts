/**
 * PURPOSE: Rewrites pasted-image tokens on a session line coming BACK off disk into browser-loadable
 * URLs. Reach for this over `imagePromptTrailerTransformer` when the text is being READ for
 * rendering in the browser — that one instead prepares text going OUT to a Claude spawn and has no
 * notion of an `<img>` src.
 *
 * USAGE:
 * imagePathToUrlTransformer({ content: 'See ![Pasted Image 1](/tmp/a.png)', serverBaseUrl: 'http://dungeonmaster.localhost:3737' });
 * // Returns branded ChatEntryContent with the token rewritten to a `/api/images?path=...` URL
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { chatEntryContentContract } from '../../contracts/chat-entry-content/chat-entry-content-contract';
import type { ChatEntryContent } from '../../contracts/chat-entry-content/chat-entry-content-contract';

export const imagePathToUrlTransformer = ({
  content,
  serverBaseUrl,
}: {
  content: string;
  serverBaseUrl: string;
}): ChatEntryContent =>
  chatEntryContentContract.parse(
    content.replace(
      new RegExp(pastedImageStatics.imageTokenPattern, 'gu'),
      (_match: string, ordinal: string, target: string) =>
        `![Pasted Image ${ordinal}](${serverBaseUrl}${pastedImageStatics.serveRoutePath}?path=${encodeURIComponent(target)})`,
    ),
  );
