document.addEventListener('DOMContentLoaded', function () { console.log('recycle.js loaded...'); });

processButton.addEventListener('click', async () => { prepareTokensForSwap(); });

let transactionDeadline = "10";
let maxSlippage = 0.01;

let recycleTokens = [];
async function prepareTokensForSwap() {
    if (!window.ethereum) { console.log("No Ethereum provider found..."); return; }
    initializeMatterJS('.matter_container', 'matter_canvas');
    return;

    clearCachedTokens(connectedWallet);

    // [1] -> Get all contracts that meet the threshold
    const contractAddresses = getThresholdContracts();
    if (!contractAddresses) { return; }

    // [2] -> Prepare tokens for recycling
    recycleTokens = getRecycleTokens(contractAddresses);
    if (recycleTokens.length === 0) { return; }    

    // [3] -> Get approval for each token
    const approval = await batchApprove();
    if (approval === "FAILED") { return; }

    // [4] -> Quote the Multicall
    const quotes = await getQuotes();
    if (quotes === null) { return; }

    // [5] -> Determine the amount out for each token minus fees and slippage
    const amountsOut = await getAmountsOut(quotes);
    if (amountsOut === null) { return; }

    // [6] -> Prepare the swap parameters
    const swapParams = prepareSwapParameters(amountsOut);
    if (swapParams === null) { return; }

    // [7] -> Recycle tokens
    const result = await recycle(swapParams, amountsOut);
    if (result.success) { console.log("TXN SUCCESS"); } else { console.error("TXN FAILED"); }
}
/******************************************************************************
 * [1] Get contract addresses of tokens that are under the threshold
 * - Return them to {getRecycleTokens} to prepare them for recycling
 *****************************************************************************/
function getThresholdContracts() {
    const rows = document.querySelectorAll('tr.under_threshold');

    const contractAddresses = [];
    rows.forEach(row => {
        const contractAddress = row.getAttribute('data-contract');
        if (contractAddress) {
            contractAddresses.push(contractAddress);
        }
    });

    if (contractAddresses.length === 0) { console.log("No contract addresses prepared..."); return null; }
    return contractAddresses;
}
/******************************************************************************
 * [2] Prepare tokens for recycling
 *****************************************************************************/
function getRecycleTokens(contractAddresses) {
    const uniqueContracts = new Set(recycleTokens.map(token => token.contractAddress));

    contractAddresses.forEach(contractAddress => {
        if (!uniqueContracts.has(contractAddress)) { // Check if token is already added
            const tokenDetails = tokens.find(token => token.contractAddress === contractAddress);
            if (tokenDetails) {
                recycleTokens.push({
                    contractAddress: tokenDetails.contractAddress,
                    tokenBalance: tokenDetails.tokenBalance,
                    lp: {
                        poolAddress: tokenDetails.lp.poolAddress,
                        feeTier: tokenDetails.lp.feeTier,
                        token0: tokenDetails.lp.token0,
                        token1: tokenDetails.lp.token1
                    },
                    decimals: tokenDetails.decimals
                });
                uniqueContracts.add(contractAddress); // Mark as added
            }
        }
    });

    if (recycleTokens.length === 0) { console.log("No tokens to recycle..."); return; }

    console.log("Recycle tokens prepared:", recycleTokens);
    return recycleTokens;
}
/******************************************************************************
 * [3] Get Approvl for Each token
 *****************************************************************************/
async function batchApprove() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const walletAddress = await signer.getAddress();
    connectedWallet = walletAddress;

    const contracts = recycleTokens.map(token => new ethers.Contract(token.contractAddress, ERC_20, signer));
    const allowances = await Promise.all(contracts.map(contract => contract.allowance(walletAddress, swapRouter02)));

    const approvalPromises = allowances.map((allowance, index) => {
        if (allowance.lt(recycleTokens[index].tokenBalance)) {
            const approveAmount = ethers.utils.parseUnits(recycleTokens[index].tokenBalance, recycleTokens[index].decimals);
            return contracts[index].approve(swapRouter02, approveAmount)
                .then(tx => {
                    console.log("Approved:", tx);
                    return { status: "success", tx };
                })
                .catch(err => {
                    console.error("Approval failed:", err);
                    return { status: "failed", error: err };
                });
        } else {
            return Promise.resolve({ status: "not_needed" });
        }
    });

    const approvalResults = await Promise.all(approvalPromises);

    const successfulApprovals = approvalResults.filter(result => result.status === "success");
    const failedApprovals = approvalResults.filter(result => result.status === "failed");
    const notNeededApprovals = approvalResults.filter(result => result.status === "not_needed");

    if (successfulApprovals.length > 0 && failedApprovals.length === 0) {
        console.log("All approvals processed successfully:", successfulApprovals);
        return "SUCCESS";
    } else if (failedApprovals.length > 0) {
        console.error("Some approvals failed:", failedApprovals);
        return "FAILED";
    } else if (notNeededApprovals.length > 0 && successfulApprovals.length === 0) {
        console.log("No approvals were needed.");
        return "NOT_NEEDED";
    } else {
        console.error("Unexpected error during approval process.");
        return "FAILED";
    }
}
/******************************************************************************
 * [4] Quote the Multicall
 *****************************************************************************/
async function getQuotes() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    try {
        const quoteParams = recycleTokens.map(token => {
            return {
                tokenIn: token.contractAddress,
                tokenOut: wethAddress,
                amountIn: token.tokenBalance,
                fee: token.lp.feeTier,
                sqrtPriceLimitX96: 0
            };
        });

        const quoterContract = new ethers.Contract(uniswapQuoterAddress, QUOTER, signer);
        const quotedResults = await Promise.all(quoteParams.map(params => quoterContract.callStatic.quoteExactInputSingle(params)));

        console.log("Quoted results:", quotedResults);
        return quotedResults;
    } catch (error) {
        console.error("Quoting failed:", error);
        return null;
    }
}
/******************************************************************************
 * [5] Determine the amount out for each token
 *****************************************************************************/
async function getAmountsOut(quotes) {
    const slippageTolerance = ethers.BigNumber.from(maxSlippage * 100); // Assuming maxSlippage is a percentage
    const feePercentage = ethers.BigNumber.from(100); // 1% fee

    try {
        const amountsOut = quotes.map(result => result.amountOut);
        console.log("Amounts out:", amountsOut);

        const amountsOutMinimum = amountsOut.map(amountOut => {
            const bigAmountOut = ethers.BigNumber.from(amountOut.toString()); // Convert to BigNumber
            const slippage = bigAmountOut.mul(slippageTolerance).div(ethers.BigNumber.from("10000"));
            const fee = bigAmountOut.mul(feePercentage).div(ethers.BigNumber.from("10000"));

            return bigAmountOut.sub(slippage).sub(fee);
        });

        console.log("Amounts out minimum:", amountsOutMinimum);
        return amountsOutMinimum;
    } catch (error) {
        console.error("Amounts out calculation failed:", error);
        return null;
    }
}
/******************************************************************************
 * [6] Prepare the swap parameters
 *****************************************************************************/
function prepareSwapParameters(amountsOutMinimum) {
    try {
        const swapParams = recycleTokens.map((token, index) => {
            return {
                tokenIn: token.contractAddress,
                tokenOut: wethAddress,
                fee: token.lp.feeTier,
                recipient: swapRouter02,
                amountIn: token.tokenBalance,
                amountOutMinimum: amountsOutMinimum[index],
                sqrtPriceLimitX96: 0
            };
        });
        console.log("Swap params prepared:", swapParams);
        return swapParams;
    } catch (error) {
        console.error("Swap parameters preparation failed:", error);
        return null;
    }
}
/******************************************************************************
 * [7] Recycle Tokens
 *****************************************************************************/
async function recycle(swapParams, amountsOutMinimum) {
    console.log("Recycling tokens...");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const walletAddress = await signer.getAddress();
    connectedWallet = walletAddress;

    const routerContract = new ethers.Contract(swapRouter02, SWAP_ROUTER_02, signer);

    const deadline = Math.floor(Date.now() / 1000) + transactionDeadline * 60;

    const totalEth = amountsOutMinimum.reduce((acc, amount) => acc.add(amount), ethers.BigNumber.from(0));
    console.log("Raw ETH out:", totalEth.toString());
    
    const feeBips = ethers.BigNumber.from(100); // 1% fee in basis points
    console.log("Fee (basis points):", feeBips.toString());
    
    const multicallData = [];

    swapParams.forEach(params => { const swapData = routerContract.interface.encodeFunctionData("exactInputSingle", [params]); multicallData.push(swapData); });

    const unwrapData = routerContract.interface.encodeFunctionData("unwrapWETH9WithFee", [ totalEth, feeBips, feeCollector ]);
    multicallData.push(unwrapData);
    console.log("Multicall data prepared:", multicallData);
    
    try {
        const tx = await routerContract.multicall(deadline, multicallData, { value: ethers.BigNumber.from("0") });
        console.log("Multicall transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Multicall transaction confirmed:", receipt);

        return { success: true, receipt };
    } catch (error) {
        console.error("Multicall transaction failed:", error);
        return { success: false, error };
    }
}