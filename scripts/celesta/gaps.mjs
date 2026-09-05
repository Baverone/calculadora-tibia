// Reservas -> janelas livres.
//
// Porto do scripts/gaps.py da skill, para o bot não precisar de Python
// instalado além do Node. A lógica chata é toda a mesma:
//
//  - O bot Letter lista as reservas por ordem cronológica A PARTIR DA HORA
//    ATUAL, e não a partir da meia-noite. Ao passar da meia-noite as horas
//    voltam a subir do zero — daí a deteção da quebra e o +1 dia. Sem isto,
//    uma reserva das 01:00 lida às 22:00 parecia ter acontecido de manhã.
//  - Reservas sobrepostas juntam-se antes de se calcular o que sobra.
//  - Tudo é recortado à janela de 24h a contar de "agora".

const MINUTOS_POR_DIA = 1440;
const LINHA = /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s*(.*)$/;

export function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function paraHoras(x) {
  const v = ((x % (MINUTOS_POR_DIA * 3)) + MINUTOS_POR_DIA * 3) % (MINUTOS_POR_DIA * 3);
  return `${String(Math.floor(v / 60) % 24).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
}

/**
 * @param {Record<string, string[]>} reservas mapa spot -> ["HH:MM - HH:MM Nome", ...]
 * @param {string} agoraHHMM hora do footer do summary (fuso do bot)
 * @param {number} janelaMinima minutos
 * @returns {{name: string, free: {start: string, end: string, minutes: number}[], noBookings?: boolean}[]}
 */
export function calcularJanelas(reservas, agoraHHMM, janelaMinima = 30) {
  const agora = paraMinutos(agoraHHMM);
  const saida = [];

  for (const [spot, linhas] of Object.entries(reservas)) {
    // Um spot que não aparece no summary não tem reservas nenhumas.
    if (!Array.isArray(linhas) || linhas.length === 0 || linhas[0] === 'SEM RESERVAS') {
      saida.push({ name: spot, free: [], noBookings: true });
      continue;
    }

    const marcadas = [];
    let dia = 0;
    let anterior = null;

    for (const bruta of linhas) {
      const mo = LINHA.exec(String(bruta).trim());
      if (!mo) continue;
      const s = paraMinutos(mo[1]);
      const e = paraMinutos(mo[2]);
      if (anterior !== null && s < anterior) dia += 1;
      anterior = s;
      let inicio = dia * MINUTOS_POR_DIA + s;
      let fim = dia * MINUTOS_POR_DIA + e;
      if (fim <= inicio) fim += MINUTOS_POR_DIA;
      marcadas.push([inicio, fim]);
    }

    marcadas.sort((a, b) => a[0] - b[0]);

    const juntas = [];
    for (const [s, e] of marcadas) {
      const ultima = juntas[juntas.length - 1];
      if (ultima && s <= ultima[1]) ultima[1] = Math.max(ultima[1], e);
      else juntas.push([s, e]);
    }

    const lo = agora;
    const hi = agora + MINUTOS_POR_DIA;
    const livres = [];
    let cursor = lo;
    for (const [s, e] of juntas) {
      if (e <= lo || s >= hi) continue;
      if (s > cursor) livres.push([cursor, Math.min(s, hi)]);
      cursor = Math.max(cursor, e);
    }
    if (cursor < hi) livres.push([cursor, hi]);

    saida.push({
      name: spot,
      free: livres
        .filter(([a, b]) => b - a >= janelaMinima)
        .map(([a, b]) => ({ start: paraHoras(a), end: paraHoras(b), minutes: b - a })),
    });
  }

  return saida;
}

/**
 * As melhores janelas em horário decente, já em texto.
 *
 * "Decente" é sobreposição com as 17:00-01:00, e não a hora a que a janela
 * começa. Uma janela das 12:00 às 23:00 cobre a noite toda; classificá-la
 * pela hora de início deixava-a de fora e destacava outra pior que por acaso
 * começava às 18:00.
 */
export function destaques(spots, agoraHHMM, minimoMinutos = 90) {
  const agora = paraMinutos(agoraHHMM);
  const PASSO = 15;

  /** Início absoluto de uma janela, na volta de 24h que começa em `agora`. */
  const absoluto = (hhmm) => agora + (((paraMinutos(hhmm) - agora) % MINUTOS_POR_DIA) + MINUTOS_POR_DIA) % MINUTOS_POR_DIA;

  const ehNoite = (minutoAbsoluto) => {
    const hora = Math.floor(minutoAbsoluto / 60) % 24;
    return hora >= 17 || hora < 1;
  };

  const candidatas = [];
  for (const spot of spots) {
    if (spot.noBookings) {
      candidatas.push({ texto: `${spot.name} — livre o dia todo`, peso: MINUTOS_POR_DIA });
      continue;
    }
    for (const janela of spot.free) {
      if (janela.minutes < minimoMinutos) continue;
      const ini = absoluto(janela.start);
      let noite = 0;
      for (let t = ini; t < ini + janela.minutes; t += PASSO) if (ehNoite(t)) noite += PASSO;
      if (noite < 60) continue;
      candidatas.push({ texto: `${spot.name} — ${janela.start} a ${janela.end}`, peso: noite });
    }
  }

  candidatas.sort((a, b) => b.peso - a.peso);
  return candidatas.slice(0, 4).map((c) => c.texto);
}
