import type { TrezorDevice } from '@suite-common/suite-types';
import type { DEVICE, Device, UI_REQUEST } from '@trezor/connect';

// Hooks invoked from the connect UI/DEVICE event handlers. Provided by the
// platform composition root so the static handler bodies (in `handleUiEventActionThunk`
// and the device-event listener in `connectInitThunk`) can reach platform-specific
// side effects without taking them as a thunk parameter.
export type ConnectInitHooks = Partial<
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
