/* ============================================================
   첫 화면 — 숫자 카드 · 최근 소식 · 연도별 그래프 · 연혁 요약
   ============================================================ */
(function () {
  var F = window.FINANCE, A = window.ARCHIVE || [], H = window.HISTORY || [], esc = EFM.esc;
  var years = F.years.slice().sort(function (a, b) { return a.year - b.year; });
  var last = years[years.length - 1], prev = years[years.length - 2];

  /* ---- 히어로 신뢰 카드 ---- */
  var tc = document.getElementById("trustCard");
  if (tc) {
    tc.innerHTML =
      "<h3>" + last.year + "년 한 해, 숫자로 보는 나눔" + (F.meta.sample ? ' <span class="badge badge-sample">예시</span>' : "") + "</h3>" +
      '<div class="tc-row"><span class="tc-label">기부물품 접수</span><span class="tc-val">' + esc(EFM.fmtWonShort(last.donated)) + "</span></div>" +
      '<div class="tc-row"><span class="tc-label">이웃에게 전달</span><span class="tc-val">' + esc(EFM.fmtWonShort(last.distributed)) + "</span></div>" +
      '<div class="tc-row"><span class="tc-label">이용 등록 가구</span><span class="tc-val">' + EFM.fmtNum(last.households) + "<small>가구</small></span></div>" +
      '<div class="tc-row"><span class="tc-label">함께한 기탁처</span><span class="tc-val">' + EFM.fmtNum(last.donors) + "<small>곳</small></span></div>" +
      '<p class="tc-foot">기준: ' + esc(F.meta.basis) + " · " + esc(EFM.fmtDate(F.meta.updated)) + ' 갱신 · <a href="transparency.html">전체 통계 보기</a></p>';
  }

  /* ---- 누적 숫자 (스크롤하면 세어 올라감) ---- */
  var totalDonated = years.reduce(function (s, y) { return s + y.donated; }, 0);
  var totalVisits = years.reduce(function (s, y) { return s + y.visits; }, 0);
  var since = 2016, nth = new Date().getFullYear() - since + 1;
  var kpis = [
    { label: "누적 기부물품 (" + years[0].year + "~" + last.year + ")", val: totalDonated, unit: "won" },
    { label: "누적 이용 건수", val: totalVisits, unit: "count", suffix: "건" },
    { label: last.year + "년 이용 등록자", val: last.users, unit: "count", suffix: "명",
      delta: prev ? Math.round((last.users - prev.users) / prev.users * 100) : null },
    { label: "동탄에서 나눔을 이어온 지", val: nth, unit: "count", suffix: "년째", prefix: since + "년부터 " }
  ];
  var row = document.getElementById("kpiRow");
  if (row) {
    row.innerHTML = kpis.map(function (k, i) {
      var d = k.delta != null ? '<div class="k-delta">전년 대비 <b class="' + (k.delta < 0 ? "down" : "") + '">' + (k.delta > 0 ? "+" : "") + k.delta + "%</b></div>" : (k.prefix ? '<div class="k-delta">' + esc(k.prefix) + "</div>" : "");
      return '<div class="kpi' + (i === 0 ? " kpi-accent" : "") + '"><div class="k-label">' + esc(k.label) + '</div><div class="k-val" data-count="' + k.val + '" data-unit="' + k.unit + '">' +
        (k.unit === "won" ? esc(EFM.fmtWonShort(k.val)) : EFM.fmtNum(k.val)) + (k.suffix ? "<small>" + k.suffix + "</small>" : "") + "</div>" + d + "</div>";
    }).join("");
    /* 세어 올라가는 효과 */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var el = en.target, target = +el.dataset.count, unit = el.dataset.unit, small = el.querySelector("small"), t0 = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - p, 3), v = target * e;
          el.firstChild.nodeValue = unit === "won" ? EFM.fmtWonShort(v) : EFM.fmtNum(v);
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        if (small) el.appendChild(small);
      });
    }, { threshold: .4 });
    row.querySelectorAll(".k-val").forEach(function (el) { el.firstChild.nodeValue = el.dataset.unit === "won" ? "0원" : "0"; io.observe(el); });
  }

  /* ---- 최근 소식 ---- */
  function list(items, elId) {
    var el = document.getElementById(elId); if (!el) return;
    if (!items.length) { el.innerHTML = '<li class="muted small">아직 등록된 글이 없습니다.</li>'; return; }
    el.innerHTML = items.map(function (it) {
      var href = it.url ? it.url : "archive.html#" + it.cat + "?id=" + it.id;
      var ext = it.url ? ' target="_blank" rel="noopener"' : "";
      return "<li><a href=\"" + esc(href) + '"' + ext + '><span class="n-title"><span class="n-src">' + esc(it.source || EFM.catLabel[it.cat]) + "</span>" + esc(it.title) + '</span><span class="n-date">' + esc(EFM.fmtDate(it.date)) + "</span></a></li>";
    }).join("");
  }
  var sorted = A.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  list(sorted.filter(function (x) { return x.cat === "press"; }).slice(0, 5), "homePress");
  list(sorted.filter(function (x) { return x.cat !== "press"; }).slice(0, 5), "homeNews");

  /* ---- 연도별 그래프 ---- */
  if (window.Chart && document.getElementById("homeChart")) {
    EFM.chart.card({
      el: "homeChart", type: "bar", unit: "won",
      title: "연도별 기부물품 접수 · 전달 금액",
      sub: "접수한 기부물품의 평가액과 실제 이웃에게 전달한 금액을 해마다 비교합니다.",
      data: { labels: years.map(function (y) { return y.year + "년"; }), datasets: [
        { label: "접수", data: years.map(function (y) { return y.donated; }) },
        { label: "전달", data: years.map(function (y) { return y.distributed; }) }
      ] },
      rowHeader: "연도", foot: "출처: " + F.meta.basis + (F.meta.sample ? " · 화면 구성용 예시 수치" : "")
    });
  }

  /* ---- 연혁 요약 (최근 4건) ---- */
  var hl = document.getElementById("homeHistory");
  if (hl) {
    hl.innerHTML = H.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4).map(function (h) {
      return '<li><span class="t-date">' + esc(EFM.fmtDate(h.date)) + '</span><span class="badge t-tag">' + esc(h.tag) + "</span><h3>" + esc(h.title) + "</h3><p>" + esc(h.desc) + "</p></li>";
    }).join("");
  }
})();
