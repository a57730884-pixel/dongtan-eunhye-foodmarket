/* ============================================================
   첫 화면 — 사진 슬라이더 · 숫자 타일 · 연도별 그래프 · 언론 보도
   (함께한 순간들 갤러리는 js/gallery.js 에 있습니다)
   ============================================================ */
(function () {
  var F = window.FINANCE, A = window.ARCHIVE || [], O = window.ORG || {}, esc = EFM.esc;
  var years = F.years.slice().sort(function (a, b) { return a.year - b.year; });
  var last = years[years.length - 1], prev = years[years.length - 2];
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ---- 첫 화면 슬라이더 ---- */
  (function () {
    var slides = [].slice.call(document.querySelectorAll(".hero-slide")), i = 0, timer;
    var title = document.getElementById("heroTitle"), tag = document.getElementById("heroTag"), idx = document.getElementById("heroIdx");
    var cap = document.getElementById("heroCap");
    document.getElementById("heroTotal").textContent = pad2(slides.length);
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      var s = slides[i];
      title.innerHTML = esc(s.dataset.title).split("|").join("<br>");
      tag.textContent = s.dataset.tag;
      if (cap) cap.textContent = s.dataset.caption || "";
      idx.textContent = pad2(i + 1);
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { show(i + 1); }, 7000); }
    document.getElementById("heroPrev").addEventListener("click", function () { show(i - 1); auto(); });
    document.getElementById("heroNext").addEventListener("click", function () { show(i + 1); auto(); });
    var hero = document.getElementById("hero");
    hero.addEventListener("mouseenter", function () { clearInterval(timer); });
    hero.addEventListener("mouseleave", auto);
    document.addEventListener("keydown", function (e) {
      if (document.querySelector(".lb.open")) return;
      if (e.key === "ArrowRight") { show(i + 1); auto(); }
      if (e.key === "ArrowLeft") { show(i - 1); auto(); }
    });
    show(0); auto();
  })();

  /* ---- 몇 년째 ---- */
  var nth = new Date().getFullYear() - 2016 + 1;
  var bn = document.getElementById("bigYears"); if (bn) bn.innerHTML = nth + "<small>년째</small>";

  /* ---- 숫자 타일 (스크롤하면 세어 올라감) ---- */
  var totalDonated = years.reduce(function (s, y) { return s + y.donated; }, 0);
  var totalVisits = years.reduce(function (s, y) { return s + y.visits; }, 0);
  var kpis = [
    { label: years[0].year + "~" + last.year + " 누적 기부물품", val: totalDonated, unit: "won" },
    { label: "누적 이용 건수", val: totalVisits, unit: "count", suffix: "건" },
    { label: last.year + "년 이용 등록자", val: last.users, unit: "count", suffix: "명", delta: prev ? Math.round((last.users - prev.users) / prev.users * 100) : null },
    { label: last.year + "년 함께한 기탁처", val: last.donors, unit: "count", suffix: "곳", delta: prev ? Math.round((last.donors - prev.donors) / prev.donors * 100) : null }
  ];
  var row = document.getElementById("kpiRow");
  if (row) {
    row.innerHTML = kpis.map(function (k, n) {
      var d = k.delta != null ? '<div class="k-delta">전년 대비 <b class="' + (k.delta < 0 ? "down" : "") + '">' + (k.delta > 0 ? "+" : "") + k.delta + "%</b></div>" : '<div class="k-delta">' + (F.meta.sample ? '<span class="badge badge-sample">예시 수치</span>' : "기준 " + esc(EFM.fmtDate(F.meta.updated))) + "</div>";
      return '<div class="kpi' + (n === 0 ? " kpi-accent" : "") + '"><div class="k-label">' + esc(k.label) + '</div><div class="k-val" data-count="' + k.val + '" data-unit="' + k.unit + '">' +
        (k.unit === "won" ? esc(EFM.fmtWonShort(k.val)) : EFM.fmtNum(k.val)) + (k.suffix ? "<small>" + k.suffix + "</small>" : "") + "</div>" + d + "</div>";
    }).join("");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var el = en.target, target = +el.dataset.count, unit = el.dataset.unit, t0 = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - p, 3), v = target * e;
          el.firstChild.nodeValue = unit === "won" ? EFM.fmtWonShort(v) : EFM.fmtNum(v);
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: .4 });
    row.querySelectorAll(".k-val").forEach(function (el) { el.firstChild.nodeValue = el.dataset.unit === "won" ? "0원" : "0"; io.observe(el); });
  }

  /* ---- 연도별 그래프 ---- */
  if (window.Chart && document.getElementById("homeChart")) {
    EFM.chart.card({
      el: "homeChart", type: "bar", unit: "won",
      title: "연도별 기부물품 접수 · 전달 금액",
      sub: "접수한 기부물품의 평가액과 실제 이웃에게 전달한 금액",
      data: { labels: years.map(function (y) { return y.year + "년"; }), datasets: [
        { label: "접수", data: years.map(function (y) { return y.donated; }) },
        { label: "전달", data: years.map(function (y) { return y.distributed; }) }
      ] },
      rowHeader: "연도", foot: "출처: " + F.meta.basis + (F.meta.sample ? " · 화면 구성용 예시 수치" : "")
    });
  }

  /* ---- 언론 보도 ---- */
  var pl = document.getElementById("homePress");
  if (pl) {
    var press = A.filter(function (x) { return x.cat === "press"; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
    pl.innerHTML = press.map(function (it) {
      return '<li><a href="' + esc(it.url) + '" target="_blank" rel="noopener"><span class="n-date">' + esc(EFM.fmtDate(it.date)) + '</span><span class="n-title">' + esc(it.title) + '</span><span class="n-src">' + esc(it.source) + " ↗</span></a></li>";
    }).join("");
  }

  var cp = document.getElementById("ctaPhone"); if (cp && O.phone) cp.textContent = O.phone + " · 전화 한 통이면 찾아갑니다";

  /* ---- 첫 화면 정보줄 ---- */
  var fh = document.getElementById("factHours"); if (fh && O.hours) fh.textContent = O.hours.replace(/~/g, "–");
  var fp = document.getElementById("factPhone"); if (fp && O.phone) fp.textContent = O.phone;
})();
