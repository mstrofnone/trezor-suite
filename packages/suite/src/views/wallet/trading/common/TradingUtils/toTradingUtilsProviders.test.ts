import { toTradingUtilsProviders } from './toTradingUtilsProviders';

describe(toTradingUtilsProviders.name, () => {
    it('returns undefined when provider has no name', () => {
        expect(toTradingUtilsProviders({})).toBeUndefined();
        expect(toTradingUtilsProviders({ logo: 'x.png', companyName: 'X' })).toBeUndefined();
    });

    it('maps full provider data', () => {
        expect(
            toTradingUtilsProviders({
                name: 'changelly',
                companyName: 'Changelly',
                logo: 'changelly.png',
            }),
        ).toEqual({
            changelly: { logo: 'changelly.png', companyName: 'Changelly' },
        });
    });

    it('falls back to name when companyName is missing', () => {
        expect(toTradingUtilsProviders({ name: 'changelly', logo: 'changelly.png' })).toEqual({
            changelly: { logo: 'changelly.png', companyName: 'changelly' },
        });
    });

    it('falls back to empty string when logo is missing', () => {
        expect(toTradingUtilsProviders({ name: 'changelly', companyName: 'Changelly' })).toEqual({
            changelly: { logo: '', companyName: 'Changelly' },
        });
    });
});
