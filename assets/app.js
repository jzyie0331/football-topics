(() => {
  const $ = (id) => document.getElementById(id);
  const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const state = { dates: [], day: null, tag: "全部", q: "" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const weekday = (d) => WEEK[new Date(d + "T00:00:00").getDay()];
  const fetchJSON = (url) => fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  });

  async function init() {
    try {
      const idx = await fetchJSON("data/index.json");
      state.dates = (idx.dates || []).slice().sort().reverse();
      $("updated").textContent = idx.updated ? `最近更新：${idx.updated}` : "";
    } catch (e) {
      $("updated").textContent = "读取 data/index.json 失败";
      $("empty").hidden = false;
      $("empty").textContent = "还没有数据，或者需要通过网页服务器打开（不能直接双击 html）。";
      return;
    }
    $("dateList").innerHTML = state.dates.map((d) =>
      `<li data-d="${d}"><span>${d.slice(5).replace("-", "月")}日</span><span class="wk">${weekday(d)}</span></li>`
    ).join("");
    const h = location.hash.slice(1);
    loadDay(state.dates.includes(h) ? h : state.dates[0]);
  }

  async function loadDay(date) {
    if (!date) return;
    document.querySelectorAll("#dateList li").forEach((li) =>
      li.classList.toggle("active", li.dataset.d === date));
    history.replaceState(null, "", "#" + date);
    $("sidebar").classList.remove("open");
    try {
      state.day = await fetchJSON(`data/${date}.json`);
    } catch (e) {
      state.day = { date, items: [] };
    }
    state.tag = "全部";
    const items = state.day.items || [];
    $("dayTitle").textContent = `${date} ${weekday(date)} · ${items.length} 条`;
    const tags = ["全部", ...new Set(items.flatMap((t) => t.tags || []))];
    $("tagChips").innerHTML = tags.map((t) =>
      `<button class="chip ${t === state.tag ? "active" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`
    ).join("");
    render();
  }

  function render() {
    let list = state.day.items || [];
    if (state.tag !== "全部") list = list.filter((t) => (t.tags || []).includes(state.tag));
    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter((t) => [t.title, t.content, ...(t.tags || [])].join(" ").toLowerCase().includes(q));
    }
    $("empty").hidden = list.length > 0;
    $("empty").textContent = "没有内容";
    $("list").innerHTML = list.map((t) => `
      <article class="item">
        <h3>${esc(t.title)}</h3>
        ${t.content ? `<p>${esc(t.content)}</p>` : ""}
        <div class="meta">
          ${(t.tags || []).map((g) => `<span class="tag">${esc(g)}</span>`).join("")}
          ${t.time ? `<span class="time">${esc(t.time)}</span>` : ""}
          ${(t.sources || []).map((s) =>
            `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || "来源")}</a>`).join("")}
        </div>
      </article>`).join("");
  }

  $("dateList").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) loadDay(li.dataset.d);
  });
  $("tagChips").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state.tag = c.dataset.tag;
    document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("active", x === c));
    render();
  });
  $("search").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
  $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  window.addEventListener("hashchange", () => {
    const d = location.hash.slice(1);
    if (state.dates.includes(d) && d !== state.day?.date) loadDay(d);
  });

  init();
})();
