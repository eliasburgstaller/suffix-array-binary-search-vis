// Constants
const kLcpMaxBarWidth = 128; // px

// HTML elements
const elSearchTextInput = document.getElementById('searchtext');
const elSearchPatternInput = document.getElementById('searchpattern');
const elStartStopButton = document.getElementById('start-stop-button');
const elNextStepButton = document.getElementById('next-step-button');
const elSuffixArrayTable = document.getElementById('suffix-array-table');

const elLcpPL = document.getElementById('lcp-PL');
const elLcpPR = document.getElementById('lcp-PR');
const elLcpLM = document.getElementById('lcp-LM');
const elLcpMR = document.getElementById('lcp-MR');
const elLcpHPL = document.getElementById('lcp-h-PL');
const elLcpHLM = document.getElementById('lcp-h-LM');
const elLcpHMR = document.getElementById('lcp-h-MR');
const elLcpHPR = document.getElementById('lcp-h-PR');
const elLcpCase = document.getElementById('lcp-case');

// Global variables
let gSearchText;
let gSearchPattern;
let gSuffixArray = [];
let gSA = [];
let gIsSearchActive = false;
let gL, gM, gR;
let gLcpPL, gLcpPR, gLcpLM, gLcpMR;
let gCase;
let gNextStep;
let gCompareIndex;
let gFoundIndex;

function handleStartStopButtonClicked() {
    if (gIsSearchActive) {
        // stop the search
        _stopBinarySearch();
    } else {
        // start the search
        gSearchText = elSearchTextInput.value;
        if (!gSearchText || gSearchText.length === 0) return;

        gSearchPattern = elSearchPatternInput.value;
        if (!gSearchPattern || gSearchPattern.length === 0) return;

        // build the suffix array
        _buildSuffixArray();

        // render the suffix array
        _renderSuffixArray();

        // start binary search
        _startBinarySearch();
    }
}

function handleNextStepButtonClicked() {
    _doNextSearchStep();
}

function _startBinarySearch() {
    elNextStepButton.hidden = false;

    gIsSearchActive = true;
    elStartStopButton.innerHTML = 'Stop';

    gCase = null;
    gNextStep = null;
    gCompareIndex = null;
    gFoundIndex = null;

    gL = 0;
    gR = gSuffixArray.length - 1;
    gM = Math.floor((gL + gR) / 2);
    _highlightLMR();

    gLcpPL = _lcp(gSearchPattern, gSuffixArray[gL]);
    gLcpPR = _lcp(gSearchPattern, gSuffixArray[gR]);
    gLcpLM = _lcp(gSuffixArray[gL], gSuffixArray[gM]);
    gLcpMR = _lcp(gSuffixArray[gM], gSuffixArray[gR]);
    _updateLCPElements();

    if (gLcpPL > gLcpPR) {
        // case 1-3
        if (gLcpLM > gLcpPL) {
            gCase = 'LCP(L,M) > LCP(P,L)';
            gNextStep = 'right';
        } else if (gLcpLM < gLcpPL) {
            gCase = 'LCP(L,M) < LCP(P,L)';
            gNextStep = 'left';
        } else {
            gCase = 'LCP(L,M) = LCP(P,L)';
            gNextStep = 'compare';
            gCompareIndex = gLcpPL;
        }
    } else {
        // case 4-6
        if (gLcpMR > gLcpPR) {
            gCase = 'LCP(M,R) > LCP(P,R)';
            gNextStep = 'left';
        } else if (gLcpMR < gLcpPR) {
            gCase = 'LCP(M,R) < LCP(P,R)';
            gNextStep = 'right';
        } else {
            gCase = 'LCP(M,R) = LCP(P,R)';
            gNextStep = 'compare';
            gCompareIndex = gLcpPR;
        }
    }
    elLcpCase.innerHTML = gCase + ' -> ' + gNextStep;
}

function _stopBinarySearch() {
    // clear the suffix array
    gSuffixArray = [];
    gSA = [];
    _renderSuffixArray();

    elNextStepButton.hidden = true;

    gIsSearchActive = false;
    elStartStopButton.innerHTML = 'Start';
    _updateLCPElements();
}

// jaburjabualihebur
// burgburschenbur : pattern:bu

function _doNextSearchStep() {
    if (gL >= gM && !gFoundIndex) {
        // binary search has finished
        elLcpCase.innerHTML = 'PATTERN NOT FOUND!';
        return;
    }

    // check if the current middle suffix 
    // has the search pattern as prefix
    gCompareIndex = Math.min(gLcpPL, gLcpPR);
    let found = true;
    for (let i = gCompareIndex; i < gSearchPattern.length && gSA[gM] + i < gSearchText.length; i++) {
        if (gSearchPattern.charAt(i) < gSearchText.charAt(gSA[gM] + i)) {
            found = false;
            break;
        } else if (gSearchPattern.charAt(i) > gSearchText.charAt(gSA[gM] + i)) {
            found = false;
            break;
        }
    }
    if (found) {
        gFoundIndex = gSA[gM];
        elLcpCase.innerHTML = 'PATTERN FOUND AT INDEX ' + gFoundIndex;
        return;
    }

    switch (gNextStep) {
        case 'left':
            gR = gM;
            break;
        case 'right':
            gL = gM;
            break;
        case 'compare':
            let equal = true;
            let left = true;
            for (let i = gCompareIndex; i < gSearchPattern.length && gSA[gM] + i < gSearchText.length; i++) {
                if (gSearchPattern.charAt(i) < gSearchText.charAt(gSA[gM] + i)) {
                    equal = false;
                    break;
                } else if (gSearchPattern.charAt(i) > gSearchText.charAt(gSA[gM] + i)) {
                    equal = false;
                    left = false;
                    break;
                }
            }
            if (equal) {
                gFoundIndex = gSA[gM];
                elLcpCase.innerHTML = 'PATTERN FOUND AT INDEX ' + gFoundIndex;
            } else if (left) {
                gNextStep = 'left';
                elLcpCase.innerHTML = ' -> ' + gNextStep;
            } else {
                gNextStep = 'right';
                elLcpCase.innerHTML = ' -> ' + gNextStep;
            }
            return;
        default:
            return;
    }

    gM = Math.floor((gL + gR) / 2);
    _highlightLMR();

    gLcpPL = _lcp(gSearchPattern, gSuffixArray[gL]);
    gLcpPR = _lcp(gSearchPattern, gSuffixArray[gR]);
    gLcpLM = _lcp(gSuffixArray[gL], gSuffixArray[gM]);
    gLcpMR = _lcp(gSuffixArray[gM], gSuffixArray[gR]);
    _updateLCPElements();

    if (gLcpPL > gLcpPR) {
        // case 1-3
        if (gLcpLM > gLcpPL) {
            gCase = 'LCP(L,M) > LCP(P,L)';
            gNextStep = 'right';
        } else if (gLcpLM < gLcpPL) {
            gCase = 'LCP(L,M) < LCP(P,L)';
            gNextStep = 'left';
        } else {
            gCase = 'LCP(L,M) = LCP(P,L)';
            gNextStep = 'compare';
            gCompareIndex = gLcpPL;
        }
    } else {
        // case 4-6
        if (gLcpMR > gLcpPR) {
            gCase = 'LCP(M,R) > LCP(P,R)';
            gNextStep = 'left';
        } else if (gLcpMR < gLcpPR) {
            gCase = 'LCP(M,R) < LCP(P,R)';
            gNextStep = 'right';
        } else {
            gCase = 'LCP(M,R) = LCP(P,R)';
            gNextStep = 'compare';
            gCompareIndex = gLcpPR;
        }
    }
    elLcpCase.innerHTML = gCase + ' -> ' + gNextStep;
}

function _lcp(a, b) {
    let lcp = 0;
    for (let i = 0; i < a.length; i++) {
        if (i >= b.length) break;
        if (a.charAt(i) === b.charAt(i)) {
            lcp++;
        } else {
            break;
        }
    }
    return lcp;
}

function _buildSuffixArray() {
    const tmpSuffixArray = []

    // put all suffices into the array
    for (let i = 0; i < gSearchText.length; i++) {
        const suffix = gSearchText.substring(i);
        tmpSuffixArray.push({ i, suffix });
    }

    // sort the array lexicographically
    tmpSuffixArray.sort((s1, s2) => s1.suffix.localeCompare(s2.suffix));

    gSuffixArray = tmpSuffixArray.map((e) => e.suffix);
    gSA = tmpSuffixArray.map((e) => e.i);
}

function _renderSuffixArray() {
    // clear the table if the suffix array is empty
    if (gSuffixArray.length === 0) {
        const tableRows = elSuffixArrayTable.getElementsByTagName('tr');
        for (let i = tableRows.length - 1; i > 0; i--) {
            elSuffixArrayTable.removeChild(tableRows[i]);
        }
        return;
    }

    // otherwise add all suffices to the table element
    for (let i = 0; i < gSuffixArray.length; i++) {
        const elSuffixTableRow = document.createElement('tr');
        const elTdSpecial = document.createElement('td');
        const elTdSA = document.createElement('td');
        const elTdIndex = document.createElement('td');
        const elTdSuffix = document.createElement('td');
        elTdSpecial.innerHTML = '';
        elTdSA.innerHTML = gSA[i];
        elTdIndex.innerHTML = i;
        elTdSuffix.innerHTML = gSuffixArray[i];
        elSuffixTableRow.appendChild(elTdSpecial);
        elSuffixTableRow.appendChild(elTdSA);
        elSuffixTableRow.appendChild(elTdIndex);
        elSuffixTableRow.appendChild(elTdSuffix);
        elSuffixArrayTable.appendChild(elSuffixTableRow);
    }
}

function _highlightLMR() {
    const tableRows = elSuffixArrayTable.getElementsByTagName('tr');

    for (let i = 0; i < tableRows.length; i++) {
        if (tableRows[i].getElementsByTagName('td')[0]) {
            tableRows[i].getElementsByTagName('td')[0].innerHTML = '';
        }
        tableRows[i].classList.remove('marker-L');
        tableRows[i].classList.remove('marker-M');
        tableRows[i].classList.remove('marker-R');
    }

    tableRows[gL + 1].getElementsByTagName('td')[0].innerHTML += 'L ->';
    tableRows[gL + 1].classList.add('marker-L');

    tableRows[gM + 1].getElementsByTagName('td')[0].innerHTML += 'M ->';
    tableRows[gM + 1].classList.add('marker-M');

    tableRows[gR + 1].getElementsByTagName('td')[0].innerHTML += 'R ->';
    tableRows[gR + 1].classList.add('marker-R');
}

function _updateLCPElements() {
    if (!gIsSearchActive) {
        elLcpHPL.innerHTML = '';
        elLcpHPR.innerHTML = '';
        elLcpHLM.innerHTML = '';
        elLcpHMR.innerHTML = '';

        elLcpPL.style.width = 0 + 'px';
        elLcpPR.style.width = 0 + 'px';
        elLcpLM.style.width = 0 + 'px';
        elLcpMR.style.width = 0 + 'px';
        return;
    }

    elLcpHPL.innerHTML = `LCP(P,L)=${gLcpPL}`;
    elLcpHPR.innerHTML = `LCP(P,R)=${gLcpPR}`;
    elLcpHLM.innerHTML = `LCP(L,M)=${gLcpLM}`;
    elLcpHMR.innerHTML = `LCP(M,R)=${gLcpMR}`;

    const maxLcp = Math.max(gLcpPL, gLcpPR, gLcpLM, gLcpMR);
    elLcpPL.style.width = kLcpMaxBarWidth * (gLcpPL / maxLcp) + 'px';
    elLcpPR.style.width = kLcpMaxBarWidth * (gLcpPR / maxLcp) + 'px';
    elLcpLM.style.width = kLcpMaxBarWidth * (gLcpLM / maxLcp) + 'px';
    elLcpMR.style.width = kLcpMaxBarWidth * (gLcpMR / maxLcp) + 'px';
    if (elLcpPL.style.width === '0px') elLcpPL.style.width = '12px';
    if (elLcpPR.style.width === '0px') elLcpPR.style.width = '12px';
    if (elLcpLM.style.width === '0px') elLcpLM.style.width = '12px';
    if (elLcpMR.style.width === '0px') elLcpMR.style.width = '12px';

    elLcpPL.style.paddingBottom = '1em';
    elLcpPR.style.paddingBottom = '1em';
    elLcpLM.style.paddingBottom = '1em';
    elLcpMR.style.paddingBottom = '1em';
}