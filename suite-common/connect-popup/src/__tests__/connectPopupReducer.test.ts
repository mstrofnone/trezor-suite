import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import { connectPopupInitialState, prepareConnectPopupReducer } from '../connectPopupReducer';

const reducer = prepareConnectPopupReducer(extraDependenciesCommonMock);

describe('connectPopupReducer', () => {
    it('returns the initial state when no action matches', () => {
        expect(reducer(undefined, { type: 'noop' } as any)).toEqual(connectPopupInitialState);
    });

    describe('storageLoad', () => {
        it('keeps remembered permissions stored in the new PermissionRequest shape', () => {
            const validPermission = {
                origin: 'https://example.com',
                type: 'web' as const,
                manifest: { appName: 'Example' },
                types: [
                    { permission: 'read_address', coin: 'BTC' },
                    { permission: 'sign', coin: 'BTC' },
                ],
            };

            const state = reducer(undefined, {
                type: extraDependenciesCommonMock.actionTypes.storageLoad,
                payload: {
                    connect: { permissions: [validPermission] },
                },
            } as any);

            expect(state.permissions).toEqual([validPermission]);
        });

        it('drops legacy entries stored as flat MethodPermission[] (strings)', () => {
            const legacyPermission = {
                origin: 'https://legacy.example',
                type: 'web' as const,
                manifest: { appName: 'Legacy' },
                // Pre-upgrade shape: each entry is a plain string, not a { permission, coin? } tuple.
                types: ['read', 'write'],
            };
            const newPermission = {
                origin: 'https://new.example',
                type: 'web' as const,
                manifest: { appName: 'New' },
                types: [{ permission: 'read_address', coin: 'BTC' }],
            };

            const state = reducer(undefined, {
                type: extraDependenciesCommonMock.actionTypes.storageLoad,
                payload: {
                    connect: { permissions: [legacyPermission, newPermission] },
                },
            } as any);

            expect(state.permissions).toEqual([newPermission]);
        });

        it('handles a missing connect payload gracefully', () => {
            const state = reducer(undefined, {
                type: extraDependenciesCommonMock.actionTypes.storageLoad,
                payload: {},
            } as any);

            expect(state.permissions).toEqual([]);
        });
    });
});
