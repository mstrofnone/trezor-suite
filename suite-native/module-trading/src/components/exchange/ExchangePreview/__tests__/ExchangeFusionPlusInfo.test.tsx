import type { ExchangeProviderInfo } from 'invity-api';

import { getTranslation } from '@suite-native/intl';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangeFusionPlusInfo } from '../ExchangeFusionPlusInfo';

describe('ExchangeFusionPlusInfo', () => {
    const fusionProviderInfos = {
        ['1inchfusionplus']: {
            name: '1inchfusionplus',
            companyName: '1inch Fusion+',
            logo: '1inch.svg',
            isActive: true,
            buyTickers: [],
            sellTickers: [],
            statusUrl: '',
            supportUrl: '',
            termsUrl: '',
            isDex: true,
            isFixedRate: false,
            kycPolicyType: 'DEX',
            addressFormats: {},
        },
        ['1inchfusion']: {
            name: '1inchfusion',
            companyName: '1inch Fusion',
            logo: '1inch.svg',
            isActive: true,
            buyTickers: [],
            sellTickers: [],
            statusUrl: '',
            supportUrl: '',
            termsUrl: '',
            isDex: true,
            isFixedRate: false,
            kycPolicyType: 'DEX',
            addressFormats: {},
        },
    } satisfies Record<string, ExchangeProviderInfo>;

    const renderExchangeFusionPlusInfo = (exchange: string) =>
        renderWithTradingProvider(<ExchangeFusionPlusInfo exchange={exchange} />, {
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            exchangeInfo: {
                                providerInfos: fusionProviderInfos,
                            },
                        },
                    },
                },
            },
        });

    it('should render the canonical Fusion+ name when exchange is 1inchfusionplus', () => {
        const { getByText } = renderExchangeFusionPlusInfo('1inchfusionplus');

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.title', {
                    providerName: '1inch Fusion+',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should render the canonical Fusion name (without +) when exchange is 1inchfusion', () => {
        const { getByText } = renderExchangeFusionPlusInfo('1inchfusion');

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.title', {
                    providerName: '1inch Fusion',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should render all three bullet points', () => {
        const { getByText } = renderExchangeFusionPlusInfo('1inchfusionplus');

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet1'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet2'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.fusionPlusInfo.bullet3'),
            ),
        ).toBeOnTheScreen();
    });
});
