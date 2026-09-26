import { gatewayPureReexportStatementTypesStatics } from './gateway-pure-reexport-statement-types-statics';

describe('gatewayPureReexportStatementTypesStatics', () => {
  it('VALID: {} => lists the three self-sufficient pure-reexport statement types', () => {
    expect(gatewayPureReexportStatementTypesStatics).toStrictEqual({
      types: ['ExportAllDeclaration', 'TSExportAssignment', 'TSImportEqualsDeclaration'],
    });
  });
});
