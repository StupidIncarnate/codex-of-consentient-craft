/**
 * PURPOSE: The action to perform on video recording — 'start' or 'stop'. Reach for
 * this over a raw string literal whenever an action parameter is validated as belonging
 * to the video step's allowed operations.
 *
 * USAGE:
 * videoActionContract.parse('start');
 * // Returns a branded VideoAction
 */

import { z } from 'zod';

import { videoStatics } from '../../statics/video/video-statics';

export const videoActionContract = z.enum(videoStatics.actions).brand<'VideoAction'>();

export type VideoAction = z.infer<typeof videoActionContract>;
