// Project detail page: project.html?id=<id>#<tab>. One tab visible at a time.
(function () {
  const KIND = { ml: "ML / Research", data: "Data pipeline", app: "Web app" };
  const STATUS = { production: "In use", "in-progress": "In progress", prototype: "Prototype", research: "Research" };
  const COLORS = ["var(--k)", "var(--muted)", "var(--app)"];
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const list = (arr) => (arr && arr.length ? `<ul class="plist">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const chips = (arr) => `<div class="chips">${(arr || []).map((s) => `<span>${esc(s)}</span>`).join("")}</div>`;

  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  // ── Dummy previews (same as before) ─────────────────
  function lineChart(pv) {
    const all = pv.series.flatMap((s) => s[1]);
    const min = Math.min(...all), max = Math.max(...all), W = 320, H = 120, n = pv.labels.length;
    const x = (i) => 10 + (i * (W - 20)) / (n - 1);
    const y = (v) => H - 16 - ((v - min) / (max - min || 1)) * (H - 28);
    const lines = pv.series.map((s, k) => `<polyline fill="none" stroke="${COLORS[k % 3]}" stroke-width="2.2" ${k === 1 && pv.series.length === 2 ? 'stroke-dasharray="5 4"' : ""} points="${s[1].map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`).join("");
    const labels = pv.labels.map((l, i) => `<text x="${x(i)}" y="${H - 3}" font-size="8" text-anchor="middle" fill="var(--muted)">${esc(l)}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(pv.title)}">${lines}${labels}</svg>
      <div class="legend">${pv.series.map((s, k) => `<span><i style="background:${COLORS[k % 3]}"></i>${esc(s[0])}</span>`).join("")}</div>`;
  }
  const shoe = `<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M8 20 Q10 10 22 12 L34 14 Q44 15 50 20 L52 23 L8 23 Z" fill="var(--k)" opacity=".75"/></svg>`;
  function preview(pv) {
    if (!pv) return "";
    let body = "";
    if (pv.type === "table") body = `<table><tr>${pv.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${pv.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    else if (pv.type === "kpis") {
      const mx = Math.max(...pv.bars.map((b) => b[1]));
      body = `<div class="kpis">${pv.kpis.map((k) => `<div><b>${esc(k[1])}</b><span>${esc(k[0])}</span></div>`).join("")}</div>` +
        pv.bars.map((b) => `<div class="hbar"><span>${esc(b[0])}</span><div><i style="width:${(b[1] / mx) * 100}%"></i></div><span>${esc(b[1])}</span></div>`).join("");
    } else if (pv.type === "line") body = lineChart(pv);
    else if (pv.type === "chat") body = `<div class="chat">${pv.messages.map((m) => `<div class="${m[0] === "user" ? "u" : "b"}">${esc(m[1])}</div>`).join("")}</div>`;
    else if (pv.type === "grid") body = `<div class="tiles">${pv.items.map((t) => `<div>${shoe}${esc(t[0])}<b>${esc(t[1])}</b></div>`).join("")}</div>`;
    return `<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><b>${esc(pv.title)}</b><em>dummy data</em></div><div class="mock-body">${body}</div></div>`;
  }

  // ── Doc blocks (used when a project has "sections") ──
  function table(t) {
    return `<div class="tbl-wrap"><table class="tbl">${t.caption ? `<caption>${esc(t.caption)}</caption>` : ""}
      <thead><tr>${t.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="k"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function block(b, p) {
    if (b.h) return `<h3>${esc(b.h)}</h3>`;
    if (b.p) return `<p>${esc(b.p)}</p>`;
    if (b.ul) return `<ul class="plist">${b.ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    if (b.ol) return `<ol class="plist">${b.ol.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
    if (b.table) return table(b.table);
    if (b.kv) return table({ caption: b.caption, columns: b.columns || ["Item", "Detail"], rows: b.kv });
    if (b.code) return `<figure class="code">${b.title ? `<figcaption>${esc(b.title)}</figcaption>` : ""}<pre><code>${esc(b.code)}</code></pre></figure>`;
    if (b.flow) return `<div class="flow">${b.flow.map((s) => `<span>${esc(s)}</span>`).join("<em>→</em>")}</div>`;
    if (b.callout) return `<div class="callout">${esc(b.callout)}</div>`;
    if (b.preview) return `${preview(p.preview)}<p class="note" style="margin-top:6px">Recreated example with dummy data. Real company data can't be shown.</p>`;
    if (b.stack) return chips(p.stack);
    return "";
  }

  // ── Tabs ────────────────────────────────────────────
  function tabsFor(p) {
    if (Array.isArray(p.sections) && p.sections.length) {
      return p.sections.map((s) => ({ id: s.id, label: s.label, html: () => `<h2>${esc(s.title || s.label)}</h2>${(s.blocks || []).map((b) => block(b, p)).join("")}` }));
    }
    return [
      { id: "overview", label: "Overview", html: () => `
        <div class="p-grid">
          <div><h2>Overview</h2><p>${esc(p.tagline)}</p>
            ${p.architecture ? `<h3>Data flow</h3><div class="flow">${p.architecture.map((s) => `<span>${esc(s)}</span>`).join("<em>→</em>")}</div>` : ""}
            <h3>Built with</h3>${chips(p.stack)}
            ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}</div>
          <div>${preview(p.preview)}<p class="note" style="margin-top:6px">Recreated example with dummy data. Real company data can't be shown.</p></div>
        </div>` },
      { id: "problem", label: "Problem", html: () => `
        <h2>The problem</h2><p>${esc(p.problem)}</p>
        ${p.before ? `<div class="ba"><div class="b"><b>Before</b>${list(p.before)}</div><div class="a"><b>After</b>${list(p.after)}</div></div>` : ""}` },
      { id: "solution", label: "Solution", html: () => `
        <h2>Solution</h2><p>${esc(p.solution)}</p>
        ${p.architecture ? `<h3>Pipeline, step by step</h3><ol class="plist">${p.architecture.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}` },
      { id: "technical", label: "How it works", html: () => `<h2>How it works (technical)</h2>${list(p.tech)}` },
      { id: "testing", label: "Testing", html: () => `<h2>How it was tested / validated</h2>${list(p.testing)}` },
      { id: "outcome", label: "Outcome", html: () => `<h2>Outcome</h2>${list(p.outcomes)}` },
    ].filter((t) => t.id === "overview" || t.id === "problem" || (t.id === "solution" && p.solution) ||
      (t.id === "technical" && p.tech) || (t.id === "testing" && p.testing) || (t.id === "outcome" && p.outcomes));
  }

  function show(p, tabs, id) {
    const i = Math.max(0, tabs.findIndex((t) => t.id === id));
    const t = tabs[i];
    $("#pTabs").querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-selected", j === i));
    $("#pPanel").innerHTML = t.html();
    const prev = tabs[i - 1], next = tabs[i + 1];
    $("#pPager").innerHTML = `${prev ? `<button data-go="${prev.id}">← ${esc(prev.label)}</button>` : "<span></span>"}${next ? `<button data-go="${next.id}">${esc(next.label)} →</button>` : ""}`;
    history.replaceState(null, "", `#${t.id}`);
  }

  const id = new URLSearchParams(location.search).get("id");
  fetch("data/projects.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      const p = (d.projects || []).find((x) => x.id === id);
      if (!p) { $("#pTitle").textContent = "Project not found"; $("#pPanel").innerHTML = '<p><a href="index.html">Back to all projects</a></p>'; return; }
      document.title = `${p.title} · Sandesh K P`;
      document.body.classList.add(p.kind);
      $("#pTitle").textContent = p.title;
      $("#pTagline").textContent = p.tagline;
      $("#pMeta").innerHTML = `<span class="tag">${esc(KIND[p.kind] || p.kind)}</span><span class="status ${esc(p.status)}">${esc(STATUS[p.status] || p.status)}</span><span class="tag">${p.group === "personal" ? "Personal research" : "Work project"}</span>`;
      const tabs = tabsFor(p);
      $("#pTabs").innerHTML = tabs.map((t) => `<button role="tab" data-go="${t.id}">${esc(t.label)}</button>`).join("");
      document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-go]");
        if (b) { show(p, tabs, b.dataset.go); window.scrollTo({ top: 0, behavior: "smooth" }); }
      });
      show(p, tabs, location.hash.slice(1) || "overview");
    })
    .catch(() => { $("#pTitle").textContent = "Could not load project"; });
})();
