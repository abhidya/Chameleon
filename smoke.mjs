#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';

function makeElement(value = '') {
  return {
    value,
    textContent: '',
    max: '',
    placeholder: '',
    classList: {
      values: new Set(['hidden']),
      add(...names) {
        for (const name of names) this.values.add(name);
      },
      remove(...names) {
        for (const name of names) this.values.delete(name);
      },
      contains(name) {
        return this.values.has(name);
      },
    },
    addEventListener() {},
    focus() {},
  };
}

const elements = {
  totalPlayers: makeElement('6'),
  totalPlayersValue: makeElement(),
  playerNumberRange: makeElement(),
  roomCode: makeElement('PINKFISH'),
  playerNumber: makeElement('1'),
  revealBtn: makeElement(),
  result: makeElement(),
  roleDisplay: makeElement(),
  wordDisplay: makeElement(),
  roundInfo: makeElement(),
  countdown: makeElement(),
};

const context = {
  console,
  alert(message) {
    throw new Error(`unexpected alert: ${message}`);
  },
  setInterval() {},
  Date: { now: () => 120_000 },
  document: {
    getElementById(id) {
      if (!elements[id]) throw new Error(`unknown element: ${id}`);
      return elements[id];
    },
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('script.js', 'utf8'), context, { filename: 'script.js' });

const imposter = context.getImposterPlayer('PINKFISH', '1');
if (imposter < 1 || imposter > 6) {
  throw new Error(`imposter out of range: ${imposter}`);
}

elements.playerNumber.value = String(imposter);
context.revealRole();
if (!elements.roleDisplay.textContent.includes('Imposter')) {
  throw new Error('imposter role did not render');
}

const regular = imposter === 1 ? 2 : 1;
elements.playerNumber.value = String(regular);
context.revealRole();
if (!elements.wordDisplay.textContent || elements.wordDisplay.textContent === 'Try to blend in!') {
  throw new Error('regular player word did not render');
}

console.log('STATIC GAME SMOKE OK');
console.log(`room=PINKFISH round=1 players=6 imposter=${imposter} regular_word=${elements.wordDisplay.textContent}`);
console.log('demo_path=python3 -m http.server 8000 -> http://localhost:8000/');
