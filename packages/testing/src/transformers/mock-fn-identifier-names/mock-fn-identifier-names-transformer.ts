/**
 * PURPOSE: Computes a registerMock({fn}) call's identifierNames/objectIdentifierNames pair. A bare
 * named import (`fn: join`) selectively mocks just that one function; a property access
 * (`fn: X.method`) instead records X's own export name (falling back to the local identifier when
 * none was resolved) so the codegen auto-mocks every one of X's OWN methods instead of replacing
 * X's single accessed method with a flat `X: jest.fn()`.
 *
 * USAGE:
 * mockFnIdentifierNamesTransformer({exportName: 'join', isPropertyAccess: false, rootIdentifier: 'join'});
 * // Returns {identifierNames: ['join'], objectIdentifierNames: []}
 */

import { mockCallContract } from '../../contracts/mock-call/mock-call-contract';
import type { IdentifierName } from '../../contracts/identifier-name/identifier-name-contract';

const mockFnIdentifierNamesContract = mockCallContract.pick({
  identifierNames: true,
  objectIdentifierNames: true,
});

export const mockFnIdentifierNamesTransformer = ({
  exportName,
  isPropertyAccess,
  rootIdentifier,
}: {
  exportName: IdentifierName | undefined;
  isPropertyAccess: boolean;
  rootIdentifier: IdentifierName;
}): ReturnType<typeof mockFnIdentifierNamesContract.parse> =>
  mockFnIdentifierNamesContract.parse({
    identifierNames: exportName && !isPropertyAccess ? [exportName] : [],
    objectIdentifierNames: isPropertyAccess ? [exportName ?? rootIdentifier] : [],
  });
