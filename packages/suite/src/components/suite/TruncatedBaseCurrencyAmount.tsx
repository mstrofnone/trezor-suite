import type { FormatNumberOptions } from '@formatjs/intl';
import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { redactNumericalSubstring, useShouldRedactNumbers } from '@suite-common/wallet-utils';

const TruncateWrapper = styled.span`
    display: inline-flex;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    vertical-align: bottom;
`;

const TruncateHead = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
`;

const TruncateTail = styled.span`
    white-space: nowrap;
    flex-shrink: 0;
`;

const TruncateFixed = styled.span`
    white-space: nowrap;
    flex-shrink: 0;
`;

type TruncatedBaseCurrencyAmountProps = {
    value: BaseCurrencyAmount;
    currency: string;
    tailChars: number;
    prefix?: string;
    fiatAmountFormatterOptions?: FormatNumberOptions;
};

export const TruncatedBaseCurrencyAmount = ({
    value,
    currency,
    tailChars,
    prefix,
    fiatAmountFormatterOptions,
}: TruncatedBaseCurrencyAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });

    const formatted = BaseCurrencyAmountFormatter.format(value, {
        currency,
        ...fiatAmountFormatterOptions,
    });

    if (formatted === null) return null;

    const finalString = shouldRedactNumbers ? redactNumericalSubstring(formatted) : formatted;
    const showWrapper = finalString.length > tailChars;
    const accessibleValue = shouldRedactNumbers ? undefined : `${prefix ?? ''}${formatted}`;

    if (!showWrapper && !prefix) {
        return <>{finalString}</>;
    }

    return (
        <TruncateWrapper aria-label={accessibleValue} title={accessibleValue}>
            {prefix && <TruncateFixed>{prefix}</TruncateFixed>}
            {showWrapper ? (
                <>
                    <TruncateHead>{finalString.slice(0, -tailChars)}</TruncateHead>
                    <TruncateTail>{finalString.slice(-tailChars)}</TruncateTail>
                </>
            ) : (
                <TruncateFixed>{finalString}</TruncateFixed>
            )}
        </TruncateWrapper>
    );
};
