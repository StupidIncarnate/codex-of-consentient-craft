/**
 * PURPOSE: Computes the final allowed external imports for each architecture folder based on framework preset and user configuration
 *
 * USAGE:
 * computeAllowedImportsTransformer({config});
 * // Returns AllowedExternalImports object with resolved package lists for each folder type
 */

import { frameworkPresetsDataStatics } from '../../statics/framework-presets-data/framework-presets-data-statics';
import { applyOverridesTransformer } from '../apply-overrides/apply-overrides-transformer';
import { folderConfigContract } from '../../contracts/folder-config/folder-config-contract';
import { frameworkPresetsContract } from '../../contracts/framework-presets/framework-presets-contract';
import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';
import type { AllowedExternalImports } from '../../contracts/folder-config/folder-config-contract';

export const computeAllowedImportsTransformer = ({
  config,
}: {
  config: QuestmaestroConfig;
}): AllowedExternalImports => {
  // Get the base preset for the framework (guaranteed to exist by Zod validation)
  const rawPreset = frameworkPresetsDataStatics.presets[config.framework];

  // Convert readonly preset to mutable FrameworkPreset with branded types
  const basePreset = frameworkPresetsContract.parse(rawPreset);

  // Apply user overrides to the preset
  const preset = applyOverridesTransformer({ preset: basePreset, config });

  // Convert schema field to array for consistent handling
  const schemaLibraries = Array.isArray(config.schema) ? config.schema : [config.schema];

  // Build the computed configuration - parse through contract to validate and brand types
  const result = folderConfigContract.parse({
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
  });

  // Handle routing library for frameworks that need it
  if (config.routing && result.flows) {
    // Parse routing string as PackageName through Zod contract
    const routingPackage = folderConfigContract.shape.flows.unwrap().element.parse(config.routing);

    // For frontend frameworks, add routing library to flows
    if (!result.flows.includes(routingPackage)) {
      result.flows.push(routingPackage);
    }
  }

  return result;
};
