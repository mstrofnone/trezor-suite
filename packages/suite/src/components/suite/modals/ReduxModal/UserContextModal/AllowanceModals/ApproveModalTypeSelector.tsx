import { useRef } from 'react';

import { type CryptoId, type DexApprovalType } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type AmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import {
    CardList,
    Column,
    Icon,
    Paragraph,
    Popover,
    type PopoverRef,
    Row,
    Text,
} from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

import type { AllowanceModalProvider } from './AllowanceModalProviderInfo';

// Popover does not have a box-shadow by default, but the design requires it, so we create a styled version of it here
// eslint-disable-next-line local-rules/no-override-ds-component
const StyledPopover = styled(Popover)`
    box-shadow: ${({ theme }) => theme.boxShadowBase};
`;

interface ApproveModalTypeSelectorProps {
    approvalType: DexApprovalType;
    isLoading: boolean;
    data: string;
    cryptoId: CryptoId;
    onSelect: (type: DexApprovalType) => void;
    provider: AllowanceModalProvider;
    token: TokenInfo;
    displayAmount: AmountSubunit;
    hasPreapprovedAmount: boolean;
}

type SelectableType = Extract<DexApprovalType, 'INFINITE' | 'MINIMAL'>;

const TYPE_LABEL_ID = {
    INFINITE: 'TR_EXCHANGE_APPROVAL_VALUE_INFINITE',
    MINIMAL: 'TR_EXCHANGE_APPROVAL_VALUE_MINIMAL',
} as const satisfies Record<SelectableType, string>;

const TYPE_INFO_ID = {
    INFINITE: 'TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO',
    MINIMAL: 'TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO',
} as const satisfies Record<SelectableType, string>;

const toSelectable = (type: DexApprovalType): SelectableType =>
    type === 'INFINITE' ? 'INFINITE' : 'MINIMAL';

export const ApproveModalTypeSelector = ({
    approvalType,
    isLoading,
    cryptoId,
    onSelect,
    provider,
    token,
    displayAmount,
    hasPreapprovedAmount,
}: ApproveModalTypeSelectorProps) => {
    const popoverRef = useRef<PopoverRef>(null);
    const displaySymbol = token.symbol ? getDisplaySymbol(token.symbol) : token.name;

    const translationValues = {
        value: subunitsToUnits({ value: displayAmount, decimals: token.decimals }).toString(),
        send: displaySymbol,
        provider: provider.name,
    };

    const handleSelect = (type: DexApprovalType) => {
        onSelect(type);
        popoverRef.current?.close();
    };

    const renderDetails = (type: SelectableType) => (
        <>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={TYPE_INFO_ID[type]} values={translationValues} />
            </Paragraph>
            {type === 'INFINITE' && (
                <Text intent="warning" typographyStyle="body-sm">
                    <Row gap={8}>
                        <Icon name="warning" size={16} />
                        <Translation
                            id="TR_EXCHANGE_APPROVAL_REVOKE_UNLIMITED_SPENDING_WARNING"
                            values={{ displaySymbol }}
                        />
                    </Row>
                </Text>
            )}
        </>
    );

    const renderOption = (type: SelectableType) => (
        <CardList.Item key={type} onClick={() => handleSelect(type)} width="100%">
            <Column gap={4} flex="1" alignItems="flex-start">
                <Row gap={8}>
                    <TradingCoinLogo cryptoId={cryptoId} size={20} />
                    <Text typographyStyle="body-sm-strong">
                        <Translation id={TYPE_LABEL_ID[type]} values={translationValues} />
                    </Text>
                </Row>
                {renderDetails(type)}
            </Column>
        </CardList.Item>
    );

    const selectedType = toSelectable(approvalType);
    const trigger = (
        <CardList.Item isDisabled={isLoading} width="100%">
            <Column gap={4} flex="1">
                <Row justifyContent="space-between" width="100%" gap={12}>
                    <Text typographyStyle="body-sm">
                        <Translation
                            id={
                                hasPreapprovedAmount
                                    ? 'TR_EXCHANGE_APPROVAL_NEW_LIMIT'
                                    : 'TR_EXCHANGE_APPROVAL_LIMIT'
                            }
                        />
                    </Text>
                    <Row gap={8}>
                        <TradingCoinLogo cryptoId={cryptoId} size={20} />
                        <Text typographyStyle="body-sm-strong">
                            <Translation
                                id={TYPE_LABEL_ID[selectedType]}
                                values={translationValues}
                            />
                        </Text>
                        <Icon name="caretDown" size={20} color="contentSecondary" />
                    </Row>
                </Row>
                {renderDetails(selectedType)}
            </Column>
        </CardList.Item>
    );

    if (isLoading) {
        return trigger;
    }

    return (
        <StyledPopover
            ref={popoverRef}
            placement={{ position: 'bottom', alignment: 'end' }}
            zIndex={zIndices.modal + 1}
            popoverOffset={-60}
            content={
                <CardList width={420}>
                    {renderOption('MINIMAL')}
                    {renderOption('INFINITE')}
                </CardList>
            }
        >
            {trigger}
        </StyledPopover>
    );
};
