import { questContractPropertyContract } from './quest-contract-property-contract';
import { QuestContractPropertyStub } from './quest-contract-property.stub';

describe('questContractPropertyContract', () => {
  describe('valid properties', () => {
    it('VALID: {name, type, description} => parses basic property with required fields', () => {
      const property = QuestContractPropertyStub({
        name: 'userId',
        type: 'UserId',
        description: 'The user identifier',
      });

      expect(property).toStrictEqual({
        name: 'userId',
        type: 'UserId',
        description: 'The user identifier',
      });
    });

    it('VALID: {name, type, value, description, optional} => parses property with all fields', () => {
      const property = QuestContractPropertyStub({
        name: 'method',
        type: 'HttpMethod',
        value: 'POST',
        description: 'The HTTP method for this endpoint',
        optional: false,
      });

      expect(property).toStrictEqual({
        name: 'method',
        type: 'HttpMethod',
        value: 'POST',
        description: 'The HTTP method for this endpoint',
        optional: false,
      });
    });

    it('VALID: {nested properties} => parses recursive property 2 levels deep', () => {
      const property = QuestContractPropertyStub({
        name: 'address',
        type: 'Address',
        description: 'User mailing address',
        properties: [
          {
            name: 'street',
            type: 'StreetName',
            description: 'Street address line',
          },
          {
            name: 'city',
            type: 'CityName',
            description: 'City name',
          },
        ],
      });

      expect(property).toStrictEqual({
        name: 'address',
        type: 'Address',
        description: 'User mailing address',
        properties: [
          {
            name: 'street',
            type: 'StreetName',
            description: 'Street address line',
          },
          {
            name: 'city',
            type: 'CityName',
            description: 'City name',
          },
        ],
      });
    });

    it('VALID: {deeply nested properties} => parses recursive property 3 levels deep', () => {
      const property = QuestContractPropertyStub({
        name: 'organization',
        type: 'Organization',
        description: 'Organization entity',
        properties: [
          {
            name: 'headquarters',
            type: 'Location',
            description: 'HQ location',
            properties: [
              {
                name: 'coordinates',
                type: 'GeoCoordinates',
                description: 'Geographic coordinates',
                properties: [
                  {
                    name: 'latitude',
                    type: 'Latitude',
                    description: 'Latitude value',
                  },
                  {
                    name: 'longitude',
                    type: 'Longitude',
                    description: 'Longitude value',
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(property).toStrictEqual({
        name: 'organization',
        type: 'Organization',
        description: 'Organization entity',
        properties: [
          {
            name: 'headquarters',
            type: 'Location',
            description: 'HQ location',
            properties: [
              {
                name: 'coordinates',
                type: 'GeoCoordinates',
                description: 'Geographic coordinates',
                properties: [
                  {
                    name: 'latitude',
                    type: 'Latitude',
                    description: 'Latitude value',
                  },
                  {
                    name: 'longitude',
                    type: 'Longitude',
                    description: 'Longitude value',
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe('invalid properties', () => {
    it('INVALID: {name: ""} => throws validation error', () => {
      const parseEmptyName = (): unknown =>
        questContractPropertyContract.parse({
          name: '',
          type: 'ValidType',
          description: 'Some description',
        });

      expect(parseEmptyName).toThrow(/too_small/u);
    });

    it('INVALID: {type: ""} => throws validation error', () => {
      const parseEmptyType = (): unknown =>
        questContractPropertyContract.parse({
          name: 'validName',
          description: 'Some description',
          type: '',
        });

      expect(parseEmptyType).toThrow(/too_small/u);
    });

    it('INVALID: {type: "string"} => rejects raw primitive type', () => {
      const parseRawString = (): unknown =>
        questContractPropertyContract.parse({
          name: 'validName',
          description: 'Some description',
          type: 'string',
        });

      expect(parseRawString).toThrow(/branded type reference/u);
    });

    it('INVALID: {type: "number"} => rejects raw primitive type', () => {
      const parseRawNumber = (): unknown =>
        questContractPropertyContract.parse({
          name: 'validName',
          description: 'Some description',
          type: 'number',
        });

      expect(parseRawNumber).toThrow(/branded type reference/u);
    });

    it('INVALID: {type: "String"} => rejects raw primitive type case-insensitively', () => {
      const parseUpperString = (): unknown =>
        questContractPropertyContract.parse({
          name: 'validName',
          description: 'Some description',
          type: 'String',
        });

      expect(parseUpperString).toThrow(/branded type reference/u);
    });

    it('INVALID: {type: "NUMBER"} => rejects raw primitive type case-insensitively', () => {
      const parseUpperNumber = (): unknown =>
        questContractPropertyContract.parse({
          name: 'validName',
          description: 'Some description',
          type: 'NUMBER',
        });

      expect(parseUpperNumber).toThrow(/branded type reference/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {properties: []} => parses with empty properties array', () => {
      const property = QuestContractPropertyStub({
        name: 'emptyContainer',
        type: 'Container',
        description: 'Empty container property',
        properties: [],
      });

      expect(property).toStrictEqual({
        name: 'emptyContainer',
        type: 'Container',
        description: 'Empty container property',
        properties: [],
      });
    });

    it('EDGE: {name, type, description, optional: true} => parses with required fields and optional', () => {
      const property = QuestContractPropertyStub({
        name: 'optionalField',
        type: 'FieldType',
        description: 'An optional field',
        optional: true,
      });

      expect(property).toStrictEqual({
        name: 'optionalField',
        type: 'FieldType',
        description: 'An optional field',
        optional: true,
      });
    });
  });
});
