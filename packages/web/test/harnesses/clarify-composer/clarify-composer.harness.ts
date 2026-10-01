/**
 * PURPOSE: Seeds a chaoswhisperer quest whose first turn asks a given set of questions, opens it,
 * and gets the clarify panel on screen, then exposes the paste gestures aimed at CLARIFY_COMPOSER
 * (never CHAT_INPUT — both composers are mounted at once and share the thumbnail test id), the
 * thumbnail reads scoped inside the clarify composer, and a log of every POST the page makes to the
 * clarify route. Real ClipboardEvents, real canvas encoding and real network traffic only exist in a
 * browser, so the mechanics live here and the scenario file asserts what they return.
 *
 * Built as a factory of semantic methods so a failure-forcing piece can add its own beside these.
 *
 * USAGE:
 * const clarify = clarifyComposerHarness({ page, request, guildPath, sessions, claudeMock });
 * await clarify.openClarifyPanel({ guildName: 'Clarify Guild', questions });
 * const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
 * await clarify.pasteImage({ dataUrl: String(dataUrl) });
 * await expect(clarify.thumbnails()).toHaveCount(1);
 */
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import {
  ClarificationResponseStub,
  SimpleTextResponseStub,
} from '@dungeonmaster/shared/contracts/claude-queue-response/claude-queue-response.stub';
import { SystemInitStreamLineStub } from '@dungeonmaster/shared/contracts/system-init-stream-line/system-init-stream-line.stub';
import { ResultStreamLineStub } from '@dungeonmaster/shared/contracts/result-stream-line/result-stream-line.stub';
import { AssistantAskUserQuestionStreamLineStub } from '@dungeonmaster/shared/contracts/assistant-stream-line/assistant-stream-line.stub';
import type { APIRequestContext, Locator, Page } from '#gateway/npm/playwright__test';

import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import { navigationHarness } from '../navigation/navigation.harness';
import { composerPasteHarness } from '../composer-paste/composer-paste.harness';
import type { sessionHarness } from '../session/session.harness';
import type { claudeMockHarness } from '../claude-mock/claude-mock.harness';

const PANEL_TIMEOUT = 10_000;
const SESSION_ID = 'e2e-session-clarify-pasted-images';
const WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000d1';
const CONTINUATION_TEXT = 'Thanks, carrying on with your answers';
const DEFAULT_IMAGE_FILE_NAME = 'pasted-image.png';
const DEFAULT_BYTES_FILE_NAME = 'pasted-bytes';
const IMAGE_SIZE_PX = 20;

// Restated, not imported: a harness may not import statics values. The route template is
// webConfigStatics.api.routes.questClarify's literal, so a drift there fails every POST read here.
const CLARIFY_ROUTE_SUFFIX = '/clarify';

// Dispatches a synthetic ClipboardEvent carrying one image File at CLARIFY_COMPOSER. React's onPaste
// is delegated from the root container, so the event fires ON the editor with `bubbles: true`.
// Self-contained: page.evaluate serializes only this function's own source text.
const PASTE_IMAGE_AT_CLARIFY_BROWSER_FN = (params: {
  dataUrl: string;
  fileName: string;
}): boolean => {
  const editor = document.querySelector('[data-testid="CLARIFY_COMPOSER"]');
  if (editor === null) {
    throw new Error('clarify-composer harness: CLARIFY_COMPOSER not found');
  }

  const commaIndex = params.dataUrl.indexOf(',');
  const header = params.dataUrl.slice(0, commaIndex);
  const base64Body = params.dataUrl.slice(commaIndex + 1);
  const mediaTypeMatch = /^data:(.*);base64$/u.exec(header);
  const mediaType =
    mediaTypeMatch?.[1] === undefined ? 'application/octet-stream' : mediaTypeMatch[1];
  const binary = atob(base64Body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(new File([bytes], params.fileName, { type: mediaType }));
  return editor.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true }),
  );
};

// Same dispatch for explicit bytes under an explicit media type — image/bmp is the unsupported one.
const PASTE_BYTES_AT_CLARIFY_BROWSER_FN = (params: {
  bytes: number[];
  mediaType: string;
  fileName: string;
}): boolean => {
  const editor = document.querySelector('[data-testid="CLARIFY_COMPOSER"]');
  if (editor === null) {
    throw new Error('clarify-composer harness: CLARIFY_COMPOSER not found');
  }

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(
    new File([new Uint8Array(params.bytes)], params.fileName, { type: params.mediaType }),
  );
  return editor.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true }),
  );
};

// Wraps window.fetch for ONE clarify POST: the first `"mediaType":"image/png"` in the outgoing body
// becomes `mediaType`, so the first answer's first image leaves the page as a type the server
// refuses. The composer refuses an unsupported image type before send, so a real 400 can only be
// earned by changing the outgoing body — the real server then answers it for real. NOT `page.route`:
// nothing about the response is faked. Self-contained, because page.evaluate serializes only this
// function's own source text.
const TAMPER_NEXT_CLARIFY_POST_BROWSER_FN = (params: {
  urlSuffix: string;
  mediaType: string;
}): void => {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (
      init !== undefined &&
      init.method === 'POST' &&
      typeof init.body === 'string' &&
      url.endsWith(params.urlSuffix)
    ) {
      globalThis.fetch = originalFetch;
      return originalFetch(input, {
        ...init,
        body: init.body.replace('"mediaType":"image/png"', `"mediaType":"${params.mediaType}"`),
      });
    }
    return originalFetch(input, init);
  };
};

export const clarifyComposerHarness = ({
  page,
  request,
  guildPath,
  sessions,
  claudeMock,
}: {
  page: Page;
  request: APIRequestContext;
  guildPath: string;
  sessions: ReturnType<typeof sessionHarness>;
  claudeMock: ReturnType<typeof claudeMockHarness>;
}): {
  openClarifyPanel: (params: {
    guildName: string;
    questions: {
      question: string;
      header: string;
      options: { label: string; description: string }[];
      multiSelect: boolean;
    }[];
  }) => Promise<void>;
  composer: () => Locator;
  thumbnails: () => Locator;
  buildPngDataUrl: (params: { seed: number }) => Promise<unknown>;
  dataUrlBase64: (params: { dataUrl: string }) => unknown;
  pasteImage: (params: { dataUrl: string }) => Promise<boolean>;
  pasteBytes: (params: { bytes: readonly number[]; mediaType: string }) => Promise<boolean>;
  clarifyPostCount: () => number;
  readClarifyAnswers: (params: { postIndex: number }) => readonly unknown[];
  waitForClarifyStatus: () => Promise<unknown>;
  sendError: () => Locator;
  counter: () => Locator;
  waitForClarifyRefusal: () => Promise<{ status: unknown; error: unknown }>;
  tamperNextClarifyPostIntoBmp: () => Promise<void>;
  goOffline: () => Promise<void>;
  goOnline: () => Promise<void>;
  corruptQuestFile: () => Promise<void>;
  restoreQuestFile: () => Promise<void>;
} => {
  const seeded = { questId: '', questFolder: '', questFilePath: '' };
  const clarifyPostLog: unknown[] = [];
  const composerPaste = composerPasteHarness({ page });

  const isClarifyUrl = ({ url }: { url: string }) =>
    url.endsWith(`/api/quests/${seeded.questId}${CLARIFY_ROUTE_SUFFIX}`);

  // The quest file exactly as openClarifyPanel first wrote it, so a restore leaves the quest loadable.
  const writeSeededQuestFile = async (): Promise<void> => {
    await questHarness({ request }).writeQuestFile({
      questId: QuestIdStub({ value: seeded.questId }),
      questFolder: seeded.questFolder,
      questFilePath: seeded.questFilePath,
      status: 'explore_flows',
      workItems: [{ id: WORK_ITEM_ID, role: 'chaoswhisperer', sessionId: SESSION_ID }],
    });
  };

  return {
    openClarifyPanel: async ({ guildName, questions }): Promise<void> => {
      const guild = await guildHarness({ request }).createGuild({
        name: guildName,
        path: guildPath,
      });
      await sessions.createSessionFile({ sessionId: SESSION_ID, userMessage: 'Build the feature' });
      const quests = questHarness({ request });
      const created = await quests.createQuest({
        guildId: GuildIdStub({ value: String(guild.id) }),
        title: `E2E ${guildName} Quest`,
        userRequest: 'Build the feature',
      });
      await quests.writeQuestFile({
        questId: created.questId,
        questFolder: created.questFolder,
        questFilePath: created.filePath,
        status: 'explore_flows',
        workItems: [{ id: WORK_ITEM_ID, role: 'chaoswhisperer', sessionId: SESSION_ID }],
      });
      Object.assign(seeded, {
        questId: created.questId,
        questFolder: created.questFolder,
        questFilePath: created.filePath,
      });

      claudeMock.queueResponse({
        response: ClarificationResponseStub({
          sessionId: SESSION_ID,
          lines: [
            JSON.stringify(SystemInitStreamLineStub({ session_id: SESSION_ID })),
            JSON.stringify(
              AssistantAskUserQuestionStreamLineStub({
                message: {
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool_use',
                      id: 'toolu_01ClarifyPastedImages',
                      name: 'mcp__dungeonmaster__ask-user-question',
                      input: { questions: [...questions] },
                    },
                  ],
                },
              }),
            ),
            JSON.stringify(ResultStreamLineStub({ session_id: SESSION_ID })),
          ],
        }),
      });
      claudeMock.queueResponse({
        response: SimpleTextResponseStub({ sessionId: SESSION_ID, text: CONTINUATION_TEXT }),
      });

      page.on('request', (req) => {
        if (req.method() === 'POST' && isClarifyUrl({ url: req.url() })) {
          clarifyPostLog.push(req.postDataJSON());
        }
      });

      const urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');
      await navigationHarness({ page }).navigateToQuest({ urlSlug, questId: created.questId });
      await page.getByTestId('CHAT_INPUT').fill('Start the quest');
      await page.getByTestId('SEND_BUTTON').click();
      await page
        .getByTestId('QUEST_CLARIFY_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    },

    composer: (): Locator => page.getByTestId('CLARIFY_COMPOSER'),

    // Scoped inside CLARIFY_COMPOSER: the chat composer's thumbnails carry the same test id.
    thumbnails: (): Locator =>
      page.getByTestId('CLARIFY_COMPOSER').getByTestId('CHAT_INPUT_THUMBNAIL'),

    buildPngDataUrl: async ({ seed }: { seed: number }): Promise<unknown> =>
      composerPaste.buildImageDataUrl({
        widthPx: IMAGE_SIZE_PX,
        heightPx: IMAGE_SIZE_PX,
        seed,
      }),

    dataUrlBase64: ({ dataUrl }: { dataUrl: string }): unknown =>
      dataUrl.slice(dataUrl.indexOf(',') + 1),

    pasteImage: async ({ dataUrl }: { dataUrl: string }): Promise<boolean> =>
      page.evaluate(PASTE_IMAGE_AT_CLARIFY_BROWSER_FN, {
        dataUrl,
        fileName: DEFAULT_IMAGE_FILE_NAME,
      }),

    pasteBytes: async ({
      bytes,
      mediaType,
    }: {
      bytes: readonly number[];
      mediaType: string;
    }): Promise<boolean> =>
      page.evaluate(PASTE_BYTES_AT_CLARIFY_BROWSER_FN, {
        bytes: [...bytes],
        mediaType,
        fileName: DEFAULT_BYTES_FILE_NAME,
      }),

    clarifyPostCount: (): number => clarifyPostLog.length,

    // `answers` of the Nth clarify POST the page has made, oldest first.
    readClarifyAnswers: ({ postIndex }: { postIndex: number }): readonly unknown[] => {
      const body: unknown = clarifyPostLog[postIndex];
      if (typeof body !== 'object' || body === null || !('answers' in body)) {
        throw new Error(`clarify-composer harness: no clarify POST at index ${postIndex}`);
      }
      const { answers } = body;
      return Array.isArray(answers) ? answers : [];
    },

    // Registered BEFORE the gesture that sends, resolves with the status of the next clarify POST.
    waitForClarifyStatus: async (): Promise<unknown> => {
      const response = await page.waitForResponse(
        (res) => res.request().method() === 'POST' && isClarifyUrl({ url: res.url() }),
      );
      return response.status();
    },

    // Inside the panel only: the chat panel mounts its own error surfaces too.
    sendError: (): Locator =>
      page.getByTestId('QUEST_CLARIFY_PANEL').getByTestId('CLARIFY_SEND_ERROR'),

    counter: (): Locator => page.getByTestId('CLARIFY_COUNTER'),

    // Registered BEFORE the gesture that sends. Resolves with the real status and the `error` string
    // the server's own JSON body carried, so the scenario compares the panel text to the wire.
    waitForClarifyRefusal: async (): Promise<{ status: unknown; error: unknown }> => {
      const response = await page.waitForResponse(
        (res) => res.request().method() === 'POST' && isClarifyUrl({ url: res.url() }),
      );
      const body: unknown = await response.json();
      const error =
        typeof body === 'object' && body !== null && 'error' in body ? body.error : null;
      return { status: response.status(), error };
    },

    tamperNextClarifyPostIntoBmp: async (): Promise<void> => {
      await page.evaluate(TAMPER_NEXT_CLARIFY_POST_BROWSER_FN, {
        urlSuffix: `/api/quests/${seeded.questId}${CLARIFY_ROUTE_SUFFIX}`,
        mediaType: 'image/bmp',
      });
    },

    // A true outage: setOffline cuts the wire, so the page's own fetch rejects with no response.
    goOffline: async (): Promise<void> => {
      await page.context().setOffline(true);
    },

    goOnline: async (): Promise<void> => {
      await page.context().setOffline(false);
    },

    // quest.json that questContract rejects: StartOrchestrator.loadQuest throws for real and the
    // responder's catch-all answers 500 { error }.
    corruptQuestFile: async (): Promise<void> => {
      await questHarness({ request }).writeUnparseableQuestFile({
        questId: QuestIdStub({ value: seeded.questId }),
        questFolder: seeded.questFolder,
        questFilePath: seeded.questFilePath,
      });
    },

    restoreQuestFile: writeSeededQuestFile,
  };
};
