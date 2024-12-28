document.addEventListener('DOMContentLoaded', function () { console.log('interface.js loaded...'); });

// #region Initialization
document.addEventListener('walletConnected', () => { fetchUserDetails(); });
document.addEventListener('tokenImageFound', (event) => { const { token } = event.detail; updateTokenImage(token); });
document.addEventListener('tokenDetailsFetched', () => { sortTable(currentSortType); });
document.addEventListener('backgroundLogoFetchingComplete', () => { appendDefaultLogos(); });
toggleSwitch.addEventListener("change", () => { isValueCheck = toggleSwitch.checked; highlightRows(); });
thresholdInput.addEventListener("input", () => { currentThreshold = parseFloat(thresholdInput.value) || 0; highlightRows(); });
startButton.addEventListener('click', async () => {
    if (!isConnected) { await connectWallet(); }

    toggleLoader(startButton, true);

    await getTokens();

    isRecycling = true;
    updateMainDisplay();
});
nameHeader.addEventListener('click', handleHeaderClick("name"));
tokensHeader.addEventListener('click', handleHeaderClick("tokens"));
valueHeader.addEventListener('click', handleHeaderClick("value"));

let isRecycling = false;
let currentThreshold = null;
let isValueCheck = false;

let tableSortTypes = ["name", "name_reverse", "tokens", "tokens_reverse", "value", "value_reverse"];

// #endregion Initialization
////
// #region Main Interface
function updateMainDisplay() {
    if (isRecycling) {
        toggleHide(homeContainer, true, () => { toggleShow(recycleContainer, true); populateTokensTable(); });
    } else {
        toggleHide(recycleContainer, true, () => { toggleShow(homeContainer, true); });
    }
}
function toggleHide(element, bool, callback) {
    if (bool) {
        element.classList.add("hide");
        element.addEventListener("animationend", function handler() {
            element.removeEventListener("animationend", handler);
            element.style.display = "none";
            if (callback) callback();
        });
    } else {
        element.style.display = "flex";
        element.classList.remove("hide");
    }
}
function toggleShow(element, bool) {
    if (bool) {
        element.style.display = "flex";
        element.classList.add("show");
        element.classList.remove("hide");
    } else {
        element.classList.remove("show");
    }
}
// #endregion Main Interface
////
// #region Token Table
function populateTokensTable(passedTokens = null) {
    tableBody.innerHTML = "";

    if (passedTokens !== null) { tokens = passedTokens; }

    const validTokens = tokens.filter((token) => {
        return token.tokenBalance > 0 && token.value > 0 && token.value !== null;
    });

    validTokens.forEach((token) => {
        const row = document.createElement("tr");

        const logoCell = createLogoCell(token);

        row.dataset.name = token.name;
        const nameCell = document.createElement("td");
        nameCell.textContent = token.name || "N/A";
        nameCell.classList.add("list_cell");

        row.dataset.contract = token.contractAddress;
        const contractCell = document.createElement("td");
        contractCell.textContent = truncate(token.contractAddress) || "N/A";
        contractCell.classList.add("list_cell", "link");
        contractCell.addEventListener("click", async () => {
            const url = `https://basescan.org/token/${token.contractAddress}`;
            window.open(url, "_blank");
        });

        const tokensCell = document.createElement("td");
        const parsedBalance = parseFloat(token.tokenBalance || 0) / Math.pow(10, token.decimals);
        row.dataset.tokens = parsedBalance;
        tokensCell.textContent = truncateBalance(parsedBalance);
        tokensCell.classList.add("list_cell");

        const totalValue = parsedBalance * token.value;
        row.dataset.value = totalValue;
        const valueCell = document.createElement("td");
        valueCell.textContent = `$${truncateBalance(totalValue)}` || "N/A";
        valueCell.classList.add("list_cell");

        row.appendChild(logoCell);
        row.appendChild(nameCell);
        row.appendChild(contractCell);
        row.appendChild(tokensCell);
        row.appendChild(valueCell);

        tableBody.appendChild(row);
    });
}
function createLogoCell(token) {
    const logoCell = document.createElement("td");
    logoCell.classList.add("list_cell");

    if (token.image !== "NOT_FOUND") {
        const img = document.createElement("img");
        img.src = token.image;
        img.classList.add("token_logo");
        logoCell.appendChild(img);
    } else {
        logoCell.innerHTML = defaultTokenSVG;
    }

    return logoCell;
}
// Table Updates
////
    function updateTokenImage(token) {
        
        const rows = Array.from(tableBody.querySelectorAll("tr"));
        const row = rows.find((row) => row.querySelector("td.link")?.textContent === truncate(token.contractAddress));

        if (row) {
            const oldLogoCell = row.querySelector("td:first-child");
            const newLogoCell = createLogoCell(token);

            row.replaceChild(newLogoCell, oldLogoCell);
        }
    }
    function highlightRows() {    
        const rows = document.querySelectorAll("#tokens_body tr");
        const numericThreshold = Number(currentThreshold) || 0;
    
        rows.forEach((row) => {
            const contract = row.dataset.contract;
            if (!contract) { console.log("Count find contract..."); return; }
    
            const token = tokens.find((t) => t.contractAddress.toLowerCase() === contract.toLowerCase());
    
            if (!token) { console.log(`Couldn't find token...`); return; }
    
            const parsedBalance = parseFloat(token.tokenBalance || 0) / Math.pow(10, token.decimals);
            const totalValue = parsedBalance * token.value;
    
            if (isValueCheck) {
                if (totalValue <= numericThreshold) {
                    row.classList.add("under_threshold");
                } else {
                    row.classList.remove("under_threshold");
                }
            } else {
                if (parsedBalance <= numericThreshold) {
                    row.classList.add("under_threshold");
                } else {
                    row.classList.remove("under_threshold");
                }
            }
        });
    }
    function appendDefaultLogos() {
        const tokenLogos = document.querySelectorAll(".token_logo");
        tokenLogos.forEach(img => {
            if (!img.src || img.src === "null" || img.src === "undefined") {
                img.src = "assets/img/default.svg";
                console.log(`Updated src for token_logo to default.svg for element:`, img);
            }
        });
    }
////
// Table Sorting
////
    function handleHeaderClick(headerType) {
        return async () => {
            if (currentSortType === headerType) {
                sortTable(`${headerType}_reverse`);
            } else {
                sortTable(headerType);
            }
            highlightRows();
        };
    }
    function sortTable(sortType) {
        const tableBody = document.getElementById("tokens_body");
        tableBody.innerHTML = "";

        let validTokens = tokens.filter((token) => {
            return (
                token.tokenBalance > 0 &&
                token.value > 0 &&
                token.value !== null
            );
        });

        switch (sortType) {
            case "name":
                validTokens.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case "name_reverse":
                validTokens.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
                break;
            case "tokens_reverse":
                validTokens.sort((a, b) => {
                    let aTokens = parseFloat(a.tokenBalance) / Math.pow(10, a.decimals);
                    let bTokens = parseFloat(b.tokenBalance) / Math.pow(10, b.decimals);
                    return aTokens - bTokens;
                });
                break;
            case "tokens":
                validTokens.sort((a, b) => {
                    let aTokens = parseFloat(a.tokenBalance) / Math.pow(10, a.decimals);
                    let bTokens = parseFloat(b.tokenBalance) / Math.pow(10, b.decimals);
                    return bTokens - aTokens;
                });
                break;
            case "value_reverse":
                validTokens.sort((a, b) => {
                    let aTokens = parseFloat(a.tokenBalance) / Math.pow(10, a.decimals);
                    let bTokens = parseFloat(b.tokenBalance) / Math.pow(10, b.decimals);
                    let aValue = aTokens * a.value;
                    let bValue = bTokens * b.value;
                    return aValue - bValue;
                });
                break;
            case "value":
                validTokens.sort((a, b) => {
                    let aTokens = parseFloat(a.tokenBalance) / Math.pow(10, a.decimals);
                    let bTokens = parseFloat(b.tokenBalance) / Math.pow(10, b.decimals);
                    let aValue = aTokens * a.value;
                    let bValue = bTokens * b.value;
                    return bValue - aValue;
                });
                break;
            default:
                console.warn(`Invalid sortType: ${sortType}`);
                break;
        }

        currentSortType = sortType;
        populateTokensTable(validTokens);
        updateTableHeader(sortType);
        cacheUserDetails(null, true);
    }
    function insertSortArrow(id, sortType) {
        const downArrow = '<span class="sort_arrow">▼</span>';
        const upArrow = '<span class="sort_arrow">▲</span>';

        const headers = document.querySelectorAll("#tokens_table th");

        headers.forEach(header => {
            const arrow = header.querySelector(".sort_arrow");
            if (arrow) {
                arrow.remove();
            }
        });

        let arrowHTML;
        if (sortType.includes("reverse")) {
            arrowHTML = upArrow;
        } else {
            arrowHTML = downArrow;
        }

        const headerToUpdate = document.getElementById(id);
        if (headerToUpdate) {
            headerToUpdate.insertAdjacentHTML("beforeend", arrowHTML);
        }
    }
    function updateTableHeader(sortType) {
        let headerId;

        switch (sortType) {
            case "name":
            case "name_reverse":
                headerId = "table_name";
                break;
            case "tokens":
            case "tokens_reverse":
                headerId = "table_tokens";
                break;
            case "value":
            case "value_reverse":
                headerId = "table_value";
                break;
            default:
                console.warn(`Invalid sortType: ${sortType}`);
                return;
        }
        insertSortArrow(headerId, sortType);
    }
////
//
// #endregion Token Table
////
// #region Colors
let lastRandomColor = null;
function setRootColors(colors = null) {
    if (!connectedWallet) return;

    let randomColor;
    do { randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    } while (randomColor === lastRandomColor);

    lastRandomColor = randomColor;

    let mainColor = null;
    let darkColor = null;
    let lightColor = null;

    if (colors !== null) {
        mainColor = colors.main;
        darkColor = colors.dark;
        lightColor = colors.light;
    } else {
        mainColor = getComputedStyle(root).getPropertyValue(randomColor.main).trim();
        darkColor = getComputedStyle(root).getPropertyValue(randomColor.dark).trim();
        lightColor = getComputedStyle(root).getPropertyValue(randomColor.light).trim();
    }

    const animationDuration = 50;
    animateColorTransition('--main', mainColor, animationDuration);
    animateColorTransition('--dark', darkColor, animationDuration);
    animateColorTransition('--light', lightColor, animationDuration);

    colors = { main: mainColor, dark: darkColor, light: lightColor };
    cacheUserDetails(colors);
}
function animateColorTransition(property, newColor, duration) {
    const currentColor = getComputedStyle(root).getPropertyValue(property).trim();
    const [r1, g1, b1] = parseColor(currentColor);
    const [r2, g2, b2] = parseColor(newColor);
    const frames = 60;
    const stepTime = duration / frames;
    let frame = 0;

    const interval = setInterval(() => {
        frame++;
        const t = 1 - Math.pow(1 - frame / frames, 3);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        const interpolatedColor = `rgb(${r}, ${g}, ${b})`;
        root.style.setProperty(property, interpolatedColor);
        if (frame >= frames) clearInterval(interval);
    }, stepTime);
}
function parseColor(color) {
    if (color.startsWith('rgb')) {
        return color.match(/\d+/g).map(Number);
    } else if (color.startsWith('#')) {
        const bigint = parseInt(color.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    } else {
        throw new Error(`Unsupported color format: ${color}`);
    }
}
// #endregion Colors
////
// #region Animations
function processAndReplaceText(element, newText = null) {
    if (!element || !element.textContent) {
        console.error("Invalid element...");
        return;
    }

    const replaceSpeed = 550; // Speed of replacing random characters with target text
    const randomSpeed = 50;   // Speed of typing random characters
    const originalText = element.textContent;
    element.textContent = "";

    let targetText = newText === null ? originalText : newText;
    let currentIndex = 0;

    // We assume there's a global or higher-scope 'characters' array available.
    // Example: const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const randomInterval = setInterval(() => {
        if (currentIndex < targetText.length) {
            // Generate a random character for the current position
            const randomChar = characters[Math.floor(Math.random() * characters.length)];

            // Display final text up to (but not including) this index,
            // plus the random character at the current index
            element.textContent = targetText.slice(0, currentIndex) + randomChar;

            // Schedule the replacement of that random char with the final character
            setTimeout(() => {
                element.textContent =
                    targetText.slice(0, currentIndex) +   // Already finalized text
                    targetText.charAt(currentIndex);      // Correct char for the current index
            }, replaceSpeed);

            currentIndex++;
        } else {
            // Once we've handled all characters, clear the interval
            clearInterval(randomInterval);
        }
    }, randomSpeed);
}
// #endregion Animations







document.addEventListener("tokenPriceUpdating", (event) => {
    const { contractAddress } = event.detail;

    const tableRow = document.querySelector(`tr[data-contract="${contractAddress.toLowerCase()}"]`);

    if (tableRow) {
        const valueCell = tableRow.querySelector(".list_cell:last-child");
        if (valueCell) {
            valueCell.textContent = "";
            const loaderContainer = document.createElement("div");
            loaderContainer.classList.add("loader_container");
            valueCell.appendChild(loaderContainer);
            const loader = document.createElement("div");
            loader.classList.add("loader");
            loader.innerHTML = loaderHTML;
            loaderContainer.appendChild(loader);
            console.log(`Updating row for contract ${contractAddress}`);
        } else {
            console.warn(`Value cell not found for contract ${contractAddress}`);
        }
    } else { console.warn(`No table row found for contract address: ${contractAddress}`); }
});

document.addEventListener("tokenPriceUpdated", (event) => {
    const { contractAddress, price } = event.detail;

    const tableRow = document.querySelector(`tr[data-contract="${contractAddress.toLowerCase()}"]`);

    if (tableRow) {
        const valueCell = tableRow.querySelector(".list_cell:last-child");
        if (valueCell) {
            const tokenBalance = parseFloat(tableRow.dataset.tokens);
            const totalValue = tokenBalance * price;
            tokens.find((t) => t.contractAddress.toLowerCase() === contractAddress.toLowerCase()).value = price;
            valueCell.textContent = `$${truncateBalance(totalValue)}`; // Format the price to 6 decimals
            console.log(`Updated row for contract ${contractAddress} with price: $${truncateBalance(totalValue)}`);
        } else {
            console.warn(`Value cell not found for contract ${contractAddress}`);
        }
    } else {
        console.warn(`No table row found for contract address: ${contractAddress}`);
    }
});









window.addEventListener('load', () => {
    // Select all elements with a `data-speed` attribute
    const parallaxElements = document.querySelectorAll('[data-speed]');

    function applyParallax() {
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            const offset = window.scrollY * speed;
            element.style.transform = `translateY(${-offset}px)`;
        });
    }

    // Use requestAnimationFrame for smoother animations
    function onScroll() {
        requestAnimationFrame(applyParallax);
    }

    // Add the scroll event listener
    window.addEventListener('scroll', onScroll);

    // Initial call to position elements correctly on load
    applyParallax();
});

