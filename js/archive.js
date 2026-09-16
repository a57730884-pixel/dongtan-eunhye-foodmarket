/* ============================================================
   아카이브 게시판 — 분류 탭 · 검색 · 연도 · 쪽 나누기 · 본문 창
   ------------------------------------------------------------
   주소의 # 부분으로 분류를 고를 수 있습니다:
     archive.html#press · #activity · #report · #notice
     archive.html#press?id=p-2016-03-29  → 해당 글을 바로 엽니다
   ============================================================ */
(function () {
  var A = (window.ARCHIVE || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
  var esc = EFM.esc, PER = 10;
  var state = { cat: "all", q: "", year: "", page: 1 };

  var listEl = document.getElementById("boardList"), pagerEl = document.getElementById("pager"), tabsEl = document.getElementById("tabs"),
      qEl = document.getElementById("q"), yearEl = document.getElementById("year"), countEl = document.getElementById("resultCount");

  /* 연도 선택지 */
  var yearsSet = {}; A.forEach(function (x) { yearsSet[x.date.slice(0, 4)] = 1; });
  Object.keys(yearsSet).sort().reverse().forEach(function (y) { var o = document.createElement("option"); o.value = y; o.textContent = y + "년"; yearEl.appendChild(o); });

  function readHash() {
    var h = location.hash.replace("#", ""), id = null;
    if (h.indexOf("?") >= 0) { var p = h.split("?"); h = p[0]; var m = /id=([^&]+)/.exec(p[1]); if (m) id = decodeURIComponent(m[1]); }
    state.cat = ["press", "activity", "report", "notice"].indexOf(h) >= 0 ? h : "all";
    state.page = 1; render();
    if (id) { var it = A.filter(function (x) { return x.id === id; })[0]; if (it) open(it); }
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return A.filter(function (x) {
      if (state.cat !== "all" && x.cat !== state.cat) return false;
      if (state.year && x.date.slice(0, 4) !== state.year) return false;
      if (q) { var hay = (x.title + " " + (x.summary || "") + " " + (x.source || "") + " " + (x.tags || []).join(" ")).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
      return true;
    });
  }

  function render() {
    /* 탭 */
    var counts = { all: A.length }; A.forEach(function (x) { counts[x.cat] = (counts[x.cat] || 0) + 1; });
    tabsEl.innerHTML = [["all", "전체"], ["press", "언론 보도"], ["activity", "활동 소식"], ["report", "운영 실적"], ["notice", "공지사항"]].map(function (t) {
      return '<button type="button" class="tab' + (state.cat === t[0] ? " active" : "") + '" data-cat="' + t[0] + '">' + t[1] + '<span class="cnt">' + (counts[t[0]] || 0) + "</span></button>";
    }).join("");
    tabsEl.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { location.hash = b.dataset.cat === "all" ? "" : b.dataset.cat; state.cat = b.dataset.cat; state.page = 1; render(); }); });

    var items = filtered(), total = items.length, pages = Math.max(1, Math.ceil(total / PER));
    if (state.page > pages) state.page = pages;
    countEl.textContent = "총 " + total + "건";
    var slice = items.slice((state.page - 1) * PER, state.page * PER);

    if (!slice.length) { listEl.innerHTML = '<li class="empty">조건에 맞는 글이 없습니다.</li>'; }
    else listEl.innerHTML = slice.map(function (x) {
      var badge = '<span class="badge badge-' + x.cat + '">' + EFM.catLabel[x.cat] + "</span>";
      var inner = '<span class="b-cat">' + badge + (x.url ? '<span class="b-ext">원문 보기 ↗</span>' : "") + "</span>" +
        '<span><span class="b-title">' + esc(x.title) + "</span>" + (x.summary ? '<span class="b-sum">' + esc(x.summary) + "</span>" : "") + "</span>" +
        '<span class="b-meta"><b>' + esc(x.source || "") + "</b>" + esc(EFM.fmtDate(x.date)) + "</span>";
      if (x.url && !x.body) return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + inner + "</a></li>";
      return '<li><button type="button" class="row" data-id="' + esc(x.id) + '">' + inner + "</button></li>";
    }).join("");
    listEl.querySelectorAll("button.row").forEach(function (b) { b.addEventListener("click", function () { open(A.filter(function (x) { return x.id === b.dataset.id; })[0]); }); });

    /* 쪽 */
    var ph = '<button type="button" data-p="' + (state.page - 1) + '"' + (state.page <= 1 ? " disabled" : "") + ">‹</button>";
    for (var i = 1; i <= pages; i++) ph += '<button type="button" data-p="' + i + '"' + (i === state.page ? ' class="active"' : "") + ">" + i + "</button>";
    ph += '<button type="button" data-p="' + (state.page + 1) + '"' + (state.page >= pages ? " disabled" : "") + ">›</button>";
    pagerEl.innerHTML = pages > 1 ? ph : "";
    pagerEl.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { state.page = +b.dataset.p; render(); document.getElementById("boardTop").scrollIntoView({ behavior: "smooth", block: "start" }); }); });
  }

  /* 본문 창 */
  var bg = document.getElementById("modalBg");
  function open(x) {
    if (!x) return;
    document.getElementById("mTitle").textContent = x.title;
    document.getElementById("mMeta").innerHTML = '<span class="badge badge-' + x.cat + '">' + EFM.catLabel[x.cat] + "</span> " + esc(x.source || "") + " · " + esc(EFM.fmtDate(x.date)) + (x.author ? " · " + esc(x.author) : "");
    document.getElementById("mBody").innerHTML = (x.body || ("<p>" + esc(x.summary || "") + "</p>")) +
      (x.url ? '<p class="mt-3"><a class="btn btn-outline btn-sm" href="' + esc(x.url) + '" target="_blank" rel="noopener">원문 기사 보기 ↗</a></p>' : "");
    bg.classList.add("open"); document.body.classList.add("menu-lock");
  }
  function close() { bg.classList.remove("open"); document.body.classList.remove("menu-lock"); }
  bg.addEventListener("click", function (e) { if (e.target === bg) close(); });
  document.getElementById("mClose").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  qEl.addEventListener("input", function () { state.q = qEl.value; state.page = 1; render(); });
  yearEl.addEventListener("change", function () { state.year = yearEl.value; state.page = 1; render(); });
  window.addEventListener("hashchange", readHash);
  readHash();
})();
