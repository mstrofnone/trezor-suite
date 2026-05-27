import {
    WelcomeLayoutWithoutModalSwitcher,
    type WelcomeLayoutWithoutModalSwitcherProps,
} from './WelcomeLayoutWithoutModalSwitcher';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { PassphraseFlow } from '../SuiteLayout/PassphraseFlow';
import { SwitchDeviceLayer } from '../SuiteLayout/SwitchDeviceLayer';

export const WelcomeLayout = ({ children, ...rest }: WelcomeLayoutWithoutModalSwitcherProps) => (
    <WelcomeLayoutWithoutModalSwitcher {...rest}>
        <ModalSwitcher />
        <SwitchDeviceLayer />
        <PassphraseFlow />
        {children}
    </WelcomeLayoutWithoutModalSwitcher>
);
