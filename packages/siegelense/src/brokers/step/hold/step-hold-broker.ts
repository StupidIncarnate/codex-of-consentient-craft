/**
 * PURPOSE: Drives the `hold` step verb — captures N live frames at an interval using session.captureLive
 * (without disabling CSS/GIF animations), compares consecutive frames using shotChangeReadBroker to detect
 * non-settlement or no-feedback states, optionally copies the final frame to shotPath, and returns
 * the rendered HoldReading JSON.
 *
 * USAGE:
 * await stepHoldBroker({
 *   lane,
 *   session,
 *   index: StepIndexStub({ value: 1 }),
 *   shotPath: AbsoluteFilePathStub({ value: '/repo/runs/run_1/step1.png' }),
 *   frames: 4,
 *   everyMs: 1500,
 * });
 * // Returns ContentText JSON representing the HoldReading
 */

import { pathDirnameAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { asyncDelayAdapter } from '../../../adapters/async/delay/async-delay-adapter';
import { fsCopyFileAdapter } from '../../../adapters/fs/copy-file/fs-copy-file-adapter';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { holdReadingContract } from '../../../contracts/hold-reading/hold-reading-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { holdStatics } from '../../../statics/hold/hold-statics';
import { holdReadingRenderTransformer } from '../../../transformers/hold-reading-render/hold-reading-render-transformer';
import { shotChangeReadBroker } from '../../shot/change-read/shot-change-read-broker';

const MS_PER_SECOND = 1000;

export const stepHoldBroker = async ({
  lane,
  session,
  index,
  shotPath,
  frames,
  everyMs,
}: {
  lane: LaneSession;
  session: BrowserSession;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
  frames: number;
  everyMs: number;
}): Promise<ContentText> => {
  const dir =
    shotPath === null
      ? lane.evidencePath
      : pathDirnameAdapter({ path: filePathContract.parse(shotPath) });

  const framePaths: AbsoluteFilePath[] = [];
  for (let i = 0; i < frames; i += 1) {
    const frameNumber = i + 1;
    const framePath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [dir, `step${String(index)}_frame${String(frameNumber)}.png`] }),
    );
    framePaths.push(framePath);
  }

  const changeState = { differing: 0 };

  await framePaths.reduce(async (previous, currentFramePath, i) => {
    await previous;

    if (i > 0) {
      await asyncDelayAdapter({ ms: everyMs });
    }

    await session.captureLive({ filePath: currentFramePath });

    if (i > 0) {
      const previousFramePath = framePaths[i - 1];
      if (previousFramePath !== undefined) {
        const pixelChange = await shotChangeReadBroker({
          previousPath: previousFramePath,
          currentPath: currentFramePath,
        });

        if (pixelChange !== null && pixelChange !== '0%') {
          changeState.differing += 1;
        }
      }
    }
  }, Promise.resolve());

  if (shotPath !== null) {
    const lastFramePath = framePaths.at(-1);
    if (lastFramePath !== undefined) {
      await fsCopyFileAdapter({ sourcePath: lastFramePath, destinationPath: shotPath });
    }
  }

  const durationSeconds = ((frames - 1) * everyMs) / MS_PER_SECOND;
  const verdictTemplate =
    changeState.differing === 0
      ? holdStatics.verdicts.nothingChanged
      : holdStatics.verdicts.stillChanging;
  const verdict = verdictTemplate.replace('{duration}', String(durationSeconds));

  const reading = holdReadingContract.parse({
    frames,
    differing: changeState.differing,
    verdict,
    shots: framePaths,
  });

  return holdReadingRenderTransformer({ reading });
};
