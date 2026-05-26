import { useEffect, useState } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';

import { ConfirmActionModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';
import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { useSelector } from 'src/hooks/suite';

/**
 * Layout-level layer for the scoped hidden-wallet discovery flow.
 *
 * Watches discovery state for the currently selected device. While a
 * scoped hidden-wallet discovery is in progress (i.e. `useScopedCallIds`
 * was set and the status hasn't hit a terminal value), renders the
 * modals that would normally come from the global modal stack
 * (PassphraseModal + ConfirmActionModal).
 *
 * Why here, not in `AddWalletButton`:
 *   - The trigger lives inside `SwitchDevice` (a foreground app modal)
 *     which closes the moment the user clicks "Add hidden wallet" — the
 *     trigger component is unmounted.
 *   - Mounted at SuiteLayout / WelcomeLayout level, this component
 *     survives the closing of any modal and renders the flow's UI
 *     declaratively off discovery state. Auto-unmounts on
 *     terminal status (cancelled / failed / complete). No useEffect on
 *     state to dispatch navigation — discovery state drives everything.
 *
 * Why a local subscription to `TrezorConnect.on(UI_EVENT, ...)`:
 *   - The global UI_EVENT listener in `connectInitThunks` skips events
 *     that carry a `callId`. Discovery's scoped calls carry one, so the
 *     modal slice never transitions into REQUEST_PASSPHRASE /
 *     REQUEST_BUTTON, and `usePreferredModal` has nothing to route. We
 *     listen directly to catch the `ui-button` / `ui-close_window`
 *     events that the global listener drops, and flip a local boolean
 *     for the "confirm on device" prompt.
 *   - Any callId-tagged event in this window is "ours" — this is the
 *     only scoped flow mounted at a time.
 */
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
            // Only react to scoped (callId-tagged) events. Non-scoped
            // events continue through the global modal flow as usual.
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

    // Mutually exclusive — the global flow used to switch between these
    // via `usePreferredModal` (passphrase-flow → redux-modal when the
    // ui-button arrived). Mirror that here so the passphrase input
    // unmounts the moment the "confirm on device" prompt takes over.
    return hasPendingButton ? (
        <ConfirmActionModal device={device} />
    ) : (
        <PassphraseModal device={device} />
    );
};
