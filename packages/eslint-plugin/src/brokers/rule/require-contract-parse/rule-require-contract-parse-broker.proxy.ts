import { contractIndexBuildBrokerProxy } from '@dungeonmaster/shared/brokers/contract-index/build/contract-index-build-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

export const ruleRequireContractParseBrokerProxy = (): {
  setupProject: ({
    parsedContractText,
    lonelyContractText,
    parsingBrokerText,
    functionTypesContractText,
    dataTypeContractText,
    driftedTypeContractText,
  }: {
    parsedContractText: string;
    lonelyContractText: string;
    parsingBrokerText: string;
    functionTypesContractText: string;
    dataTypeContractText: string;
    driftedTypeContractText: string;
  }) => void;
} => {
  const buildProxy = contractIndexBuildBrokerProxy();
  const packageDir = AbsoluteFilePathStub({ value: '/project/packages/alpha' });
  const srcDir = AbsoluteFilePathStub({ value: '/project/packages/alpha/src' });
  const contractsDir = AbsoluteFilePathStub({ value: '/project/packages/alpha/src/contracts' });
  const brokersDir = AbsoluteFilePathStub({ value: '/project/packages/alpha/src/brokers' });

  return {
    setupProject: ({
      parsedContractText,
      lonelyContractText,
      parsingBrokerText,
      functionTypesContractText,
      dataTypeContractText,
      driftedTypeContractText,
    }: {
      parsedContractText: string;
      lonelyContractText: string;
      parsingBrokerText: string;
      functionTypesContractText: string;
      dataTypeContractText: string;
      driftedTypeContractText: string;
    }): void => {
      buildProxy.setupSubfolders({
        dirPath: AbsoluteFilePathStub({ value: '/project/packages' }),
        folders: ['alpha'],
      });
      buildProxy.setupPackageJson({ packageDir, json: '{"name":"@project/alpha"}' });
      buildProxy.setupWalkedFolder({ dirPath: packageDir, folders: ['src'], files: [] });
      buildProxy.setupWalkedFolder({
        dirPath: srcDir,
        folders: ['contracts', 'brokers'],
        files: [],
      });
      buildProxy.setupWalkedFolder({
        dirPath: contractsDir,
        folders: ['thing', 'lonely', 'handler', 'plain', 'drifted'],
        files: [],
      });
      buildProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/thing` }),
        folders: [],
        files: ['thing-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/lonely` }),
        folders: [],
        files: ['lonely-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/handler` }),
        folders: [],
        files: ['handler-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/plain` }),
        folders: [],
        files: ['plain-contract.ts'],
      });
      buildProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/drifted` }),
        folders: [],
        files: ['drifted-contract.ts'],
      });
      buildProxy.setupWalkedFolder({ dirPath: brokersDir, folders: ['use'], files: [] });
      buildProxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${brokersDir}/use` }),
        folders: [],
        files: ['use-broker.ts'],
      });
      buildProxy.setupSourceText({
        filePath: AbsoluteFilePathStub({ value: `${contractsDir}/thing/thing-contract.ts` }),
        text: parsedContractText,
      });
      buildProxy.setupSourceText({
        filePath: AbsoluteFilePathStub({ value: `${contractsDir}/lonely/lonely-contract.ts` }),
        text: lonelyContractText,
      });
      buildProxy.setupSourceText({
        filePath: AbsoluteFilePathStub({ value: `${contractsDir}/handler/handler-contract.ts` }),
        text: functionTypesContractText,
      });
      buildProxy.setupSourceText({
        filePath: AbsoluteFilePathStub({ value: `${contractsDir}/plain/plain-contract.ts` }),
        text: dataTypeContractText,
      });
      buildProxy.setupSourceText({
        filePath: AbsoluteFilePathStub({ value: `${contractsDir}/drifted/drifted-contract.ts` }),
        text: driftedTypeContractText,
      });
      buildProxy.setupSourceText({
        filePath: AbsoluteFilePathStub({ value: `${brokersDir}/use/use-broker.ts` }),
        text: parsingBrokerText,
      });
    },
  };
};
