const serviceAccount = require('./serviceaccountkey.json');
const functions = require('firebase-functions');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const express = require('express');
const path = require('path');

const ethers = require('ethers');
const { BigNumber } = require("@ethersproject/bignumber");
const { AddressZero, WeiPerEther } = require('@ethersproject/constants');

require('dotenv').config();

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    const basePath = req.baseUrl || '/'; // Detect base path dynamically
    app.use(basePath, express.static(path.join(__dirname, '../public')));
    next();
});

const baseEndpoint = process.env.BASE_ENDPOINT;
const baseProvider = new ethers.JsonRpcProvider(baseEndpoint);
const mainnetProviders = [
    new ethers.CloudflareProvider(),
    new ethers.JsonRpcProvider(process.env.MAINNET_ENDPOINT),
];
const coingeckoAPIKey = process.env.COINGECKO_API_KEY;
const coingeckoBaseURL = "https://api.coingecko.com/api/v3/coins";

const wethAddress = "0x4200000000000000000000000000000000000006";
const chainlinkPricefeed = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const uniswapV3FactoryAddress = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

const premiumContractAddresses = [ "0x21b9d428eb20fa075a29d51813e57bab85406620" ]

const abis = require('./abi.json');
const chainlinkABI = abis.chainlink;
const erc20ABI = abis.erc20;
const uniswapV3ABI = abis.uniswapV3;
const uniswapV3FactoryABI = abis.uniswapV3Factory;
const uniswapV3PoolABI = abis.uniswapV3Pool; 

// #region Functions
////////////////////////////////////////////////////////////////////////////////
//
// #region ENS
////
    app.get('/api/resolveENS', async (req, res) => {
        try {
            const address = req.query.address;
            if (!address) {
                console.log("No address provided in request.");
                return res.status(400).json({ error: 'No address provided' });
            }
            console.log(`Attempting to resolve ENS for address: ${address}`);

            for (const provider of mainnetProviders) {
                try {
                    const ensName = await provider.lookupAddress(address);
                    if (ensName) {
                        console.log(`Successfully resolved address ${address} to ENS: ${ensName}`);
                        return res.json({ ensName });
                    }
                } catch (error) {
                    console.warn(error.message);
                    continue;
                }
            }
            console.warn(`No ENS found for address: ${address}`);
            return res.json({ ensName: null, error: 'No ENS found for address' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
////
// #endregion ENS
//
// #region ETH Price
////
    app.get('/api/getETHPrice', async (req, res) => {
        try {
            for (const provider of mainnetProviders) {
                try {
                    const priceFeed = new ethers.Contract(chainlinkPricefeed, chainlinkABI, provider);
                    const roundData = await priceFeed.latestRoundData();
                    const ethPrice = ethers.formatUnits(roundData[1], 8);

                    console.log(`Current ETH Price (USD): ${ethPrice}`);
                    return res.json({ ethPrice });
                } catch (error) {
                    console.warn(`Error fetching ETH price from provider: ${error.message}`);
                    continue;
                }
            }
            console.warn('Failed to fetch ETH price from all providers');
            return res.status(404).json({ error: 'Failed to fetch ETH price' });
        } catch (error) {
            console.error('Internal server error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
////
// #endregion ETH Price
//
// #region Token Storage
////
    app.post('/api/storeToken', async (req, res) => {
        try {
            const { contractAddress, name, symbol, decimals, lp, image } = req.body;

            if (!contractAddress) {
                return res.status(400).json({ error: 'Missing required contractAddress' });
            }
            const checksummedAddress = ethers.getAddress(contractAddress);

            console.log(`Updating token data for contract: ${checksummedAddress}`);
            const tokenRef = db.collection('tokens').doc(checksummedAddress);

            const updateData = {};
            if (name) updateData.name = name;
            if (symbol) updateData.symbol = symbol;
            if (decimals) updateData.decimals = decimals;
            if (lp) updateData.lp = {
                poolAddress: lp.poolAddress,
                liquidity: lp.liquidity,
                feeTier: lp.feeTier,
                token0: lp.token0,
                token1: lp.token1,
            };
            if (image) updateData.image = image;

            await tokenRef.set(updateData, { merge: true }); // Merge
            console.log(`Token data updated successfully for ${checksummedAddress}`);

            res.status(200).json({ message: 'Token data updated successfully' });
        } catch (error) {
            console.error('Error updating token data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    //
    app.get('/api/fetchToken', async (req, res) => {
        try {
            const { contractAddress } = req.query;
    
            if (!contractAddress) { return res.status(400).json({ error: 'No Contract' }); }
    
            const checksummedAddress = ethers.getAddress(contractAddress);
    
            console.log(`Fetching token data for contract: ${checksummedAddress}`);
            const tokenRef = db.collection('tokens').doc(checksummedAddress);
            const docSnapshot = await tokenRef.get();
    
            if (!docSnapshot.exists) {
                console.log(`No token data found for: ${checksummedAddress}`);
                return res.status(404).json({ error: 'Token not found' });
            }
    
            const tokenData = docSnapshot.data();
            console.log(`Token data fetched successfully for ${checksummedAddress}`);
            res.status(200).json(tokenData);
        } catch (error) {
            console.error('Error fetching token data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
////
// #endregion Token Storage
//
// #region Token Fetching
////
    app.post('/api/getTokenBalances', async (req, res) => {
        try {
            const { walletAddress } = req.body;

            if (!walletAddress) { return res.status(400).json({ error: 'Missing walletAddress' }); }

            console.log(`Fetching token balances for wallet: ${walletAddress}`);

            const response = await fetch(baseEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'alchemy_getTokenBalances',
                    params: [walletAddress],
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch token balances: ${response.statusText}`);
            }

            const data = await response.json();

            console.log(`Token balances fetched successfully for wallet: ${walletAddress}`);
            res.status(200).json(data); // Return the data to the frontend
        } catch (error) {
            console.error('Error fetching token balances:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    //
    app.post('/api/getTokenDetails', async (req, res) => {
        try {
            const { contractAddress } = req.body;
    
            if (!contractAddress) { return res.status(400).json({ error: 'Missing contractAddress' }); }

            console.log(`Fetching token details for contract: ${contractAddress}`);
    
            const contract = new ethers.Contract(contractAddress, erc20ABI, baseProvider);
    
            const [name, symbol, decimals] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
            ]);
    
            console.log(`Fetched token details for ${contractAddress}:`, { name, symbol, decimals: decimals.toString() });
    
            res.status(200).json({ name, symbol, decimals: decimals.toString() });
        } catch (error) {
            console.error(`Error fetching token details for ${req.body.contractAddress}:`, error);
    
            if (error.message.includes('invalid address')) {
                return res.status(400).json({ error: 'Invalid contract address' });
            }
    
            if (error.code === 'CALL_EXCEPTION') {
                return res.status(404).json({ error: 'Token contract not found or inaccessible' });
            }
    
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    //
    app.post('/api/getPoolDetails', async (req, res) => {
        try {
            const { poolAddress, contractAddress } = req.body;
    
            if (!poolAddress || !contractAddress) {
                return res.status(400).json({ error: 'Missing poolAddress or contractAddress' });
            }

            const checksumContractAddress = ethers.getAddress(contractAddress);
            const checksumLPAddress = ethers.getAddress(poolAddress);
    
            console.log(`Fetching pool details for LP: ${checksumLPAddress}, Contract: ${checksumContractAddress}`);
    
            const tokenRef = db.collection('tokens').doc(checksumContractAddress);
            const docSnapshot = await tokenRef.get();
    
            let tokenData;
            if (docSnapshot.exists) {
                tokenData = docSnapshot.data();
                console.log(`Token data found for ${checksumContractAddress}`);
            } else {
                console.log(`No token data found for ${checksumContractAddress}`);
            }
    
            let sqrtPriceX96, token0, token1, decimals0, decimals1;
    
            // Fetch sqrtPriceX96 from the pool contract
            const lpContract = new ethers.Contract(poolAddress, uniswapV3ABI, baseProvider);
            const slot0Data = await lpContract.slot0();
            sqrtPriceX96 = slot0Data.sqrtPriceX96;
            console.log(`Fetched sqrtPriceX96 for ${checksumLPAddress}: ${sqrtPriceX96}`);
    
            if (tokenData && tokenData.lp) { // Use stored details
                token0 = tokenData.lp.token0;
                token1 = tokenData.lp.token1;
                decimals0 = token0.toLowerCase() === wethAddress.toLowerCase() ? 18 : tokenData.decimals;
                decimals1 = token1.toLowerCase() === wethAddress.toLowerCase() ? 18 : tokenData.decimals;
    
                console.log(`Returning stored pool data for ${checksumLPAddress}`);
            } else { // Fetch details from the pool contract
                console.log(`Fetching pool details for ${checksumLPAddress}`);
                token0 = await lpContract.token0();
                token1 = await lpContract.token1();
    
                const token0Contract = new ethers.Contract(token0, erc20ABI, baseProvider);
                const token1Contract = new ethers.Contract(token1, erc20ABI, baseProvider);
    
                decimals0 = await token0Contract.decimals();
                decimals1 = await token1Contract.decimals();
    
                console.log(`Fetched decimals: token0=${decimals0}, token1=${decimals1}`);
            }
    
            res.status(200).json({
                poolAddress,
                token0,
                token1,
                decimals0,
                decimals1,
                sqrtPriceX96: sqrtPriceX96.toString(),
            });
        } catch (error) {
            console.error('Error fetching pool details:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    //
    app.post('/api/getPoolsForToken', async (req, res) => {
        try {
            const { tokenAddress, feeTiers, minLiquidityUSD, ethPrice } = req.body;
            console.log('Received request body:', req.body);
    
            if (!tokenAddress || !feeTiers || !minLiquidityUSD || !ethPrice) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
    
            console.log(`Fetching pools for token: ${tokenAddress}`);
            const factoryContract = new ethers.Contract(uniswapV3FactoryAddress, uniswapV3FactoryABI, baseProvider);
    
            const pools = [];
            const ethPriceBN = BigNumber.from(ethPrice);
    
            for (const fee of feeTiers) {
                try {
                    const poolAddress = await factoryContract.getPool(tokenAddress, wethAddress, fee);
                    if (poolAddress !== AddressZero) {
                        const poolContract = new ethers.Contract(poolAddress, uniswapV3PoolABI, baseProvider);
    
                        const liquidity = await poolContract.liquidity();
                        const liquidityBN = BigNumber.from(liquidity);
                        if (liquidityBN.eq(0)) {
                            console.log(`Pool at ${poolAddress} has no liquidity, skipping...`);
                            continue;
                        }
    
                        const token0 = await poolContract.token0();
                        const token1 = await poolContract.token1();
    
                        let wethToken = null;
                        if (token0.toLowerCase() === wethAddress.toLowerCase()) {
                            wethToken = token0;
                        } else if (token1.toLowerCase() === wethAddress.toLowerCase()) {
                            wethToken = token1;
                        }
    
                        if (wethToken) {
                            const liquidityInETH = BigNumber.from(liquidity).div(WeiPerEther); // Convert to ETH
                            const liquidityInUSD = liquidityInETH.mul(ethPriceBN).div(WeiPerEther); // Convert to USD
    
                            if (liquidityInUSD.lt(BigNumber.from(minLiquidityUSD))) {
                                console.log(`Ignoring pool at ${poolAddress} due to low liquidity: ${liquidityInUSD.toString()} USD`);
                                continue; // Skip this pool
                            }
                        }
    
                        pools.push({
                            poolAddress,
                            feeTier: fee,
                            token0,
                            token1,
                            liquidity: liquidity.toString(), // Convert to string for JSON serialization
                        });
                    }
                } catch (error) {
                    console.warn(`Error fetching pool for fee tier ${fee}:`, error.message);
                }
            }
    
            if (pools.length === 0) {
                console.log(`No pools found or all pools have low liquidity for token: ${tokenAddress}`);
                return res.status(200).json([]);
            }
    
            console.log(`Returning pools for token: ${tokenAddress}`);
            res.status(200).json(pools);
        } catch (error) {
            console.error('Error fetching pools for token:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });   
    //
    app.get('/api/getTokenLogo', async (req, res) => {
        const { contractAddress } = req.query;
    
        if (!contractAddress) {
            return res.status(400).json({ error: "Contract address is required" });
        }
    
        try {
            const response = await fetch(
                `${coingeckoBaseURL}/base/contract/${contractAddress}?api_key=${coingeckoAPIKey}`
            );
    
            if (response.status === 404) {
                return res.status(404).json({ error: "Token not found" });
            }
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error(`Failed to fetch logo for ${contractAddress}:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }); 
////
// #endregion Token Fetching
//
// #region Premium
////
    app.post("/api/getPremiumBalances", async (req, res) => {
        try {
        const { walletAddress } = req.body;
    
        if (!walletAddress) { return res.status(400).json({ error: "Wallet address is required" }); }
    
        const balances = {};
        for (const address of premiumContractAddresses) {
            const contract = new ethers.Contract(address, erc20ABI, baseProvider);
    
            const balance = await contract.balanceOf(walletAddress);
            balances[address] = ethers.formatEther(balance);
        }
    
        res.status(200).json({ balances });
        } catch (error) {
        console.error("Error fetching balances:", error);
        res.status(500).json({ error: "Internal server error" });
        }
    });
////
// #endregion Premium
////////////////////////////////////////////////////////////////////////////////
// #endregion Functions

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '../public/index.html')); });

exports.app = functions.https.onRequest(app);