import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { queriesStaleTime } from '../config';
import { getMerklUsersRewards } from '../services';

export class ChainAddressKey {
    static readonly delimiter = ':';

    static compose(chainId: number, address: string) {
        return `${chainId}${ChainAddressKey.delimiter}${address}` as const;
    }

    static parse(key: string) {
        const [chainId, address] = key.split(ChainAddressKey.delimiter);

        return {
            chainId: Number(chainId),
            address,
        } as const;
    }
}

export type MerkleRewardsParams<Address extends string> = {
    address: Address;
    chainId: number;
};

export function useGetMerkleRewards<Address extends string>(
    queryEntries: MerkleRewardsParams<Address>[],
) {
    return useQuery({
        queryKey: commonQueryKeys.merkleRewards(queryEntries),
        staleTime: queriesStaleTime.getMerkleRewards,
        queryFn({ signal }) {
            return getMerklUsersRewards({ body: queryEntries, signal });
        },
    });
}

export type MerkleRewardsByChainAndAddress = NonNullable<
    Awaited<ReturnType<typeof useGetMerkleRewards>['data']>
>;
