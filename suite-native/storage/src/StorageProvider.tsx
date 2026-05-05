import { type ReactNode } from 'react';

import { type Persistor } from 'redux-persist/es/types';
import { PersistGate } from 'redux-persist/integration/react';

import { StorageContext } from './contexts';

type StorageProviderProps = {
    persistor: Persistor;
    children: ReactNode;
};

// [btc-unknown-tx-debug] Captured at module load so we can measure how long redux-persist took to
// rehydrate state from MMKV. Used together with `loading={null}` below: children render immediately
// with empty initial state, and we log when rehydration actually completes. By correlating in Sentry
// with `[btc-unknown-tx-debug] addFakePendingTxThunk → prepending tx has type=unknown`, we can tell
// whether the user signed a tx before account.addresses were rehydrated (R2 rehydration race).
const moduleLoadedAt = Date.now();

export const StorageProvider = ({ children, persistor }: StorageProviderProps) => (
    <StorageContext.Provider value={persistor}>
        <PersistGate
            loading={null}
            persistor={persistor}
            onBeforeLift={() => {
                console.error('[btc-unknown-tx-debug] PersistGate rehydration completed', {
                    msSinceModuleLoad: Date.now() - moduleLoadedAt,
                });
            }}
        >
            {children}
        </PersistGate>
    </StorageContext.Provider>
);
