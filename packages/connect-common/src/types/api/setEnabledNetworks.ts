/**
 * Declare which networks the application has enabled. Connect uses this set
 * when creating/validating device sessions (currently only `'ada'` triggers
 * a Cardano-aware THP session). The canonical post-validation set is delivered
 * back via the `'enabled-networks-changed'` event.
 *
 * Unknown coin symbols throw `Method_UnknownCoin`.
 */

import type { Response } from '../params';

export type SetEnabledNetworks = string[];

export declare function setEnabledNetworks(
    networks: SetEnabledNetworks,
): Response<{ message: 'success' }>;
