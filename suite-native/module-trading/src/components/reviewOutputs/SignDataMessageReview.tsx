import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import {
    getUnusedAddressFromAccount,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { Card, Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

type TypedDataDomain = {
    name?: string;
    version?: string;
    chainId?: number | bigint | string;
    verifyingContract?: string;
    salt?: ArrayBuffer | string;
};

type TypedDataPayload = {
    domain?: TypedDataDomain;
    primaryType?: string;
    message?: Record<string, unknown>;
};

// Ported verbatim from packages/suite SignMessageModal.simplifyJSON so the mobile
// review presents EIP-712 data in the same flattened form as desktop. JSON.stringify
// can't serialize bigints natively, so they're stringified via a reviver.
const simplifyJSON = (object: unknown): string => {
    if (object === undefined || object === null) {
        return '';
    }

    return JSON.stringify(
        object,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2,
    )
        .replace(/[{}",[\]]/g, '')
        .replace(/^\s{2}/gm, '')
        .replace(/\n\s*\n/gm, '\n')
        .trim();
};

const formatMessageValue = (value: unknown): string => {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    if (typeof value === 'object') {
        return simplifyJSON(value);
    }

    return String(value);
};

type SignDataCardProps = {
    titleId: TxKeyPath;
    children: ReactNode;
};

const SignDataCard = ({ titleId, children }: SignDataCardProps) => (
    <Card>
        <VStack spacing="sp8">
            <Text variant="body-sm-strong">
                <Translation id={titleId} />
            </Text>
            <Text variant="body-sm" selectable>
                {children}
            </Text>
        </VStack>
    </Card>
);

type MessageFieldRowProps = {
    label: string;
    value: unknown;
};

const MessageFieldRow = ({ label, value }: MessageFieldRowProps) => (
    <VStack spacing="sp2">
        <Text variant="body-xs" color="contentSecondary">
            {label}
        </Text>
        <Text variant="body-sm" selectable>
            {formatMessageValue(value)}
        </Text>
    </VStack>
);

const MessageCard = ({ message }: { message: Record<string, unknown> }) => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="body-sm-strong">
                <Translation id="moduleTrading.tradingReviewOutputs.signData.message" />
            </Text>
            {Object.entries(message).map(([key, value]) => (
                <MessageFieldRow key={key} label={key} value={value} />
            ))}
        </VStack>
    </Card>
);

export const SignDataMessageReview = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const signData = quote?.signData;

    if (!signData || signData.type !== 'eip712-typed-data') {
        return null;
    }

    const data =
        signData.data && typeof signData.data === 'object'
            ? (signData.data as TypedDataPayload)
            : {};
    const { domain, message } = data;
    const signerAddress = (() => {
        if (!sendAccount) return undefined;
        try {
            return getUnusedAddressFromAccount(sendAccount).address;
        } catch (error) {
            console.warn('Failed to get signer address:', error);

            return undefined;
        }
    })();

    return (
        <VStack spacing="sp12">
            <Text variant="body-md-strong">
                <Translation id="moduleTrading.tradingReviewOutputs.signData.heading" />
            </Text>
            {signerAddress && (
                <Card>
                    <VStack spacing="sp8">
                        <Text variant="body-sm-strong">
                            <Translation id="moduleTrading.tradingReviewOutputs.signData.address" />
                        </Text>
                        <AddressFormatter
                            value={signerAddress}
                            format="full"
                            variant="body-sm"
                            selectable
                        />
                    </VStack>
                </Card>
            )}
            {domain && (
                <SignDataCard titleId="moduleTrading.tradingReviewOutputs.signData.domain">
                    {simplifyJSON(domain)}
                </SignDataCard>
            )}
            {message && <MessageCard message={message} />}
        </VStack>
    );
};
