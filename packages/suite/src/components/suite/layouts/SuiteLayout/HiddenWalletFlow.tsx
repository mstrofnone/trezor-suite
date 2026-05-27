import { useEffect, useState } from 'react';

import { MODAL_CONTEXT_DEVICE } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import TrezorConnect, { UI_EVENT, UI_REQUEST } from '@trezor/connect';
import { type UiEventMessage, type UiRequestButton } from '@trezor/connect-common';

import { DeviceContextModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/DeviceContextModal';
import { PassphraseModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal';
import { useSelector } from 'src/hooks/suite';

const HIDDEN_WALLET_TERMINAL_STATUSES = new Set(['cancelled', 'failed', 'complete']);

// What's left of a UiEventMessage once the `event: 'UI_EVENT'` discriminator
// has been stripped off — the typed union of every UI request shape, plus
// the optional `requestId` / `callId` fields the message-channel attaches.
type ScopedUiEvent = Omit<UiEventMessage, 'event'>;

// Modal-slice shape we feed into <DeviceContextModal />. Matches the
// MODAL_CONTEXT_DEVICE variant of ModalState in `modalReducer.ts`
// (windowType / data / requestId), so the receiving component reads it
// exactly the way it would read a real entry from `state.modal`.
type DeviceContextModalProps = {
    windowType: string | undefined;
    data: UiRequestButton['payload']['data'];
    requestId: string | undefined;
};

// Map a scoped UI event onto the modal-slice shape DeviceContextModal
// expects. Mirrors `modalReducer`'s case-by-case translation — most UI
// requests just pass the action type as `windowType`; `ui-button` is
// special because its `windowType` is the button-request code (e.g.
// `'ButtonRequest_Other'`) carried in `payload.code`, and the optional
// `data` is `payload.data`. Type-narrows on `event.type` so the
// `event.payload.code` access is checked, not optional-chained.
const toDeviceContextModalProps = (event: ScopedUiEvent): DeviceContextModalProps => {
    if (event.type === UI_REQUEST.REQUEST_BUTTON) {
        return {
            windowType: event.payload.code,
            data: event.payload.data,
            requestId: event.requestId,
        };
    }

    return {
        windowType: event.type,
        data: undefined,
        requestId: event.requestId,
    };
};

export const HiddenWalletFlow = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state =>
        device?.path ? selectDiscoveryByDevicePath(state, device.path) : undefined,
    );
    const [pendingScopedEvent, setPendingScopedEvent] = useState<ScopedUiEvent | null>(null);

    const isActive =
        !!device &&
        discovery?.useScopedCallIds === true &&
        discovery.isAddingHiddenWallet === true &&
        !HIDDEN_WALLET_TERMINAL_STATUSES.has(discovery.status);

    useEffect(() => {
        if (!isActive) {
            setPendingScopedEvent(null);

            return undefined;
        }
        const onUiEvent = (message: UiEventMessage) => {
            const { event: _, ...action } = message;
            if (!action.callId) return;
            if (action.type === UI_REQUEST.CLOSE_UI_WINDOW) {
                setPendingScopedEvent(null);

                return;
            }
            // Passphrase request stays handled by <PassphraseModal /> below,
            // because it's driven off discovery state + has its own
            // sub-flows (best-practices, wallet-exists / not-exist,
            // confirm-empty-passphrase). Every other UI request goes
            // through DeviceContextModal's switch.
            if (action.type === UI_REQUEST.REQUEST_PASSPHRASE) return;
            setPendingScopedEvent(action);
        };

        TrezorConnect.on(UI_EVENT, onUiEvent);

        return () => {
            TrezorConnect.off(UI_EVENT, onUiEvent);
        };
    }, [isActive]);

    if (!isActive || !device) return null;

    if (pendingScopedEvent) {
        const { windowType, data, requestId } = toDeviceContextModalProps(pendingScopedEvent);

        return (
            <DeviceContextModal
                context={MODAL_CONTEXT_DEVICE}
                device={device}
                windowType={windowType}
                data={data}
                requestId={requestId}
            />
        );
    }

    return <PassphraseModal device={device} />;
};
