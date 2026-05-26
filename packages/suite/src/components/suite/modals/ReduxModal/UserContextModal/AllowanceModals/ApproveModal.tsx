import { FormProvider } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import {
    Banner,
    Box,
    CardList,
    CollapsibleBox,
    Column,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { borders } from '@trezor/theme';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useAllowanceModal } from 'src/hooks/wallet/allowance';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';
import { TradingUtilsProvider } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsProvider';
import { toTradingUtilsProviders } from 'src/views/wallet/trading/common/TradingUtils/toTradingUtilsProviders';

import type { AllowanceModalProvider, ProviderLogoSourceType } from './AllowanceModalProviderInfo';
import { ApproveModalTypeSelector } from './ApproveModalTypeSelector';

interface ApproveModalProps {
    amount: string;
    cryptoId: CryptoId;
    account: Account;
    provider: AllowanceModalProvider;
    spender: string;
    logoSourceType?: ProviderLogoSourceType;
    preapprovedAmount?: string;
    onSelectApprovalType?: (type: DexApprovalType) => void;
    onConfirm?: (approvalType: DexApprovalType) => void;
    onCancel?: () => void;
}

export const ApproveModal = (props: ApproveModalProps) => {
    const { account, provider, spender, cryptoId, preapprovedAmount, logoSourceType } = props;
    const { device } = useDevice();
    const { handleClick, disabled: isConfirmInProgress } = useAsyncClickHandler();
    const context = useAllowanceModal({ ...props, type: 'APPROVE' });
    const isDebug = useSelector(selectIsDebugModeActive);

    const {
        inputAmount,
        feeInfo,
        token,
        approvalType,
        isLoading,
        composedLevels,
        composedLevelsError,
        canSubmit,
        data,
        methods,
        selectApprovalType,
        handleClose,
        handleFeeChange,
        confirmAndSend,
    } = context;

    if (!token?.symbol) return null;

    const displaySymbol = getDisplaySymbol(token.symbol, token.contract);
    const hasPreapprovedAmount = !!preapprovedAmount && preapprovedAmount !== '0';
    const isPreapprovedAmountUnlimited =
        hasPreapprovedAmount && isAllowanceUnlimited(preapprovedAmount, token.decimals);

    return (
        <FormProvider {...methods}>
            <Modal
                onCancel={handleClose}
                intent="brand"
                width={480}
                heading={
                    <Translation
                        id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING"
                        values={{ displaySymbol: getDisplaySymbol(token.symbol, token.contract) }}
                    />
                }
                description={
                    <Translation
                        id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING_DESCRIPTION"
                        values={{
                            displaySymbol: getDisplaySymbol(token.symbol, token.contract),
                            provider: provider.companyName,
                        }}
                    />
                }
                bottomContent={
                    <>
                        <Modal.Button
                            isLoading={isLoading || isConfirmInProgress}
                            isDisabled={!device?.connected || !canSubmit || isConfirmInProgress}
                            onClick={() => handleClick(confirmAndSend)}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>

                        <Modal.Button intent="neutral" priority="secondary" onClick={handleClose}>
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <Column gap={8}>
                    {hasPreapprovedAmount && (
                        <Banner
                            intent="info"
                            icon="info"
                            description={
                                <Translation id="TR_EXCHANGE_APPROVAL_MODAL_APPROVE_BANNER" />
                            }
                        />
                    )}
                    <CardList borderRadius={borders.radii.sm}>
                        <CardList.Item isDisabled>
                            <Text typographyStyle="body-sm">
                                <Translation id="TR_ACCOUNT" />
                            </Text>
                            <Row gap={8}>
                                <NetworkIcon networkSymbol={account.symbol} size={20} />
                                <AccountLabeling
                                    account={account}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                    typographyStyle="body-sm"
                                />
                            </Row>
                        </CardList.Item>
                        <CardList.Item isDisabled>
                            <Text typographyStyle="body-sm">
                                <Translation id={provider.label ?? 'TR_TRADING_PROVIDER'} />
                            </Text>
                            <Column alignItems="flex-end" gap={2}>
                                <TradingUtilsProvider
                                    exchange={provider.name}
                                    providers={toTradingUtilsProviders(provider)}
                                    typographyStyle="body-sm"
                                    logoSourceType={logoSourceType}
                                />
                                {logoSourceType === 'url' && (
                                    <Text
                                        typographyStyle="body-xs"
                                        intent="neutral"
                                        priority="secondary"
                                        wordBreak="break-all"
                                    >
                                        {spender}
                                    </Text>
                                )}
                            </Column>
                        </CardList.Item>
                        {hasPreapprovedAmount && (
                            <CardList.Item isDisabled>
                                <Text typographyStyle="body-sm">
                                    <Translation id="TR_EXCHANGE_APPROVAL_CURRENT_LIMIT" />
                                </Text>
                                <Row gap={8}>
                                    <TradingCoinLogo cryptoId={cryptoId} size={20} />
                                    <Text typographyStyle="body-sm-strong">
                                        {isPreapprovedAmountUnlimited ? (
                                            <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
                                        ) : (
                                            `${preapprovedAmount} ${displaySymbol}`
                                        )}
                                    </Text>
                                </Row>
                            </CardList.Item>
                        )}
                        <ApproveModalTypeSelector
                            approvalType={approvalType}
                            isLoading={isLoading}
                            data={data}
                            cryptoId={cryptoId}
                            onSelect={selectApprovalType}
                            provider={provider}
                            token={token}
                            displayAmount={inputAmount}
                            hasPreapprovedAmount={hasPreapprovedAmount}
                        />
                    </CardList>

                    {isDebug && (
                        <CollapsibleBox
                            heading={
                                <Text typographyStyle="body-sm">
                                    <DebugOnlyBadge>
                                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                                    </DebugOnlyBadge>
                                </Text>
                            }
                            toggleIconName="caretDown"
                            toggleIconSize={20}
                        >
                            <Text wordBreak="break-all" isMonospaced>
                                {data}
                            </Text>
                        </CollapsibleBox>
                    )}

                    <Column gap={12}>
                        <Box
                            padding={{ horizontal: 20, vertical: 12 }}
                            borderWidth={borders.widths.small}
                            borderRadius={borders.radii.sm}
                            backgroundColor="surfaceFillRaised"
                        >
                            <Fees
                                label="TR_TX_FEE"
                                feeInfo={feeInfo}
                                account={account}
                                composedLevels={composedLevels}
                                changeFeeLevel={handleFeeChange}
                                headerTypographyStyle="body-sm"
                            />
                        </Box>

                        {composedLevelsError && (
                            <Banner
                                intent="critical"
                                icon="warning"
                                description={
                                    <Translation
                                        id={composedLevelsError.id}
                                        values={composedLevelsError.values}
                                    />
                                }
                            />
                        )}
                    </Column>
                </Column>
            </Modal>
        </FormProvider>
    );
};
