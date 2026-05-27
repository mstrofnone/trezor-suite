import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    calculateTotalGasCost,
    evmHexToBigNumber,
    hexToWei,
    weiToGwei,
} from '@suite-common/wallet-utils';

type ParsedUnsignedEvmTransaction = NonNullable<
    ReturnType<typeof parseUnsignedEvmTransactionForSigning>
>;

const buildPrecomposedTransaction = (
    tx: ParsedUnsignedEvmTransaction,
): PrecomposedTransactionFinal | null => {
    const gasPriceHex = tx.maxFeePerGas ?? tx.gasPrice;

    if (!gasPriceHex) {
        return null;
    }

    const gasLimit = evmHexToBigNumber(tx.gasLimit).toFixed(0);
    const gasPrice = evmHexToBigNumber(gasPriceHex).toFixed(0);
    const feePerByte = weiToGwei(hexToWei(gasPriceHex));
    const fee = calculateTotalGasCost(gasPrice, gasLimit);
    const eip1559Fields: Partial<
        Pick<PrecomposedTransactionFinal, 'maxFeePerGas' | 'maxPriorityFeePerGas'>
    > =
        tx.maxFeePerGas && tx.maxPriorityFeePerGas
            ? {
                  maxFeePerGas: weiToGwei(hexToWei(tx.maxFeePerGas)),
                  maxPriorityFeePerGas: weiToGwei(hexToWei(tx.maxPriorityFeePerGas)),
              }
            : {};

    return {
        type: 'final',
        fee,
        feePerByte,
        feeLimit: gasLimit,
        totalSpent: fee,
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
        ...eip1559Fields,
    };
};

export const buildYieldDepositFeePreview = (
    unsignedTransaction: string,
): PrecomposedTransactionFinal | null => {
    const tx = parseUnsignedEvmTransactionForSigning(unsignedTransaction);

    if (!tx) {
        return null;
    }

    return buildPrecomposedTransaction(tx);
};
