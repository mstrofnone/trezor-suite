import { Asset, Networks, StrKey } from '@stellar/stellar-sdk';

export const isValidAssetCode = (code: string): boolean => /^[a-zA-Z0-9]{1,12}$/.test(code);

export const isValidAddress = (address: string): boolean => StrKey.isValidEd25519PublicKey(address);

/**
 * Derive the public-network Soroban contract id for a classic Stellar asset
 * in strict `CODE-ISSUER` form.
 *
 * This is intentionally hard-coded to `Networks.PUBLIC`.
 */
export const computeSorobanAssetContractId = (classicAssetContract: string) => {
    const contractParts = classicAssetContract.split('-');

    if (contractParts.length !== 2) {
        throw new Error('Invalid Stellar asset contract format.');
    }

    const [assetCode, issuer] = contractParts;

    if (!isValidAssetCode(assetCode) || !isValidAddress(issuer)) {
        throw new Error('Invalid Stellar asset contract format.');
    }

    return {
        assetCode,
        issuer,
        sorobanAssetContractId: new Asset(assetCode, issuer).contractId(Networks.PUBLIC),
    };
};
