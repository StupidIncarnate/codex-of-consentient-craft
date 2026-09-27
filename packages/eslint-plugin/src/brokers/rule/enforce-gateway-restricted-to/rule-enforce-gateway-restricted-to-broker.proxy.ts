// Pure rule: gatewayCallerPackageNameTransformer reads only the linted file's own path, and options
// come from the RuleTester case — no dependency to mock.
export const ruleEnforceGatewayRestrictedToBrokerProxy = (): Record<PropertyKey, never> => ({});
