import { type NetworkSymbol, isAccountBasedNetwork } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { getUnusedAddressFromAccount } from '../utils';

type GetReceiveAccountPreselectionParams = {
    symbol: NetworkSymbol;
    accounts: Account[];
    sendAccount?: Account;
};

export type ReceiveAccountPreselection = {
    accountKey: AccountKey;
    address?: string | undefined;
};

export const getReceiveAccountPreselection = ({
    symbol,
    accounts,
    sendAccount,
}: GetReceiveAccountPreselectionParams): ReceiveAccountPreselection | null => {
    if (accounts.length === 0) {
        return null;
    }

    if (sendAccount?.symbol === symbol) {
        return {
            accountKey: sendAccount.key,
        };
    }

    if (!isAccountBasedNetwork(symbol)) {
        const account = accounts[0];
        const { address } = getUnusedAddressFromAccount(account);

        return {
            accountKey: account.key,
            address,
        };
    }

    return {
        accountKey: accounts[0].key,
    };
};
