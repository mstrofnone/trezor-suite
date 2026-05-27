import { useEffect } from 'react';

import { handleUiEventActionThunk } from '@suite-common/connect-init';
import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';
import { type PopupEventMessage, type UiEventMessage } from '@trezor/connect-common';

import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { useDispatch, useSelector } from 'src/hooks/suite';

const HIDDEN_WALLET_TERMINAL_STATUSES = new Set(['cancelled', 'failed', 'complete']);

export const AddPassphraseWalletFlow = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state =>
        device?.path ? selectDiscoveryByDevicePath(state, device.path) : undefined,
    );

    const callIds = discovery?.callIds;
    const isActive =
        !!device &&
        callIds !== undefined &&
        discovery?.isAddingHiddenWallet === true &&
        !HIDDEN_WALLET_TERMINAL_STATUSES.has(discovery.status);

    useEffect(() => {
        if (!isActive || !callIds) return undefined;

        const scopedCallIds = new Set<string>(Object.values(callIds));
        const onUiEvent = (message: UiEventMessage | PopupEventMessage) => {
            const { event: _, ...action } = message;
            if (!('callId' in action) || !action.callId) return;
            if (!scopedCallIds.has(action.callId)) return;
            // Passphrase request stays handled by <PassphraseModal /> below,
            // because it's driven off discovery state + has its own
            // sub-flows (best-practices, wallet-exists / not-exist,
            // confirm-empty-passphrase).
            if (action.type === UI_REQUEST.REQUEST_PASSPHRASE) return;
            dispatch(handleUiEventActionThunk(action));
        };

        TrezorConnect.on(UI_EVENT, onUiEvent);

        return () => {
            TrezorConnect.off(UI_EVENT, onUiEvent);
        };
    }, [isActive, callIds, dispatch]);

    if (!isActive || !device) return null;

    return <PassphraseModal device={device} />;
};
