import {
    WelcomeLayoutWithoutModalSwitcher,
    type WelcomeLayoutWithoutModalSwitcherProps,
} from './WelcomeLayoutWithoutModalSwitcher';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { HiddenWalletFlow } from '../SuiteLayout/HiddenWalletFlow';
import { SwitchDeviceLayer } from '../SuiteLayout/SwitchDeviceLayer';

export const WelcomeLayout = ({ children, ...rest }: WelcomeLayoutWithoutModalSwitcherProps) => (
    <WelcomeLayoutWithoutModalSwitcher {...rest}>
        <ModalSwitcher />
        <SwitchDeviceLayer />
        <HiddenWalletFlow />
        {children}
    </WelcomeLayoutWithoutModalSwitcher>
);
