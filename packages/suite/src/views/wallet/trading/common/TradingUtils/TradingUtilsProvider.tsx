import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type TradingUtilsProvidersProps, invityAPI } from '@suite-common/trading';
import { Row, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { TradingIcon } from '../TradingIcon';

interface TradingUtilsProviderProps {
    exchange?: string;
    className?: string;
    providers?: TradingUtilsProvidersProps;
    typographyStyle?: TypographyStyle;
    // 'invity-api-path' (default) wraps provider.logo with invityAPI.getProviderLogoUrl;
    // 'url' uses provider.logo verbatim (for non-Invity providers like yield vaults).
    logoSourceType?: 'invity-api-path' | 'url';
}

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1.5rem auto;
    gap: 0.5rem;
`;

export const TradingUtilsProvider = ({
    exchange,
    providers,
    className,
    typographyStyle,
    logoSourceType = 'invity-api-path',
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;
    const providerName = provider?.brandName ?? provider?.companyName;
    const getProviderLogoUrl = () => {
        if (!provider?.logo) return null;
        if (logoSourceType === 'url') return provider.logo;

        return invityAPI.getProviderLogoUrl(provider.logo);
    };
    const providerLogoUrl = getProviderLogoUrl();

    return (
        <Wrapper className={className} data-testid="@trading/offers/quote/provider">
            {provider ? (
                <>
                    {providerLogoUrl && (
                        <Row alignItems="center" justifyContent="center">
                            <TradingIcon
                                iconUrl={providerLogoUrl}
                                maxHeight={typographyStyle === 'body-sm' ? 20 : undefined}
                            />
                        </Row>
                    )}
                    <Text typographyStyle={typographyStyle}>{providerName}</Text>
                </>
            ) : (
                <Text typographyStyle={typographyStyle}>
                    {exchange ? exchange : <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}
                </Text>
            )}
        </Wrapper>
    );
};
