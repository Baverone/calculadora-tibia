// Testes do parser da tabela do guildstats e da formula de experiencia.
// Sem rede: o HTML e uma fixture aqui ao lado, copiada da forma que o
// guildstats serve desde o redesenho de agosto de 2026 (duas spans por
// celula, a segunda com a abreviatura para telemovel).
import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceForLevel, levelForExperience, parseExperienceRows } from './guildstatsHistory.mjs';

const linha = (data, curta, nivel, xp, xpCurta) => `
  <tr>
    <td><span>${data}</span><span>${curta}</span></td>
    <td>1</td>
    <td>2</td>
    <td>${nivel}</td>
    <td><span>${xp}</span><span>${xpCurta}</span></td>
  </tr>`;

const tabela = (...linhas) => `<table><tbody>${linhas.join('')}</tbody></table>`;

test('le a tabela toda, e nao so a linha mais recente', () => {
  const html = tabela(
    linha('2026-09-05', '09-05', '1150', '26,552,190,000', '26.5B'),
    linha('2026-09-04', '09-04', '1149 (+1)', '26,500,000,000', '26.5B')
  );

  assert.deepEqual(parseExperienceRows(html), [
    { date: '2026-09-05', level: 1150, experience: 26552190000 },
    { date: '2026-09-04', level: 1149, experience: 26500000000 },
  ]);
});

test('celula de experiencia vazia nao vira um dia de 0 XP', () => {
  // Number('') e 0, nao NaN: sem o guarda, esta linha entrava no historico
  // como um dia legitimo de zero experiencia e ficava la para sempre.
  const html = tabela(
    linha('2026-09-05', '09-05', '1150', '26,552,190,000', '26.5B'),
    linha('2026-09-04', '09-04', '1149', '', '')
  );

  assert.deepEqual(parseExperienceRows(html), [{ date: '2026-09-05', level: 1150, experience: 26552190000 }]);
});

test('linhas com data ou nivel ilegiveis sao ignoradas', () => {
  const html = tabela(
    linha('Total', '', '', '999', ''),
    linha('2026-09-05', '09-05', '1150', '26,552,190,000', '26.5B')
  );

  assert.deepEqual(parseExperienceRows(html), [{ date: '2026-09-05', level: 1150, experience: 26552190000 }]);
});

test('uma tabela sem linhas parseaveis grita em vez de devolver vazio', () => {
  assert.throws(() => parseExperienceRows(tabela(linha('Total', '', '', '999', ''))), /layout pode ter mudado/);
  assert.throws(() => parseExperienceRows('<p>403 Forbidden</p>'), /layout pode ter mudado/);
});

test('a formula de experiencia bate certo com a tabela oficial', () => {
  assert.equal(experienceForLevel(1), 0);
  assert.equal(experienceForLevel(2), 100);
  assert.equal(experienceForLevel(8), 4200);
  assert.equal(levelForExperience(0), 1);
  assert.equal(levelForExperience(99), 1);
  assert.equal(levelForExperience(100), 2);
  assert.equal(levelForExperience(experienceForLevel(1150)), 1150);
  assert.equal(levelForExperience(experienceForLevel(1150) - 1), 1149);
});
