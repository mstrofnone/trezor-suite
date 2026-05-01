import dump from '../../fixtures/remembered-wallet-db-lite.json';
import { expect, test } from '../../support/fixtures';
import type { IndexedDbDump } from '../../support/indexedDb';

test.describe('Trading - remembered wallet loading', { tag: ['@noDevice'] }, () => {
    test.use({
        startEmulator: false,
        setupEmulator: false,
    });

    test('Load remembered wallet and open trading forms without connected device', async ({
        page,
        indexedDb,
        walletPage,
        tradingPage,
    }) => {
        test.setTimeout(420_000);
        await test.step('Wait for Suite to initialize IndexedDB schema', async () => {
            await indexedDb.waitForInit();
        });

        await test.step('Seed remembered wallet from real DB dump', async () => {
            await indexedDb.seedFromDump(dump as IndexedDbDump);
        });

        await test.step('Reload Suite with remembered state', async () => {
            await page.reload();
            await expect(page.getByTestId('@suite/loading')).toBeVisible({ timeout: 10_000 });
            await expect(page.getByTestId('@suite/loading')).toBeHidden({ timeout: 120_000 });
            await expect(page.getByTestId('@suite/bundle-loader')).toBeHidden({ timeout: 320_000 });
        });

        await test.step('Open buy and swap forms from remembered wallet', async () => {
            await expect(walletPage.accountButton({ symbol: 'btc' })).toBeVisible({
                timeout: 60_000,
            });
            await expect(walletPage.deviceDisconnectedStatus).toBeVisible({ timeout: 60_000 });

            await walletPage.openTrading({ symbol: 'btc' });
            await tradingPage.verifyBuyFormOpened(/Bitcoin/);

            await walletPage.openSwapTrading({ symbol: 'btc' });
            await tradingPage.verifySwapFormOpened(/Bitcoin/);
        });
    });
});
