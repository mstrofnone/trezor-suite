import type { BundleProgress, DeviceUniquePath, StaticSessionId } from '@trezor/connect';

// Stable set of callIds minted once when a scoped discovery starts. Each Connect
// call in runDiscoveryThunk uses its named slot, and PassphraseFlow accepts only
// UI events whose callId is in this set. The field is set on startDiscovery and
// must not be mutated for the lifetime of that discovery instance.
export type DiscoveryCallIds = {
    initialDeviceState: string;
    emptyPassphraseCheck: string;
    discoverAccounts: string;
    confirmDeviceState: string;
};

type CommonDiscoveryStatus = {
    isAddingHiddenWallet?: boolean; // to control visibility of special loader
    isAddingExistingWallet?: boolean; // to control visibility of special loader
    hasLoadedAnyNonEmptyAccount?: boolean; // NOTE: used to indicate the the discovery started loading actual accounts
    passphraseOnDevice?: boolean;
    startTimestamp?: number;
    passphraseSubmitted?: boolean;
    useScopedCallIds?: boolean;
    callIds?: DiscoveryCallIds;
};

export type DiscoveryStatus = CommonDiscoveryStatus &
    (
        | {
              status: 'starting';
          }
        | {
              status: 'enter-passphrase';
          }
        | {
              status: 'passphrase-duplicate';
              duplicateDeviceStaticSessionId: StaticSessionId;
          }
        | {
              status: 'passphrase-mismatch';
          }
        | {
              status: 'cancelled';
          }
        | {
              status: 'progress';
              total: BundleProgress<any>['payload']['total'];
              progress: BundleProgress<any>['payload']['progress'];
          }
        | {
              status: 'confirm-empty-passphrase';
              accountFailed?: boolean;
          }
        | {
              status: 'complete';
          }
        | {
              status: 'failed';
              error?: string;
              errorCode?: 'Method_InvalidParameter' | (string & {});
          }
    );

export type Discovery = Record<DeviceUniquePath, DiscoveryStatus>;
