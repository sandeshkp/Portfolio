// Renders the portfolio from data/projects.json (the nightly updater edits only that file).
(function () {
  const KIND = { ml: "ML / Research", data: "Data pipeline", app: "Web app" };
  const STATUS = { production: "In use", "in-progress": "In progress", prototype: "Prototype", research: "Research" };
  const COLORS = ["var(--k)", "var(--muted)", "var(--app)"];
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Theme toggle (remembered per browser; works without storage too)
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  let projects = [];
  let tab = "work";
  const chips = (list, n) => `<div class="chips">${(list || []).slice(0, n || 99).map((s) => `<span>${esc(s)}</span>`).join("")}</div>`;

  // ── Dummy previews ──────────────────────────────────
  function lineChart(pv) {
    const all = pv.series.flatMap((s) => s[1]);
    const min = Math.min(...all), max = Math.max(...all), W = 300, H = 110, n = pv.labels.length;
    const x = (i) => 8 + (i * (W - 16)) / (n - 1);
    const y = (v) => H - 14 - ((v - min) / (max - min || 1)) * (H - 26);
    const lines = pv.series.map((s, k) => `<polyline fill="none" stroke="${COLORS[k % 3]}" stroke-width="2.2" ${k === 1 && pv.series.length === 2 ? 'stroke-dasharray="5 4"' : ""}
      points="${s[1].map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`).join("");
    const labels = pv.labels.map((l, i) => `<text x="${x(i)}" y="${H - 2}" font-size="8" text-anchor="middle" fill="var(--muted)">${esc(l)}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(pv.title)}">${lines}${labels}</svg>
      <div class="legend">${pv.series.map((s, k) => `<span><i style="background:${COLORS[k % 3]}"></i>${esc(s[0])}</span>`).join("")}</div>`;
  }
  const shoe = `<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M8 20 Q10 10 22 12 L34 14 Q44 15 50 20 L52 23 L8 23 Z" fill="var(--k)" opacity=".75"/></svg>`;

  function preview(pv) {
    if (!pv) return "";
    let body = "";
    if (pv.type === "table") {
      body = `<table><tr>${pv.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${pv.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    } else if (pv.type === "kpis") {
      const mx = Math.max(...pv.bars.map((b) => b[1]));
      body = `<div class="kpis">${pv.kpis.map((k) => `<div><b>${esc(k[1])}</b><span>${esc(k[0])}</span></div>`).join("")}</div>` +
        pv.bars.map((b) => `<div class="hbar"><span>${esc(b[0])}</span><div><i style="width:${(b[1] / mx) * 100}%"></i></div><span>${esc(b[1])}</span></div>`).join("");
    } else if (pv.type === "line") {
      body = lineChart(pv);
    } else if (pv.type === "chat") {
      body = `<div class="chat">${pv.messages.map((m) => `<div class="${m[0] === "user" ? "u" : "b"}">${esc(m[1])}</div>`).join("")}</div>`;
    } else if (pv.type === "grid") {
      body = `<div class="tiles">${pv.items.map((t) => `<div>${shoe}${esc(t[0])}<b>${esc(t[1])}</b></div>`).join("")}</div>`;
    }
    return `<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><b>${esc(pv.title)}</b><em>dummy data</em></div><div class="mock-body">${body}</div></div>`;
  }

  // ── Cards ───────────────────────────────────────────
  function card(p) {
    if (p.group === "personal") {
      return `<button class="card feature ${esc(p.kind)}" data-id="${esc(p.id)}" aria-haspopup="dialog">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="card-top"><span class="tag">${esc(KIND[p.kind])}</span><span class="status ${esc(p.status)}">${esc(STATUS[p.status])}</span></div>
          <h3 style="font-size:1.15rem">${esc(p.title)}</h3><p>${esc(p.tagline)}</p>
          <p>${esc(p.problem)}</p>
          ${chips(p.stack)}<span class="open">Read the full research →</span>
        </div>
        <div class="mini">${preview(p.preview)}</div></button>`;
    }
    return `<button class="card ${esc(p.kind)}" data-id="${esc(p.id)}" aria-haspopup="dialog">
      <div class="card-top"><span class="tag">${esc(KIND[p.kind])}</span><span class="status ${esc(p.status)}">${esc(STATUS[p.status])}</span></div>
      <h3>${esc(p.title)}</h3><p>${esc(p.tagline)}</p>${chips(p.stack, 4)}<span class="open">Read case study →</span></button>`;
  }

  function render() {
    const list = projects.filter((p) => (p.group || "work") === tab);
    const grid = $("#grid");
    grid.className = "grid" + (tab === "personal" ? " personal" : "");
    grid.innerHTML = list.map(card).join("") || '<p class="tab-hint">Nothing here yet.</p>';
    $("#hint").textContent = tab === "work"
      ? "Projects built for my employer. Shown with dummy data; no company data is used."
      : "Self-driven research I do outside work, mainly to test ideas properly.";
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === tab));
  }

  function openCase(id) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const dlg = $("#dlg");
    dlg.className = p.kind;
    const list = (arr) => `<ul>${(arr || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const sec = (title, html) => (html ? `<section class="cs"><h4>${title}</h4>${html}</section>` : "");
    $("#dlgContent").innerHTML = `
      <div class="dlg-head">
        <div class="row"><span class="tag">${esc(KIND[p.kind])}</span><span class="status ${esc(p.status)}">${esc(STATUS[p.status])}</span></div>
        <h3>${esc(p.title)}</h3><p>${esc(p.tagline)}</p>
        <button class="dlg-close" aria-label="Close">×</button>
      </div>
      <div class="dlg-body">
        ${sec("1. The problem", `<p>${esc(p.problem)}</p>`)}
        ${p.before ? sec("2. Before vs after", `<div class="ba"><div class="b"><b>Before</b>${list(p.before)}</div><div class="a"><b>After</b>${list(p.after)}</div></div>`) : ""}
        ${sec("3. Solution", `<p>${esc(p.solution)}</p>${p.architecture ? `<div class="flow">${p.architecture.map((s) => `<span>${esc(s)}</span>`).join("<em>→</em>")}</div>` : ""}`)}
        ${p.tech ? sec("4. How it works (technical)", list(p.tech)) : ""}
        ${p.testing ? sec("5. How it was tested / validated", list(p.testing)) : ""}
        ${p.outcomes ? sec("6. Outcome", list(p.outcomes)) : ""}
        ${p.preview ? sec("Preview", preview(p.preview)) : ""}
        ${sec("Built with", chips(p.stack))}
        ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      </div>`;
    dlg.showModal();
    $(".dlg-close").focus();
  }

  document.addEventListener("click", (e) => {
    const c = e.target.closest(".card");
    if (c) return openCase(c.dataset.id);
    if (e.target.closest(".dlg-close") || e.target === $("#dlg")) return $("#dlg").close();
    const t = e.target.closest(".tab");
    if (t) { tab = t.dataset.tab; render(); }
  });

  fetch("data/projects.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      projects = d.projects || [];
      const work = projects.filter((p) => (p.group || "work") === "work");
      $("#updated").textContent = d.updated || "";
      $("#nWork").textContent = work.length;
      $("#nPersonal").textContent = projects.length - work.length;
      $("#statWork").textContent = work.length;
      $("#statUse").textContent = work.filter((p) => p.status === "production").length;
      $("#statML").textContent = projects.filter((p) => p.kind === "ml").length;
      $("#statTech").textContent = new Set(projects.flatMap((p) => p.stack || [])).size;
      render();
    })
    .catch(() => { $("#grid").innerHTML = '<p class="tab-hint">Projects could not be loaded.</p>'; });
})();
