/**
 * PURPOSE: The process a session starts and leaves running — it owns one lane for that lane's
 * whole life and takes work over the filesystem, which is the only channel open to an agent that
 * has Write and Read but cannot hold a socket between turns. Reach for this rather than importing
 * `siegeLane` directly whenever the caller is a Claude session rather than a script: the browser
 * survives from one command to the next, so a race can be walked into instead of reconstructed,
 * and the lane closes itself when nothing arrives for the idle window, so a worker that dies
 * mid-walk does not leave an API server, a Vite server and a browser behind it.
 *
 * USAGE:
 * npx tsx packages/web/test/siege-driver/siege-driver.ts p1
 * // Prints a manifest (ports, home, the three directories) and writes it to tmp/siege/p1/lane.json
 * //
 * // Then, per command, drop ONE json file into commands/ and read the file of the same basename
 * // that appears in results/:
 * //   commands/010-goto.json  { "name": "goto", "target": "/", "timeoutMs": 30000 }
 * //   results/010-goto.txt    "OK" or "FAIL", a blank line, then the reading
 * //   commands/020-file.json  { "name": "file", "target": "guilds" }
 * //
 * // name    is one of goto waitFor click type key paste screenshot box dom storage console
 * //         network ws eval file end
 * // target  the selector, url, key combo, filter substring, or — for `file` — the path that
 * //         command reads; a `file` path that is relative resolves against `home` below
 * // value   the text to type or paste, the wait state, the screenshot filename, the eval source
 * // filePath an image on disk to put on the clipboard for `paste`; `file` reads its path from
 * //          here too, so either slot names it
 * // timeoutMs 0 means the command default
 */
import * as fs from 'fs';
import * as path from 'path';

import { z } from 'zod';
import {
  contentTextContract,
  fileNameContract,
  timeoutMsContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, FileName } from '@dungeonmaster/shared/contracts';

import { siegeCommand } from './siege-command';
import { siegeLane } from './siege-lane';

const JSON_INDENT = 2;
const COMMAND_POLL_MS = 150;
// A worker that dies mid-walk leaves its lane behind — an API server, a Vite server and a
// browser, times however many lanes. Closing on silence is lane hygiene, not durability.
const IDLE_TIMEOUT_MS = 900_000;
const COMMAND_EXTENSION = '.json';
const RESULT_EXTENSION = '.txt';
const PARTIAL_EXTENSION = '.partial';
const DEFAULT_LANE_NAME = 'lane-1';

const siegeCommandFileContract = z.object({
  name: contentTextContract,
  target: contentTextContract.default(''),
  value: contentTextContract.default(''),
  filePath: contentTextContract.default(''),
  timeoutMs: timeoutMsContract.default(0),
});

export const siegeDriver = async (): Promise<void> => {
  const laneName = process.argv[2] ?? process.env.SIEGE_LANE ?? DEFAULT_LANE_NAME;
  const idleTimeoutMs = Number(process.env.SIEGE_IDLE_MS ?? '') || IDLE_TIMEOUT_MS;

  const lane = await siegeLane({ laneName });

  const commandsDir = path.join(lane.laneDir, 'commands');
  const resultsDir = path.join(lane.laneDir, 'results');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  // A command left behind by a previous lane on this name would fire the moment this one is up,
  // against a page it was never written for.
  fs.readdirSync(commandsDir).forEach((entry) => {
    fs.rmSync(path.join(commandsDir, entry), { force: true });
  });

  const manifest = {
    lane: laneName,
    pid: process.pid,
    apiPort: lane.apiPort,
    webPort: lane.webPort,
    baseUrl: lane.baseUrl,
    home: lane.home,
    commandsDir,
    resultsDir,
    screenshotDir: lane.screenshotDir,
    idleTimeoutMs,
  };
  fs.writeFileSync(
    path.join(lane.laneDir, 'lane.json'),
    `${JSON.stringify(manifest, null, JSON_INDENT)}\n`,
  );
  process.stdout.write(`[siege] lane up\n${JSON.stringify(manifest, null, JSON_INDENT)}\n`);

  const sleep = async ({ ms }: { ms: number }): Promise<void> => {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  const nextCommandFile = (): FileName | undefined => {
    const [first] = fs
      .readdirSync(commandsDir)
      .filter((entry) => entry.endsWith(COMMAND_EXTENSION))
      .sort();
    return first === undefined ? undefined : fileNameContract.parse(first);
  };

  // The result lands under its command's own basename, written to a `.partial` first and renamed
  // into place — a reader polling for `<name>.txt` therefore never reads half a measurement.
  const writeResult = ({
    fileName,
    ok,
    output,
  }: {
    fileName: string;
    ok: boolean;
    output: ContentText;
  }): void => {
    const base = fileName.slice(0, -COMMAND_EXTENSION.length);
    const finalPath = path.join(resultsDir, `${base}${RESULT_EXTENSION}`);
    const partialPath = `${finalPath}${PARTIAL_EXTENSION}`;
    fs.writeFileSync(partialPath, `${ok ? 'OK' : 'FAIL'}\n\n${output}\n`);
    fs.renameSync(partialPath, finalPath);
    process.stdout.write(`[siege] ${ok ? 'OK  ' : 'FAIL'} ${fileName}\n`);
  };

  const runOne = async ({ fileName }: { fileName: string }): Promise<boolean> => {
    const commandPath = path.join(commandsDir, fileName);
    const raw = fs.readFileSync(commandPath, 'utf-8');
    // Removed BEFORE it runs: a command that takes the driver down with it must not be replayed.
    fs.rmSync(commandPath, { force: true });

    const parsed = siegeCommandFileContract.safeParse(JSON.parse(raw) as unknown);
    if (!parsed.success) {
      writeResult({
        fileName,
        ok: false,
        output: contentTextContract.parse(parsed.error.message),
      });
      return false;
    }

    const { name, target, value, filePath, timeoutMs } = parsed.data;
    const result = await siegeCommand({ lane, name, target, value, filePath, timeoutMs });
    writeResult({ fileName, ok: result.ok, output: result.output });
    return name === 'end';
  };

  // Deadline-bounded recursion, not a loop: `while (true)` is banned outright and a loop with an
  // await in it trips no-await-in-loop. Shape copied from serverAppHarness's pollForInvocation.
  const pump = async ({ idleDeadline }: { idleDeadline: number }): Promise<void> => {
    const fileName = nextCommandFile();

    if (fileName === undefined) {
      if (Date.now() >= idleDeadline) {
        process.stdout.write(`[siege] idle for ${String(idleTimeoutMs)}ms — closing lane\n`);
        return;
      }
      await sleep({ ms: COMMAND_POLL_MS });
      await pump({ idleDeadline });
      return;
    }

    const finished = await runOne({ fileName });
    if (finished) {
      return;
    }
    await pump({ idleDeadline: Date.now() + idleTimeoutMs });
  };

  // The lane's servers are spawned detached so their whole process group can be killed together,
  // which also means nothing reaps them if this process is interrupted.
  const shutdown = (): void => {
    lane.stop().catch((error: unknown) => {
      process.stderr.write(`[siege] shutdown failed: ${String(error)}\n`);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await pump({ idleDeadline: Date.now() + idleTimeoutMs });
  await lane.stop();
  process.stdout.write(`[siege] lane ${laneName} stopped\n`);
};

siegeDriver().catch((error: unknown) => {
  process.stderr.write(`[siege] driver failed: ${String(error)}\n`);
  process.exitCode = 1;
});
