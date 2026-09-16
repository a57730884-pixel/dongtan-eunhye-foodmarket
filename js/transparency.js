/* ============================================================
   투명 공개 — 회계·운영 통계를 그래프와 표로
   데이터: data/finance.js (window.FINANCE)
   ============================================================ */
(function () {
  var F = window.FINANCE, esc = EFM.esc, C = EFM.chart;
  var years = F.years.slice().sort(function (a, b) { return a.year - b.year; });
  var last = years[years.length - 1], prev = years[years.length - 2];
  var srcFoot = "출처: " + F.meta.basis + (F.meta.sample ? " · 화면 구성용 예시 수치" : "");

  /* 예시 데이터 띠 */
  if (F.meta.sample) {
    var b = document.getElementById("sampleBanner");
    if (b) { b.hidden = false; }
  }
  document.querySelectorAll("[data-updated]").forEach(function (el) { el.textContent = EFM.fmtDate(F.meta.updated); });
  document.querySelectorAll("[data-basis]").forEach(function (el) { el.textContent = F.meta.basis; });
  document.querySelectorAll("[data-note]").forEach(function (el) { el.textContent = F.meta.note; });
  document.querySelectorAll("[data-year-last]").forEach(function (el) { el.textContent = last.year; });

  /* ---- 요약 타일 ---- */
  function delta(a, b) { if (!b) return ""; var d = Math.round((a - b) / b * 1000) / 10; return '<div class="k-delta">' + prev.year + "년 대비 <b" + (d < 0 ? ' class="down"' : "") + ">" + (d > 0 ? "+" : "") + d + "%</b></div>"; }
  var k = document.getElementById("kpiRow");
  if (k) k.innerHTML =
    '<div class="kpi kpi-accent"><div class="k-label">' + last.year + '년 기부물품 접수</div><div class="k-val">' + esc(EFM.fmtWonShort(last.donated)) + "</div>" + delta(last.donated, prev && prev.donated) + "</div>" +
    '<div class="kpi"><div class="k-label">' + last.year + '년 이웃에게 전달</div><div class="k-val">' + esc(EFM.fmtWonShort(last.distributed)) + "</div>" + '<div class="k-delta">접수 대비 전달률 <b>' + Math.round(last.distributed / last.donated * 1000) / 10 + "%</b></div></div>" +
    '<div class="kpi"><div class="k-label">이용 등록자 / 가구</div><div class="k-val">' + EFM.fmtNum(last.users) + "<small>명</small> / " + EFM.fmtNum(last.households) + "<small>가구</small></div>" + delta(last.users, prev && prev.users) + "</div>" +
    '<div class="kpi"><div class="k-label">기탁처 / 지원 시설·단체</div><div class="k-val">' + EFM.fmtNum(last.donors) + "<small>곳</small> / " + EFM.fmtNum(last.agencies) + "<small>곳</small></div>" + delta(last.donors, prev && prev.donors) + "</div>";

  /* ---- 연도별 실적 표 ---- */
  var yt = document.getElementById("yearsTable");
  if (yt) {
    var h = '<table class="data-table"><thead><tr><th>연도</th><th class="num">기부물품 접수(원)</th><th class="num">이웃에게 전달(원)</th><th class="num">전달률</th><th class="num">기탁처</th><th class="num">이용 등록자</th><th class="num">이용 가구</th><th class="num">이용 건수</th><th class="num">지원 시설·단체</th></tr></thead><tbody>';
    years.forEach(function (y) {
      h += "<tr><td>" + y.year + '년</td><td class="num">' + EFM.fmtNum(y.donated) + '</td><td class="num">' + EFM.fmtNum(y.distributed) + '</td><td class="num">' + (Math.round(y.distributed / y.donated * 1000) / 10) + '%</td><td class="num">' + EFM.fmtNum(y.donors) + '</td><td class="num">' + EFM.fmtNum(y.users) + '</td><td class="num">' + EFM.fmtNum(y.households) + '</td><td class="num">' + EFM.fmtNum(y.visits) + '</td><td class="num">' + EFM.fmtNum(y.agencies) + "</td></tr>";
    });
    var td = years.reduce(function (s, y) { return s + y.donated; }, 0), tdd = years.reduce(function (s, y) { return s + y.distributed; }, 0), tv = years.reduce(function (s, y) { return s + y.visits; }, 0);
    h += '</tbody><tfoot><tr><td>합계</td><td class="num">' + EFM.fmtNum(td) + '</td><td class="num">' + EFM.fmtNum(tdd) + '</td><td class="num">' + (Math.round(tdd / td * 1000) / 10) + '%</td><td class="num">-</td><td class="num">-</td><td class="num">-</td><td class="num">' + EFM.fmtNum(tv) + '</td><td class="num">-</td></tr></tfoot></table>';
    yt.innerHTML = h;
  }

  if (!window.Chart) return;
  var yl = years.map(function (y) { return y.year + "년"; });

  /* ---- 기부물품 ---- */
  C.card({ el: "chYears", type: "bar", unit: "won", title: "연도별 기부물품 접수 · 전달 금액", sub: "접수한 기부물품 평가액과 이웃에게 전달한 금액",
    data: { labels: yl, datasets: [{ label: "접수", data: years.map(function (y) { return y.donated; }) }, { label: "전달", data: years.map(function (y) { return y.distributed; }) }] }, rowHeader: "연도", foot: srcFoot });

  var M = F.monthly, ml = M.rows.map(function (r) { return r.m + "월"; });
  C.card({ el: "chMonthly", type: "line", unit: "won", title: M.year + "년 월별 접수 · 전달 추이", sub: "올해 진행 중인 실적 (매월 갱신)",
    data: { labels: ml, datasets: [{ label: "접수", data: M.rows.map(function (r) { return r.donated; }) }, { label: "전달", data: M.rows.map(function (r) { return r.distributed; }) }] }, rowHeader: "월", foot: srcFoot });

  var cat = F.categories.rows.slice().sort(function (a, b) { return b.value - a.value; });
  C.card({ el: "chCategories", type: "bar", horizontal: true, unit: "won", share: true, title: F.categories.year + "년 기부물품 유형별 금액", sub: "어떤 물품이 얼마나 들어왔는지",
    data: { labels: cat.map(function (r) { return r.name; }), datasets: [{ label: "금액", data: cat.map(function (r) { return r.value; }) }] }, rowHeader: "유형", foot: srcFoot, tall: true });

  var dt = F.donorTypes.rows.slice().sort(function (a, b) { return b.value - a.value; });
  C.card({ el: "chDonorTypes", type: "bar", horizontal: true, unit: "won", share: true, title: F.donorTypes.year + "년 기탁처 유형별 금액", sub: "누가 나눔에 함께했는지",
    data: { labels: dt.map(function (r) { return r.name; }), datasets: [{ label: "금액", data: dt.map(function (r) { return r.value; }) }] }, rowHeader: "기탁처 유형", foot: srcFoot, tall: true });

  /* ---- 이용 현황 ---- */
  C.card({ el: "chUsers", type: "bar", unit: "count", title: "연도별 이용 등록자 · 가구", sub: "연말 기준 등록 인원과 가구 수",
    data: { labels: yl, datasets: [{ label: "이용 등록자(명)", data: years.map(function (y) { return y.users; }) }, { label: "이용 가구", data: years.map(function (y) { return y.households; }) }] }, rowHeader: "연도", foot: srcFoot });
  C.card({ el: "chVisits", type: "bar", unit: "count", title: "연도별 이용 건수", sub: "푸드마켓 방문 · 푸드뱅크 배분 · 그냥드림 이용을 모두 합한 건수",
    data: { labels: yl, datasets: [{ label: "이용 건수", data: years.map(function (y) { return y.visits; }) }] }, rowHeader: "연도", foot: srcFoot });
  C.card({ el: "chGnd", type: "line", unit: "count", title: M.year + "년 월별 이용 건수와 그냥드림 이용", sub: "그냥드림 코너는 " + M.year + "년 1월부터 운영",
    data: { labels: ml, datasets: [{ label: "전체 이용 건수", data: M.rows.map(function (r) { return r.visits; }) }, { label: "그냥드림 이용", data: M.rows.map(function (r) { return r.gnd; }) }] }, rowHeader: "월", foot: srcFoot });

  /* ---- 재정 결산 ---- */
  var B = F.budget, inc = B.income, exp = B.expense;
  var incT = inc.reduce(function (s, r) { return s + r.value; }, 0), expT = exp.reduce(function (s, r) { return s + r.value; }, 0);
  C.card({ el: "chIncome", type: "bar", horizontal: true, unit: "won", share: true, title: B.year + "년 수입 구성", sub: "총 수입 " + EFM.fmtWonShort(incT),
    data: { labels: inc.map(function (r) { return r.name; }), datasets: [{ label: "금액", data: inc.map(function (r) { return r.value; }) }] }, rowHeader: "수입 항목", foot: srcFoot });
  C.card({ el: "chExpense", type: "bar", horizontal: true, unit: "won", share: true, title: B.year + "년 지출 구성", sub: "총 지출 " + EFM.fmtWonShort(expT),
    data: { labels: exp.map(function (r) { return r.name; }), datasets: [{ label: "금액", data: exp.map(function (r) { return r.value; }) }] }, rowHeader: "지출 항목", foot: srcFoot, colors: ["#eb6834"] });

  var bt = document.getElementById("budgetTable");
  if (bt) {
    var rowsHtml = function (arr, total) { return arr.map(function (r) { return "<tr><td>" + esc(r.name) + '</td><td class="num">' + EFM.fmtNum(r.value) + '</td><td class="num">' + (Math.round(r.value / total * 1000) / 10) + "%</td></tr>"; }).join(""); };
    bt.innerHTML =
      '<div class="two-col">' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>수입</th><th class="num">금액(원)</th><th class="num">비중</th></tr></thead><tbody>' + rowsHtml(inc, incT) + '</tbody><tfoot><tr><td>수입 합계</td><td class="num">' + EFM.fmtNum(incT) + '</td><td class="num">100%</td></tr></tfoot></table></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>지출</th><th class="num">금액(원)</th><th class="num">비중</th></tr></thead><tbody>' + rowsHtml(exp, expT) + '</tbody><tfoot><tr><td>지출 합계</td><td class="num">' + EFM.fmtNum(expT) + '</td><td class="num">100%</td></tr></tfoot></table></div>' +
      "</div>" +
      '<p class="callout mt-3"><b>' + B.year + "년 수지 차액: " + esc(EFM.fmtWon(incT - expT)) + "</b> (수입 " + esc(EFM.fmtWon(incT)) + " − 지출 " + esc(EFM.fmtWon(expT)) + ") · 차액은 다음 해 이월되어 사업비로 씁니다.</p>";
  }

  /* ---- 공개 문서 ---- */
  var dl = document.getElementById("docList");
  if (dl) dl.innerHTML = (F.documents || []).map(function (d) {
    return "<li>" + (d.file ? '<a href="' + esc(d.file) + '" target="_blank" rel="noopener">' + esc(d.title) + " ↗</a>" : esc(d.title) + ' <span class="badge">준비 중</span>') + "</li>";
  }).join("") || '<li class="muted">등록된 문서가 없습니다.</li>';
})();
