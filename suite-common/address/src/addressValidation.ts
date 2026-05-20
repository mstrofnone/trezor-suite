import { type NetworkSymbol, getTestnetSymbols } from '@suite-common/wallet-config';
import { getAddressType, validate } from '@trezor/address-validator';

const getAddressNetworkType = (symbol: NetworkSymbol, address: string) => {
    if (symbol === 'regtest') return symbol;
    const testnets = getTestnetSymbols();

    if (symbol === 'ada' && address.startsWith('stake')) return 'stake';

    return testnets.includes(symbol) ? 'testnet' : 'prod';
};

const getCoinFromTestnet = (symbol: NetworkSymbol) => {
    switch (symbol) {
        case 'test':
        case 'regtest':
            return 'btc';
        case 'txrp':
            return 'xrp';
        case 'txlm':
            return 'xlm';
        case 'dsol':
            return 'sol';
        case 'tsep':
        case 'thod':
            return 'eth';
        default:
            return symbol;
    }
};

export const isAddressValid = (address: string, symbol: NetworkSymbol) => {
    const networkType = getAddressNetworkType(symbol, address);
    const updatedSymbol = getCoinFromTestnet(symbol);

    return validate(address, updatedSymbol.toUpperCase(), networkType);
};

export const isAddressDeprecated = (address: string, symbol: NetworkSymbol) => {
    // catch deprecated address formats
    // LTC starting with "3" and valid with a BTC format
    if (symbol === 'ltc' && address.startsWith('3') && isAddressValid(address, 'btc')) {
        return 'LTC_ADDRESS_INFO_URL';
    }
    // BCH starting with "1" and valid with a BTC format
    if (symbol === 'bch' && address.startsWith('1') && isAddressValid(address, 'btc')) {
        return 'HELP_CENTER_CASHADDR_URL';
    }
};

export const isTaprootAddress = (address: string, symbol: NetworkSymbol) => {
    const networkType = getAddressNetworkType(symbol, address);
    const updatedSymbol = getCoinFromTestnet(symbol);

    return getAddressType(address, updatedSymbol.toUpperCase(), networkType) === 'p2tr';
};

export const hasBitcoinCashAddressPrefix = (address: string) =>
    /^bitcoincash:/.test(address.toLowerCase());

export const isBitcoinCashAddressUppercase = (address: string) =>
    hasBitcoinCashAddressPrefix(address) && /[A-Z]/.test(address);

export const isBech32AddressUppercase = (address: string) =>
    /^(bc1|tb1|ltc1|vtc1)/.test(address.toLowerCase()) && /[A-Z]/.test(address);
