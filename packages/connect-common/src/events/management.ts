export const ENABLED_NETWORKS_CHANGED = 'enabled-networks-changed' as const;

export type EnabledNetworksChangedEvent = {
    type: typeof ENABLED_NETWORKS_CHANGED;
    payload: string[];
};
