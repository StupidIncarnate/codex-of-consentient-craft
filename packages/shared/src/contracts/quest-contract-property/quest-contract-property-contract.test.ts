import { questContractPropertyContract } from './quest-contract-property-contract';
import { QuestContractPropertyStub } from './quest-contract-property.stub';

describe('questContractPropertyContract', () => {
  describe('valid properties', () => {
    it('VALID: {name} => parses basic property with just name', () => {
      const property = QuestContractPropertyStub({
        name: 'userId',
      });

      expect(property).toStrictEqual({
        name: 'userId',
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
          },
        ],
      });
    });

    it('VALID: {deeply nested properties} => parses recursive property 3 levels deep', () => {
      const property = QuestContractPropertyStub({
        name: 'organization',
        type: 'Organization',
        properties: [
          {
            name: 'headquarters',
            type: 'Location',
            properties: [
              {
                name: 'coordinates',
                type: 'GeoCoordinates',
                properties: [
                  {
                    name: 'latitude',
                    type: 'Latitude',
                  },
                  {
                    name: 'longitude',
                    type: 'Longitude',
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
        properties: [
          {
            name: 'headquarters',
            type: 'Location',
            properties: [
              {
                name: 'coordinates',
                type: 'GeoCoordinates',
                properties: [
                  {
                    name: 'latitude',
                    type: 'Latitude',
                  },
                  {
                    name: 'longitude',
                    type: 'Longitude',
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
    it('INVALID_NAME: {name: ""} => throws validation error', () => {
      const parseEmptyName = (): unknown =>
        questContractPropertyContract.parse({
          name: '',
        });

      expect(parseEmptyName).toThrow(/too_small/u);
    });

    it('INVALID_TYPE: {type: ""} => throws validation error', () => {
      const parseEmptyType = (): unknown =>
        questContractPropertyContract.parse({
          name: 'validName',
          type: '',
        });

      expect(parseEmptyType).toThrow(/too_small/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {properties: []} => parses with empty properties array', () => {
      const property = QuestContractPropertyStub({
        name: 'emptyContainer',
        properties: [],
      });

      expect(property).toStrictEqual({
        name: 'emptyContainer',
        properties: [],
      });
    });

    it('EDGE: {name, optional: true} => parses with only name and optional', () => {
      const property = QuestContractPropertyStub({
        name: 'optionalField',
        optional: true,
      });

      expect(property).toStrictEqual({
        name: 'optionalField',
        optional: true,
      });
    });
  });
});
