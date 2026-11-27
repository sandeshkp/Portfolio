// Home page: project list from data/projects.json. Each card opens project.html?id=<id>.
(function () {
  const KIND = { ml: "ML / Research", data: "Data pipeline", app: "Web app" };
  const STATUS = { production: "In use", "in-progress": "In progress", prototype: "Prototype", research: "Research" };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const chips = (list, n) => `<div class="chips">${(list || []).slice(0, n || 99).map((s) => `<span>${esc(s)}</span>`).join("")}</div>`;

  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  let projects = [];
  let tab = location.hash === "#personal" ? "personal" : "work";

  const card = (p) => `
    <a class="card ${esc(p.kind)}" href="project.html?id=${encodeURIComponent(p.id)}">
      <div class="card-top"><span class="tag">${esc(KIND[p.kind] || p.kind)}</span><span class="status ${esc(p.status)}">${esc(STATUS[p.status] || p.status)}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.tagline)}</p>
      ${chips(p.stack, 5)}
      <span class="open">${p.group === "personal" ? "Read the research" : "Read case study"} →</span>
    </a>`;

  const CAT = { all: "All projects", analytics: "Data Analytics", engineering: "Data Engineering", webapp: "Web Applications", ml: "Machine Learning" };
  let cat = "all";
  const inCat = (p, c) => c === "all" || (p.cats || []).includes(c);

  function render() {
    const group = projects.filter((p) => (p.group || "work") === tab);
    const list = group.filter((p) => inCat(p, cat));
    $("#grid").innerHTML = list.map(card).join("") ||
      `<p class="tab-hint">No ${tab === "work" ? "work" : "personal"} projects in ${esc(CAT[cat])} yet.</p>`;
    const where = cat === "all" ? "" : ` · ${CAT[cat]}`;
    $("#hint").textContent = (tab === "work"
      ? "Projects built at work. Details are shown with dummy data only."
      : "Research I do on my own time, with a focus on testing ideas properly.") + where;
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === tab));
    document.querySelectorAll("#cats button").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.cat === cat);
      b.querySelector("small").textContent = projects.filter((p) => inCat(p, b.dataset.cat)).length;
    });
    $("#nWork").textContent = projects.filter((p) => (p.group || "work") === "work" && inCat(p, cat)).length;
    $("#nPersonal").textContent = projects.filter((p) => p.group === "personal" && inCat(p, cat)).length;
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (t) { tab = t.dataset.tab; history.replaceState(null, "", tab === "personal" ? "#personal" : "#projects"); render(); }
    const c = e.target.closest("#cats button");
    if (c) {
      cat = c.dataset.cat;
      // If the current group has nothing in this category, switch to the one that does.
      const has = (g) => projects.some((p) => (p.group || "work") === g && inCat(p, cat));
      if (!has(tab) && has(tab === "work" ? "personal" : "work")) tab = tab === "work" ? "personal" : "work";
      render();
    }
  });

  fetch("data/projects.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      projects = d.projects || [];
      const work = projects.filter((p) => (p.group || "work") === "work");
      $("#updated").textContent = d.updated || "";
      $("#statWork").textContent = work.length;
      $("#statUse").textContent = work.filter((p) => p.status === "production").length;
      $("#statML").textContent = projects.filter((p) => p.kind === "ml").length;
      $("#statTech").textContent = new Set(projects.flatMap((p) => p.stack || [])).size;
      render();
    })
    .catch(() => { $("#grid").innerHTML = '<p class="tab-hint">Projects could not be loaded.</p>'; });
})();
