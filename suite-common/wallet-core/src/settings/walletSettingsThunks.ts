import { type Dispatch } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect, { PROTO } from '@trezor/connect';

import { setBitcoinAmountUnits } from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectBitcoinAmountUnit, selectEnabledNetworks } from './walletSettingsReducer';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccountsToBeForgotten } from '../selectors';

export const changeCoinVisibility = createThunk<
    void,
    {
        symbol: NetworkSymbol;
        shouldBeVisible: boolean;
    },
    void
>(
    WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
    async ({ symbol, shouldBeVisible }, { dispatch, getState }) => {
        let enabledNetworks = selectEnabledNetworks(getState());
        const isAlreadyHidden = enabledNetworks.find(enabledSymbol => enabledSymbol === symbol);
        if (!shouldBeVisible) {
            enabledNetworks = enabledNetworks.filter(enabledSymbol => enabledSymbol !== symbol);
        } else if (!isAlreadyHidden) {
            enabledNetworks = [...enabledNetworks, symbol];
        }
        // Connect is the runtime source of truth. The setter triggers a canonical
        // 'enabled-networks-changed' event; the connect-init listener writes it back to
        // Redux. By the time await resolves, Redux is up-to-date (in-module IPC is sync).
        await TrezorConnect.setEnabledNetworks(enabledNetworks);

        const accountsToRemove = selectAccountsToBeForgotten(getState());
        if (accountsToRemove.length > 0) {
            dispatch(accountsActions.removeAccount(accountsToRemove));
        }

        // this seems to be only for analyticsMiddleware
        // TODO: why does it fire an action with the same type as the thunk??
        dispatch({
            type: WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
            payload: { symbol, shouldBeVisible },
        });
    },
);

export const toggleBitcoinAmountUnits = () => (dispatch: Dispatch, getState: () => any) => {
    const currentUnits = selectBitcoinAmountUnit(getState());

    const nextUnits =
        currentUnits === PROTO.AmountUnit.BITCOIN
            ? PROTO.AmountUnit.SATOSHI
            : PROTO.AmountUnit.BITCOIN;

    dispatch(setBitcoinAmountUnits(nextUnits));
};
