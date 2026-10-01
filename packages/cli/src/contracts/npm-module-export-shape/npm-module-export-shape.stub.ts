import type { z } from '#gateway/npm/zod';

import {
  npmModuleExportShapeContract,
  type NpmModuleExportShape,
} from './npm-module-export-shape-contract';

type NpmModuleExportShapeInput = z.input<typeof npmModuleExportShapeContract>;

export const NpmModuleExportShapeStub = ({
  value,
}: { value?: NpmModuleExportShapeInput } = {}): NpmModuleExportShape =>
  npmModuleExportShapeContract.parse(value ?? 'named');
