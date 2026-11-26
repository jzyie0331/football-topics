(() => {
  const $ = (id) => document.getElementById(id);
  const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const CHANNELS = [
    { id: "全部", cls: "" },
    { id: "名宿谈巨星", cls: "ch-legend" },
    { id: "球星专访", cls: "ch-talk" },
    { id: "梅罗对比", cls: "ch-ml" },
    { id: "互怼与争议", cls: "ch-drama" },
    { id: "花边与恋情", cls: "ch-gossip" },
    { id: "场外与趣闻", cls: "ch-off" },
  ];
  const CH_CLS = Object.fromEntries(CHANNELS.map((c) => [c.id, c.cls]));
  const state = { dates: [], day: null, channel: "全部", q: "" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const weekday = (d) => WEEK[new Date(d + "T00:00:00").getDay()];
  const fetchJSON = (url) => fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  });

  // 兼容旧数据：如果没有 channel 字段或用了旧频道名，自动归类
  function getChannel(item) {
    if (item.channel && CH_CLS[item.channel]) return item.channel;
    const text = [item.title, item.quote, ...(item.tags || [])].join(" ");
    if (/女友|男友|恋情|绯闻|分手|离婚|出轨|约会|妻子|老婆|模特|网红|结婚|求婚|派对|夜店/.test(text)) {
      return "花边与恋情";
    }
    if (/谈|评价|盛赞|称赞|高度赞扬|表示|透露/.test(text) && /梅西|C罗|内马尔|哈兰德|姆巴佩|亚马尔|贝林厄姆|维尼修斯/.test(text)) {
      return "名宿谈巨星";
    }
    if (/C罗.*梅西|梅西.*C罗|梅罗/.test(text)) return "梅罗对比";
    if (/质疑|回怼|炮轰|批评|吐槽|怒了|冲突|矛盾|指责|争议/.test(text)) return "互怼与争议";
    if (/采访|回应|计划|表态|自述/.test(text)) return "球星专访";
    return "场外与趣闻";
  }

  function isHot(item) {
    return Boolean(item.hot) || (item.tags || []).includes("热搜");
  }

  async function init() {
    try {
      const idx = await fetchJSON("data/index.json");
      state.dates = (idx.dates || []).slice().sort().reverse();
      $("updated").textContent = idx.updated ? `更新于 ${idx.updated}` : "";
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
      const data = await fetchJSON(`data/${date}.json`);
      const items = (data.items || []).map((t) => ({
        ...t,
        _ch: getChannel(t),
        _hot: isHot(t),
      }));
      state.day = { date, items };
    } catch (e) {
      state.day = { date, items: [] };
    }
    state.channel = "全部";
    $("dayTitle").textContent = `${date} ${weekday(date)}`;
    renderChannels();
    render();
  }

  function renderChannels() {
    const items = state.day.items || [];
    const counts = { "全部": items.length };
    items.forEach((t) => { counts[t._ch] = (counts[t._ch] || 0) + 1; });
    $("channelBar").innerHTML = CHANNELS.map((c) => {
      const n = counts[c.id] || 0;
      return `<button class="ch-tab ${c.id === state.channel ? "active" : ""}" data-ch="${esc(c.id)}">
        ${esc(c.id)}<span class="cnt">${n}</span>
      </button>`;
    }).join("");
  }

  function render() {
    let list = state.day.items || [];
    if (state.channel !== "全部") list = list.filter((t) => t._ch === state.channel);
    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter((t) =>
        [t.title, t.quote, t.content, t._ch, ...(t.tags || [])].join(" ").toLowerCase().includes(q));
    }
    $("dayCount").textContent = `共 ${list.length} 条`;
    $("empty").hidden = list.length > 0;
    $("list").innerHTML = list.map((t) => {
      const cleanTags = (t.tags || []).filter((g) => g !== t._ch && g !== "热搜").slice(0, 3);
      return `
      <article class="card ${t._hot ? "hot" : ""}">
        <div class="card-top">
          <span class="ch-badge ${CH_CLS[t._ch] || ""}">${esc(t._ch)}</span>
          ${t._hot ? `<span class="hot-badge">热</span>` : ""}
          ${t.time ? `<span class="time">${esc(t.time.replace(/^\d{4}-/, ""))}</span>` : ""}
        </div>
        ${t.image ? `<img class="card-img" src="${esc(t.image)}" alt="" loading="lazy" onerror="this.remove()" />` : ""}
        <h3>${esc(t.title)}</h3>
        ${t.quote ? `<blockquote class="quote">“${esc(t.quote)}”</blockquote>` : ""}
        ${t.content ? `<p>${esc(t.content)}</p>` : ""}
        <div class="card-foot">
          <div class="tags">${cleanTags.map((g) => `<span class="tag">${esc(g)}</span>`).join("")}</div>
          <div class="sources">${(t.sources || []).map((s) =>
            `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || "来源")}</a>`).join("")}</div>
        </div>
      </article>`;
    }).join("");
  }

  $("dateList").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) loadDay(li.dataset.d);
  });
  $("channelBar").addEventListener("click", (e) => {
    const btn = e.target.closest(".ch-tab");
    if (!btn) return;
    state.channel = btn.dataset.ch;
    document.querySelectorAll(".ch-tab").forEach((x) => x.classList.toggle("active", x === btn));
    render();
  });
  $("search").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
  $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("list").addEventListener("click", (e) => {
    const img = e.target.closest(".card-img");
    if (!img) return;
    $("lightboxImg").src = img.src;
    $("lightbox").hidden = false;
  });
  $("lightbox").addEventListener("click", () => { $("lightbox").hidden = true; });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $("lightbox").hidden = true;
  });
  window.addEventListener("hashchange", () => {
    const d = location.hash.slice(1);
    if (state.dates.includes(d) && d !== state.day?.date) loadDay(d);
  });

  init();
})();
