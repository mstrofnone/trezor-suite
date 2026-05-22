import { type EarnParams } from '@suite/router';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';

import { type YieldFlowContextValues, useYieldFlow } from '../hooks/useYieldFlow';

type UseYieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
    vault: YieldDto;
};

export const useYieldWithdraw = ({
    account,
    routeParams,
    vault,
}: UseYieldWithdrawProps): YieldFlowContextValues | null => {
    const flowResult = useYieldFlow({
        account,
        routeParams,
        vault,
        flowType: 'withdraw',
    });
    const { token, receiptToken } = flowResult;

    if (!token || !receiptToken) {
        return null;
    }

    return { ...flowResult, token, receiptToken };
};
