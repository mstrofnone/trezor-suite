/**
 * Read the current set of enabled network symbols held in Connect core.
 * The value is the canonical post-validation set; mutations come from
 * `setEnabledNetworks` and are also broadcast via the `'enabled-networks-changed'` event.
 */

export declare function getEnabledNetworks(): Promise<string[]>;
