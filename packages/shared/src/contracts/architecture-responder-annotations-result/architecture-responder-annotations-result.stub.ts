/**
 * PURPOSE: Builds a valid ArchitectureResponderAnnotationsResult for tests
 *
 * USAGE:
 * ArchitectureResponderAnnotationsResultStub();
 * // Returns a valid ArchitectureResponderAnnotationsResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ResponderAnnotationMapStub } from '../responder-annotation-map/responder-annotation-map.stub';

import { architectureResponderAnnotationsResultContract } from './architecture-responder-annotations-result-contract';
import type { ArchitectureResponderAnnotationsResult } from './architecture-responder-annotations-result-contract';

export const ArchitectureResponderAnnotationsResultStub = ({
  ...props
}: StubArgument<ArchitectureResponderAnnotationsResult> = {}): ArchitectureResponderAnnotationsResult =>
  architectureResponderAnnotationsResultContract.parse({
    responderAnnotations: ResponderAnnotationMapStub(),
    startupAnnotations: ResponderAnnotationMapStub(),
    ...props,
  });
