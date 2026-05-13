export const ENABLED_NETWORKS_CHANGED = 'enabled-networks-changed' as const;

export const SET_ENABLED_NETWORKS = 'set-enabled-networks' as const;

export interface SetEnabledNetworksMessage {
    type: typeof SET_ENABLED_NETWORKS;
    payload: string[];
}

export interface EnabledNetworksChangedEvent {
    event: typeof ENABLED_NETWORKS_CHANGED;
    type: typeof ENABLED_NETWORKS_CHANGED;
    payload: string[];
}
