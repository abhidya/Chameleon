# Imposter - Party Game

A single-page static website for a party game called "Imposter." This game runs entirely in the browser with no backend, database, or third-party services required.

## Demo Quick Start

This repo is ready to demo as static HTML:

```bash
node smoke.mjs
python3 -m http.server 8000
```

Then open `http://localhost:8000/` on each phone or laptop. Everyone should use the same room code, choose a unique player number, and keep device clocks reasonably close because rounds are time-based.

## How to Play

1. **Everyone joins the same room**: All players (3-120) enter the same room code (e.g., "PINKFISH").
2. **Select your player number**: Each player picks a unique number in the displayed range.
3. **Reveal your role**: Press "Reveal My Role" to see if you're the Imposter or a regular player.
4. **Regular players** see a secret word.
5. **The Imposter** sees no word and must blend in by listening to clues from other players.

## How Deterministic Seeding Works

The game uses a deterministic pseudorandom number generator (PRNG) to ensure all players see consistent game state without any server communication.

### Core Algorithm

1. **String to Hash (`seedToNumber`)**: Converts any string into a 32-bit unsigned integer using a variant of the djb2 hash algorithm.

2. **Hash to Float (`seededRandom`)**: Takes the hash and applies xorshift-style mixing operations for better distribution, then converts to a float in [0, 1).

3. **Consistent Results**: Given the same seed string, every device will compute the exact same "random" number.

### Game State Derivation

- **Imposter Selection**: `seed = roomCode + "-imposter-" + roundNumber`
  - `imposterPlayer = 1 + floor(seededRandom(seed) * 6)`

- **Word Selection**: `seed = roomCode + "-word-" + roundNumber`
  - `wordIndex = floor(seededRandom(seed) * wordList.length)`

### Time-Based Rounds

Rounds are derived from Unix time to ensure all players see the same round:

```javascript
roundLengthSeconds = 120; // 2 minutes
roundNumber = Math.floor(Date.now() / 1000 / roundLengthSeconds);
```

This means all players with synchronized clocks (within a few seconds) will be in the same round.

## Running with GitHub Pages

1. **Push to GitHub**: Push this repository to your GitHub account.

2. **Enable GitHub Pages**:
   - Go to your repository's **Settings** → **Pages**
   - Under "Source", select your branch (e.g., `main`)
   - Click **Save**

3. **Access the game**: Your site will be available at:
   ```
   https://<username>.github.io/<repository-name>/
   ```

## Local Development

Simply open `index.html` in a web browser. No build step or server required.

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a simple HTTP server (optional)
python -m http.server 8000
# Then visit http://localhost:8000
```

## Demo Limitations

- There is no server-side room membership, so the group must coordinate player numbers manually.
- Rounds reset every 2 minutes based on each device's local clock.
- The imposter can reveal another player's role by entering that player's number; treat numbers as private.

## Files

- `index.html` - Main HTML structure
- `style.css` - Mobile-friendly styling
- `script.js` - Game logic with deterministic PRNG

## Technical Details

- **No dependencies**: Pure HTML, CSS, and vanilla JavaScript
- **Mobile-friendly**: Responsive design works on all screen sizes
- **No backend**: All logic runs client-side
- **Deterministic**: Same inputs always produce same outputs
