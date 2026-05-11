import { combineReducers } from '@reduxjs/toolkit';

import {
    configureMockStore,
    extraDependenciesCommonMock,
    wireEnabledNetworksMock,
} from '@suite-common/test-utils';

import { walletSettingsFixtures } from './walletSettingsActions.fixtures';
import { prepareWalletSettingsReducer } from '../../src';
import * as walletSettingsActions from '../../src/settings/walletSettingsActions';

const settingsReducer = prepareWalletSettingsReducer(extraDependenciesCommonMock);

const initStore = (state: any) =>
    configureMockStore({
        reducer: {
            wallet: combineReducers({
                settings: settingsReducer,
            }),
        },
        preloadedState: { wallet: { settings: state } },
    });

describe('walletSettings Actions', () => {
    walletSettingsFixtures.forEach(f => {
        it(f.description, async () => {
            const store = initStore(f.initialState);
            // Simulate the connect-init listener: setEnabledNetworks → changeNetworks dispatch.
            wireEnabledNetworksMock(store, walletSettingsActions.changeNetworks);
            await store.dispatch(f.action() as any);
            expect(store.getState().wallet.settings).toMatchObject(f.result);
        });
    });
});
