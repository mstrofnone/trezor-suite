import { Image } from '@trezor/components';
import { borders } from '@trezor/theme';

type TradingIconProps = {
    iconUrl: string;
    maxHeight?: number;
};

export const TradingIcon = ({ iconUrl, maxHeight = 24 }: TradingIconProps) => (
    <Image imageSrc={iconUrl} maxHeight={maxHeight} borderRadius={borders.radii.xxxs} />
);
