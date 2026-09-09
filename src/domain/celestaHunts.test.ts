// O primeiro teste do lado TypeScript. Corre no mesmo `npm test` dos scripts,
// com o type stripping do Node — sem passo de build, sem browser, sem rede.
//
// O que se testa aqui e nao no gaps.test.mjs: o gaps.mjs decide quais sao as
// janelas livres; isto decide se ESTE momento cai dentro de uma delas. Sao
// perguntas diferentes e a segunda e a que a app responde no telemovel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAge,
  formatLength,
  minutesSinceReference,
  spotAvailability,
  toLisbon,
  totalFreeMinutes,
  type CelestaHuntsData,
  type HuntSpotStatus,
} from './celestaHunts.ts';

const GERADO = '2026-09-09T00:06:00.000Z';
const GERADO_MS = Date.parse(GERADO);

function dados(spots: HuntSpotStatus[], referenceTime = '02:04'): CelestaHuntsData {
  return {
    generatedAt: GERADO,
    referenceTime,
    timezone: 'Europe/Berlin',
    minWindowMinutes: 30,
    spots,
  };
}

/** Um instante `minutos` depois de o ficheiro ter sido gerado. */
function passados(minutos: number): number {
  return GERADO_MS + minutos * 60000;
}

test('minutesSinceReference conta os minutos desde o ficheiro ter sido gerado', () => {
  assert.equal(minutesSinceReference(dados([]), passados(0)), 0);
  assert.equal(minutesSinceReference(dados([]), passados(37)), 37);
});

test('minutesSinceReference recusa-se a responder com 24h ou mais de ficheiro', () => {
  // Ao fim de uma volta completa a conta dava a volta e uma janela de ontem
  // passava por "livre agora" -- errada e confiante, que e o pior que ha.
  assert.equal(minutesSinceReference(dados([]), passados(24 * 60 - 1)), 24 * 60 - 1);
  assert.equal(minutesSinceReference(dados([]), passados(24 * 60)), null);
});

test('minutesSinceReference recusa-se a responder com o relogio atras do ficheiro', () => {
  assert.equal(minutesSinceReference(dados([]), passados(-5)), null);
});

test('minutesSinceReference recusa-se a responder sem data valida', () => {
  const estragado = { ...dados([]), generatedAt: 'nao e uma data' };
  assert.equal(minutesSinceReference(estragado, passados(10)), null);
});

test('um spot sem reservas nenhumas esta sempre livre agora', () => {
  const spot: HuntSpotStatus = { name: 'Stag', free: [], noBookings: true };
  const estado = spotAvailability(spot, dados([spot]), passados(600));
  assert.equal(estado?.state, 'free');
  assert.equal(estado?.window, null);
});

test('a janela que comeca na referencia esta a decorrer agora', () => {
  const spot: HuntSpotStatus = {
    name: 'Feru DT Seal -1',
    free: [
      { start: '02:04', end: '17:00', minutes: 896 },
      { start: '20:00', end: '20:30', minutes: 30 },
    ],
  };
  const estado = spotAvailability(spot, dados([spot]), passados(30));
  assert.equal(estado?.state, 'free');
  assert.equal(estado?.changesAt, '17:00');
  assert.equal(estado?.minutesUntilChange, 896 - 30);
});

test('depois de a janela acabar o spot fica ocupado ate a proxima', () => {
  const spot: HuntSpotStatus = {
    name: 'Feru DT Seal -1',
    free: [
      { start: '02:04', end: '17:00', minutes: 896 },
      { start: '20:00', end: '20:30', minutes: 30 },
    ],
  };
  // 02:04 + 900min = 17:04, ja fora da primeira janela.
  const estado = spotAvailability(spot, dados([spot]), passados(900));
  assert.equal(estado?.state, 'busy');
  assert.equal(estado?.changesAt, '20:00');
  // 20:00 esta a 1076 minutos da referencia das 02:04 (1200 - 124).
  assert.equal(estado?.minutesUntilChange, 1076 - 900);
});

test('uma janela depois da meia-noite conta como do dia seguinte, nao do proprio', () => {
  // Este e o caso que uma leitura ingenua de "HH:MM" estraga: com a referencia
  // as 02:04, a janela "00:00 - 02:04" e daqui a 22 horas e nao ha duas horas.
  const spot: HuntSpotStatus = {
    name: 'Feru Way',
    free: [
      { start: '02:04', end: '08:15', minutes: 371 },
      { start: '00:00', end: '02:04', minutes: 124 },
    ],
  };

  const demanha = spotAvailability(spot, dados([spot]), passados(400));
  assert.equal(demanha?.state, 'busy');
  assert.equal(demanha?.changesAt, '00:00');
  assert.equal(demanha?.minutesUntilChange, 1316 - 400);

  const depoisDaMeiaNoite = spotAvailability(spot, dados([spot]), passados(1350));
  assert.equal(depoisDaMeiaNoite?.state, 'free');
  assert.equal(depoisDaMeiaNoite?.changesAt, '02:04');
});

test('sem mais janelas nas 24h o spot fica ocupado sem hora de mudanca', () => {
  const spot: HuntSpotStatus = {
    name: 'Norcferatu East',
    free: [{ start: '02:04', end: '08:45', minutes: 401 }],
  };
  const estado = spotAvailability(spot, dados([spot]), passados(500));
  assert.equal(estado?.state, 'busy');
  assert.equal(estado?.changesAt, null);
  assert.equal(estado?.minutesUntilChange, null);
});

test('sem saber que horas sao nao se inventa um estado', () => {
  const spot: HuntSpotStatus = {
    name: 'Feru DT Seal -1',
    free: [{ start: '02:04', end: '17:00', minutes: 896 }],
  };
  assert.equal(spotAvailability(spot, dados([spot]), passados(24 * 60)), null);
});

test('formatLength escreve minutos, horas e horas com minutos', () => {
  assert.equal(formatLength(45), '45min');
  assert.equal(formatLength(120), '2h');
  assert.equal(formatLength(154), '2h34');
});

test('toLisbon tira uma hora a Berlim e da a volta a meia-noite', () => {
  assert.equal(toLisbon('17:00'), '16:00');
  assert.equal(toLisbon('00:30'), '23:30');
});

test('totalFreeMinutes soma as janelas e da o dia inteiro a quem nao tem reservas', () => {
  assert.equal(totalFreeMinutes({ name: 'x', free: [], noBookings: true }), 1440);
  assert.equal(
    totalFreeMinutes({
      name: 'x',
      free: [
        { start: '02:04', end: '03:04', minutes: 60 },
        { start: '05:00', end: '05:30', minutes: 30 },
      ],
    }),
    90
  );
});

test('formatAge nao arrisca uma idade quando a data nao presta', () => {
  assert.equal(formatAge({ ...dados([]), generatedAt: 'x' }, passados(10)), 'data desconhecida');
  assert.equal(formatAge(dados([]), passados(0)), 'agora mesmo');
  assert.equal(formatAge(dados([]), passados(94)), 'há 1h34');
});
