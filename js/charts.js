/* ============================================================
   차트 공통 — Chart.js 위에 얹는 얇은 도우미
   ------------------------------------------------------------
   원칙
    · 계열이 하나면 브랜드 녹색 하나, 둘 이상이면 검증된 순서의 팔레트
      (색약·저시력 검증을 통과한 순서이므로 순서를 바꾸지 마세요)
    · 막대는 얇게(최대 24px), 데이터 끝만 둥글게, 선은 2px, 점은 8px
    · 격자는 실선 하나로 옅게, 축 테두리는 없음
    · 모든 차트는 "표로 보기" 와 마우스 올리기 설명(툴팁)을 함께 가진다
   ============================================================ */
(function () {
  window.EFM = window.EFM || {};
  var C = EFM.chart = {};

  C.palette = ["#1baf7a", "#eb6834", "#2a78d6", "#eda100", "#4a3aa7", "#e87ba4"];
  C.brand = "#1e7a4a";
  C.surface = "#ffffff";
  C.grid = "#eceeea";
  C.text = "#374151";
  C.muted = "#6b7280";

  function alpha(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  C.alpha = alpha;

  /* 값 형식 — unit: "won" | "count" | "pct" | "plain" */
  C.fmt = function (v, unit, compact) {
    if (v == null || isNaN(v)) return "-";
    if (unit === "won") return compact ? EFM.fmtWonShort(v) : EFM.fmtWon(v);
    if (unit === "pct") return (Math.round(v * 10) / 10) + "%";
    if (unit === "count") return EFM.fmtNum(v) + (compact ? "" : "");
    return Number.isInteger(v) ? EFM.fmtNum(v) : (Math.round(v * 100) / 100).toLocaleString("ko-KR");
  };

  C.setup = function () {
    if (!window.Chart || C._ready) return;
    C._ready = true;
    Chart.defaults.font.family = '"Noto Sans KR", -apple-system, "Malgun Gothic", sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = C.muted;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.boxHeight = 8;
    Chart.defaults.plugins.legend.position = "top";
    Chart.defaults.plugins.legend.align = "end";
    Chart.defaults.plugins.tooltip.backgroundColor = "#1f2a24";
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont = { weight: "600" };
    Chart.defaults.animation.duration = 500;
  };

  /* 값 하나만 골라 표시하는 끝 라벨 — 막대는 가장 큰 값, 선은 마지막 값 */
  var endLabel = {
    id: "efmEndLabel",
    afterDatasetsDraw: function (chart, args, opts) {
      if (!opts || !opts.unit) return;
      var ctx = chart.ctx; ctx.save();
      ctx.font = "600 12px 'Noto Sans KR', sans-serif"; ctx.fillStyle = C.text;
      chart.data.datasets.forEach(function (ds, i) {
        var meta = chart.getDatasetMeta(i); if (meta.hidden || !meta.data.length) return;
        var idx;
        if (chart.config.type === "line") idx = meta.data.length - 1;
        else { var max = -Infinity; ds.data.forEach(function (v, k) { if (v != null && v > max) { max = v; idx = k; } }); }
        if (idx == null) return;
        var el = meta.data[idx], v = ds.data[idx], label = C.fmt(v, opts.unit, true);
        var horizontal = chart.options.indexAxis === "y";
        if (horizontal) { ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, el.x + 6, el.y); }
        else { ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(label, el.x, el.y - 6); }
      });
      ctx.restore();
    }
  };

  function scales(unit, horizontal, stacked) {
    var valueAxis = {
      beginAtZero: true, stacked: !!stacked,
      grid: { color: C.grid, drawTicks: false }, border: { display: false },
      ticks: { padding: 8, maxTicksLimit: 6, callback: function (v) { return C.fmt(v, unit, true); } }
    };
    var catAxis = { stacked: !!stacked, grid: { display: false }, border: { display: false }, ticks: { padding: 6, autoSkip: true, maxRotation: 0 } };
    return horizontal ? { x: valueAxis, y: catAxis } : { x: catAxis, y: valueAxis };
  }

  function tooltipCb(unit) {
    return { label: function (item) { var v = item.parsed[item.chart.options.indexAxis === "y" ? "x" : "y"]; return " " + (item.dataset.label ? item.dataset.label + ": " : "") + C.fmt(v, unit); } };
  }

  /* 막대 — opts: {labels, datasets:[{label,data}], unit, horizontal, stacked, colors, endLabel}
     datasets 가 하나면 브랜드 녹색, 여럿이면 팔레트 순서대로 */
  C.bar = function (canvas, o) {
    C.setup();
    var multi = o.datasets.length > 1;
    var ds = o.datasets.map(function (d, i) {
      var color = (o.colors && o.colors[i]) || (multi ? C.palette[i % C.palette.length] : C.brand);
      return {
        label: d.label, data: d.data, backgroundColor: color, hoverBackgroundColor: alpha(color, .85),
        maxBarThickness: 24, borderRadius: 4, borderSkipped: "start",
        borderColor: o.stacked ? C.surface : undefined, borderWidth: o.stacked ? 2 : 0,
        categoryPercentage: multi ? .72 : .6, barPercentage: multi ? .85 : 1
      };
    });
    return new Chart(canvas, {
      type: "bar",
      data: { labels: o.labels, datasets: ds },
      options: {
        indexAxis: o.horizontal ? "y" : "x", responsive: true, maintainAspectRatio: false,
        layout: { padding: { top: 18, right: o.horizontal ? 64 : 8 } },
        scales: scales(o.unit, o.horizontal, o.stacked),
        plugins: {
          legend: { display: multi },
          tooltip: { mode: o.horizontal ? "nearest" : "index", intersect: false, callbacks: tooltipCb(o.unit) },
          /* 끝 라벨은 계열이 하나일 때만 — 여럿이면 라벨끼리 겹치므로 범례·툴팁·표가 값을 맡는다 */
          efmEndLabel: o.endLabel === false || o.stacked || multi ? false : { unit: o.unit }
        }
      },
      plugins: [endLabel]
    });
  };

  /* 선 — opts: {labels, datasets:[{label,data}], unit, fill} */
  C.line = function (canvas, o) {
    C.setup();
    var multi = o.datasets.length > 1;
    var ds = o.datasets.map(function (d, i) {
      var color = (o.colors && o.colors[i]) || (multi ? C.palette[i % C.palette.length] : C.brand);
      return {
        label: d.label, data: d.data, borderColor: color, backgroundColor: alpha(color, .10),
        borderWidth: 2, tension: .3, fill: !multi && o.fill !== false,
        pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: color, pointBorderColor: C.surface, pointBorderWidth: 2,
        spanGaps: true
      };
    });
    return new Chart(canvas, {
      type: "line",
      data: { labels: o.labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 18, right: 24 } },
        scales: scales(o.unit, false, false),
        plugins: {
          legend: { display: multi },
          tooltip: { callbacks: tooltipCb(o.unit) },
          efmEndLabel: o.endLabel === false || multi ? false : { unit: o.unit }
        }
      },
      plugins: [endLabel]
    });
  };

  /* 표 HTML — 차트와 같은 데이터를 표로 (접근성·투명성) */
  C.tableHTML = function (o) {
    var esc = EFM.esc, unit = o.unit, head = o.rowHeader || "구분";
    var h = '<table class="data-table"><thead><tr><th>' + esc(head) + "</th>";
    o.datasets.forEach(function (d) { h += '<th class="num">' + esc(d.label || "값") + "</th>"; });
    if (o.share && o.datasets.length === 1) h += '<th class="num">비중</th>';
    h += "</tr></thead><tbody>";
    var totals = o.datasets.map(function () { return 0; });
    var grand = o.share ? o.datasets[0].data.reduce(function (a, b) { return a + (b || 0); }, 0) : 0;
    o.labels.forEach(function (lab, r) {
      h += "<tr><td>" + esc(lab) + "</td>";
      o.datasets.forEach(function (d, i) { var v = d.data[r]; totals[i] += v || 0; h += '<td class="num">' + C.fmt(v, unit) + "</td>"; });
      if (o.share && o.datasets.length === 1) h += '<td class="num">' + (grand ? (Math.round(o.datasets[0].data[r] / grand * 1000) / 10).toFixed(1) : "0") + "%</td>";
      h += "</tr>";
    });
    h += "</tbody>";
    if (o.total !== false) {
      h += "<tfoot><tr><td>합계</td>";
      totals.forEach(function (t) { h += '<td class="num">' + C.fmt(t, unit) + "</td>"; });
      if (o.share && o.datasets.length === 1) h += '<td class="num">100%</td>';
      h += "</tr></tfoot>";
    }
    return h + "</table>";
  };

  /* 차트 카드 만들기 — 카드 요소 하나에 제목·차트·표·버튼을 모두 채운다
     card: {el, title, sub, type:"bar"|"line", data:{labels,datasets}, unit, horizontal, stacked, share, rowHeader, foot, tall} */
  C.card = function (card) {
    var el = typeof card.el === "string" ? document.getElementById(card.el) : card.el;
    if (!el) return null;
    var esc = EFM.esc, id = "c" + Math.random().toString(36).slice(2, 8);
    el.classList.add("chart-card");
    el.innerHTML =
      '<div class="cc-head"><div><h3>' + esc(card.title) + "</h3>" + (card.sub ? '<p class="cc-sub">' + esc(card.sub) + "</p>" : "") + "</div>" +
      '<div class="cc-actions"><button type="button" class="active" data-view="chart">그래프</button><button type="button" data-view="table">표</button><button type="button" data-act="png" title="그림 파일로 저장">PNG</button></div></div>' +
      '<div class="chart-box' + (card.tall ? " tall" : "") + '"><canvas id="' + id + '" role="img" aria-label="' + esc(card.title) + '"></canvas></div>' +
      '<div class="chart-table">' + C.tableHTML({ labels: card.data.labels, datasets: card.data.datasets, unit: card.unit, rowHeader: card.rowHeader, share: card.share, total: card.total }) + "</div>" +
      (card.foot ? '<p class="cc-foot"><span>' + esc(card.foot) + "</span></p>" : "");
    var canvas = el.querySelector("canvas");
    var opts = { labels: card.data.labels, datasets: card.data.datasets, unit: card.unit, horizontal: card.horizontal, stacked: card.stacked, colors: card.colors, endLabel: card.endLabel, fill: card.fill };
    var chart = card.type === "line" ? C.line(canvas, opts) : C.bar(canvas, opts);
    el.querySelectorAll(".cc-actions button[data-view]").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll(".cc-actions button[data-view]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); el.classList.toggle("show-table", b.dataset.view === "table");
      });
    });
    el.querySelector('[data-act="png"]').addEventListener("click", function () {
      var a = document.createElement("a"); a.href = chart.toBase64Image("image/png", 1); a.download = (card.title || "chart").replace(/[\\/:*?"<>|]/g, "_") + ".png"; a.click();
    });
    return chart;
  };
})();
