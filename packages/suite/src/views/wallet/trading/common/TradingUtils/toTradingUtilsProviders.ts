import { type TradingUtilsProvidersProps } from '@suite-common/trading';

type PartialProvider = {
    name?: string;
    logo?: string;
    companyName?: string;
};

// TradingUtilsProvider requires logo + companyName; this fills in fallbacks
// for callers whose provider data has them as optional. Returns undefined when
// name is missing, since name is the lookup key.
export const toTradingUtilsProviders = (
    provider: PartialProvider,
): TradingUtilsProvidersProps | undefined => {
    if (!provider.name) return undefined;

    return {
        [provider.name]: {
            logo: provider.logo ?? '',
            companyName: provider.companyName ?? provider.name,
        },
    };
};
