// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';

import { conditionalTest, getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('keepSession common param', () => {
    beforeAll(async () => {
        TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        await initTrezorConnect(controller);
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.3.2'], 'keepSession with toggled enabled networks', async () => {
        TrezorConnect.on('ui-request_passphrase', () => {
            TrezorConnect.uiResponse({ type: 'ui-receive_passphrase', payload: { value: 'a' } });
        });

        // Disable cardano-derivation by removing 'ada' from the runtime set.
        // getAccountInfo on a Cardano path now goes through a non-cardano session and
        // is expected to fail at the device level.
        await TrezorConnect.setEnabledNetworks([]);
        const noDerivation = await TrezorConnect.getAccountInfo({
            coin: 'ada',
            path: "m/1852'/1815'/0'/0/0",
            keepSession: true,
        });
        if (noDerivation.success) throw new Error('noDerivation should not succeed');
        expect(noDerivation.error.message).toBe(
            'Cardano derivation is not enabled for this session',
        );

        // Re-enable. The next call forces a session re-create with derive_cardano.
        await TrezorConnect.setEnabledNetworks(['ada']);
        const enableDerivation = await TrezorConnect.getAccountInfo({
            coin: 'ada',
            path: "m/1852'/1815'/0'/0/0",
            keepSession: true,
        });
        if (!enableDerivation.success) throw new Error(enableDerivation.error.message);
        expect(enableDerivation.payload.descriptor).toBeDefined();

        const { device } = enableDerivation;
        if (!device || !device.state) throw new Error('Device not found');

        // change device instance to simulate app reload
        // passphrase request should not be called
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        // modify instance in staticSessionId
        const staticSessionId = device.state.staticSessionId?.replace(
            ':0',
            ':1',
        ) as StaticSessionId;
        const keepCardanoDerivation = await TrezorConnect.getAccountInfo({
            coin: 'ada',
            path: "m/1852'/1815'/0'/0/0",
            device: {
                // change instance to new but use already initialized state
                instance: 1,
                state: {
                    ...device.state,
                    staticSessionId,
                },
                path: device.path,
            },
            // 'ada' stays in the runtime set; derive_cardano is preserved in the session.
        });
        if (!keepCardanoDerivation.success) throw new Error(keepCardanoDerivation.error.message);
        expect(keepCardanoDerivation.payload.descriptor).toEqual(
            enableDerivation.payload.descriptor,
        );
    });
});
