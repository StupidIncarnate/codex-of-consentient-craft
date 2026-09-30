/**
 * PURPOSE: Validates framework preset configurations with branded types for allowed external imports
 *
 * USAGE:
 * import {frameworkPresetsContract} from './framework-presets-contract';
 * const preset = frameworkPresetsContract.parse({...});
 * // Returns validated FrameworkPreset type with branded strings
 */

import { z } from '#gateway/npm/zod';

// Base preset structure - what each framework allows by default
export const frameworkPresetsContract = z
  .object({
    widgets: z.array(z.string().brand<'FrameworkPresetsWidgets'>()).nullable(),
    bindings: z.array(z.string().brand<'FrameworkPresetsBindings'>()).nullable(),
    state: z.array(z.string().brand<'FrameworkPresetsState'>()).nullable(),
    flows: z.array(z.string().brand<'FrameworkPresetsFlows'>()).nullable(),
    responders: z.array(z.string().brand<'FrameworkPresetsResponders'>()).nullable(),
    contracts: z.array(z.string().brand<'FrameworkPresetsContracts'>()),
    brokers: z.array(z.string().brand<'FrameworkPresetsBrokers'>()),
    transformers: z.array(z.string().brand<'FrameworkPresetsTransformers'>()),
    errors: z.array(z.string().brand<'FrameworkPresetsErrors'>()),
    middleware: z.array(z.string().brand<'FrameworkPresetsMiddleware'>()),
    startup: z.array(z.string().brand<'FrameworkPresetsStartup'>()),
  })
  .brand<'FrameworkPresets'>();

export type FrameworkPreset = z.infer<typeof frameworkPresetsContract>;
