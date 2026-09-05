import { useEffect, useMemo, useState } from 'react';
import type { CharacterId } from '../../domain/types';
import { levelForExperience } from '../../domain/experienceTable';
import {
  calcularHunt,
  formatarHoras,
  MAX_BOOSTS_POR_DIA,
  multiplicador,
  type OpcoesHunt,
} from '../../domain/huntPlanner';
import { carregarEntrada, guardarEntrada, type EntradaHunt } from '../../storage/huntPlannerStorage';

interface HuntPlannerCardProps {
  personagem: CharacterId;
  xpAtual: number;
  accentColor: string;
}

const numeros = new Intl.NumberFormat('pt-PT');

function paraNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (limpo === '') return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
}

export function HuntPlannerCard({ personagem, xpAtual, accentColor }: HuntPlannerCardProps) {
  const nivelAtual = levelForExperience(xpAtual);
  const [entrada, setEntrada] = useState<EntradaHunt>(() => carregarEntrada(personagem));

  useEffect(() => {
    guardarEntrada(personagem, entrada);
  }, [personagem, entrada]);

  function alterar<K extends keyof EntradaHunt>(campo: K, valor: EntradaHunt[K]) {
    setEntrada((atual) => ({ ...atual, [campo]: valor }));
  }

  const nivelAlvo = paraNumero(entrada.nivelAlvo);
  const xpHora = paraNumero(entrada.xpHora);
  const horas = paraNumero(entrada.horas);
  const boosts = entrada.boost ? (paraNumero(entrada.boosts) ?? 0) : 0;

  // Memorizado para o objeto não ser novo em cada render — sem isto o useMemo
  // do resultado recalculava sempre, e o linter tinha razão em queixar-se.
  const opcoes: OpcoesHunt = useMemo(
    () => ({ stamina: entrada.stamina, dobro: entrada.dobro }),
    [entrada.stamina, entrada.dobro]
  );

  const resultado = useMemo(() => {
    if (nivelAlvo === null || nivelAlvo < 1 || xpHora === null || xpHora <= 0 || horas === null) return null;
    return calcularHunt(xpAtual, nivelAlvo, xpHora, horas, boosts, opcoes);
  }, [xpAtual, nivelAlvo, xpHora, horas, boosts, opcoes]);

  const multSemBoost = multiplicador(opcoes, false);
  const multComBoost = multiplicador(opcoes, true);

  return (
    <div className="hunt-planner">
      <div className="hunt-form">
        <div className="hunt-form__field">
          <label htmlFor={`alvo-${personagem}`}>Nível que queres atingir</label>
          <input
            id={`alvo-${personagem}`}
            type="number"
            min="1"
            placeholder={`atual: ${nivelAtual}`}
            value={entrada.nivelAlvo}
            onChange={(e) => alterar('nivelAlvo', e.target.value)}
          />
        </div>
        <div className="hunt-form__field">
          <label htmlFor={`xph-${personagem}`}>XP/h bruta (a 100%)</label>
          <input
            id={`xph-${personagem}`}
            type="number"
            min="0"
            placeholder="ex: 2500000"
            value={entrada.xpHora}
            onChange={(e) => alterar('xpHora', e.target.value)}
          />
        </div>
        <div className="hunt-form__field">
          <label htmlFor={`horas-${personagem}`}>Horas a caçar</label>
          <input
            id={`horas-${personagem}`}
            type="number"
            min="0"
            step="0.5"
            placeholder="ex: 4"
            value={entrada.horas}
            onChange={(e) => alterar('horas', e.target.value)}
          />
        </div>
      </div>

      <div className="hunt-bonus">
        <label className="hunt-bonus__item">
          <input type="checkbox" checked={entrada.stamina} onChange={(e) => alterar('stamina', e.target.checked)} />
          Stamina verde <span className="hunt-bonus__tag">×1,5</span>
        </label>

        <label className="hunt-bonus__item">
          <input type="checkbox" checked={entrada.boost} onChange={(e) => alterar('boost', e.target.checked)} />
          XP Boost <span className="hunt-bonus__tag">+50%</span>
        </label>

        {entrada.boost && (
          <label className="hunt-bonus__item hunt-bonus__item--nested">
            quantos
            <input
              type="number"
              min="0"
              max={MAX_BOOSTS_POR_DIA}
              className="hunt-bonus__count"
              value={entrada.boosts}
              onChange={(e) => alterar('boosts', e.target.value)}
            />
            <span className="hunt-bonus__hint">1 hora de caça cada, máx. {MAX_BOOSTS_POR_DIA} por dia</span>
          </label>
        )}

        <label className="hunt-bonus__item">
          <input type="checkbox" checked={entrada.dobro} onChange={(e) => alterar('dobro', e.target.checked)} />
          Evento de dobro <span className="hunt-bonus__tag">+100%</span>
        </label>
      </div>

      <p className="hunt-planner__mult">
        Multiplicador: <strong>×{multSemBoost.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}</strong>
        {entrada.boost && (
          <>
            {' '}nas horas sem boost,{' '}
            <strong style={{ color: accentColor }}>
              ×{multComBoost.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}
            </strong>{' '}
            nas horas com boost
          </>
        )}
        .
      </p>

      {!resultado ? (
        <p className="daily-simulation-note">
          Preenche o nível alvo, a XP/h bruta e as horas para veres o resultado.
        </p>
      ) : resultado.jaAtingido ? (
        <p className="daily-simulation-summary">
          Já estás no nível {nivelAtual} — o alvo {nivelAlvo} já ficou para trás.
        </p>
      ) : (
        <>
          <p className="hunt-planner__headline">
            A sessão dá <strong style={{ color: accentColor }}>{numeros.format(Math.round(resultado.xpDaSessao))}</strong> XP
            {' '}e deixa-te no nível <strong style={{ color: accentColor }}>{resultado.nivelNoFim}</strong>.
          </p>

          <p className={resultado.chega ? 'hunt-planner__verdict hunt-planner__verdict--ok' : 'hunt-planner__verdict'}>
            {resultado.chega
              ? `Chega ao nível ${nivelAlvo}. Bastavam ${formatarHoras(resultado.horasNecessarias ?? 0)}.`
              : resultado.horasNecessarias === null
                ? `Não chega ao nível ${nivelAlvo} — e com esta configuração não há ritmo para lá chegar.`
                : `Não chega ao nível ${nivelAlvo}. Faltam ${numeros.format(Math.round(resultado.xpEmFalta - resultado.xpDaSessao))} XP — eram precisas ${formatarHoras(resultado.horasNecessarias)} no total.`}
          </p>

          <table className="hunt-planner__table">
            <tbody>
              <tr>
                <th>Falta para o nível {nivelAlvo}</th>
                <td>{numeros.format(Math.round(resultado.xpEmFalta))} XP</td>
              </tr>
              {resultado.horasComBoost > 0 && (
                <tr>
                  <th>{formatarHoras(resultado.horasComBoost)} com boost</th>
                  <td>{numeros.format(Math.round(resultado.xpHoraComBoost))} XP/h</td>
                </tr>
              )}
              {resultado.horasSemBoost > 0 && (
                <tr>
                  <th>{formatarHoras(resultado.horasSemBoost)} sem boost</th>
                  <td>{numeros.format(Math.round(resultado.xpHoraSemBoost))} XP/h</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
