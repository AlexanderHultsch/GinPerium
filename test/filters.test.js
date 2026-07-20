import test from 'node:test';
import assert from 'node:assert/strict';
import { regionKey, botanicalList, buildFilterOptions, filterGins, sortGins } from '../public/js/filters.js';
import { NO_PREFERENCE } from '../public/js/config.js';

const GINS = [
  {
    id: '1',
    name: 'Bobby',
    region: 'Niederlande / Schiedam',
    taste: 'Frucht',
    botanicals: 'Nelke, Koriander',
    averageRating: 4,
    priceEur: 26.9,
    abv: 42,
  },
  {
    id: '2',
    name: 'Alpha',
    region: 'England / London',
    taste: 'Kräuter',
    botanicals: 'Koriander, Angelika',
    averageRating: 3,
    priceEur: 16.9,
    abv: 47.3,
  },
  {
    id: '3',
    name: 'Zeta',
    region: 'England / Hampshire',
    taste: 'Frucht',
    botanicals: 'Zitrone',
    averageRating: 5,
    priceEur: 39.5,
    abv: 40,
  },
];

test('regionKey nimmt den Teil vor "/"', () => {
  assert.equal(regionKey('England / London'), 'England');
  assert.equal(regionKey('Deutschland'), 'Deutschland');
});

test('botanicalList trennt an Komma und trimmt', () => {
  assert.deepEqual(botanicalList('Wacholder, Zitrone,  Koriander'), ['Wacholder', 'Zitrone', 'Koriander']);
  assert.deepEqual(botanicalList(''), []);
});

test('buildFilterOptions liefert distinkte, sortierte Optionen', () => {
  const options = buildFilterOptions(GINS);
  assert.deepEqual(options.regions, ['England', 'Niederlande']);
  assert.deepEqual(options.tastes, ['Frucht', 'Kräuter']);
  assert.deepEqual(options.botanicals, ['Angelika', 'Koriander', 'Nelke', 'Zitrone']);
});

test('filterGins ohne Filter liefert alle', () => {
  assert.equal(filterGins(GINS, {}).length, 3);
  assert.equal(filterGins(GINS, { region: NO_PREFERENCE }).length, 3);
});

test('filterGins filtert nach Region', () => {
  const result = filterGins(GINS, { region: 'England' });
  assert.deepEqual(
    result.map((g) => g.id),
    ['2', '3'],
  );
});

test('filterGins filtert nach Geschmack', () => {
  const result = filterGins(GINS, { taste: 'Frucht' });
  assert.deepEqual(
    result.map((g) => g.id),
    ['1', '3'],
  );
});

test('filterGins filtert nach Botanical', () => {
  const result = filterGins(GINS, { botanical: 'Koriander' });
  assert.deepEqual(
    result.map((g) => g.id),
    ['1', '2'],
  );
});

test('filterGins kombiniert mehrere Filter (UND-Verknüpfung)', () => {
  const result = filterGins(GINS, { region: 'England', taste: 'Frucht' });
  assert.deepEqual(
    result.map((g) => g.id),
    ['3'],
  );
});

test('sortGins nach Name (A-Z)', () => {
  const result = sortGins(GINS, 'name');
  assert.deepEqual(
    result.map((g) => g.name),
    ['Alpha', 'Bobby', 'Zeta'],
  );
});

test('sortGins nach Bewertung (beste zuerst)', () => {
  const result = sortGins(GINS, 'rating');
  assert.deepEqual(
    result.map((g) => g.id),
    ['3', '1', '2'],
  );
});

test('sortGins nach Preis (günstig zuerst)', () => {
  const result = sortGins(GINS, 'price');
  assert.deepEqual(
    result.map((g) => g.id),
    ['2', '1', '3'],
  );
});

test('sortGins nach Alkoholgehalt (niedrig zuerst)', () => {
  const result = sortGins(GINS, 'abv');
  assert.deepEqual(
    result.map((g) => g.id),
    ['3', '1', '2'],
  );
});

test('sortGins verändert die Eingabe nicht (reine Funktion)', () => {
  const copy = [...GINS];
  sortGins(GINS, 'name');
  assert.deepEqual(GINS, copy);
});
