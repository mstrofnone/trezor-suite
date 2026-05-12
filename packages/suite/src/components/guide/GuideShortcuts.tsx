import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { selectIsDeviceProtectedByPassphrase } from '@suite-common/device';
import {
    Box,
    Column,
    Paragraph,
    Row,
    ShortcutBadge,
    type ShortcutBadgeProps,
    Text,
} from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';

import { setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideViewWrapper } from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';

type ShortcutKeys = ShortcutBadgeProps['shortcut'];
type TranslationId = Parameters<typeof Translation>[0]['id'];

interface ShortcutItem {
    labelId: TranslationId;
    keys: ShortcutKeys;
}

interface ShortcutSection {
    titleId: TranslationId;
    items: ShortcutItem[];
}

const passphraseShortcut: ShortcutItem = {
    labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_PASSPHRASE',
    keys: ['ALT', 'KEY_P'],
};

const lockAppShortcut: ShortcutItem = {
    labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LOCK_APP',
    keys: ['ALT', 'SHIFT', 'KEY_L'],
};

const generalSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_GENERAL',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_OPEN_GUIDE',
            keys: ['F1'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SETTINGS',
            keys: ['CTRL', 'COMMA'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_FIND',
            keys: ['CTRL', 'KEY_F'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_TOGGLE_THEME',
            keys: ['ALT', 'KEY_T'],
        },
    ],
};

const walletsSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_WALLETS',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_DEVICE',
            keys: ['ALT', 'KEY_D'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEARCH_ACCOUNTS',
            keys: ['CTRL', 'KEY_K'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_ACCOUNT',
            keys: ['CTRL', 'KEY_1'],
        },
    ],
};

const transactionsSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_TRANSACTIONS',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_SEND',
            keys: ['ALT', 'KEY_S'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_RECEIVE',
            keys: ['ALT', 'KEY_R'],
        },
    ],
};

const debugSection: ShortcutSection = {
    titleId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_DEBUG',
    items: [
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_NEXT',
            keys: ['CTRL', 'F9'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_PREV',
            keys: ['CTRL', 'F7'],
        },
        {
            labelId: 'TR_GUIDE_KEYBOARD_SHORTCUTS_LANGUAGE_KEYS_SWITCH',
            keys: ['CTRL', 'F12'],
        },
    ],
};

const ShortcutEntry = ({ labelId, keys }: ShortcutItem) => (
    <Row justifyContent="space-between" alignItems="center">
        <Text intent="neutral" typographyStyle="body-sm" priority="secondary">
            <Translation id={labelId} />
        </Text>
        <ShortcutBadge shortcut={keys} />
    </Row>
);

const ShortcutSectionBlock = ({ titleId, items }: ShortcutSection) => (
    <Box margin={{ bottom: 24 }}>
        <Paragraph margin={{ bottom: 8 }} typographyStyle="body-md-strong">
            <Translation id={titleId} />
        </Paragraph>
        <Column gap={spacings.xs}>
            {items.map(item => (
                <ShortcutEntry key={item.labelId} {...item} />
            ))}
        </Column>
    </Box>
);

export const GuideShortcuts = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const isPassphraseProtectionEnabled = useSelector(selectIsDeviceProtectedByPassphrase);
    const dispatch = useDispatch();

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));

    const generalSectionWithLockApp: ShortcutSection = isDesktop()
        ? { ...generalSection, items: [...generalSection.items, lockAppShortcut] }
        : generalSection;

    const walletsSectionWithPassphrase: ShortcutSection = isPassphraseProtectionEnabled
        ? { ...walletsSection, items: [passphraseShortcut, ...walletsSection.items] }
        : walletsSection;

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={<Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS" />} />
            <GuideContent>
                <Column>
                    <ShortcutSectionBlock {...generalSectionWithLockApp} />
                    <ShortcutSectionBlock {...walletsSectionWithPassphrase} />
                    <ShortcutSectionBlock {...transactionsSection} />
                    {isDebugModeActive && <ShortcutSectionBlock {...debugSection} />}
                </Column>
            </GuideContent>
        </GuideViewWrapper>
    );
};
