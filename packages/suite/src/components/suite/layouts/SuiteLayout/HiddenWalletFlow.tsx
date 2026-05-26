import { useEffect, useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';

import { ConfirmActionModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';
import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { useSelector } from 'src/hooks/suite';

const HIDDEN_WALLET_TERMINAL_STATUSES = new Set(['cancelled', 'failed', 'complete']);

export const HiddenWalletFlow = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state =>
        device?.path ? selectDiscoveryByDevicePath(state, device.path) : undefined,
    );
    const [hasPendingButton, setHasPendingButton] = useState(false);

    const isActive =
        !!device &&
        discovery?.useScopedCallIds === true &&
        discovery.isAddingHiddenWallet === true &&
        !HIDDEN_WALLET_TERMINAL_STATUSES.has(discovery.status);

    useEffect(() => {
        if (!isActive) {
            setHasPendingButton(false);

            return undefined;
        }
        const onUiEvent = ({ event: _, ...action }: { event?: string } & Record<string, any>) => {
            if (!action.callId) return;
            if (action.type === UI_REQUEST.REQUEST_BUTTON) {
                setHasPendingButton(true);
            } else if (action.type === UI_REQUEST.CLOSE_UI_WINDOW) {
                setHasPendingButton(false);
            }
        };

        TrezorConnect.on(UI_EVENT, onUiEvent);

        return () => {
            TrezorConnect.off(UI_EVENT, onUiEvent);
        };
    }, [isActive]);

    if (!isActive) return null;

    return hasPendingButton ? (
        <ConfirmActionModal device={device} />
    ) : (
        <PassphraseModal device={device} />
    );
};
