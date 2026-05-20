export {
    isAddressValid,
    isAddressDeprecated,
    isTaprootAddress,
    hasBitcoinCashAddressPrefix,
    isBitcoinCashAddressUppercase,
    isBech32AddressUppercase,
} from './addressValidation';

export { autocorrectAddress, type AddressCorrection } from './autocorrectAddress';
