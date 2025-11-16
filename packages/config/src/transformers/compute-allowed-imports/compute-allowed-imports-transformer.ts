/**
 * PURPOSE: Computes the final allowed external imports for each architecture folder based on framework preset and user configuration
 *
 * USAGE:
 * computeAllowedImportsTransformer({config});
 * // Returns AllowedExternalImports object with resolved package lists for each folder type
 */

import { frameworkPresetsDataStatics } from '../../statics/framework-presets-data/framework-presets-data-statics';
import { applyOverridesTransformer } from '../apply-overrides/apply-overrides-transformer';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';
import type { AllowedExternalImports } from '../../contracts/folder-config/folder-config-contract';

export const computeAllowedImportsTransformer = ({
  config,
}: {
  config: QuestmaestroConfig;
}): AllowedExternalImports => {
  // Get the base preset for the framework (guaranteed to exist by Zod validation)
  const basePreset = frameworkPresetsDataStatics.presets[config.framework];

  // Apply user overrides to the preset
  const preset = applyOverridesTransformer({ preset: basePreset, config });

  // Convert schema field to array for consistent handling
  const schemaLibraries = Array.isArray(config.schema) ? config.schema : [config.schema];

  // Build the computed configuration
  const result: AllowedExternalImports = {
    widgets: preset.widgets,
    bindings: preset.bindings,
    state: preset.state,
    flows: preset.flows ? [...preset.flows] : null,
    responders: preset.responders,
    contracts: [...preset.contracts, ...schemaLibraries],
    brokers: [...preset.brokers],
    transformers: [...preset.transformers],
    errors: [...preset.errors],
    middleware: [...preset.middleware],
    adapters: [...preset.adapters],
    startup: [...preset.startup],
  };

  // Handle routing library for frameworks that need it
  if (config.routing && result.flows) {
    // For frontend frameworks, add routing library to flows
    if (!result.flows.includes(config.routing)) {
      result.flows.push(config.routing);
    }
  }

  return result;
};
