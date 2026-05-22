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
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;
    const providerName = provider?.brandName ?? provider?.companyName;

    return (
        <Wrapper className={className} data-testid="@trading/offers/quote/provider">
            {provider ? (
                <>
                    {provider.logo && (
                        <Row alignItems="center" justifyContent="center">
                            <TradingIcon
                                iconUrl={invityAPI.getProviderLogoUrl(provider.logo)}
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
