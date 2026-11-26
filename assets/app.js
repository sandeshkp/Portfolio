// Renders the portfolio from data/projects.json (the nightly updater edits only that file).
(function () {
  const KIND = { ml: "ML / Data Science", data: "Data Engineering", app: "Web App" };
  const STATUS = { production: "In production", "in-progress": "In progress", prototype: "Prototype", research: "Research" };
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Theme toggle (remembered per browser; falls back silently if storage is blocked)
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  let projects = [];
  let filter = "all";

  function stack(list) {
    return `<div class="stack">${(list || []).map((s) => `<span>${esc(s)}</span>`).join("")}</div>`;
  }

  function renderGrid() {
    const grid = $("#grid");
    const shown = projects.filter((p) => filter === "all" || p.kind === filter);
    grid.innerHTML = shown.map((p) => `
      <button class="card" data-id="${esc(p.id)}" aria-haspopup="dialog">
        <div class="card-top">
          <span class="tag ${esc(p.kind)}">${esc(KIND[p.kind] || p.kind)}</span>
          <span class="status ${esc(p.status)}">${esc(STATUS[p.status] || p.status)}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        ${stack(p.stack)}
        <span class="more">Read case study →</span>
      </button>`).join("");
  }

  function openCase(id) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const list = (arr) => `<ul>${(arr || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    $("#dlgContent").innerHTML = `
      <div class="dlg-head">
        <div class="card-top" style="justify-content:flex-start;gap:12px">
          <span class="tag ${esc(p.kind)}">${esc(KIND[p.kind] || p.kind)}</span>
          <span class="status ${esc(p.status)}">${esc(STATUS[p.status] || p.status)}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p style="color:var(--muted)">${esc(p.summary)}</p>
        <button class="dlg-close" aria-label="Close">×</button>
      </div>
      <div class="dlg-body">
        <h4>Problem</h4><p>${esc(p.problem)}</p>
        ${p.pipeline?.length ? `<h4>Pipeline</h4><div class="pipeline">${p.pipeline.map((s) => `<span>${esc(s)}</span>`).join("<em>→</em>")}</div>` : ""}
        <h4>What I built</h4>${list(p.built)}
        ${p.ml?.length ? `<h4>Data science</h4>${list(p.ml)}` : ""}
        <h4>Outcome</h4>${list(p.outcome)}
        <h4>Stack</h4>${stack(p.stack)}
        ${p.note ? `<div class="note">${esc(p.note)}</div>` : ""}
      </div>`;
    $("#dlg").showModal();
    $(".dlg-close").focus();
  }

  document.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) return openCase(card.dataset.id);
    if (e.target.closest(".dlg-close") || e.target === $("#dlg")) $("#dlg").close();
    const f = e.target.closest(".chip-btn");
    if (f) {
      filter = f.dataset.filter;
      document.querySelectorAll(".chip-btn").forEach((b) => b.setAttribute("aria-pressed", b === f));
      renderGrid();
    }
  });

  fetch("data/projects.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      projects = d.projects || [];
      $("#updated").textContent = d.updated || "";
      $("#statProjects").textContent = projects.length;
      $("#statProd").textContent = projects.filter((p) => p.status === "production").length;
      $("#statML").textContent = projects.filter((p) => p.kind === "ml" || (p.ml && p.ml.length)).length;
      const techs = new Set(projects.flatMap((p) => p.stack || []));
      $("#statTech").textContent = techs.size;
      renderGrid();
    })
    .catch(() => { $("#grid").innerHTML = '<p class="section-sub">Projects could not be loaded.</p>'; });
})();
