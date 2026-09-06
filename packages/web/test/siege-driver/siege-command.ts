/**
 * PURPOSE: Turns one named command into a READING off a lane — counts, boxes, bodies, storage
 * entries, the armed buffers, and the bytes on the lane's own disk — and never into a verdict, so
 * whoever signs a unit is signing against evidence rather than against this file's opinion of it.
 * Reach for this rather than driving `lane.page` from the caller: every selector-shaped command
 * describes its target the same way, so two readings can be compared; a timeout, a bad selector or
 * an absent file comes back as a recorded reading of what went wrong instead of a throw that takes
 * the command pump down with it; the three buffer commands read what was armed at boot rather than
 * attaching a listener that has already missed everything worth hearing; and `file` reads through
 * Node's own `fs` in THIS process, which is the only side of a lane where a quest file the server
 * wrote is reachable at all — `eval` hands its source to the browser, where there is no `fs`.
 *
 * USAGE:
 * await siegeCommand({ lane, name: 'network', target: '/api/quests', value: '', filePath: '', timeoutMs: 0 });
 * // One JSON line per exchange, each carrying its request body and its response body
 */
import * as fs from 'fs';
import * as path from 'path';

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { SiegeLane } from './siege-lane';

const JSON_INDENT = 2;
const DEFAULT_TIMEOUT_MS = 10_000;
const DOM_TEXT_LIMIT = 4_000;
// A keystroke every 20ms is slow enough that a React controlled input commits each one and fast
// enough that a sentence lands inside a command's timeout.
const TYPE_DELAY_MS = 20;
// A quest.json is what a file-exists observable asks about most often, and the WHOLE of one is the
// answer — same reasoning as the lane's network body cap, which is deliberately large enough to
// hold one rather than a preview of one.
const FILE_TEXT_LIMIT = 200_000;
// A NUL inside the head is what separates a build artefact from a text file; sniffing a prefix
// rather than the whole buffer keeps the decision cheap on a large file.
const BINARY_SNIFF_BYTES = 8_000;
// A directory reading is a measurement of what a walk produced, not a filesystem dump, and the cap
// keeps a mistaken `file` at a huge tree from posting a megabyte of names back into a session.
const DIRECTORY_ENTRY_LIMIT = 500;
const PNG_MIME = 'image/png';
const JPEG_MIME = 'image/jpeg';
const IMAGE_MIME_BY_EXTENSION = new Map([
  ['.png', PNG_MIME],
  ['.jpg', JPEG_MIME],
  ['.jpeg', JPEG_MIME],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
]);

export const siegeCommand = async ({
  lane,
  name,
  target,
  value,
  filePath,
  timeoutMs,
}: {
  lane: SiegeLane;
  name: string;
  target: string;
  value: string;
  filePath: string;
  timeoutMs: number;
}): Promise<{ ok: boolean; output: ContentText }> => {
  const { page } = lane;
  const timeout = timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;

  const measured = ({ data }: { data: unknown }): { ok: boolean; output: ContentText } => ({
    ok: true,
    output: contentTextContract.parse(JSON.stringify(data, null, JSON_INDENT)),
  });

  const captured = ({
    entries,
  }: {
    entries: readonly ContentText[];
  }): { ok: boolean; output: ContentText } => ({
    ok: true,
    output: contentTextContract.parse(
      entries.length === 0 ? '<no entries captured>' : entries.join('\n'),
    ),
  });

  const matching = ({ entries }: { entries: readonly ContentText[] }): readonly ContentText[] =>
    target === '' ? entries : entries.filter((entry) => entry.includes(target));

  // Every command that names a selector reports the SAME shape for it, so a walker comparing two
  // measurements is comparing like with like rather than whatever that branch happened to read.
  const describeLocator = async ({ selector }: { selector: string }): Promise<unknown> => {
    const locator = page.locator(selector);
    const count = await locator.count();
    if (count === 0) {
      return { selector, count, present: false };
    }
    const first = locator.first();
    const [visible, box, text] = await Promise.all([
      first.isVisible(),
      first.boundingBox(),
      first.textContent(),
    ]);
    return {
      selector,
      count,
      present: true,
      visible,
      box,
      text: (text ?? '').slice(0, DOM_TEXT_LIMIT),
    };
  };

  const pasteText = async ({ text }: { text: string }): Promise<void> => {
    await page.evaluate(async (clipboardText) => {
      await navigator.clipboard.writeText(clipboardText);
    }, text);
    await page.keyboard.press('ControlOrMeta+V');
  };

  // A real Ctrl+V over a clipboard the browser itself owns. Constructing a synthetic
  // ClipboardEvent instead produces isTrusted false, which the composer's own handler is free to
  // ignore — and a measurement taken through a path production never takes is not a measurement.
  const pasteFile = async ({ imagePath }: { imagePath: string }): Promise<void> => {
    const base64 = fs.readFileSync(imagePath).toString('base64');
    const mime = IMAGE_MIME_BY_EXTENSION.get(path.extname(imagePath).toLowerCase()) ?? PNG_MIME;
    await page.evaluate(
      async (payload) => {
        const binary = atob(payload.base64);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const blob = new Blob([bytes], { type: payload.mime });
        await navigator.clipboard.write([new ClipboardItem({ [payload.mime]: blob })]);
      },
      { base64, mime },
    );
    await page.keyboard.press('ControlOrMeta+V');
  };

  try {
    switch (name) {
      case 'goto': {
        const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout });
        return measured({
          data: {
            requested: target,
            landedOn: page.url(),
            status: response === null ? null : response.status(),
            title: await page.title(),
          },
        });
      }

      case 'waitFor': {
        const state =
          value === 'hidden'
            ? 'hidden'
            : value === 'attached'
              ? 'attached'
              : value === 'detached'
                ? 'detached'
                : 'visible';
        await page.locator(target).first().waitFor({ state, timeout });
        return measured({
          data: { waitedFor: state, element: await describeLocator({ selector: target }) },
        });
      }

      case 'click': {
        const before = await describeLocator({ selector: target });
        const urlBefore = page.url();
        await page.locator(target).first().click({ timeout });
        return measured({
          data: {
            before,
            urlBefore,
            urlAfter: page.url(),
            after: await describeLocator({ selector: target }),
          },
        });
      }

      case 'type': {
        const locator = page.locator(target).first();
        await locator.pressSequentially(value, { delay: TYPE_DELAY_MS, timeout });
        return measured({
          data: {
            typed: value,
            element: await describeLocator({ selector: target }),
            inputValue: await locator.evaluate((element) =>
              element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
                ? element.value
                : null,
            ),
          },
        });
      }

      case 'key': {
        await page.keyboard.press(target, { delay: TYPE_DELAY_MS });
        return measured({
          data: {
            pressed: target,
            focused: await page.evaluate((limit) => {
              const element = document.activeElement;
              return {
                tagName: element === null ? null : element.tagName,
                testId: element === null ? null : element.getAttribute('data-testid'),
                text: (element?.textContent ?? '').slice(0, limit),
              };
            }, DOM_TEXT_LIMIT),
          },
        });
      }

      case 'paste': {
        if (target !== '') {
          await page.locator(target).first().focus({ timeout });
        }
        if (filePath === '') {
          await pasteText({ text: value });
        } else {
          await pasteFile({ imagePath: filePath });
        }
        return measured({
          data: {
            pastedText: filePath === '' ? value : null,
            pastedFile: filePath === '' ? null : filePath,
            focusTarget: target === '' ? null : await describeLocator({ selector: target }),
          },
        });
      }

      case 'screenshot': {
        const fileName = value === '' ? `shot-${String(Date.now())}.png` : value;
        const outPath = path.join(lane.screenshotDir, fileName);
        if (target === '') {
          await page.screenshot({ path: outPath });
        } else {
          await page.locator(target).first().screenshot({ path: outPath });
        }
        return measured({
          data: {
            path: outPath,
            bytes: fs.statSync(outPath).size,
            viewport: page.viewportSize(),
            url: page.url(),
          },
        });
      }

      case 'box': {
        return measured({
          data: {
            element: await describeLocator({ selector: target }),
            viewport: page.viewportSize(),
          },
        });
      }

      case 'dom': {
        // A raw querySelectorAll read rather than a Playwright locator: `dom` answers "what is
        // actually in the document", so it must not go through the auto-waiting and
        // engine-prefixed selector layer that every other command here deliberately uses.
        const nodes = await page.evaluate(
          (params) =>
            Array.from(document.querySelectorAll(params.selector)).map((element) => {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return {
                tagName: element.tagName,
                testId: element.getAttribute('data-testid'),
                className: element.getAttribute('class'),
                childCount: element.childElementCount,
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                text: (element.textContent ?? '').slice(0, params.limit),
              };
            }),
          { selector: target, limit: DOM_TEXT_LIMIT },
        );
        return measured({ data: { selector: target, count: nodes.length, nodes } });
      }

      case 'storage': {
        return measured({
          data: await page.evaluate(
            (prefix) => ({
              origin: window.location.origin,
              local: Object.fromEntries(
                Object.keys(window.localStorage)
                  .filter((key) => key.startsWith(prefix))
                  .map((key) => [key, window.localStorage.getItem(key)]),
              ),
              session: Object.fromEntries(
                Object.keys(window.sessionStorage)
                  .filter((key) => key.startsWith(prefix))
                  .map((key) => [key, window.sessionStorage.getItem(key)]),
              ),
            }),
            target,
          ),
        });
      }

      case 'console': {
        return captured({ entries: matching({ entries: lane.readConsole() }) });
      }

      case 'network': {
        return captured({ entries: matching({ entries: lane.readNetwork() }) });
      }

      case 'ws': {
        return captured({ entries: matching({ entries: lane.readWebsocket() }) });
      }

      case 'eval': {
        const evaluated: unknown = await page.evaluate(value);
        return measured({ data: { source: value, result: evaluated } });
      }

      case 'file': {
        // A relative path resolves against the lane's OWN home — the DUNGEONMASTER_HOME its server
        // was spawned with — because that is the single tree a walk both causes and can name
        // identically on every lane: `guilds/<id>/quests/<id>/quest.json` is the same phrase in
        // every reading while pointing at a different lane's file each time. The repo root would
        // name files no walk ever wrote, and the driver's cwd would name a different tree depending
        // on where the session happened to launch it. An absolute path is taken exactly as given,
        // which is what reaches the lane's own logs and lane.json under `laneDir`.
        const requested = target === '' ? filePath : target;
        const resolved = path.isAbsolute(requested)
          ? requested
          : path.resolve(lane.home, requested);
        const located = { requested, resolved, relativeTo: lane.home };
        const stats = fs.statSync(resolved, { throwIfNoEntry: false });

        // An absent file is the answer half of these readings are asking for, so it comes back as a
        // measurement rather than falling to the catch below as a failed command.
        if (stats === undefined) {
          return measured({
            data: { ...located, exists: false, kind: null, bytes: null, modifiedAt: null },
          });
        }

        const found = { ...located, exists: true, bytes: stats.size, modifiedAt: stats.mtimeMs };

        if (stats.isDirectory()) {
          const entries = fs.readdirSync(resolved).sort();
          return measured({
            data: {
              ...found,
              kind: 'directory',
              entryCount: entries.length,
              entries: entries.slice(0, DIRECTORY_ENTRY_LIMIT),
            },
          });
        }

        // Only a regular file is opened: readFileSync on a fifo blocks until something writes to
        // it, and a command that never returns takes the driver's whole pump down with it.
        if (!stats.isFile()) {
          return measured({ data: { ...found, kind: 'other' } });
        }

        const content = fs.readFileSync(resolved);
        const binary = content.subarray(0, BINARY_SNIFF_BYTES).includes(0);
        return measured({
          data: {
            ...found,
            kind: 'file',
            binary,
            truncated: content.length > FILE_TEXT_LIMIT,
            text: binary ? null : content.subarray(0, FILE_TEXT_LIMIT).toString('utf-8'),
          },
        });
      }

      case 'end': {
        return measured({ data: { stopping: true, url: page.url() } });
      }

      default: {
        return {
          ok: false,
          output: contentTextContract.parse(
            `unknown command "${name}" — the set is goto waitFor click type key paste screenshot box dom storage console network ws eval file end`,
          ),
        };
      }
    }
  } catch (error: unknown) {
    return {
      ok: false,
      output: contentTextContract.parse(
        JSON.stringify(
          { command: name, target, value, filePath, timeout, error: String(error) },
          null,
          JSON_INDENT,
        ),
      ),
    };
  }
};
