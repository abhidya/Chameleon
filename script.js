/**
 * Imposter Party Game - Client-side Logic
 * 
 * This game uses deterministic pseudorandom number generation to ensure
 * all players with the same room code see consistent game state without
 * any server communication.
 */

// ============================================================================
// WORD LIST
// A collection of 50 simple words for the game
// ============================================================================
const wordList = [
    "volcano", "library", "pizza", "dinosaur", "astronaut",
    "rainbow", "penguin", "chocolate", "submarine", "guitar",
    "elephant", "hurricane", "treasure", "jungle", "wizard",
    "pyramid", "dolphin", "tornado", "castle", "robot",
    "butterfly", "mountain", "spaceship", "dragon", "unicorn",
    "pirate", "hospital", "detective", "skeleton", "flamingo",
    "waterfall", "superhero", "campfire", "kangaroo", "avalanche",
    "lightning", "mushroom", "scarecrow", "telescope", "octopus",
    "helicopter", "goldfish", "firework", "nightmare", "mermaid",
    "thunderstorm", "crocodile", "sunflower", "jellyfish", "snowman"
];

// ============================================================================
// GAME CONFIGURATION
// ============================================================================
const ROUND_LENGTH_SECONDS = 120; // 2 minutes per round
let TOTAL_PLAYERS = 6; // Dynamically configurable via slider

// ============================================================================
// DETERMINISTIC PSEUDORANDOM NUMBER GENERATOR
// 
// These functions create reproducible "random" numbers from a string seed.
// This allows all players with the same room code to compute identical
// game state without any server communication.
// ============================================================================

/**
 * Converts a string seed into a 32-bit unsigned integer hash.
 * Uses a variant of the djb2 hash algorithm.
 * 
 * @param {string} seedString - The input string to hash
 * @returns {number} A 32-bit unsigned integer
 */
function seedToNumber(seedString) {
    let hash = 5381;
    for (let i = 0; i < seedString.length; i++) {
        // hash * 33 + charCode, keeping it as 32-bit unsigned
        hash = ((hash << 5) + hash + seedString.charCodeAt(i)) >>> 0;
    }
    return hash;
}

/**
 * Generates a deterministic float in [0, 1) from a string seed.
 * Uses the hash from seedToNumber and applies additional mixing
 * using a xorshift-style operation for better distribution.
 * 
 * @param {string} seedString - The input string to derive randomness from
 * @returns {number} A float in the range [0, 1)
 */
function seededRandom(seedString) {
    let hash = seedToNumber(seedString);
    
    // Apply xorshift mixing for better distribution
    hash ^= hash >>> 17;
    hash = Math.imul(hash, 0xed5ad4bb) >>> 0;
    hash ^= hash >>> 11;
    hash = Math.imul(hash, 0xac4c1b51) >>> 0;
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x31848bab) >>> 0;
    hash ^= hash >>> 14;
    
    // Convert to float in [0, 1)
    return (hash >>> 0) / 4294967296;
}

// ============================================================================
// ROUND COMPUTATION
// 
// Rounds are derived from Unix time, ensuring all players in the same
// time window see the same round number.
// ============================================================================

/**
 * Computes the current round number based on Unix time.
 * Each round lasts ROUND_LENGTH_SECONDS (default: 120 seconds / 2 minutes).
 * 
 * @returns {number} The current round number
 */
function getCurrentRoundNumber() {
    const currentUnixSeconds = Math.floor(Date.now() / 1000);
    return Math.floor(currentUnixSeconds / ROUND_LENGTH_SECONDS);
}

/**
 * Computes the number of seconds remaining in the current round.
 * 
 * @returns {number} Seconds until the next round begins
 */
function getSecondsUntilNextRound() {
    const currentUnixSeconds = Math.floor(Date.now() / 1000);
    const secondsIntoRound = currentUnixSeconds % ROUND_LENGTH_SECONDS;
    return ROUND_LENGTH_SECONDS - secondsIntoRound;
}

// ============================================================================
// GAME LOGIC
// 
// These functions compute which player is the Imposter and which word
// is used for the round, all derived deterministically from the room code
// and round number.
// ============================================================================

/**
 * Determines which player is the Imposter for a given room and round.
 * 
 * @param {string} roomCode - The shared room code
 * @param {string} roundKey - The round identifier (typically the round number as string)
 * @returns {number} Player number (1 to TOTAL_PLAYERS) who is the Imposter
 */
function getImposterPlayer(roomCode, roundKey) {
    const seed = roomCode + "-imposter-" + roundKey;
    return 1 + Math.floor(seededRandom(seed) * TOTAL_PLAYERS);
}

/**
 * Gets the secret word for a given room and round.
 * 
 * @param {string} roomCode - The shared room code
 * @param {string} roundKey - The round identifier (typically the round number as string)
 * @returns {string} The secret word for this round
 */
function getSecretWord(roomCode, roundKey) {
    const seed = roomCode + "-word-" + roundKey;
    const wordIndex = Math.floor(seededRandom(seed) * wordList.length);
    return wordList[wordIndex];
}

// ============================================================================
// UI ELEMENTS
// ============================================================================
const totalPlayersSlider = document.getElementById('totalPlayers');
const totalPlayersValue = document.getElementById('totalPlayersValue');
const playerNumberRange = document.getElementById('playerNumberRange');
const roomCodeInput = document.getElementById('roomCode');
const playerNumberInput = document.getElementById('playerNumber');
const revealBtn = document.getElementById('revealBtn');
const resultDiv = document.getElementById('result');
const roleDisplay = document.getElementById('roleDisplay');
const wordDisplay = document.getElementById('wordDisplay');
const roundInfo = document.getElementById('roundInfo');
const countdown = document.getElementById('countdown');

// ============================================================================
// UI LOGIC
// ============================================================================

/**
 * Validates user inputs and reveals the player's role.
 */
function revealRole() {
    // Get and validate inputs
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    const playerNumber = parseInt(playerNumberInput.value, 10);
    
    // Validate room code
    if (!roomCode) {
        alert('Please enter a room code.');
        return;
    }
    
    // Validate player number
    if (isNaN(playerNumber) || playerNumber < 1 || playerNumber > TOTAL_PLAYERS) {
        alert(`Please enter a valid player number (1-${TOTAL_PLAYERS}).`);
        return;
    }
    
    // Compute round info
    const roundNumber = getCurrentRoundNumber();
    const roundKey = String(roundNumber);
    
    // Compute game state
    const imposterPlayer = getImposterPlayer(roomCode, roundKey);
    const secretWord = getSecretWord(roomCode, roundKey);
    
    // Display result
    resultDiv.classList.remove('hidden', 'imposter', 'normal');
    
    if (playerNumber === imposterPlayer) {
        // Player is the Imposter
        resultDiv.classList.add('imposter');
        roleDisplay.textContent = '🕵️ You are the Imposter!';
        wordDisplay.textContent = "Try to blend in!";
    } else {
        // Player is not the Imposter
        resultDiv.classList.add('normal');
        roleDisplay.textContent = '✓ You are NOT the Imposter';
        wordDisplay.textContent = secretWord;
    }
}

/**
 * Updates the timer display showing current round and countdown.
 */
function updateTimer() {
    const roundNumber = getCurrentRoundNumber();
    const secondsRemaining = getSecondsUntilNextRound();
    
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    roundInfo.textContent = `Round ${roundNumber} (resets every 2 minutes)`;
    countdown.textContent = `Next round in: ${timeString}`;
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

/**
 * Updates the TOTAL_PLAYERS configuration and UI when slider changes.
 */
function updateTotalPlayers() {
    TOTAL_PLAYERS = parseInt(totalPlayersSlider.value, 10);
    totalPlayersValue.textContent = TOTAL_PLAYERS;
    playerNumberRange.textContent = `1-${TOTAL_PLAYERS}`;
    playerNumberInput.max = TOTAL_PLAYERS;
    playerNumberInput.placeholder = `1-${TOTAL_PLAYERS}`;
}

// Total players slider handler
totalPlayersSlider.addEventListener('input', updateTotalPlayers);

// Reveal button click handler
revealBtn.addEventListener('click', revealRole);

// Allow Enter key to trigger reveal
playerNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        revealRole();
    }
});

roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        playerNumberInput.focus();
    }
});

// Start timer updates
updateTimer();
setInterval(updateTimer, 1000);
