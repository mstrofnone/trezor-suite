import { events as sharedEvents } from '@suite-common/analytics';
import {
    deviceActions,
    selectDevices,
    selectIsPendingTransportEvent,
    selectSelectedDevice,
} from '@suite-common/device';
import { selectEffectiveFirmwareChannel } from '@suite-common/firmware';
import {
    Feature,
    parseTimeoutThresholdsPerModel,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getBrowserName } from '@suite-common/suite-utils';
import { deviceConnectThunks, selectEnabledNetworks } from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    type ConnectSettings,
    type ConnectSettingsTransport,
    DEVICE,
    DEVICE_EVENT,
    type Device,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';
import { isDesktop, isWeb } from '@trezor/env-utils';
// Deep import bypasses the `@trezor/transport` barrel so browser bundlers
// don't pull in node-only sibling modules (`UdpTransport`/`dgram`,
// `NodeUsbTransport`/`usb`) when this file is loaded on web.
import { BridgeTransport } from '@trezor/transport/src/transports/bridge';
import { WebUsbTransport } from '@trezor/transport-web';
import { DATA_URL } from '@trezor/urls';
import { capitalizeFirstLetter, getSynchronize, isArrayMember } from '@trezor/utils';

import { blacklist } from './blacklist';
import { type ConnectKey } from './types';

const CONNECT_INIT_MODULE = '@common/connect-init';

// Web counterpart to suite-desktop-core's IPC-side mapping. Web has no IPC
// boundary — `TrezorConnect.init` runs in-process — so we must translate the
// debug switcher's string identifiers to DI references in the renderer itself
// before they reach @trezor/connect's TransportList (which only accepts
// Transport instances or classes). Only Bridge and WebUSB are reachable on
// the web debug switcher; unknown strings (e.g. NodeUsbTransport from stale
// persisted state) are dropped.
const mapWebDebugTransport = (t: string): ConnectSettingsTransport | undefined => {
    switch (t) {
        case 'BridgeTransport':
            return BridgeTransport;
        case 'WebUsbTransport':
            return WebUsbTransport;
        default:
            return undefined;
    }
};

// If you are looking where connectInitSettings is defined, it is defined in packages/suite/src/support/extraDependencies.ts
// or in suite-native/state/src/extraDependencies.ts depends on which platform this connectInitThunk runs.

type ConnectInitHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
> &
    Partial<
        Record<
            typeof UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED | typeof UI_REQUEST.REQUEST_WORD,
            () => void
        >
    >;

export const connectInitThunk = createThunk<void, ConnectInitHooks | void, void>(
    `${CONNECT_INIT_MODULE}/initThunk`,
    async (connectInitHooks, { dispatch, getState, extra }) => {
        const {
            selectors: { selectDebugSettings, selectThpSettings },
            actions: { lockDevice },
            services: { connectInitSettings, analytics },
        } = extra;

        const getEnabledNetworks = () => selectEnabledNetworks(getState());
        const getEffectiveFirmwareChannel = selectEffectiveFirmwareChannel(
            extra.selectors.selectAllowPrerelease,
        );

        // set event listeners and dispatch as
        TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...eventData }) => {
            if (eventData.type === DEVICE.CONNECT || eventData.type === DEVICE.CONNECT_UNACQUIRED) {
                // This special case here allows us to "inject" extra data into action's payload
                // and change the type of the action (in this case DeviceEvent type !== Redux Action type)
                const connectedDevices = selectDevices(getState());
                dispatch(deviceConnectThunks({ type: eventData.type, device: eventData.payload }));

                if (connectInitHooks && eventData.type in connectInitHooks) {
                    connectInitHooks[eventData.type]?.(eventData.payload, connectedDevices);
                }
            } else {
                // dispatch event as action
                dispatch({ type: eventData.type, payload: eventData.payload });

                if (eventData.type === DEVICE.THP_PAIRING_STATUS_CHANGED) {
                    const { status } = eventData.payload;
                    if (status === 'finished' || status === 'canceled') {
                        analytics.report({
                            type: sharedEvents.deviceConnectionDeviceConfirmationEvent.name,
                            payload: { option: status },
                        });
                    }
                }
            }
        });

        TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
            if (action.type === UI_REQUEST.FIRMWARE_DOWNLOADED) {
                // We are in web therefore we ignore `FIRMWARE_DOWNLOADED` action.
                return;
            }

            // dispatch event as action
            dispatch(action);

            // this switch is still one more layer of indirection to be removed. connect actions are dispatched
            // and could be handled directly in reducers
            switch (action.type) {
                case UI_REQUEST.REQUEST_PIN:
                case UI_REQUEST.INVALID_PIN:
                    dispatch(
                        deviceActions.addButtonRequest({
                            // todo: note that this is not 'threadsafe', currently selected device is not necessarily the device
                            // connect call was made for
                            device: selectSelectedDevice(getState()),
                            buttonRequest: {
                                code: action.payload.type ? action.payload.type : action.type,
                            },
                        }),
                    );
                    break;
                case UI_REQUEST.REQUEST_BUTTON: {
                    const { device: _, ...request } = action.payload;
                    dispatch(
                        deviceActions.addButtonRequest({
                            device: selectSelectedDevice(getState()),
                            buttonRequest: request,
                        }),
                    );
                    break;
                }
            }

            if (
                connectInitHooks &&
                (action.type === UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED ||
                    action.type === UI_REQUEST.REQUEST_WORD)
            ) {
                connectInitHooks[action.type]?.();
            }
        });

        TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            dispatch(action);
        });

        TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            dispatch(action);
        });

        const synchronize = getSynchronize();

        Object.keys(TrezorConnect)
            .filter(k => !isArrayMember(k, blacklist))
            .forEach(key => {
                // typescript complains about params and return type, need to be "any"
                const original: any = TrezorConnect[key as ConnectKey];
                if (!original) return;
                (TrezorConnect[key as ConnectKey] as any) = async (params: any) => {
                    dispatch(lockDevice(true));

                    // cardano patch
                    const enabledNetworks = getEnabledNetworks();
                    const isCardanoMethod =
                        key === 'call'
                            ? params.method.startsWith('cardano')
                            : key.startsWith('cardano');
                    const cardanoEnabled = enabledNetworks.includes('ada') || isCardanoMethod;

                    const result = await synchronize(() =>
                        original({ ...params, useCardanoDerivation: cardanoEnabled }),
                    );

                    dispatch(lockDevice(false));
                    dispatch(
                        deviceActions.removeButtonRequests({
                            // todo: device not 'thread safe' - meaning that device to which button requests have been added to might not
                            // be the same re-selected device from this line. We should reuse device from params.
                            device: selectSelectedDevice(getState()),
                        }),
                    );

                    return result;
                };
            });

        const binFilesBaseUrl = isDesktop()
            ? extra.selectors.selectDesktopBinDir(getState())
            : DATA_URL;

        const firmwareHashCheckTimeoutsOverride = parseTimeoutThresholdsPerModel(
            selectFeatureConfig(getState(), Feature.firmwareHashCheckTimeout),
        );
        const firmwareHashCheckTimeouts = {
            ...connectInitSettings.firmwareHashCheckTimeouts,
            ...firmwareHashCheckTimeoutsOverride,
        };

        const { transports: debugTransports, showConnectLogs } = selectDebugSettings(getState());
        const thp = selectThpSettings(getState());
        // desktop thp appName/hostName enhanced in ./packages/suite-desktop-core/src/modules/trezor-connect.ts
        if (isWeb()) {
            thp.hostName = capitalizeFirstLetter(getBrowserName());
        }

        // The debug transport switcher writes legacy string identifiers
        // (`'BridgeTransport'` …) to Redux. They are not part of @trezor/connect's
        // pure-DI public type surface and must be translated to a Transport
        // instance / class / factory before reaching its TransportList runtime.
        //
        // - Desktop: pass strings through; the IPC proxy serializes them to
        //   suite-desktop-core's main process, which maps them in its IPC
        //   handler (`packages/suite-desktop-core/src/modules/trezor-connect.ts`).
        //   The cast is the renderer-side acknowledgement of this wire format.
        // - Web: there is no IPC. `TrezorConnect.init` runs in-process, so we
        //   map locally before the call (`mapWebDebugTransport` above).
        // selectDebugSettings is typed as `any` (see SuiteCompatibleSelector<any>
        // in extraDependenciesType.ts) so we have to narrow `debugTransports` to
        // a concrete shape here — otherwise the filter callback below becomes
        // implicitly-any and fails strict type-check on CI.
        const stringTransports = debugTransports as string[] | undefined;
        const transports = isWeb()
            ? stringTransports
                  ?.map(mapWebDebugTransport)
                  .filter((t): t is ConnectSettingsTransport => t !== undefined)
            : (stringTransports as unknown as ConnectSettings['transports']);

        try {
            await TrezorConnect.init({
                ...connectInitSettings,
                binFilesBaseUrl,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
                transports,
                thp,
                debug: showConnectLogs,
                firmwareHashCheckTimeouts,
                firmwareChannel: getEffectiveFirmwareChannel(getState()),
            });
        } catch (error) {
            let formattedError: string;
            if (typeof error === 'string') {
                formattedError = error;
            } else {
                formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
            }
            throw new Error(formattedError);
        }
    },
);
