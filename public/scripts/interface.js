document.addEventListener('DOMContentLoaded', function () { console.log('interface.js loaded...'); mobileControls(); fadeInOnScroll(); });

// #region Initialization
window.addEventListener('load', () => { parallax(); });
document.addEventListener('walletConnected', () => { fetchUserDetails(); });
document.addEventListener('tokenImageFound', (event) => { const { token } = event.detail; updateTokenImage(token); });
document.addEventListener('tokenDetailsFetched', (event) => {
    if (event.detail.tokens.length === 0) { noTokens = true; return; } else { sortTable(currentSortType); }
});
document.addEventListener('backgroundLogoFetchingComplete', () => { appendDefaultLogos(); });
document.addEventListener("tokenPriceUpdating", (event) => { const { contractAddress } = event.detail; tokenPriceLoading(contractAddress); });
document.addEventListener("tokenPriceUpdated", (event) => { const { contractAddress, price } = event.detail; tokenPriceLoaded(contractAddress, price); });
document.querySelectorAll('.dropdown_content').forEach(content => { if (!content.hasAttribute('data-state')) { content.setAttribute('data-state', 'collapsed'); }});
document.querySelectorAll('.hover_detection').forEach(detection => { faqHoverDetection(detection); });

toggleSwitch.addEventListener("change", () => { isValueCheck = toggleSwitch.checked; highlightRows(); });
thresholdInput.addEventListener("input", () => { currentThreshold = parseFloat(thresholdInput.value) || 0; highlightRows(); });
optionToggles.forEach(toggle => { toggle.addEventListener('click', () => { toggleMoreOptions(); });});

tokensPageButton.addEventListener('click', () => { toggleTablePage('tokens'); });
premiumPageButton.addEventListener('click', () => { toggleTablePage('deposits'); });
refreshTokensButton.addEventListener('click', async () => { 
    const clearedCache = await clearCachedTokens(connectedWallet);
    if (!clearedCache) { return; }
    
    await getTokens(true);
});

startButton.addEventListener('click', async () => { getStarted(); });
nameHeader.addEventListener('click', handleHeaderClick("name"));
tokensHeader.addEventListener('click', handleHeaderClick("tokens"));
valueHeader.addEventListener('click', handleHeaderClick("value"));

let isMoreOptionsVisible = false;

let isRecycling = false;
let currentThreshold = null;
let isValueCheck = false;

let tableSortTypes = ["name", "name_reverse", "tokens", "tokens_reverse", "value", "value_reverse"];

let noTokens = false;

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
async function getStarted() {
    if (!isConnected) {
        const walletAddress = await connectWallet();
        if (!walletAddress) {
            console.error("Wallet connection failed..");
            return;
        }
    }

    toggleLoader(startButton, true);

    await getTokens();

    isRecycling = true;
    updateMainDisplay();
}
function parallax() {
    const parallaxElements = document.querySelectorAll('[data-speed]');

    function applyParallax() {
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            const offset = window.scrollY * speed;
            element.style.transform = `translateY(${-offset}px)`;
        });
    }
    function onScroll() { requestAnimationFrame(applyParallax); }
    window.addEventListener('scroll', onScroll);
    applyParallax();
}
function mobileControls() {
    const hamburgerMenu = document.querySelector('.hamburger_menu');
    const header = document.querySelector('header');

    hamburgerMenu.addEventListener('click', () => { header.classList.toggle('show'); });
}
function fadeInOnScroll() {
    const elements = document.querySelectorAll('[data-fade]');
    if (elements.length === 0) { return; }

    elements.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                el.style.opacity = 1;
                el.style.transform = 'translateY(0)';
            } else {
                el.style.opacity = 0;
                el.style.transform = 'translateY(20px)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}
function toggleMoreOptions() {
    if (isMoreOptionsVisible) {
        moreOptionsContainer.classList.add('hide');
        setTimeout(() => {
            moreOptionsContainer.style.display = 'none';
            moreOptionsContainer.classList.remove('hide');

            thresholdContainer.style.display = 'flex';
            thresholdContainer.classList.add('show');
            thresholdSubtext.style.display = 'flex';
            thresholdSubtext.classList.add('show');
        }, 500);
    } else {
        thresholdContainer.classList.add('hide');
        thresholdSubtext.classList.add('hide');
        setTimeout(() => {
            thresholdContainer.style.display = 'none';
            thresholdContainer.classList.remove('hide');
            thresholdSubtext.style.display = 'none';
            thresholdSubtext.classList.remove('hide');

            moreOptionsContainer.style.display = 'flex';
            moreOptionsContainer.classList.add('show');
        }, 500);
    }
    isMoreOptionsVisible = !isMoreOptionsVisible;
}
function faqHoverDetection(detection) {
    let hoverTimeout;

    detection.addEventListener('click', () => {
        const targetId = detection.nextElementSibling.getAttribute('data-target');
        const content = document.getElementById(targetId);

        content.classList.toggle('show');

        if (content.classList.contains('show')) {
            content.setAttribute('data-state', 'shown');
        } else {
            content.setAttribute('data-state', 'collapsed');
        }
    });

    detection.addEventListener('mouseover', () => {
        clearTimeout(hoverTimeout);
        const targetId = detection.nextElementSibling.getAttribute('data-target');
        const content = document.getElementById(targetId);

        hoverTimeout = setTimeout(() => {
            if (content.getAttribute('data-state') === 'collapsed') {
                content.classList.remove('collapse');
                content.classList.add('show');
                content.setAttribute('data-state', 'shown');
            }
        }, 200);
    });

    detection.addEventListener('mouseout', () => {
        clearTimeout(hoverTimeout);
        const targetId = detection.nextElementSibling.getAttribute('data-target');
        const content = document.getElementById(targetId);

        hoverTimeout = setTimeout(() => {
            if (content.getAttribute('data-state') === 'shown') {
                content.classList.remove('show');
                content.classList.add('collapse');
                content.setAttribute('data-state', 'collapsed');
            }
        }, 500);
    });
}
// #endregion Main Interface
////
// #region Token Table
//
// #region Table Population
////
    function populateTokensTable(passedTokens = null) {
        tableBody.innerHTML = "";

        if (passedTokens !== null) { tokens = passedTokens; }

        if (noTokens) {
            table.remove();

            const div = document.createElement("div");
            div.classList.add("container", "no_tokens");
            div.textContent = "No tokens found...";

            tokensMask.appendChild(div);
            return; 
        }

        const validTokens = tokens.filter((token) => {
            return token.tokenBalance > 0 && token.value > 0 && token.value !== null;
        });

        validTokens.forEach((token) => {
            const row = document.createElement("tr");

            const logoCell = createLogoCell(token);
            logoCell.classList.add("list_cell", "table_logo");

            row.dataset.name = token.name;
            const nameCell = document.createElement("td");
            nameCell.textContent = token.name || "N/A";
            nameCell.classList.add("list_cell", "table_name");

            row.dataset.contract = token.contractAddress;
            const contractCell = document.createElement("td");
            contractCell.textContent = truncate(token.contractAddress) || "N/A";
            contractCell.classList.add("list_cell", "link", "table_contract");
            contractCell.addEventListener("click", async () => {
                const url = `https://basescan.org/token/${token.contractAddress}`;
                window.open(url, "_blank");
            });

            const tokensCell = document.createElement("td");
            const parsedBalance = parseFloat(token.tokenBalance || 0) / Math.pow(10, token.decimals);
            row.dataset.tokens = parsedBalance;
            tokensCell.textContent = truncateBalance(parsedBalance);
            tokensCell.classList.add("list_cell", "table_tokens");

            const totalValue = parsedBalance * token.value;
            row.dataset.value = totalValue;
            const valueCell = document.createElement("td");
            valueCell.textContent = `$${truncateBalance(totalValue)}` || "N/A";
            valueCell.classList.add("list_cell", "table_value");

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
////
// #region Table Updates
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
                img.src = "../assets/img/default.svg";
                console.log(`Updated src for token_logo to default.svg for element:`, img);
            }
        });
    }
    function tokenPriceLoading(contractAddress) {
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
            }
        } else { console.warn(`No table row found for contract address: ${contractAddress}`); }
    }
    function tokenPriceLoaded(contractAddress, price) {
        const tableRow = document.querySelector(`tr[data-contract="${contractAddress.toLowerCase()}"]`);

        if (tableRow) {
            const valueCell = tableRow.querySelector(".list_cell:last-child");
            if (valueCell) {
                const tokenBalance = parseFloat(tableRow.dataset.tokens);
                const totalValue = tokenBalance * price;
                tokens.find((t) => t.contractAddress.toLowerCase() === contractAddress.toLowerCase()).value = price;
                valueCell.textContent = `$${truncateBalance(totalValue)}`;
            }
        } else {
            console.warn(`No table row found for contract address: ${contractAddress}`);
        }
    }
    function showLoaderRow(table) {
        table.innerHTML = "";

        const row = document.createElement("tr");
        row.classList.add("loader_row");

        const logoLoaderCell = document.createElement("td");
        logoLoaderCell.classList.add("list_cell", "loader_cell");
        toggleLoader(logoLoaderCell, true);

        const nameLoaderCell = document.createElement("td");
        nameLoaderCell.classList.add("list_cell", "loader_cell");
        toggleLoader(nameLoaderCell, true);

        const contractLoaderCell = document.createElement("td");
        contractLoaderCell.classList.add("list_cell", "loader_cell");
        toggleLoader(contractLoaderCell, true);

        const tokensLoaderCell = document.createElement("td");
        tokensLoaderCell.classList.add("list_cell", "loader_cell");
        toggleLoader(tokensLoaderCell, true);

        const valueLoaderCell = document.createElement("td");
        valueLoaderCell.classList.add("list_cell", "loader_cell");
        toggleLoader(valueLoaderCell, true);

        row.appendChild(logoLoaderCell);
        row.appendChild(nameLoaderCell);
        row.appendChild(contractLoaderCell);
        row.appendChild(tokensLoaderCell);
        row.appendChild(valueLoaderCell);

        table.appendChild(row);
    }
////
// #endregion Table Updates
//
// #region Table Sorting
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
                headerId = "header_name";
                break;
            case "tokens":
            case "tokens_reverse":
                headerId = "header_tokens";
                break;
            case "value":
            case "value_reverse":
                headerId = "header_value";
                break;
            default:
                console.warn(`Invalid sortType: ${sortType}`);
                return;
        }
        insertSortArrow(headerId, sortType);
    }
////
//
// #region Pages
////
    function toggleTablePage(page) {
        if (page === 'tokens') {
            // Update buttons
            tokensPageButton.classList.add('left_page_selected');
            tokensPageButton.classList.remove('page_unselected');
            premiumPageButton.classList.remove('right_page_selected');
            premiumPageButton.classList.add('page_unselected');

            // Update tables
            tokensMask.classList.add('show');
            tokensMask.classList.remove('hide');
            premiumMask.classList.add('hide');
            premiumMask.classList.remove('show');

            // Set timeout to update display after animation
            setTimeout(() => {
                tokensMask.style.display = 'flex';
                premiumMask.style.display = 'none';
            }, 500); // Matches animation duration
        } else if (page === 'deposits') {
            // Update buttons
            premiumPageButton.classList.add('right_page_selected');
            premiumPageButton.classList.remove('page_unselected');
            tokensPageButton.classList.remove('left_page_selected');
            tokensPageButton.classList.add('page_unselected');

            // Update tables
            premiumMask.classList.add('show');
            premiumMask.classList.remove('hide');
            tokensMask.classList.add('hide');
            tokensMask.classList.remove('show');

            // Set timeout to update display after animation
            setTimeout(() => {
                premiumMask.style.display = 'flex';
                tokensMask.style.display = 'none';
            }, 500); // Matches animation duration
        }
    }
////
// #endregion Pages
////
// #endregion Table Sorting
//
// #endregion Token Table
////
// #region Colors
let lastRandomColor = null;
function setRootColors(colors = null) {
    if (!connectedWallet) return;

    let randomColor;
    do {
        randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
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