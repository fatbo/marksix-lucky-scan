// Mark Six Lucky Scan Application

// Mock data for latest Mark Six results (in production, this would come from an API)
const mockResults = {
    drawDate: '2026-02-15',
    drawNumber: '24/015',
    winningNumbers: [3, 12, 18, 27, 35, 42],
    extraNumber: 9
};

// Application state
let currentResults = null;
let userNumbers = [];

// DOM Elements
const loadResultsBtn = document.getElementById('loadResultsBtn');
const verifyBtn = document.getElementById('verifyBtn');
const clearBtn = document.getElementById('clearBtn');
const numberInputs = document.querySelectorAll('.number-input');
const errorMessage = document.getElementById('errorMessage');
const verificationSection = document.getElementById('verificationSection');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadLatestResults();
});

// Setup event listeners
function setupEventListeners() {
    loadResultsBtn.addEventListener('click', loadLatestResults);
    verifyBtn.addEventListener('click', verifyNumbers);
    clearBtn.addEventListener('click', clearInputs);

    // Add input validation
    numberInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => validateInput(e.target));
        input.addEventListener('keypress', (e) => {
            // Only allow numbers
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
        // Auto-focus next input
        input.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (e.target.value.length === 2 && !isNaN(value) && value >= 1 && value <= 49 && index < numberInputs.length - 1) {
                numberInputs[index + 1].focus();
            }
        });
    });
}

// Load latest results
function loadLatestResults() {
    // In production, this would fetch from an API
    // For now, use mock data
    currentResults = mockResults;
    displayResults();
    loadResultsBtn.textContent = '✓ Results Loaded';
    loadResultsBtn.disabled = true;
    setTimeout(() => {
        loadResultsBtn.textContent = 'Refresh Results';
        loadResultsBtn.disabled = false;
    }, 2000);
}

// Display the latest results
function displayResults() {
    if (!currentResults) return;

    document.getElementById('drawDate').textContent = currentResults.drawDate;
    document.getElementById('drawNumber').textContent = currentResults.drawNumber;

    const winningBallsContainer = document.getElementById('winningBalls');
    winningBallsContainer.innerHTML = '';

    currentResults.winningNumbers.forEach(num => {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.textContent = num;
        winningBallsContainer.appendChild(ball);
    });

    const extraBall = document.getElementById('extraBall');
    extraBall.textContent = currentResults.extraNumber;
}

// Validate individual input
function validateInput(input) {
    const value = parseInt(input.value);
    
    if (input.value === '') {
        input.classList.remove('valid', 'invalid');
        return;
    }

    if (isNaN(value) || value < 1 || value > 49) {
        input.classList.remove('valid');
        input.classList.add('invalid');
    } else {
        input.classList.remove('invalid');
        input.classList.add('valid');
    }
}

// Validate all inputs
function validateAllInputs() {
    userNumbers = [];
    let isValid = true;
    let errorMsg = '';

    numberInputs.forEach(input => {
        const value = parseInt(input.value);
        
        if (input.value === '' || isNaN(value)) {
            isValid = false;
            errorMsg = 'Please enter all 6 numbers';
            return;
        }

        if (value < 1 || value > 49) {
            isValid = false;
            errorMsg = 'Numbers must be between 1 and 49';
            return;
        }

        userNumbers.push(value);
    });

    // Check for duplicates
    if (isValid && new Set(userNumbers).size !== userNumbers.length) {
        isValid = false;
        errorMsg = 'Please enter unique numbers (no duplicates)';
    }

    errorMessage.textContent = errorMsg;
    return isValid;
}

// Verify user numbers against results
function verifyNumbers() {
    if (!currentResults) {
        errorMessage.textContent = 'Please load the latest results first';
        return;
    }

    if (!validateAllInputs()) {
        return;
    }

    const matches = compareNumbers();
    displayVerificationResult(matches);
}

// Compare user numbers with winning numbers
function compareNumbers() {
    const matchedNumbers = [];
    const extraMatched = userNumbers.includes(currentResults.extraNumber);

    userNumbers.forEach(num => {
        if (currentResults.winningNumbers.includes(num)) {
            matchedNumbers.push(num);
        }
    });

    return {
        matchedNumbers,
        matchCount: matchedNumbers.length,
        extraMatched,
        userNumbers
    };
}

// Display verification result
function displayVerificationResult(matches) {
    const resultContainer = document.getElementById('verificationResult');
    verificationSection.classList.add('show');

    let summaryClass = 'no-match';
    let summaryText = 'No matching numbers';
    let prizeInfo = '';

    if (matches.matchCount === 6) {
        summaryClass = 'winner';
        summaryText = '🎉 JACKPOT! All 6 numbers match! 🎉';
        prizeInfo = getPrizeInfo(6, matches.extraMatched);
    } else if (matches.matchCount === 5 && matches.extraMatched) {
        summaryClass = 'winner';
        summaryText = '🎊 Amazing! 5 + Extra number! 🎊';
        prizeInfo = getPrizeInfo(5, true);
    } else if (matches.matchCount >= 3) {
        summaryClass = 'partial';
        summaryText = `✨ Great! You matched ${matches.matchCount} numbers! ✨`;
        prizeInfo = getPrizeInfo(matches.matchCount, matches.extraMatched);
    }

    resultContainer.innerHTML = `
        <div class="match-summary ${summaryClass}">
            <h3>${summaryText}</h3>
            <p>Matched ${matches.matchCount} out of 6 numbers${matches.extraMatched ? ' + Extra' : ''}</p>
        </div>
        <div class="numbers-comparison">
            ${matches.userNumbers.map(num => {
                let ballClass = 'no-match';
                if (matches.matchedNumbers.includes(num)) {
                    ballClass = 'matched';
                } else if (num === currentResults.extraNumber) {
                    ballClass = 'extra-matched';
                }
                return `<div class="user-ball ${ballClass}">${num}</div>`;
            }).join('')}
        </div>
        ${prizeInfo}
    `;

    // Scroll to results
    verificationSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Get prize information based on matches
function getPrizeInfo(matchCount, extraMatched) {
    const prizes = {
        '6': 'First Prize - Jackpot (Multi-million dollar prize)',
        '5+': 'Second Prize - 5 + Extra Number',
        '5': 'Third Prize - 5 Numbers',
        '4+': 'Fourth Prize - 4 + Extra Number',
        '4': 'Fifth Prize - 4 Numbers',
        '3+': 'Sixth Prize - 3 + Extra Number',
        '3': 'Seventh Prize - 3 Numbers'
    };

    let prizeKey = '';
    if (matchCount === 6) prizeKey = '6';
    else if (matchCount === 5 && extraMatched) prizeKey = '5+';
    else if (matchCount === 5) prizeKey = '5';
    else if (matchCount === 4 && extraMatched) prizeKey = '4+';
    else if (matchCount === 4) prizeKey = '4';
    else if (matchCount === 3 && extraMatched) prizeKey = '3+';
    else if (matchCount === 3) prizeKey = '3';

    if (!prizeKey) return '';

    return `
        <div class="prize-info">
            <h3>🏆 Prize Division</h3>
            <p><strong>${prizes[prizeKey]}</strong></p>
            <p style="margin-top: 15px; font-size: 0.9em;">
                <em>Note: Actual prize amounts vary based on ticket sales and number of winners. 
                Please verify with official Mark Six sources.</em>
            </p>
        </div>
    `;
}

// Clear all inputs
function clearInputs() {
    numberInputs.forEach(input => {
        input.value = '';
        input.classList.remove('valid', 'invalid');
    });
    errorMessage.textContent = '';
    verificationSection.classList.remove('show');
    numberInputs[0].focus();
}
