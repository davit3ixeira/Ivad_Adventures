/**
 * components.js — helpers de renderização compartilhados.
 */
import { HEROES, AFFINITIES, xpForNext, LEVEL_CAP } from "../data/heroes.js";
import { portrait } from "../data/manifest.js";

/** cria elemento a partir de string HTML */
export function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function stars(n) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

export function affBadge(aff) {
  const a = AFFINITIES[aff];
  return `<span class="badge-aff aff-${aff}">${a.icon} ${a.label.split(" / ")[0]}</span>`;
}

export function affDot(aff) {
  return `<span class="unit__aff aff-${aff}"></span>`;
}

export function hpBar(cur, max) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  return `<div class="bar bar--hp ${pct <= 30 ? "is-low" : ""}"><div class="bar__fill" style="width:${pct}%"></div></div>`;
}

/**
 * Ficha de herói do roster.
 * view: { uid, id, level, xp, dupes, def, stats }
 */
export function heroCard(view, opts = {}) {
  const def = view.def || HEROES[view.id];
  const selected = opts.selected ? "is-selected" : "";
  const badge = opts.badge ? `<span class="hero-card__badge">${opts.badge}</span>` : "";
  const xpNeed = view.level >= LEVEL_CAP ? 0 : xpForNext(view.level);
  const xpPct = xpNeed ? Math.min(100, (view.xp / xpNeed) * 100) : 100;

  return `
    <button class="hero-card rar-${def.star} ${selected}" data-hero-uid="${view.uid || ""}" data-hero-id="${def.id}">
      ${badge}
      <div class="hero-card__portrait">${portrait("heroes", def.id, def.emoji)}</div>
      <div class="hero-card__name">${def.name}</div>
      <div class="hero-card__row">
        <span class="stars">${stars(def.star)}</span>
        <span class="hero-card__lvl">Nv ${view.level ?? 1}</span>
      </div>
      <div class="hero-card__row" style="margin-top:6px">${affBadge(def.aff)}</div>
      ${
        opts.showXp !== false && view.level < LEVEL_CAP
          ? `<div class="bar bar--xp" style="margin-top:8px"><div class="bar__fill" style="width:${xpPct}%"></div></div>`
          : ""
      }
      ${view.dupes ? `<div class="hero-card__lvl" style="margin-top:6px">+${view.dupes} cópia${view.dupes > 1 ? "s" : ""}</div>` : ""}
    </button>`;
}

/** Ficha detalhada (para modal). */
export function heroSheet(view) {
  const def = view.def || HEROES[view.id];
  const s = view.stats;
  return `
    <div class="hero-sheet">
      <div class="hero-sheet__head">
        <div class="hero-sheet__portrait">${portrait("heroes", def.id, def.emoji)}</div>
        <div>
          <h2>${def.name}</h2>
          <div class="dim" style="font-size:.85rem">${def.title}</div>
          <div class="row" style="--g:6px; margin-top:6px">
            <span class="stars rar-${def.star}" style="--rar:var(--r${def.star})">${stars(def.star)}</span>
            ${affBadge(def.aff)}
          </div>
        </div>
      </div>
      <p class="dim" style="font-style:italic">“${def.quote}”</p>
      <div class="stat-grid">
        <div class="stat-box"><b>${s.maxHP}</b><span>HP</span></div>
        <div class="stat-box"><b>${s.atk}</b><span>ATK</span></div>
        <div class="stat-box"><b>${s.def}</b><span>DEF</span></div>
        <div class="stat-box"><b>${s.spd}</b><span>SPD</span></div>
        <div class="stat-box"><b>${s.mov}</b><span>MOV</span></div>
        <div class="stat-box"><b>${s.rng}</b><span>RNG</span></div>
      </div>
      <div class="skill-line">
        <b>Passiva · ${def.skill.name}</b>
        <p class="dim" style="font-size:.88rem; margin-top:2px">${def.skill.text}</p>
      </div>
      ${
        def.active
          ? `<div class="skill-line">
               <b style="color:var(--gold)">✨ Especial · ${def.active.name}</b>
               <p class="dim" style="font-size:.88rem; margin-top:2px">${def.active.text}</p>
               <p class="muted" style="font-size:.76rem; margin-top:3px">Carrega em ${def.active.charge} ações.</p>
             </div>`
          : ""
      }
      ${
        view.level != null
          ? `<div class="muted" style="font-size:.82rem; margin-top:10px">Nível ${view.level} · ${
              view.level >= LEVEL_CAP ? "MÁX" : `${view.xp}/${xpForNext(view.level)} XP`
            }${view.dupes ? ` · +${view.dupes} cópias` : ""}</div>`
          : ""
      }
    </div>`;
}

export function emptyState(icon, title, sub) {
  return `<div class="center" style="min-height:40vh; text-align:center">
    <div>
      <div style="font-size:3rem">${icon}</div>
      <h3 style="margin:10px 0 4px">${title}</h3>
      <p class="muted">${sub || ""}</p>
    </div>
  </div>`;
}
