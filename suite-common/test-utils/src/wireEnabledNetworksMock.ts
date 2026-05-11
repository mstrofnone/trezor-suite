interface StoreLike {
    dispatch: (action: any) => unknown;
}

/**
 * Wires the global `TrezorConnect.setEnabledNetworks` mock so it dispatches the
 * `changeNetworks` action into the provided store, simulating the listener registered
 * by `connectInitThunk` in real apps. Pass the action creator to avoid a dep from
 * `@suite-common/test-utils` to `@suite-common/wallet-core`.
 *
 * Use in tests where `changeCoinVisibility` (or any code calling `setEnabledNetworks`)
 * is expected to produce a `changeNetworks` Redux action end-to-end.
 */
export const wireEnabledNetworksMock = (
    store: StoreLike,
    // `any` because callers pass a strongly-typed action creator (NetworkSymbol[] payload)
    // and we don't want to leak that type into the cross-package helper. The runtime
    // shape is `(payload) => { type, payload }`.
    changeNetworksAction: (networks: any) => any,
) => {
    // Lazy-require — a top-level `import TrezorConnect from '@trezor/connect'` here would
    // pull the connect-common types (cardano → @trezor/protobuf → @bufbuild/protobuf)
    // into every consumer of `@suite-common/test-utils`, breaking tests in jsdom envs
    // that lack the TextEncoder polyfill the runtime protobuf decoder needs.

    const TrezorConnect = require('@trezor/connect').default;

    const impl = (networks: string[]) => {
        store.dispatch(changeNetworksAction(networks));

        return Promise.resolve({
            success: true,
            payload: { message: 'success' },
        });
    };

    // Some test environments (e.g. wallet-core) don't activate the @trezor/connect auto-mock
    // from `test-utils/__mocks__`. Replace the property unconditionally — works whether the
    // existing function is the real one or a jest.fn.
    TrezorConnect.setEnabledNetworks = jest.fn(impl);
};
