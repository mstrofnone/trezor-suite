import { type NetworkSymbol } from '@suite-common/wallet-config';

import {
    hasBitcoinCashAddressPrefix,
    isAddressValid,
    isBech32AddressUppercase,
    isBitcoinCashAddressUppercase,
} from './addressValidation';

export type AddressCorrection =
    | { corrected: string; type: 'lowercase' }
    | { corrected: string; type: 'bchPrefix' }
    | null;

// Bech32 and CashAddr addresses are valid as uppercase but are not accepted by Trezor.
// BCH addresses require the `bitcoincash:` prefix.
export const autocorrectAddress = (address: string, symbol: NetworkSymbol): AddressCorrection => {
    if (isBitcoinCashAddressUppercase(address) || isBech32AddressUppercase(address)) {
        return { corrected: address.toLowerCase(), type: 'lowercase' };
    }

    if (
        symbol === 'bch' &&
        !hasBitcoinCashAddressPrefix(address) &&
        isAddressValid(`bitcoincash:${address}`, symbol)
    ) {
        return { corrected: `bitcoincash:${address}`, type: 'bchPrefix' };
    }

    return null;
};
