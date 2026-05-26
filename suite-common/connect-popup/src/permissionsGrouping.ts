import { type PermissionRequest } from '@trezor/connect';

/**
 * A bucket of permission scopes grouped by their `coin` (or `undefined` for
 * coin-less permissions like `management` or `read_features`).
 *
 * UIs that present permission requests render one row per group with a
 * coin/device label followed by the list of granted scopes (e.g.
 * `Bitcoin: read address, read xpub, sign`).
 */
export type GroupedPermissions = {
    coin?: string;
    permissions: PermissionRequest['permission'][];
};

/**
 * Returns true when every `requested` `(permission, coin)` tuple is covered by
 * at least one entry in `granted`. Tuples are compared exactly: a `granted`
 * entry for one coin does not satisfy a request for a different coin, and
 * coin-less entries (`coin === undefined`) only match other coin-less entries.
 */
export const permissionsAreCovered = (
    requested: PermissionRequest[],
    granted: PermissionRequest[],
): boolean =>
    requested.every(req =>
        granted.some(g => g.permission === req.permission && g.coin === req.coin),
    );

const dedup = <T>(values: T[]): T[] => Array.from(new Set(values));

/**
 * Group a flat list of `PermissionRequest`s by `coin`, preserving the order
 * in which each coin (and each scope within a coin) first appears. The
 * coin-less bucket (`coin === undefined`) is always emitted last so that the
 * device-level scopes render after coin-specific ones.
 */
export const groupPermissionsByCoin = (permissions: PermissionRequest[]): GroupedPermissions[] => {
    const order: (string | undefined)[] = [];
    const byCoin = new Map<string | undefined, PermissionRequest['permission'][]>();

    for (const { coin, permission } of permissions) {
        if (!byCoin.has(coin)) {
            byCoin.set(coin, []);
            order.push(coin);
        }
        byCoin.get(coin)!.push(permission);
    }

    const coinFirst = order.filter(c => c !== undefined) as string[];
    const groups: GroupedPermissions[] = coinFirst.map(coin => ({
        coin,
        permissions: dedup(byCoin.get(coin)!),
    }));
    if (byCoin.has(undefined)) {
        groups.push({ permissions: dedup(byCoin.get(undefined)!) });
    }

    return groups;
};
