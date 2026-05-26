import { type PermissionRequest } from '@trezor/connect';

import { groupPermissionsByCoin, permissionsAreCovered } from '../permissionsGrouping';

describe('groupPermissionsByCoin', () => {
    it('returns an empty list for an empty input', () => {
        expect(groupPermissionsByCoin([])).toEqual([]);
    });

    it('groups permissions by coin, preserving insertion order', () => {
        const input: PermissionRequest[] = [
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_xpub', coin: 'BTC' },
            { permission: 'sign', coin: 'ETH' },
            { permission: 'read_address', coin: 'ETH' },
            { permission: 'sign', coin: 'BTC' },
        ];

        expect(groupPermissionsByCoin(input)).toEqual([
            { coin: 'BTC', permissions: ['read_address', 'read_xpub', 'sign'] },
            { coin: 'ETH', permissions: ['sign', 'read_address'] },
        ]);
    });

    it('emits coin-less permissions in their own group at the end', () => {
        const input: PermissionRequest[] = [
            { permission: 'management' },
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_features' },
        ];

        expect(groupPermissionsByCoin(input)).toEqual([
            { coin: 'BTC', permissions: ['read_address'] },
            { permissions: ['management', 'read_features'] },
        ]);
    });

    it('deduplicates repeated permissions within a coin bucket', () => {
        const input: PermissionRequest[] = [
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'sign', coin: 'BTC' },
        ];

        expect(groupPermissionsByCoin(input)).toEqual([
            { coin: 'BTC', permissions: ['read_address', 'sign'] },
        ]);
    });
});

describe('permissionsAreCovered', () => {
    it('returns true for an empty requested list', () => {
        expect(permissionsAreCovered([], [])).toBe(true);
        expect(permissionsAreCovered([], [{ permission: 'read_address', coin: 'BTC' }])).toBe(true);
    });

    it('matches each requested (permission, coin) tuple exactly', () => {
        const granted: PermissionRequest[] = [
            { permission: 'read_address', coin: 'BTC' },
            { permission: 'sign', coin: 'BTC' },
        ];

        expect(permissionsAreCovered([{ permission: 'read_address', coin: 'BTC' }], granted)).toBe(
            true,
        );
        expect(
            permissionsAreCovered(
                [
                    { permission: 'read_address', coin: 'BTC' },
                    { permission: 'sign', coin: 'BTC' },
                ],
                granted,
            ),
        ).toBe(true);
    });

    it('does not satisfy a request for a different coin', () => {
        const granted: PermissionRequest[] = [{ permission: 'read_address', coin: 'BTC' }];

        expect(permissionsAreCovered([{ permission: 'read_address', coin: 'LTC' }], granted)).toBe(
            false,
        );
    });

    it('keeps read_address and read_xpub scopes independent', () => {
        const granted: PermissionRequest[] = [{ permission: 'read_address', coin: 'BTC' }];

        expect(permissionsAreCovered([{ permission: 'read_xpub', coin: 'BTC' }], granted)).toBe(
            false,
        );
    });

    it('treats coin-less and coin-scoped entries as distinct', () => {
        const grantedCoinless: PermissionRequest[] = [{ permission: 'read_features' }];

        expect(permissionsAreCovered([{ permission: 'read_features' }], grantedCoinless)).toBe(
            true,
        );
        expect(
            permissionsAreCovered([{ permission: 'read_features', coin: 'BTC' }], grantedCoinless),
        ).toBe(false);
    });

    it('returns false when only some of the requested tuples are granted', () => {
        const granted: PermissionRequest[] = [{ permission: 'read_address', coin: 'BTC' }];

        expect(
            permissionsAreCovered(
                [
                    { permission: 'read_address', coin: 'BTC' },
                    { permission: 'sign', coin: 'BTC' },
                ],
                granted,
            ),
        ).toBe(false);
    });
});
