import { memo } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { BulletListItem, Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoHeader, TradeInfoRow } from '@suite-native/trading-atoms';

export type ExchangeFusionPlusInfoProps = {
    exchange?: string;
};

export const ExchangeFusionPlusInfo = memo(({ exchange }: ExchangeFusionPlusInfoProps) => {
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, exchange, 'exchange'),
    );
    const providerName = provider?.companyName ?? exchange ?? '';

    return (
        <Card noPadding>
            <TradeInfoHeader
                title={
                    <Translation
                        id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.title"
                        values={{ providerName }}
                    />
                }
            />
            <TradeInfoRow>
                <VStack>
                    <BulletListItem variant="body-sm">
                        <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet1" />
                    </BulletListItem>
                    <BulletListItem variant="body-sm">
                        <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet2" />
                    </BulletListItem>
                    <BulletListItem variant="body-sm">
                        <Translation id="moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet3" />
                    </BulletListItem>
                </VStack>
            </TradeInfoRow>
        </Card>
    );
});
