import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { parseErc681TransferUri } from '@suite-common/suite-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    hasBitcoinCashAddressPrefix,
    isAddressValid,
    isBech32AddressUppercase,
    isBitcoinCashAddressUppercase,
} from '@suite-common/wallet-utils';
import { type NativeAccountsRootState, selectFreshAccountAddress } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { isDebugEnv } from '@suite-native/config';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { SendFormLabelEditable } from '@suite-native/labeling';
import { useAnalytics } from '@suite-native/services';
import { HELP_CENTER_EVM_ADDRESS_CHECKSUM, HELP_CENTER_SOLANA_HELP_URL } from '@trezor/urls';

import { AddressInfoMessage } from './AddressInfoMessage';
import { QrCodeBottomSheetIcon } from './QrCodeBottomSheetIcon';
import { useAddressValidationAlerts } from '../hooks/useAddressValidationAlerts/useAddressValidationAlerts';
import { useSolAssociatedTokenAddress } from '../hooks/useAddressValidationAlerts/useSolAssociatedTokenAddress';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';

const AUTOCORRECT_MESSAGE_TIMEOUT_MS = 3000;

type AddressInputProps = {
    index: number;
    accountKey: AccountKey;
};
export const AddressInput = ({ index, accountKey }: AddressInputProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');
    const utxoLabelFieldName = getOutputFieldName(index, 'label');
    const amountFieldName = getOutputFieldName(index, 'amount');
    const tokenFieldName = getOutputFieldName(index, 'token');
    const { setValue, watch } = useFormContext<SendOutputsFormValues>();
    const analytics = useAnalytics();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { checkSolAssociatedTokenAddress, isSolATA } = useSolAssociatedTokenAddress();

    const freshAccountAddress = useSelector(
        (state: NativeAccountsRootState & TransactionsRootState) =>
            selectFreshAccountAddress(state, accountKey),
    );

    const { wasAddressChecksummed } = useAddressValidationAlerts({ inputIndex: index });

    const [autocorrectMessageId, setAutocorrectMessageId] = useState<TxKeyPath | null>(null);
    const autocorrectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showAutocorrectMessage = (messageId: TxKeyPath) => {
        setAutocorrectMessageId(messageId);
        if (autocorrectTimeoutRef.current) {
            clearTimeout(autocorrectTimeoutRef.current);
        }
        autocorrectTimeoutRef.current = setTimeout(() => {
            setAutocorrectMessageId(null);
            autocorrectTimeoutRef.current = null;
        }, AUTOCORRECT_MESSAGE_TIMEOUT_MS);
    };

    useEffect(
        () => () => {
            if (autocorrectTimeoutRef.current) {
                clearTimeout(autocorrectTimeoutRef.current);
            }
        },
        [],
    );

    // bech32 and CashAddr addresses are valid as uppercase but are not accepted by Trezor.
    // BCH addresses are also valid without the `bitcoincash:` prefix but Trezor requires it.
    // Mirror desktop behavior by silently autocorrecting these instead of rejecting the input.
    const autocorrectAddress = (newValue: string): string => {
        if (!symbol) return newValue;

        if (isBitcoinCashAddressUppercase(newValue) || isBech32AddressUppercase(newValue)) {
            const lowercased = newValue.toLowerCase();
            setValue(addressFieldName, lowercased, { shouldValidate: true });
            showAutocorrectMessage('moduleSend.outputs.recipients.address.convertedToLowercase');

            return lowercased;
        }

        if (
            symbol === 'bch' &&
            !hasBitcoinCashAddressPrefix(newValue) &&
            isAddressValid(`bitcoincash:${newValue}`, symbol)
        ) {
            const prefixed = `bitcoincash:${newValue}`;
            setValue(addressFieldName, prefixed, { shouldValidate: true });
            showAutocorrectMessage('moduleSend.outputs.recipients.address.addedBitcoincashPrefix');

            return prefixed;
        }

        return newValue;
    };

    const handleScanAddressQRCode = (qrCodeData: string) => {
        const erc681 =
            account?.networkType === 'ethereum' ? parseErc681TransferUri(qrCodeData) : null;
        if (erc681) {
            setValue(addressFieldName, erc681.recipientAddress, { shouldValidate: true });
            if (erc681.contractAddress) {
                setValue(tokenFieldName, erc681.contractAddress, { shouldDirty: true });
                const token = account?.tokens?.find(
                    t => t.contract.toLowerCase() === erc681.contractAddress!.toLowerCase(),
                );
                if (token && erc681.tokenAmount !== undefined) {
                    setValue(
                        amountFieldName,
                        convertAmountSubunitsToUnits(erc681.tokenAmount, token.decimals),
                        { shouldValidate: true },
                    );
                }
            }
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr-erc681' },
            });

            return;
        }

        const corrected = autocorrectAddress(qrCodeData);
        if (corrected === qrCodeData) {
            setValue(addressFieldName, qrCodeData, { shouldValidate: true });
        }
        if (symbol && isAddressValid(corrected, symbol)) {
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'qr' },
            });
        }
    };

    const handleChangeValue = (newValue: string) => {
        const corrected = autocorrectAddress(newValue);
        if (symbol && isAddressValid(corrected, symbol)) {
            analytics.report({
                type: events.sendAddressFilledEvent.name,
                payload: { method: 'manual' },
            });
            checkSolAssociatedTokenAddress({
                value: corrected,
                symbol,
                fieldName: addressFieldName,
            });
        }
    };

    // Debug helper to fill opened account address.
    const fillSelfAddress = () => {
        if (freshAccountAddress)
            setValue(addressFieldName, freshAccountAddress.address, {
                shouldValidate: true,
            });
    };

    const utxoLabel = watch(utxoLabelFieldName);
    const outputToken = watch(tokenFieldName);

    return (
        <VStack spacing="sp12">
            <HStack alignItems="center" justifyContent="space-between" spacing="sp12">
                <Text variant="body-sm">
                    <Translation id="moduleSend.outputs.recipients.addressLabel" />
                </Text>
                {/* Tokens labels wouldn't sync properly between desktop & mobile, so labeling is */}
                {/* turned off for tokens until it's fixed. */}
                {!outputToken && (
                    <SendFormLabelEditable
                        label={utxoLabel ?? null}
                        onLabelChange={newUtxoLabel => {
                            setValue(utxoLabelFieldName, newUtxoLabel, {
                                shouldValidate: true,
                            });
                        }}
                    />
                )}
            </HStack>
            {isDebugEnv() && (
                <Button
                    size="medium"
                    intent="neutral"
                    priority="secondary"
                    onPress={fillSelfAddress}
                >
                    DEV: self address
                </Button>
            )}
            <TextInputField
                multiline
                name={addressFieldName}
                testID={addressFieldName}
                onChangeText={handleChangeValue}
                maxLength={formInputsMaxLength.address}
                accessibilityLabel="address input"
                rightIcon={<QrCodeBottomSheetIcon onCodeScanned={handleScanAddressQRCode} />}
            />
            {wasAddressChecksummed && (
                <AddressInfoMessage
                    txId="moduleSend.outputs.recipients.checksum.label"
                    link={HELP_CENTER_EVM_ADDRESS_CHECKSUM}
                />
            )}
            {autocorrectMessageId && <AddressInfoMessage txId={autocorrectMessageId} />}
            {isSolATA && (
                <AddressInfoMessage
                    type="warning"
                    txId="moduleSend.outputs.recipients.solAssociatedAccountAddress.label"
                    link={HELP_CENTER_SOLANA_HELP_URL}
                />
            )}
        </VStack>
    );
};
