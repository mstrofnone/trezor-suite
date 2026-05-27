import { useEffect, useState } from 'react';

import { MODAL_CONTEXT_NONE, type State, modalReducer } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';
import { type PopupEventMessage, type UiEventMessage } from '@trezor/connect-common';

import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { ReduxModal } from 'src/components/suite/modals/ReduxModal/ReduxModal';
import { useSelector } from 'src/hooks/suite';

const HIDDEN_WALLET_TERMINAL_STATUSES = new Set(['cancelled', 'failed', 'complete']);

const initialModalState: State = { context: MODAL_CONTEXT_NONE };

export const PassphraseFlow = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state =>
        device?.path ? selectDiscoveryByDevicePath(state, device.path) : undefined,
    );
    const [modalState, setModalState] = useState<State>(initialModalState);

    const isActive =
        !!device &&
        discovery?.useScopedCallIds === true &&
        discovery.isAddingHiddenWallet === true &&
        !HIDDEN_WALLET_TERMINAL_STATUSES.has(discovery.status);

    useEffect(() => {
        if (!isActive) {
            setModalState(initialModalState);

            return undefined;
        }
        const onUiEvent = (message: UiEventMessage | PopupEventMessage) => {
            const { event: _, ...action } = message;
            if (!('callId' in action) || !action.callId) return;
            // Passphrase request stays handled by <PassphraseModal /> below,
            // because it's driven off discovery state + has its own
            // sub-flows (best-practices, wallet-exists / not-exist,
            // confirm-empty-passphrase).
            if (action.type === UI_REQUEST.REQUEST_PASSPHRASE) return;
            setModalState(prev => modalReducer(prev, action));
        };

        TrezorConnect.on(UI_EVENT, onUiEvent);

        return () => {
            TrezorConnect.off(UI_EVENT, onUiEvent);
        };
    }, [isActive]);

    if (!isActive || !device) return null;

    if (modalState.context !== MODAL_CONTEXT_NONE) {
        return <ReduxModal {...modalState} />;
    }

    return <PassphraseModal device={device} />;
};
