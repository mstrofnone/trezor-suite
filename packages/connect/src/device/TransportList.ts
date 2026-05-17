import { ERRORS } from '@trezor/connect-common/src/constants';
import type {
    ConnectSettingsTransport,
    TransportClass,
} from '@trezor/connect-common/src/types/settings';
import {
    type AbstractTransportParams,
    type Transport,
    isTransportInstance,
} from '@trezor/transport-common';

type Params = AbstractTransportParams & { sessionsBackgroundUrl?: string | null };

const isInstanceArg = (arg: ConnectSettingsTransport): arg is Transport =>
    typeof arg === 'object' && arg !== null;

const isTransportClass = (arg: ConnectSettingsTransport): arg is TransportClass =>
    typeof arg === 'function';

const reuseOrUse = (existing: Transport[], candidate: Transport): Transport =>
    existing.find(t => t.name === candidate.name) ?? candidate;

const resolveOne = (
    existing: Transport[],
    arg: ConnectSettingsTransport,
    params: Params,
): Transport => {
    if (isInstanceArg(arg)) {
        if (!isTransportInstance(arg)) {
            throw ERRORS.TypedError(
                'Runtime',
                `init({ transports }) entry is not a valid Transport instance`,
            );
        }

        return reuseOrUse(existing, arg);
    }
    if (isTransportClass(arg)) {
        const instance = new arg(params);
        if (!isTransportInstance(instance)) {
            throw ERRORS.TypedError(
                'Runtime',
                `Provided class did not produce a valid Transport instance`,
            );
        }

        return reuseOrUse(existing, instance);
    }

    throw ERRORS.TypedError(
        'Runtime',
        `init({ transports }) entry is not a Transport instance or class`,
    );
};

const createTransports = (
    existing: Transport[],
    transports: ConnectSettingsTransport[] | undefined,
    params: Params,
): Transport[] => {
    // Thin wrappers (connect-web, connect-webextension, connect-mobile) propagate
    // host-supplied settings as-is and never inject a default; the Suite app is
    // expected to provide its own transports list. Returning an empty array here
    // is intentional — no transports means no devices, but it must not crash.
    if (!transports?.length) return [];

    return transports.map(t => resolveOne(existing, t, params));
};

export const createTransportList =
    (params: Params) => (existing: Transport[], transports?: ConnectSettingsTransport[]) =>
        createTransports(existing, transports, params);
