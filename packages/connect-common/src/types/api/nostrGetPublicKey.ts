import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { GetPublicKey, Params, Response } from '../params';

export declare function nostrGetPublicKey(
    params: Params<GetPublicKey>,
): Response<PROTO.NostrPubkey>;
