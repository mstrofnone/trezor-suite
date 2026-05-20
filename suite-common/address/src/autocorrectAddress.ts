import { type NetworkSymbol } from '@suite-common/wallet-config';

import { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';
import { isAddressValid } from './isAddressValid';
import { isBech32AddressUppercase } from './isBech32AddressUppercase';
import { isBitcoinCashAddressUppercase } from './isBitcoinCashAddressUppercase';

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
