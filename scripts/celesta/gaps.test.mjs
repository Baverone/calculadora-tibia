// Testes das janelas livres. Sem rede, sem dependencias: so `node --test`.
//
// O que estes casos protegem e a leitura das horas do bot Letter, que lista as
// reservas a partir da hora atual e nao da meia-noite -- e onde uma reserva
// depois da meia-noite ja apareceu como janela livre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularJanelas, destaques, linhaLegivel, paraHoras, paraMinutos } from './gaps.mjs';

const soUm = (reservas, agora, minima = 30) => calcularJanelas(reservas, agora, minima)[0];

test('reserva depois da meia-noite na primeira linha nao e descartada', () => {
  const spot = soUm({ 'Roshamuul West': ['02:00 - 04:00 Alguem'] }, '22:00');
  assert.deepEqual(
    spot.free.map((w) => [w.start, w.end]),
    [
      ['22:00', '02:00'],
      ['04:00', '22:00'],
    ]
  );
});

test('reserva a decorrer agora continua a contar como ocupada', () => {
  const spot = soUm({ 'Feru Way (Hell Hub)': ['21:00 - 23:00 Alguem'] }, '22:00');
  assert.deepEqual(
    spot.free.map((w) => [w.start, w.end]),
    [['23:00', '22:00']]
  );
});

test('reserva que atravessa a meia-noite conta como um bloco so', () => {
  const spot = soUm({ 'Norcferatu East': ['23:00 - 01:00 Alguem'] }, '22:00');
  assert.deepEqual(
    spot.free.map((w) => [w.start, w.end]),
    [
      ['22:00', '23:00'],
      ['01:00', '22:00'],
    ]
  );
});

test('a quebra na sequencia continua a somar um dia', () => {
  const spot = soUm({ 'Stag Catacombs -1': ['23:00 - 23:30 A', '01:00 - 02:00 B'] }, '22:00');
  assert.deepEqual(
    spot.free.map((w) => [w.start, w.end]),
    [
      ['22:00', '23:00'],
      ['23:30', '01:00'],
      ['02:00', '22:00'],
    ]
  );
});

test('reservas sobrepostas juntam-se antes de sobrar o que sobra', () => {
  const spot = soUm({ 'Feru DT Seal -1 (Shulgrax)': ['22:00 - 23:30 A', '23:00 - 00:30 B'] }, '21:00');
  assert.deepEqual(
    spot.free.map((w) => [w.start, w.end]),
    [
      ['21:00', '22:00'],
      ['00:30', '21:00'],
    ]
  );
});

test('janelas abaixo do minimo nao aparecem', () => {
  const spot = soUm({ X: ['22:00 - 23:00 A', '23:20 - 23:50 B'] }, '22:00');
  assert.deepEqual(
    spot.free.map((w) => [w.start, w.end]),
    [['23:50', '22:00']]
  );
});

test('"SEM RESERVAS" marca o spot como livre o dia todo', () => {
  const spot = soUm({ 'Roshamuul Upper (Depot)': ['SEM RESERVAS'] }, '10:00');
  assert.equal(spot.noBookings, true);
  assert.deepEqual(spot.free, []);
});

test('paraMinutos e paraHoras sao inversos dentro da volta de 24h', () => {
  assert.equal(paraMinutos('00:00'), 0);
  assert.equal(paraMinutos('23:59'), 1439);
  assert.equal(paraHoras(1440 + 120), '02:00');
});

test('linhaLegivel distingue o formato do bot de tudo o resto', () => {
  assert.equal(linhaLegivel('22:00 - 23:30 Baverone'), true);
  assert.equal(linhaLegivel('  22:00-23:30  '), true);
  assert.equal(linhaLegivel('SEM RESERVAS'), false);
  assert.equal(linhaLegivel('22:00 ate 23:30 Baverone'), false);
  assert.equal(linhaLegivel('Baverone reservou das 22h as 23h'), false);
});

test('destaques so escolhem janelas com uma hora de noite', () => {
  const spots = calcularJanelas({ Dia: ['17:00 - 09:00 A'], Noite: ['09:00 - 17:00 A'] }, '08:00', 30);
  const linhas = destaques(spots, '08:00');
  assert.equal(linhas.length, 1);
  assert.match(linhas[0], /^Noite —/);
});
