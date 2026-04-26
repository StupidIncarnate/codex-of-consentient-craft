/**
 * PURPOSE: Defines the shape of a parsed JSON tool input object as a record of unknown values keyed by branded tool-input keys
 *
 * USAGE:
 * parsedToolInputContract.parse(JSON.parse(rawJson));
 * // Returns ParsedToolInput — a Record<ToolInputKey, unknown>
 */

import { z } from 'zod';

import { toolInputKeyContract } from '../tool-input-key/tool-input-key-contract';

export const parsedToolInputContract = z.record(toolInputKeyContract, z.unknown());

export type ParsedToolInput = z.infer<typeof parsedToolInputContract>;
