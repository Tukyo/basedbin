const SWAP_ROUTER_02 = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "tokenIn", "type": "address" },
                    { "internalType": "address", "name": "tokenOut", "type": "address" },
                    { "internalType": "uint24", "name": "fee", "type": "uint24" },
                    { "internalType": "address", "name": "recipient", "type": "address" },
                    { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                    { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
                    { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
                ],
                "internalType": "struct IV3SwapRouter.ExactInputSingleParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "exactInputSingle",
        "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountMinimum", "type": "uint256" },
            { "internalType": "uint256", "name": "feeBips", "type": "uint256" },
            { "internalType": "address", "name": "feeRecipient", "type": "address" }
        ],
        "name": "unwrapWETH9WithFee",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "deadline", "type": "uint256" },
            { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }
        ],
        "name": "multicall",
        "outputs": [{ "internalType": "bytes[]", "name": "results", "type": "bytes[]" }],
        "stateMutability": "payable",
        "type": "function"
    }
];
const ERC_20 = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 value) external returns (bool)"
];
const QUOTER = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "tokenIn", "type": "address" },
                    { "internalType": "address", "name": "tokenOut", "type": "address" },
                    { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                    { "internalType": "uint24", "name": "fee", "type": "uint24" },
                    { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
                ],
                "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "quoteExactInputSingle",
        "outputs": [
            { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
            { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
            { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
            { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes", "name": "path", "type": "bytes" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
        ],
        "name": "quoteExactInput",
        "outputs": [
            { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
            { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" },
            { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" },
            { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes", "name": "path", "type": "bytes" },
            { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
        ],
        "name": "quoteExactOutput",
        "outputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" },
            { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" },
            { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];