import * as ops from 'bitcoin-ops';

// extend with Decred OP codes
const OPS = {
    ...ops,
    OP_SSTX: 0xba,
    OP_SSTXCHANGE: 0xbd,
    OP_SSGEN: 0xbb,
    OP_SSRTX: 0xbc,
} as const satisfies Record<string, number>;

const REVERSE_OPS: string[] = [];
Object.keys(OPS).forEach(code => {
    const opCode: number = OPS[code];
    REVERSE_OPS[opCode] = code;
});

export { OPS, REVERSE_OPS };
