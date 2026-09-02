/**
 * PURPOSE: Records the composer's send-flow state over time (lock/unlock, upload-bar geometry,
 * progress), observes the real HTTP POSTs a send issues, reads Mantine toast text, and reads back
 * the server's real filesystem writes to a quest's images directory. `composer-paste.harness.ts`
 * owns focus/paste/draft-storage reads for the composer's CONTENT; this harness owns everything
 * about what happens once Enter/SEND actually fires a request — the transient lock/progress states
 * a point-in-time read can never see, and the server-side proof that a send's bytes landed on disk.
 *
 * USAGE:
 * const send = composerSendHarness({ page });
 * await send.recordComposerSendStates();                          // BEFORE page.goto
 * send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });  // BEFORE the send
 * // ... drive a real send through the UI ...
 * const states = await send.readComposerSendStates();
 * const posts = send.readPosts();
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import type { Page } from '@playwright/test';

import { locationsStatics } from '@dungeonmaster/shared/statics';

// Restated rather than imported: a harness may not import application statics/contracts as values,
// and these are the exact `data-testid` literals chat-input-widget.tsx and
// upload-progress-bar-widget.tsx stamp on their elements — a drift there must fail this harness's
// reads rather than silently follow it.
const CHAT_INPUT_TEST_ID = 'CHAT_INPUT';
const SEND_BUTTON_TEST_ID = 'SEND_BUTTON';
const CHAT_INPUT_THUMBNAIL_TEST_ID = 'CHAT_INPUT_THUMBNAIL';
const CHAT_INPUT_UPLOAD_PROGRESS_TEST_ID = 'CHAT_INPUT_UPLOAD_PROGRESS';

// Restated rather than imported — same reasoning as composer-paste.harness.ts's own
// QUEST_IMAGES_DIR_NAME: the server writes every pasted image under <questFolderPath>/images
// (locationsStatics.quest.imagesDir), and a Node-side reader proving that write actually happened
// must fail the moment that literal drifts, rather than silently following it.
const QUEST_IMAGES_DIR_NAME = 'images';

// Restated rather than imported — a harness may not import application statics as values, and this
// is pastedImageStatics.imageTokenPattern verbatim (group 1 = the per-message ordinal, group 2 = the
// resolved path substituted in by pastedImageTokenSubstituteTransformer). A drift in that static must
// fail this harness's reads rather than silently follow it.
const IMAGE_TOKEN_PATTERN_SOURCE = '!\\[Pasted Image (\\d+)\\]\\(([^)]+)\\)';

// Restated rather than imported — same reasoning: pastedImageStatics.promptSentinel verbatim, the
// literal imagePromptTrailerTransformer both tests for (idempotency) and appends.
const PROMPT_SENTINEL = '<!-- dungeonmaster:images -->';

// Mantine's OWN static class names, not guessed: MantineProvider defaults to
// `withStaticClasses: true` and `classNamesPrefix: 'mantine'` (packages/web/node_modules/@mantine/
// core/esm/core/MantineProvider/MantineProvider.mjs), and `useStyles`' `getStaticClassNames` then
// appends `${prefix}-${componentName}-${selector}` to EVERY styled element unconditionally
// (get-static-class-names.mjs). `@mantine/notifications`' `Notifications` component styles its
// per-position wrapper `Box` under the component name "Notifications" at the "root" selector
// (Notifications.mjs), and `@mantine/core`'s `Notification` (the single toast, rendered by
// `NotificationContainer` with `children: message`) styles its message div under "Notification" at
// the "description" selector (Notification.mjs) — so a toast's text always carries
// `mantine-Notification-description` inside a `mantine-Notifications-root` ancestor, regardless of
// which of the six position wrappers it renders under. Scoping to the container is what keeps a
// matching string rendered in the chat transcript from being mistaken for a toast.
const NOTIFICATIONS_CONTAINER_CLASS = 'mantine-Notifications-root';
const NOTIFICATION_DESCRIPTION_CLASS = 'mantine-Notification-description';

// Node-side read-back shapes for readComposerSendStates/readQuestImagesDir/readPromptImageTokens.
// Every field stays `unknown` — never a raw TS string/number keyword, which
// @dungeonmaster/ban-primitives forbids outside a function parameter, and there is no real domain
// value here to brand; these are structural echoes of a DOM mutation / fs read, not app data. Naming
// the fields (rather than leaving the array itself typed `unknown[]`, as these three methods used to
// return) is what fixes the TS2345 "types of parameters are incompatible" a `.map((entry: {...}) =>
// ...)` callback at each call site used to produce against a bare `unknown[]` source: a callback
// declared narrower than the array's OWN element type fails strict function-parameter comparison (the
// bivariant escape hatch covers only method declarations, never a plain function-typed parameter like
// Array#map's callback) — but once the source's element type is itself a NAMED shape, even an
// all-`unknown`-valued one, a callback naming a SUBSET of those same keys, each still `unknown`,
// structurally satisfies it (extra fields on the source side are always fine).
interface ComposerSendRect {
  x: unknown;
  y: unknown;
  width: unknown;
  height: unknown;
}

// Mirrors the plain, JSON-serialisable object RECORD_COMPOSER_SEND_STATES_BROWSER_FN pushes into
// `__composerSendStates` on every mutation.
interface ComposerSendStateEntry {
  contentEditable: unknown;
  sendDisabled: unknown;
  barPresent: unknown;
  ariaValueNow: unknown;
  barRect: ComposerSendRect | null;
  inputRect: ComposerSendRect | null;
  visibilityState: unknown;
}

// Mirrors readQuestImagesDir's real-fs read.
interface QuestImagesDirSummary {
  exists: unknown;
  ino: unknown[];
  fileNames: unknown[];
  dirPath: unknown;
}

// Mirrors readPromptImageTokens' real regex-match read.
interface PromptImageTokens {
  ordinals: unknown[];
  paths: unknown[];
}

// Self-contained browser function passed BY REFERENCE to page.addInitScript, which serializes only
// the function's own source text — no outer closure survives the trip, so every literal it needs
// arrives via its one argument. Mirrors the *_BROWSER_FN functions in composer-paste.harness.ts.
// No explicit return type: this is module-private (never exported), so TypeScript infers it and
// keeps every primitive field (the rect's x/y/width/height, the aria-valuenow string) out of the
// source text entirely — an explicit annotation here trips @dungeonmaster/ban-primitives.
//
// Installs ONE MutationObserver on `document` (not `document.documentElement` — an init script runs
// at document-start where documentElement can still be null, and observe(null) throws, silently
// leaving the recorder empty and every assertion against it vacuous) and pushes a snapshot of the
// composer's send-relevant state on every mutation (plus once immediately at install), DE-DUPED
// against the previous entry by JSON equality so a long send doesn't produce thousands of identical
// entries. Rects are read INSIDE the observer callback because the upload bar is torn down in the
// send's `.finally` — a rect read later, from the test's own `await`, is always null. MutationObserver
// rather than a poll: setInterval/rAF are throttled to ~1s in a backgrounded tab.
const RECORD_COMPOSER_SEND_STATES_BROWSER_FN = (params: {
  chatInputTestId: string;
  sendButtonTestId: string;
  uploadProgressTestId: string;
}) => {
  const states: unknown[] = [];
  Object.assign(globalThis, { __composerSendStates: states });

  // Reduces a DOMRect to a plain, JSON-serialisable, structurally-comparable shape — a DOMRect's own
  // properties are getters on its prototype, so JSON.stringify-ing one directly (the dedup check
  // below) yields '{}' and two different rects would look identical to the recorder.
  const readRect = (element: Element | null) => {
    if (element === null) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  };

  const record = (): void => {
    const input = document.querySelector(`[data-testid="${params.chatInputTestId}"]`);
    const sendButton = document.querySelector(`[data-testid="${params.sendButtonTestId}"]`);
    const bar = document.querySelector(`[data-testid="${params.uploadProgressTestId}"]`);

    const next = {
      contentEditable: input === null ? null : input.getAttribute('contenteditable'),
      sendDisabled: sendButton === null ? null : sendButton.hasAttribute('disabled'),
      barPresent: bar !== null,
      ariaValueNow: bar === null ? null : bar.getAttribute('aria-valuenow'),
      barRect: readRect(bar),
      inputRect: readRect(input),
      visibilityState: document.visibilityState,
    };

    const previous: unknown = states[states.length - 1];
    if (previous !== undefined && JSON.stringify(previous) === JSON.stringify(next)) {
      return;
    }
    states.push(next);
  };

  new MutationObserver(record).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  record();
};

// Dispatches a plain (no Shift) Enter `keydown` directly at CHAT_INPUT, bubbling — the same shape
// React's delegated listener picks up from a real OS keypress, EXCEPT it does not require
// `document.activeElement` to be CHAT_INPUT first. That is the one thing a real `page.keyboard.press`
// cannot do here: once a send locks the composer, `contenteditable` flips to `"false"` and Chromium
// drops focus off the div (measured: `document.activeElement` reads no `data-testid` at all
// immediately after the first Enter), so a second `page.keyboard.press('Enter')` lands on nothing
// the composer's own `onKeyDown` ever sees — a double-submit attempt made through THAT route is
// unobservable no matter what `handleSend`'s own `if (isSending) return;` guard does. Dispatching
// directly at the element is what still reaches the real `onKeyDown` → `handleSend` path (React's
// delegated listener responds to the bubbled native event, not to focus), so this is what actually
// exercises the guard rather than a focus loss that would mask it either way.
const DISPATCH_ENTER_KEYDOWN_BROWSER_FN = (params: { chatInputTestId: string }): boolean => {
  const editor = document.querySelector(`[data-testid="${params.chatInputTestId}"]`);
  if (editor === null) {
    throw new Error('composer-send harness: CHAT_INPUT not found');
  }
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
  });
  return editor.dispatchEvent(event);
};

export const composerSendHarness = ({
  page,
}: {
  page: Page;
}): {
  recordComposerSendStates: () => Promise<void>;
  readComposerSendStates: () => Promise<readonly ComposerSendStateEntry[]>;
  recordPosts: (params: { urlSuffix: string }) => void;
  readPosts: () => readonly unknown[];
  readPostCount: () => unknown;
  readToastTexts: () => Promise<readonly unknown[]>;
  readThumbnailCount: () => Promise<unknown>;
  readQuestImagesDir: (params: { questFilePath: string }) => Promise<QuestImagesDirSummary>;
  resolveNewQuestFilePath: (params: { guildId: string; questId: string }) => unknown;
  readImageFileBase64: (params: { filePath: string }) => unknown;
  dispatchEnterKeydown: () => Promise<boolean>;
  readPromptImageTokens: (params: { prompt: string }) => PromptImageTokens;
  countSentinelOccurrences: (params: { prompt: string }) => unknown;
  fileExistsAt: (params: { filePath: string }) => boolean;
  blockImagesDir: (params: { questFilePath: string }) => void;
  unblockImagesDir: (params: { questFilePath: string }) => void;
} => {
  // Node-side accumulator for recordPosts/readPosts/readPostCount — a real `page.on('request')`
  // listener, not a browser-side global, since Playwright's Request object (and its postDataJSON())
  // only exists on this side of the bridge. Typed `unknown[]` rather than an inline
  // `{url: string; ...}[]` annotation, which would trip @dungeonmaster/ban-primitives on the raw
  // `string` fields — readPosts/readPostCount's own signatures already promise `unknown`.
  const posts: unknown[] = [];

  return {
    recordComposerSendStates: async (): Promise<void> => {
      await page.addInitScript(RECORD_COMPOSER_SEND_STATES_BROWSER_FN, {
        chatInputTestId: CHAT_INPUT_TEST_ID,
        sendButtonTestId: SEND_BUTTON_TEST_ID,
        uploadProgressTestId: CHAT_INPUT_UPLOAD_PROGRESS_TEST_ID,
      });
    },

    readComposerSendStates: async (): Promise<readonly ComposerSendStateEntry[]> =>
      page.evaluate(
        () =>
          (globalThis as unknown as { __composerSendStates?: ComposerSendStateEntry[] })
            .__composerSendStates ?? [],
      ),

    // Every POST whose url ends with `urlSuffix`, in arrival order. Filtering on method AND suffix
    // BEFORE calling postDataJSON() is what keeps this safe against non-JSON POSTs elsewhere on the
    // page (asset uploads, beacons) that this harness has no business parsing.
    recordPosts: ({ urlSuffix }: { urlSuffix: string }): void => {
      page.on('request', (request) => {
        if (request.method() !== 'POST') {
          return;
        }
        if (!request.url().endsWith(urlSuffix)) {
          return;
        }
        posts.push({ url: request.url(), method: request.method(), body: request.postDataJSON() });
      });
    },

    readPosts: (): readonly unknown[] => posts,

    readPostCount: (): unknown => posts.length,

    // Scoped to the Mantine notifications container (see the class-name derivation comment above)
    // so a chat-transcript string that happens to match a toast's text is never mistaken for one.
    readToastTexts: async (): Promise<readonly unknown[]> =>
      page
        .locator(`.${NOTIFICATIONS_CONTAINER_CLASS} .${NOTIFICATION_DESCRIPTION_CLASS}`)
        .allTextContents(),

    // A composer-send-flow-scoped read of the thumbnail count, alongside this harness's other
    // send-flow reads — composer-paste.harness.ts's own `readThumbnailCount` remains the one to
    // reach for from a paste-focused spec; this one lets a send-focused spec assert the terminal
    // "0 thumbnails after acceptance" surface without importing a second harness for one count.
    readThumbnailCount: async (): Promise<unknown> =>
      page.getByTestId(CHAT_INPUT_THUMBNAIL_TEST_ID).count(),

    // Node-side real-fs read: the server writes real files, and a Playwright `page` has no
    // filesystem access to read them back. An absent dir reads as `exists: false` with empty lists
    // rather than throwing, since "no send has landed yet" is a legitimate precondition a test
    // measures against. `ino` rides alongside `fileNames` (same sort, same index) so a test can
    // prove two entries are two DISTINCT files on disk, not the same inode read twice.
    readQuestImagesDir: async ({
      questFilePath,
    }: {
      questFilePath: string;
    }): Promise<QuestImagesDirSummary> => {
      await Promise.resolve();
      const dirPath = join(dirname(questFilePath), QUEST_IMAGES_DIR_NAME);
      if (!existsSync(dirPath)) {
        return { exists: false, ino: [], fileNames: [], dirPath };
      }
      const fileNames = readdirSync(dirPath).sort();
      const ino = fileNames.map((fileName) => statSync(join(dirPath, fileName)).ino);
      return { exists: true, ino, fileNames, dirPath };
    },

    // Resolves the absolute quest.json path for a quest the CREATE surface just minted. Unlike
    // questHarness.createQuest (which hands back filePath directly), the create-surface POST response
    // carries only questId — the quest folder is discoverable only by walking the same
    // DUNGEONMASTER_HOME/guilds/<guildId>/quests/<questId>/ layout the server itself writes to
    // (quest-delete-broker's own PURPOSE line is what confirms the folder name IS the questId).
    resolveNewQuestFilePath: ({
      guildId,
      questId,
    }: {
      guildId: string;
      questId: string;
    }): unknown => {
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME;
      if (dungeonmasterHome === undefined) {
        throw new Error('composer-send harness: DUNGEONMASTER_HOME env var is not set');
      }
      return join(
        dungeonmasterHome,
        locationsStatics.dungeonmasterHome.guildsDir,
        guildId,
        locationsStatics.guild.questsDir,
        questId,
        locationsStatics.quest.questFile,
      );
    },

    readImageFileBase64: ({ filePath }: { filePath: string }): unknown =>
      readFileSync(filePath).toString('base64'),

    dispatchEnterKeydown: async (): Promise<boolean> =>
      page.evaluate(DISPATCH_ENTER_KEYDOWN_BROWSER_FN, { chatInputTestId: CHAT_INPUT_TEST_ID }),

    // Every `![Pasted Image N](path)` occurrence in a prompt string, in the order they appear in the
    // text — `ordinals`/`paths` ride the same index so a test can pair `ordinals[i]` with `paths[i]`
    // without re-deriving the match itself. A fresh RegExp per call (rather than a shared top-level
    // one) is deliberate: a `g`-flagged RegExp carries mutable `lastIndex` state across calls, and a
    // shared instance would silently skip matches on a harness reused within one test.
    readPromptImageTokens: ({ prompt }: { prompt: string }): PromptImageTokens => {
      const pattern = new RegExp(IMAGE_TOKEN_PATTERN_SOURCE, 'gu');
      const ordinals: unknown[] = [];
      const paths: unknown[] = [];
      for (const match of prompt.matchAll(pattern)) {
        ordinals.push(match[1]);
        paths.push(match[2]);
      }
      return { ordinals, paths };
    },

    // A plain substring split rather than a RegExp: the sentinel literal carries no characters a
    // RegExp would need escaping for, and split's `.length - 1` is the exact non-overlapping
    // occurrence count for a literal needle.
    countSentinelOccurrences: ({ prompt }: { prompt: string }): unknown =>
      prompt.split(PROMPT_SENTINEL).length - 1,

    // Node-side real-fs check: proves a path the prompt carries names a file `pastedImagePersistBroker`
    // actually wrote, rather than a well-formed but dangling path.
    fileExistsAt: ({ filePath }: { filePath: string }): boolean => existsSync(filePath),

    // Forces the server's write-failure branch: pastedImagePersistBroker's fsMkdirAdapter calls
    // Node's `mkdir(dirPath, {recursive: true})`, which throws ENOTDIR/EEXIST when a REGULAR FILE
    // already occupies the target path — a real, unmocked failure mode, not a stubbed one. Writing a
    // plain empty file (not a directory) at the exact path the images dir would occupy is what
    // reaches that throw. Must run before the send that is meant to fail; the images dir must not
    // already exist as a real directory when this runs, or the write races an already-successful
    // mkdir from an earlier send in the same test.
    blockImagesDir: ({ questFilePath }: { questFilePath: string }): void => {
      writeFileSync(join(dirname(questFilePath), QUEST_IMAGES_DIR_NAME), '');
    },

    // Undoes blockImagesDir so a retry in the same test can succeed — removes the blocking file
    // (never a directory here, since only blockImagesDir could have put anything at this exact path
    // before a real send ever succeeds) so the next send's real mkdir has a clear path again.
    unblockImagesDir: ({ questFilePath }: { questFilePath: string }): void => {
      rmSync(join(dirname(questFilePath), QUEST_IMAGES_DIR_NAME), { force: true });
    },
  };
};
