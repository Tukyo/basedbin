document.addEventListener('DOMContentLoaded', async () => { console.log('walletconnect.js loaded...'); setTimeout(autoConnect, 500); });

// #region Event Listeners
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// {connectButton} is used to connect the user's wallet to the site or if they are connected show their balance
connectButton.addEventListener('click', async () => { connectWallet(true); });
// #endregion Event Listeners
////
// #region Connection + Auto-Connection + Chain Switching
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// {connectWallet} is used to connect the user's wallet to the site
/// Called when the user has already connected before or when clicking {connectButton}
// {autoConnect} is used to automatically connect the user's wallet to the site
/// Called on load to check if the user has previously connected
// {switchChain} is used to switch the user's wallet to the Base chain
/// Called when the user connects their wallet if they are not on the Base chain
const connectWallet = async (setColors = false) => {
  if (isConnected) { console.log("User already connected..."); if (setColors) { setRootColors(); } return; }

  console.log('Attempting to connect wallet...');
  if (typeof window.ethereum !== 'undefined') {
    console.log('Wallet provider detected...');
    try {
      console.log('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await switchChain();

      if (accounts[0]) {
        updateWalletConnectionStatus(true, accounts[0]);
        updateConnectButtons(accounts[0]);
        await checkForENS(accounts[0]);
      }
      console.log('Connection Initialized...');
      return accounts[0];
    } catch (error) {
      console.error('Connection error:', error);
      return null;
    }
  } else {
    console.log('Wallet provider not installed...');
  }
};
async function autoConnect() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        console.log('Connection Initialized...');
        updateWalletConnectionStatus(true, accounts[0]);
        updateConnectButtons(accounts[0]);
        await checkForENS(accounts[0]);
        await switchChain();
      } else {
        console.log('Not connected...');
      }
    } catch (error) {
      console.error('Error checking connected accounts:', error);
    }
  } else {
    console.log('Wallet provider not installed or unavailable.');
  }
}
async function switchChain() {
  const currentChainID = await window.ethereum.request({ method: 'eth_chainId' });
  if (currentChainID === chainID) { return; }

  try {
    console.log('Switching to Base chain...');
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainID }]
    });
  } catch (switchError) {
    console.log('Switch error:', switchError);
    if (switchError.code === 4902) {
      console.log('Adding Base chain...');
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainID,
          chainName: chainName,
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org']
        }]
      });
    }
  }
}
// #endregion Connection + Auto-Connection + Chain Switching
////
// #region Wallet Connection Status
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This section handles the wallet connection status
// {updateWalletConnectButton} manages the UI for the {connectButton}
// {updateWalletConnectionStatus} manages the actual connection status
function updateConnectButtons(string) { connectButton.textContent = truncate(string); }
async function updateWalletConnectionStatus(bool, walletAddress) {
  isConnected = bool;
  connectedWallet = walletAddress;

  isReturningUser = await getCachedUserWallet(connectedWallet);

  document.dispatchEvent(new CustomEvent('walletConnected'));
  fetchPremiumBalances();

  if (isReturningUser) { updateElement(startButton, "Welcome Back"); } //processAndReplaceText(startButton, "Welcome Back");
  console.log("Wallet address: ", walletAddress);
}
// #endregion Wallet Connection Status