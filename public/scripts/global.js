document.addEventListener('DOMContentLoaded', function () { console.log('global.js loaded...'); });
//// 
// Wallet Connection
let isConnected = false;
let isReturningUser = false;
let connectedWallet = null;
let isUsingTokenCache = false;
//
////
// Premium
let isPremium = false;
let premiumBalances = [];
//
////
// Cache
const cacheStale = 36000000000; // 1 hour
//
// Chain
const chainID = "0x2105";
const chainName = "Base Mainnet";
//
////
// Interface
const loaderHTML = `<div class="loader"></div>`;
const scrollPrompt = document.getElementById('scroll_prompt');
const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトホモヨョロヲゴゾドボポヴッン0123456789DESYPHEƎR';
const defaultTokenSVG = `
<svg class="default_logo" width="100%" height="100%" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" fill-rule="evenodd"
        d="M6,12 C2.68629,12 0,9.313725 0,6 C0,2.68629 2.68629,0 6,0 C9.313725,0 12,2.68629 12,6 C12,9.313725 9.313725,12 6,12 Z M3.324375,4.643415 C3.324375,4.329675 3.4311225,4.0118025 3.644625,3.689805 C3.8581275,3.3678075 4.169625,3.10113 4.579125,2.8897725 C4.988625,2.6784075 5.46636,2.5727475 6.01236,2.5727475 C6.5198625,2.5727475 6.967875,2.6610825 7.356375,2.8377675 C7.744875,3.0144525 8.045025,3.2547075 8.25675,3.55854 C8.468475,3.8623725 8.574375,4.1926275 8.574375,4.5492975 C8.574375,4.830015 8.514,5.0760375 8.39325,5.2874025 C8.2725,5.49876 8.129025,5.6812275 7.96275,5.83479 C7.796475,5.98836 7.498125,6.24678 7.0676175,6.610065 C6.9486225,6.71244 6.853245,6.8024175 6.7814925,6.8800275 C6.7097475,6.9576375 6.65637,7.0286475 6.6213675,7.09305 C6.3321,7.7601 5.077635,7.6848 5.319375,6.7512375 C5.4103725,6.54813 5.5311225,6.369795 5.681625,6.216225 C5.8321275,6.062655 6.0351075,5.880195 6.29061,5.66883 C6.5146125,5.4838875 6.6765,5.3443725 6.77625,5.250255 C6.876,5.15613 6.96,5.051265 7.02825,4.935675 C7.0965,4.820085 7.13061,4.694595 7.13061,4.55919 C7.13061,4.2949875 7.0265025,4.07208 6.81825,3.890445 C6.610005,3.7088025 6.3413625,3.6179775 6.01236,3.6179775 C5.627355,3.6179775 5.343855,3.70962 5.16186,3.8929125 C4.9798575,4.076205 4.82586,4.3461825 4.69986,4.70286 C4.5808575,5.076045 4.3551225,5.2626375 4.0226175,5.2626375 C3.82662,5.2626375 3.661245,5.19741 3.5265,5.0669625 C3.3917475,4.936515 3.324375,4.795335 3.324375,4.643415 Z M6,9.75 C5.5857825,9.75 5.25,9.414225 5.25,9 C5.25,8.585775 5.5857825,8.25 6,8.25 C6.4142175,8.25 6.75,8.585775 6.75,9 C6.75,9.414225 6.4142175,9.75 6,9.75 Z"/>
</svg>`;
//// Root
const root = document.documentElement;
const rainbowColors = [
    { main: '--coinbase_main', dark: '--coinbase_dark', light: '--coinbase_light' },
    { main: '--rainbow_1', dark: '--rainbow_1_dark', light: '--rainbow_1_light' },
    { main: '--rainbow_2', dark: '--rainbow_2_dark', light: '--rainbow_2_light' },
    { main: '--rainbow_3', dark: '--rainbow_3_dark', light: '--rainbow_3_light' },
    { main: '--rainbow_4', dark: '--rainbow_4_dark', light: '--rainbow_4_light' },
    { main: '--rainbow_5', dark: '--rainbow_5_dark', light: '--rainbow_5_light' },
    { main: '--rainbow_6', dark: '--rainbow_6_dark', light: '--rainbow_6_light' },
];
////
//
//// Buttons
const connectButton = document.getElementById("connect_button");
const startButton = document.getElementById("start_button");
const recycleButton = document.getElementById("recycle_button");
const processButton = document.getElementById("process_button");
const tokensPageButton = document.getElementById("tokens_button");
const premiumPageButton = document.getElementById("premium_button");
////
//
//// Containers
const recycleContainer = document.getElementById("recycle_container");
const homeContainer = document.getElementById("home_container");
////
//// Inputs
const thresholdInput = document.getElementById("threshold_input");
////
//
//// Toggles
const toggleSwitch = document.getElementById("switch");
////
//
//// Table
const table = document.getElementById("tokens_table");
const tableBody = document.getElementById("tokens_body");
const tokensMask = document.querySelector(".tokens_mask");
const premiumMask = document.querySelector(".premium_mask");
const nameHeader = document.getElementById("header_name");
const tokensHeader = document.getElementById("header_tokens");
const valueHeader = document.getElementById("header_value");
let currentSortType = "value";
////
//
////
// Contracts
const wethAddress = "0x4200000000000000000000000000000000000006"; // BASE
const bbApprover = "0x72d90623D29f9d0232Bc6d971c796AC071F39DaB";
const swapRouter02 = "0x2626664c2603336E57B271c5C0b26F421741e481";
const uniswapQuoterAddress = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const feeCollector = "0xaa7De8cb38CC1463f183A495c9E3e5A3c7F1ca07" //TODO: Update to correct feeCollector address
let tokens = [];
// let pools = [];
let currentETHPrice = null;
////
//
// #region Global Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////
    // #region Truncation
    // This function truncates a string to a specified length
    function truncate(string, startLength = 6, endLength = 4) {
        if (string.length <= startLength + endLength + 3) { // Only truncate if too long
            return string;
        }
        return `${string.slice(0, startLength)}...${string.slice(-endLength)}`;
    }
    //
    function truncateBalance(balance, maxLength = 8) {
        const num = parseFloat(balance);
        if (isNaN(num)) { console.error("Invalid balance:", balance); return balance; }

        if (num >= 1e15) return `${(num / 1e15).toFixed(2)}Q`;
        if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;

        const [intPart, decPart = ""] = num.toString().split(".");
        if (intPart.length >= maxLength) { return intPart; }

        const remainingLength = maxLength - intPart.length - 1;
        const truncatedDecimal = decPart.slice(0, Math.max(remainingLength, 0));
        return truncatedDecimal ? `${intPart}.${truncatedDecimal}` : intPart;
    }
    //
    function checksumAddress(address) { return ethers.utils.getAddress(address); }
    // #endregion Truncation
//////
    // #region Interface
    function updateElement(element, string) { element.textContent = string; }
    //
    function toggleLoader(element, isEnabled = true, newText = "") {
        if (!element) return;
        if (isEnabled) { element.innerHTML = loaderHTML; } else { element.innerHTML = newText; }
    }
    // #endregion Interface
////
    // #region Crypto Details
    async function getTokens() {
        if (!window.ethereum) { return; }

        console.log("Fetching token details...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const walletAddress = await signer.getAddress();

        const cachedTokens = fetchTokenCache(walletAddress); // Check the cache
        if (cachedTokens) { tokens = cachedTokens; isUsingTokenCache = true; }

        try {
            let data = null;
            if (!isUsingTokenCache) {
                const response = await fetch('/api/getTokenBalances', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ walletAddress }),
                });

                if (!response.ok) { throw new Error(`Failed to fetch token balances: ${response.statusText}`); }
                data = await response.json();
                console.log("Fetched token balances:", data);
            }

            if (isUsingTokenCache) { fetchTokenPricesBackground(tokens); }

            if (data !== null && isUsingTokenCache === false) {
                if (currentETHPrice === null) { await getETHPrice(); }

                tokens = await Promise.all(
                    data.result.tokenBalances.map(async (token) => {
                        const contractAddress = token.contractAddress;
                        const tokenBalance = token.tokenBalance;

                        if (parseInt(tokenBalance, 16) === 0) { return null; }

                        try {
                            let name = null;
                            let symbol = null;
                            let decimals = null;
                            let chosenPool = null;
                            let image = null;

                            const result = await fetchTokenFromDatabase(contractAddress);

                            if (result) {
                                name = result.name;
                                symbol = result.symbol;
                                decimals = result.decimals;
                                chosenPool = result.lp;
                                image = result.image;
                            } else {
                                const response = await fetch('/api/getTokenDetails', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ contractAddress }),
                                });
                            
                                if (!response.ok) { throw new Error(`Failed to fetch token details: ${response.statusText}`); }
                                
                            
                                const details = await response.json();
                                console.log("Fetched details:", details);
                                name = details.name;
                                symbol = details.symbol;
                                decimals = Number(details.decimals);

                                if (decimals !== 18) { return null; }
                                console.log("Decimals:", decimals);

                                const pools = await getPoolsForToken(contractAddress);

                                chosenPool = await getBestPool(pools, contractAddress);
                                if (!chosenPool) { return null; }

                                await storeTokenInDatabase(contractAddress, name, symbol, decimals, chosenPool);
                            }

                            return {
                                contractAddress,
                                tokenBalance: ethers.BigNumber.from(tokenBalance).toString(),
                                name,
                                symbol,
                                decimals,
                                lp: {
                                    poolAddress: chosenPool.poolAddress,
                                    liquidity: ethers.BigNumber.from(chosenPool.liquidity).toString(),
                                    feeTier: chosenPool.feeTier,
                                    token0: chosenPool.token0,
                                    token1: chosenPool.token1,
                                },
                                value: await getTokenPrice(contractAddress, chosenPool),
                                image,
                            };
                        } catch (error) {
                            console.error(`Error fetching token details for ${contractAddress}:`, error);
                            return {
                                contractAddress,
                                tokenBalance: ethers.BigNumber.from(tokenBalance).toString(),
                                name: "Unknown",
                                symbol: "Unknown",
                                decimals: 0,
                                lp: [],
                                feeTier: [],
                                value: null,
                                image: null,
                            };
                        }
                    })
                );
            }
            tokens = tokens.filter((token) => token !== null);
            console.log("Tokens:", tokens);
            if (tokens.length === 0) { console.log("No tokens found..."); }
            document.dispatchEvent(new CustomEvent("tokenDetailsFetched", { detail: { tokens } }));
            if (!isUsingTokenCache) { cacheTokenDetails(walletAddress, tokens); fetchLogosBackground(15000, 3); }
            return tokens;
        } catch (error) {
            console.error("Error fetching token balances:", error);
        }
    }
    //
    async function getPoolsForToken(tokenAddress) {
        const feeTiers = [500, 3000, 10000];
        const MIN_LIQUIDITY_USD_THRESHOLD = 100; // Example: $100 USD (adjust as needed)

        // Fetch the current ETH price in USD
        if (currentETHPrice === null) { currentETHPrice = await getETHPrice(); }
        const ethPrice = ethers.BigNumber.from(ethers.utils.parseUnits(currentETHPrice.toString(), 18));

        try {
            const response = await fetch('/api/getPoolsForToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenAddress,
                    feeTiers,
                    minLiquidityUSD: MIN_LIQUIDITY_USD_THRESHOLD,
                    ethPrice: ethPrice.toString(),
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error(
                    `Failed to fetch pools for token ${tokenAddress}:`,
                    response.status,
                    errorData.error || response.statusText
                );
                return null;
            }
    
            const pools = await response.json();
            console.log(`Fetched pools for token ${tokenAddress}:`, pools);
    
            return pools;
        } catch (error) {
            console.error(`Error fetching pools for token ${tokenAddress}:`, error.message);
            return null;
        }
    }
    //
    async function fetchLogosBackground(interval, maxPings) {
        console.log("Starting background logo fetching...");

        for (const token of tokens) {
            if (token.image || token.image === "NOT_FOUND") { continue; }
            if (token.value === null) { continue; }
            if (token.decimals !== 18) { continue; }

            let attempts = 0;
            let image = null;

            while (attempts < maxPings) {
                try {
                    console.log(`Fetching logo for ${truncate(token.contractAddress)} (Attempt ${attempts + 1})...`);

                    const response = await fetch(`/api/getTokenLogo?contractAddress=${token.contractAddress}`);

                    if (response.status === 404) {
                        console.log(`404 Not Found for ${truncate(token.contractAddress)}.`);
                        token.image = "NOT_FOUND";
                        break; // Stop retrying for this token.
                    }

                    if (!response.ok) { throw new Error(`Error fetching data: ${response.statusText}`); }

                    const data = await response.json();
                    if (data.image && data.image.large) {
                        image = data.image.large;
                        console.log(`Logo found for ${truncate(token.contractAddress)}: ${image}`);
                        token.image = image;
                        document.dispatchEvent(new CustomEvent("tokenImageFound", { detail: { token, image } }));
                        await updateTokenImageDB(token.contractAddress, image);
                        break; // Stop retrying as we found the image.
                    } else {
                        console.log(`No logo in response for ${truncate(token.contractAddress)}.`);
                    }
                } catch (error) {
                    console.error(`Attempt ${attempts + 1} failed for ${truncate(token.contractAddress)}:`, error);
                }

                attempts++;
                if (attempts < maxPings) {
                    console.log(`Waiting ${interval / 1000} seconds before retrying...`);
                    await new Promise((resolve) => setTimeout(resolve, interval));
                }
            }
            if (!image && token.image !== "NOT_FOUND") {
                console.log(`Failed to fetch logo for ${truncate(token.contractAddress)} after ${maxPings} attempts.`);
                token.image = "NOT_FOUND"; // Mark as NOT_FOUND if all attempts failed.
            }
        }
        cacheTokenDetails(connectedWallet, tokens);
        document.dispatchEvent(new CustomEvent("backgroundLogoFetchingComplete"));
        console.log("Background logo fetching completed.");
    }
    //
    function fetchTokenPricesBackground(tokens, interval = 10000) {
        let currentIndex = 0;

        const updatePrices = async () => {
            if (currentIndex >= tokens.length) {
                console.log("Completed fetching prices for all tokens.");
                clearInterval(intervalId);
                return;
            }
    
            const token = tokens[currentIndex];
            currentIndex++;
    
            const chosenPool = token.lp;
            if (chosenPool) {
                try {
                    const contractAddress = token.contractAddress;
                    document.dispatchEvent(new CustomEvent("tokenPriceUpdating", { detail: { contractAddress } }));
                    const price = await getTokenPrice(token.contractAddress, chosenPool);
                    if (price !== null) {
                        token.value = price;                       
    
                        document.dispatchEvent(new CustomEvent("tokenPriceUpdated", { detail: { contractAddress, price } }));
                        console.log(`Updated price for ${token.symbol}: ${price}`);
                    }
                } catch (error) {
                    console.error(`Failed to update price for ${token.symbol}:`, error);
                }
            } else {
                console.warn(`Token ${token.symbol} missing pool details; skipping price update.`);
            }
        };
        const intervalId = setInterval(updatePrices, interval);
        updatePrices();
        return intervalId;
    }
    //
    async function getETHPrice() { //API
        try {
            const response = await fetch('/api/getETHPrice', { method: "GET", });

            if (!response.ok) { console.error(response.status); throw new Error('Failed to fetch ETH price...'); }

            const data = await response.json();
            if (data.ethPrice) {
                currentETHPrice = data.ethPrice;
                console.log(`Current ETH Price (USD): ${currentETHPrice}`);
                return currentETHPrice;
            } else { console.warn('ETH price not fetched...'); return null; }
        } catch (error) { console.error(error); throw error; }
    }
    //
    async function getBestPool(pools, contractAddress) {
        if (!pools || !Array.isArray(pools) || pools.length === 0) {
            console.log(`No pools found for token: ${truncate(contractAddress)}`);
            return null;
        }
        
        const tokenPools = pools.filter(
            (pool) =>
                pool.token0.toLowerCase() === contractAddress.toLowerCase() ||
                pool.token1.toLowerCase() === contractAddress.toLowerCase()
        );

        let bestPool = null;
        let maxLiquidity = ethers.BigNumber.from(0);

        tokenPools.forEach((pool) => {
            const poolLiquidity = ethers.BigNumber.from(pool.liquidity);
            if (poolLiquidity.gt(maxLiquidity)) {
                maxLiquidity = poolLiquidity;
                bestPool = pool;
            }
        });

        if (!bestPool) { console.log(`No valid pool found for token: ${truncate(contractAddress)}`); return null; }
        return bestPool;
    }
    //
    async function getTokenPrice(contractAddress, pool) {
        try {
            const response = await fetch('/api/getPoolDetails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolAddress: pool.poolAddress,
                    contractAddress: contractAddress,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error(
                    `Failed to fetch pool details for ${pool.poolAddress}:`,
                    response.status,
                    errorData.error || response.statusText
                );
                return null;
            }

            const { poolAddress, token0, token1, decimals0, decimals1, sqrtPriceX96 } = await response.json();

            console.log(`Fetched pool details for ${poolAddress}:`, {
                token0,
                token1,
                decimals0,
                decimals1,
                sqrtPriceX96,
            });

            // Step 2: Calculate the price ratio = token1/token0 using precise big-number math
            const formattedSqrtPricex96 = ethers.BigNumber.from(sqrtPriceX96);
            const Q96 = ethers.BigNumber.from("79228162514264337593543950336");
            const numerator = formattedSqrtPricex96
                .mul(formattedSqrtPricex96)
                .mul(ethers.BigNumber.from(10).pow(decimals0));
            const denominator = Q96.mul(Q96).mul(ethers.BigNumber.from(10).pow(decimals1));
            const ratioBN = numerator.div(denominator);
            const remainder = numerator.mod(denominator);

            const decimalsWanted = 8;
            const scaleFactor = ethers.BigNumber.from(10).pow(decimalsWanted);
            const remainderScaled = remainder.mul(scaleFactor).div(denominator);
            const ratioFloat =
                parseFloat(ratioBN.toString()) +
                parseFloat(remainderScaled.toString()) / Math.pow(10, decimalsWanted);

            // Step 2b: Determine how many WETH per token or tokens per WETH
            let tokenWETH;
            if (token1.toLowerCase() === wethAddress.toLowerCase()) {
                tokenWETH = ratioFloat;
            } else if (token0.toLowerCase() === wethAddress.toLowerCase()) {
                tokenWETH = 1 / ratioFloat;
            } else {
                console.log(`Skipping pool ${poolAddress} - Neither token is WETH.`);
                return null;
            }

            // Step 3: Fetch the ETH price in USD
            if (currentETHPrice === null) currentETHPrice = await getETHPrice();
            if (!currentETHPrice) { return null; }

            // Step 4: Convert token price from WETH to USD
            console.log(`Converting token price from WETH to USD for pool ${poolAddress}...`);
            const tokenPriceUSD = tokenWETH * parseFloat(currentETHPrice);
            console.log(`Price for pool ${poolAddress}: ${tokenPriceUSD} USD`);

            return tokenPriceUSD;
        } catch (error) {
            console.error("Error fetching " + defaultToken + " price:", error);
            return null;
        }
    }
    // #endregion Crypto Details
////
    // #region Premium
    async function fetchPremiumBalances() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const walletAddress = await signer.getAddress();
            connectedWallet = walletAddress;

            const response = await fetch("/api/getPremiumBalances", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ walletAddress }),
            });

            if (!response.ok) { throw new Error("Failed to fetch premium balances"); }

            const data = await response.json();
            console.log("Premium Balances:", data.balances);

            return data.balances;
        } catch (error) { console.error("Error:", error); }
    }
    // #endregion Premium
////
    // #region Caching
    function cacheUserWallet(walletAddress) {
        const checksummedAddress = checksumAddress(walletAddress);
        localStorage.setItem('user', JSON.stringify({ checksummedAddress }));
        console.log(`User's wallet address cached: ${truncate(checksummedAddress)}`);
    }
    //
    function getCachedUserWallet(walletAddress) {
        const checksummedAddress = checksumAddress(walletAddress);
        const userCache = JSON.parse(localStorage.getItem('user'));
        if (userCache && userCache.checksummedAddress === checksummedAddress) {
            console.log(`Wallet address ${truncate(checksummedAddress)} is in the cache.`);
            return true;
        } else {
            cacheUserWallet(checksummedAddress);
            console.log(`Wallet address ${truncate(walletAddress)} is not in the cache.`);
            return false;
        }
    }
    //
    function cacheTokenDetails(walletAddress, tokenDetails) {
        const checksummedAddress = checksumAddress(walletAddress);
        const tokenDetailsCache = JSON.parse(localStorage.getItem('tokenDetailsCache')) || {};
        const currentCache = tokenDetailsCache[checksummedAddress];
        
        const isStale = currentCache && (Date.now() - currentCache.timestamp > cacheStale);
    
        if (currentCache && !isStale && JSON.stringify(currentCache.data) === JSON.stringify(tokenDetails)) {
            console.log(`Cache for wallet ${truncate(checksummedAddress)} is already up-to-date.`);
            return; // Do not update if the cache is already valid and not stale.
        }
    
        tokenDetailsCache[checksummedAddress] = {
            data: tokenDetails,
            timestamp: Date.now(),
        };
        localStorage.setItem('tokenDetailsCache', JSON.stringify(tokenDetailsCache));
        console.log(`Token details cached for wallet: ${truncate(checksummedAddress)}${isStale ? " (replaced due to staleness)" : ""}`);
    }
    function clearCachedTokens(walletAddress) {
        const checksummedAddress = checksumAddress(walletAddress);
        const tokenDetailsCache = JSON.parse(localStorage.getItem('tokenDetailsCache')) || {};
    
        if (tokenDetailsCache[checksummedAddress]) {
            delete tokenDetailsCache[checksummedAddress];
            localStorage.setItem('tokenDetailsCache', JSON.stringify(tokenDetailsCache));
            console.log(`Cache cleared for wallet: ${truncate(checksummedAddress)}`);
        } else {
            console.log(`No cache found for wallet: ${truncate(checksummedAddress)}`);
        }
    }    
    //
    function fetchTokenCache(walletAddress) {
        const checksummedAddress = checksumAddress(walletAddress);
        const cache = JSON.parse(localStorage.getItem('tokenDetailsCache'));
        if (cache && cache[checksummedAddress]) {
            const { data, timestamp } = cache[checksummedAddress];
            const isStale = Date.now() - timestamp > cacheStale;

            if (!isStale) {
                console.log(`Loaded token details from cache for wallet: ${truncate(checksummedAddress)}`);
                return data;
            } else {
                console.log(`Cache for wallet ${truncate(checksummedAddress)} is stale.`);
            }
        } else {
            console.log(`No cache found for wallet: ${truncate(checksummedAddress)}`);
        }
        return null; // No valid cache
    }
    //
    function cacheUserDetails(colors = null, cacheSorting = false) {
        if (!connectedWallet) return;

        const checksummedAddress = checksumAddress(connectedWallet);
        const userCache = JSON.parse(localStorage.getItem('user')) || {};
    
        userCache[checksummedAddress] = { colors: colors || userCache[checksummedAddress]?.colors || null, };
        if (currentSortType !== null && cacheSorting) { userCache.sortType = currentSortType; }
    
        localStorage.setItem('user', JSON.stringify(userCache));
    
        console.log(`Cached data for wallet ${truncate(checksummedAddress)}`);
    }
    //
    function fetchUserDetails() {
        if (!connectedWallet) return;

        const checksummedAddress = checksumAddress(connectedWallet);
        const userCache = JSON.parse(localStorage.getItem('user')) || {};

        if (userCache[checksummedAddress]) {
            const { colors } = userCache[checksummedAddress];

            setRootColors(colors);
            console.log(`Fetched colors for wallet: ${truncate(checksummedAddress)}`);
            return;
        } else {
            setRootColors();
        }
        if (userCache.sortType) { currentSortType = userCache.sortType; }
    }
    // #endregion Caching
////
    // #region ENS
    ////
    // This function resolves an address to an ENS name using {mainnetEndpoint} in {global.js}
    // It uses {maxEndpointRetries} from {global.js} and attempts to resolve the address to ENS
    async function checkForENS(address) {
        ens = await resolveAddressToENS(address);
        if (ens) {
            updateConnectButtons(truncate(ens));
        } else { updateConnectButtons(truncate(address)); }
    }
    //
    async function resolveAddressToENS(address, retries = 3) { //API
        try {
            const response = await fetch(`/api/resolveENS?address=${address}`, { method: "GET", });
            if (!response.ok) { console.error(`API call failed: ${response.status}`); return null; }

            const data = await response.json();
            if (data.ensName) {
                console.log(`Address ${truncate(address)} ENS: ${data.ensName}`);
                return data.ensName;
            } else if (data.error) { console.log(`${data.error}`); return null; }
        } catch (error) {
            console.error(`Error resolving address ${truncate(address)} via backend:`, error);

            if (retries > 0) {
                console.log(`(Failed, ${retries} attempts left)...`);
                return resolveAddressToENS(address, retries - 1);
            }
            return null;
        }
    }
    // #endregion ENS
////
    // #region Token Persistence
    async function storeTokenInDatabase(contractAddress, name, symbol, decimals, lp) {
        const convertedLiquidity = ethers.BigNumber.from(lp.liquidity).toString();
        try {
            const response = await fetch('/api/storeToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractAddress,
                    name,
                    symbol,
                    decimals,
                    lp: {
                        poolAddress: lp.poolAddress,
                        liquidity: convertedLiquidity,
                        feeTier: lp.feeTier,
                        token0: lp.token0,
                        token1: lp.token1,
                    },
                }),
            });

            if (!response.ok) { throw new Error(`Failed to store token: ${response.statusText}`); }

            const result = await response.json();
            console.log(`Token stored successfully for ${contractAddress}:`, result);
        } catch (error) { console.error(`Error storing token for ${contractAddress}:`, error); }
    }
    //
    async function updateTokenImageDB(contractAddress, image) {
        try {
            const response = await fetch('/api/storeToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractAddress,
                    image,
                }),
            });

            if (!response.ok) { throw new Error(`Failed to update token image: ${response.statusText}`); }

            const result = await response.json();
            console.log(`Image updated successfully for ${contractAddress}:`, result);
        } catch (error) { console.error(`Error updating token image for ${contractAddress}:`, error); }
    }
    //
    async function fetchTokenFromDatabase(contractAddress) {
        try {
            const response = await fetch(`/api/fetchToken?contractAddress=${contractAddress}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 404) { console.log(`Token not found in database: ${contractAddress}`); return null; }

            if (!response.ok) { throw new Error(`Failed to fetch token: ${response.statusText}`); }

            const tokenData = await response.json();
            console.log(`Token data fetched successfully for ${contractAddress}:`, tokenData);
            return tokenData;
        } catch (error) {
            console.error(`Error fetching token data for ${contractAddress}:`, error);
            return null;
        }
    }
    // #endregion Token Persistence
////
//
// #endregion Global Functions