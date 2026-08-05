import { questTypeOptionsStatics } from './quest-type-options-statics';

describe('questTypeOptionsStatics', () => {
  it('VALID: exported value => matches the full expected object', () => {
    expect(questTypeOptionsStatics).toStrictEqual({
      options: [
        { label: 'Create Feature', questType: 'feature' },
        { label: 'Create Bug', questType: 'bug-hunt' },
      ],
      defaultLabel: 'Create Feature',
    });
  });

  it('VALID: defaultLabel => names one of the offered options', () => {
    const matching = questTypeOptionsStatics.options.filter(
      (option) => option.label === questTypeOptionsStatics.defaultLabel,
    );

    expect(matching).toStrictEqual([{ label: 'Create Feature', questType: 'feature' }]);
  });
});
