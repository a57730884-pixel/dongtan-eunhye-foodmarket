/* ============================================================
   데이터 분석 — 엑셀(.xlsx/.xls/.csv)을 끌어다 놓으면
   열의 성격(날짜·숫자·범주·글)을 스스로 알아내어
   요약 숫자 · 시계열 그래프 · 범주별 그래프 · 피벗 표 · 원본 표를 만든다.
   ------------------------------------------------------------
   · 파일은 브라우저 안에서만 읽습니다. 서버로 보내지 않습니다.
   · SheetJS(xlsx)로 읽고, Chart.js로 그립니다(js/charts.js 도우미 사용).
   ============================================================ */
(function () {
  var esc = EFM.esc, C = EFM.chart;
  var state = { wb: null, sheet: "", header: [], rows: [], cols: [], charts: [], fileName: "", sort: { col: -1, dir: 1 } };

  var dz = document.getElementById("dropzone"), input = document.getElementById("fileInput"), panel = document.getElementById("analysis");
  var sheetSel = document.getElementById("sheetSelect"), fileNameEl = document.getElementById("fileName"), chipsEl = document.getElementById("colChips");
  var summaryEl = document.getElementById("summaryGrid"), chartsEl = document.getElementById("chartsGrid"), rawEl = document.getElementById("rawTable"), rawInfo = document.getElementById("rawInfo");
  var pvRow = document.getElementById("pvRow"), pvSplit = document.getElementById("pvSplit"), pvMeasure = document.getElementById("pvMeasure"), pvAgg = document.getElementById("pvAgg"), pvTable = document.getElementById("pivotTable"), pvChartEl = document.getElementById("pivotChart");
  var pivotChart = null;

  /* ---------- 파일 받기 ---------- */
  ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("over"); }); });
  /* 화면 다른 곳에 떨어뜨렸을 때 브라우저가 파일을 열어 버리지 않도록 */
  document.addEventListener("dragover", function (e) { e.preventDefault(); });
  document.addEventListener("drop", function (e) { e.preventDefault(); if (e.target !== dz && !dz.contains(e.target)) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handleFile(f); } });
  dz.addEventListener("drop", function (e) { var f = e.dataTransfer.files[0]; if (f) handleFile(f); });
  dz.addEventListener("click", function () { input.click(); });
  dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  input.addEventListener("change", function () { if (input.files[0]) handleFile(input.files[0]); input.value = ""; });

  var demoBtn = document.getElementById("demoBtn");
  if (demoBtn) demoBtn.addEventListener("click", function () {
    var url = demoBtn.dataset.file;
    demoBtn.disabled = true; demoBtn.textContent = "불러오는 중…";
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (buf) { loadWorkbook(buf, decodeURIComponent(url.split("/").pop())); })
      .catch(function () { alert("예시 파일을 불러오지 못했습니다. 파일을 직접 끌어다 놓아 주세요.\n(파일을 더블클릭해 연 경우에는 예시 불러오기가 동작하지 않습니다 — 로컬 서버나 배포된 주소에서 열어 주세요.)"); })
      .finally(function () { demoBtn.disabled = false; demoBtn.textContent = "예시 파일로 체험하기"; });
  });

  function handleFile(file) {
    if (!/\.(xlsx|xlsm|xls|csv|tsv)$/i.test(file.name)) { alert("엑셀(.xlsx, .xls) 또는 CSV 파일만 올릴 수 있습니다."); return; }
    var fr = new FileReader();
    fr.onload = function (e) { loadWorkbook(e.target.result, file.name); };
    fr.onerror = function () { alert("파일을 읽지 못했습니다."); };
    fr.readAsArrayBuffer(file);
  }

  function loadWorkbook(buf, name) {
    /* cellDates 를 끄고(시간대 오차 방지) 날짜 서식 칸은 sheetToAoa 에서 연·월·일로 직접 바꾼다 */
    try { state.wb = XLSX.read(buf, { type: "array", cellDates: false, cellNF: true }); }
    catch (err) { alert("엑셀 파일을 해석하지 못했습니다: " + err.message); return; }
    state.fileName = name; fileNameEl.textContent = name;
    sheetSel.innerHTML = state.wb.SheetNames.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + "</option>"; }).join("");
    panel.classList.add("ready");
    loadSheet(state.wb.SheetNames[0]);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  sheetSel.addEventListener("change", function () { loadSheet(sheetSel.value); });

  /* ---------- 표 읽기 · 열 성격 알아내기 ---------- */
  function isEmpty(v) { return v == null || (typeof v === "string" && v.trim() === ""); }
  function parseNumber(v) {
    if (typeof v === "number") return isFinite(v) ? v : NaN;
    if (v instanceof Date) return NaN;
    if (typeof v !== "string") return NaN;
    var s = v.replace(/[,\s₩원$]/g, "").replace(/^\((.*)\)$/, "-$1");
    if (s === "" || s === "-") return NaN;
    if (/^-?\d+(\.\d+)?%$/.test(s)) return parseFloat(s);
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function parseDate(v) {
    if (v instanceof Date) return isNaN(v) ? null : v;
    if (typeof v === "number" && v > 20000 && v < 80000 && Number.isInteger(v)) { var p = XLSX.SSF.parse_date_code(v); return p ? new Date(p.y, p.m - 1, p.d) : null; }
    if (typeof v !== "string") return null;
    var s = v.trim(), m = /^(\d{4})\s*[-./년]\s*(\d{1,2})(?:\s*[-./월]\s*(\d{1,2}))?\s*일?/.exec(s);
    if (m) { var d = new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1); return isNaN(d) ? null : d; }
    m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return null;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dateKey(d, gran) { if (gran === "year") return d.getFullYear() + "년"; if (gran === "month") return d.getFullYear() + "-" + pad(d.getMonth() + 1); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  /* 시트 → 2차원 배열. 날짜 서식 칸은 시간대 영향 없이 연·월·일만 뽑아 Date 로 만든다 */
  function sheetToAoa(ws) {
    var ref = ws["!ref"]; if (!ref) return [];
    var range = XLSX.utils.decode_range(ref), out = [];
    for (var R = range.s.r; R <= range.e.r; R++) {
      var row = [];
      for (var Cc = range.s.c; Cc <= range.e.c; Cc++) {
        var cell = ws[XLSX.utils.encode_cell({ r: R, c: Cc })], v = null;
        if (cell && cell.t !== "e") {
          if (cell.t === "d" && cell.v instanceof Date) v = new Date(cell.v.getFullYear(), cell.v.getMonth(), cell.v.getDate());
          else if (cell.t === "n" && cell.z && XLSX.SSF.is_date(cell.z)) { var p = XLSX.SSF.parse_date_code(cell.v); v = p ? new Date(p.y, p.m - 1, p.d) : cell.v; }
          else v = cell.v;
        }
        row.push(v);
      }
      out.push(row);
    }
    return out;
  }

  function loadSheet(name) {
    state.sheet = name;
    var ws = state.wb.Sheets[name];
    var aoa = sheetToAoa(ws);
    aoa = aoa.filter(function (r) { return r.some(function (v) { return !isEmpty(v); }); });
    if (!aoa.length) { alert("비어 있는 시트입니다."); return; }
    /* 머리글 줄: 글자 칸이 둘 이상이고 그 줄의 칸 대부분이 글자인 첫 줄 */
    var hi = 0;
    for (var i = 0; i < Math.min(aoa.length, 15); i++) {
      var r = aoa[i], nonEmpty = r.filter(function (v) { return !isEmpty(v); }), strs = nonEmpty.filter(function (v) { return typeof v === "string" && isNaN(parseNumber(v)) && !parseDate(v); });
      if (nonEmpty.length >= 2 && strs.length >= Math.max(2, nonEmpty.length * .6)) { hi = i; break; }
    }
    var width = Math.max.apply(null, aoa.map(function (r) { return r.length; }));
    var seen = {};
    state.header = [];
    for (var j = 0; j < width; j++) {
      var h = aoa[hi][j]; h = isEmpty(h) ? "열" + (j + 1) : String(h).trim();
      if (h instanceof Date) h = dateKey(h, "day");
      var base = h, n = 2; while (seen[h]) { h = base + " (" + (n++) + ")"; } seen[h] = 1;
      state.header.push(h);
    }
    state.rows = aoa.slice(hi + 1).map(function (r) { var o = []; for (var j = 0; j < width; j++) o.push(j < r.length ? r[j] : null); return o; });
    /* 완전히 비어 있는 열 제거 */
    var keep = state.header.map(function (_, j) { return state.rows.some(function (r) { return !isEmpty(r[j]); }); });
    state.header = state.header.filter(function (_, j) { return keep[j]; });
    state.rows = state.rows.map(function (r) { return r.filter(function (_, j) { return keep[j]; }); });
    state.cols = state.header.map(inferColumn);
    state.sort = { col: -1, dir: 1 };
    render();
  }

  function inferColumn(name, j) {
    var vals = state.rows.map(function (r) { return r[j]; }).filter(function (v) { return !isEmpty(v); });
    var n = vals.length || 1, nums = 0, dates = 0, uniq = {};
    vals.forEach(function (v) { if (!isNaN(parseNumber(v))) nums++; if (parseDate(v) && (v instanceof Date || typeof v === "string" || (typeof v === "number" && /날짜|일자|date|일시|년월|월$/i.test(name)))) dates++; uniq[typeof v === "string" ? v.trim() : String(v)] = 1; });
    var u = Object.keys(uniq).length, type;
    var looksDateName = /날짜|일자|date|일시|년월|기간/i.test(name);
    if (dates >= n * .8 && (vals[0] instanceof Date || typeof vals[0] === "string" || looksDateName)) type = "date";
    else if (nums >= n * .8 && !(u <= 12 && /구분|유형|분류|종류|코드|동$|월$/.test(name))) type = "number";
    else if (u <= Math.max(30, n * .05) && u <= n * .6 && u >= 1) type = "category";
    else type = "text";
    var col = { name: name, index: j, type: type, unique: u, count: vals.length };
    if (type === "number") {
      var arr = vals.map(parseNumber).filter(function (x) { return !isNaN(x); });
      col.sum = arr.reduce(function (a, b) { return a + b; }, 0); col.min = Math.min.apply(null, arr); col.max = Math.max.apply(null, arr); col.mean = arr.length ? col.sum / arr.length : 0;
      /* 금액 성격 — "인원·직원·회원"의 '원'은 돈이 아니므로 뺀다 */
      col.money = /금액|비용|매출|수입|지출|가격|단가|평가액|총액|후원금|보조금|₩|\(원\)|원\)|원$/.test(name) && !/인원|직원|회원|정원|병원|가구원|구성원|단원/.test(name);
      /* 단가·비율·평균처럼 더해서는 안 되는 열 — 자동 그래프의 합계에서 뺀다 */
      col.rate = /단가|가격|비율|율$|평균|퍼센트|%/.test(name);
      col.score = (/금액|합계|총액|총계|total|amount/i.test(name) ? 3 : 0) + (col.money ? 1 : 0);
    }
    if (type === "date") {
      var ds = vals.map(parseDate).filter(Boolean).sort(function (a, b) { return a - b; });
      col.minDate = ds[0]; col.maxDate = ds[ds.length - 1];
      var span = (col.maxDate - col.minDate) / 864e5;
      col.gran = span <= 62 ? "day" : span <= 1100 ? "month" : "year";
    }
    return col;
  }

  /* ---------- 집계 도우미 ---------- */
  function groupSum(keyFn, valFn) {
    var m = {}, order = [];
    state.rows.forEach(function (r) {
      var k = keyFn(r); if (k == null) return;
      var v = valFn ? valFn(r) : 1; if (v == null || isNaN(v)) return;
      if (!(k in m)) { m[k] = { sum: 0, n: 0, min: Infinity, max: -Infinity }; order.push(k); }
      m[k].sum += v; m[k].n++; if (v < m[k].min) m[k].min = v; if (v > m[k].max) m[k].max = v;
    });
    return { map: m, keys: order };
  }
  function numVal(col) { return function (r) { var v = parseNumber(r[col.index]); return isNaN(v) ? null : v; }; }
  function catKey(col) { return function (r) { var v = r[col.index]; return isEmpty(v) ? null : String(v).trim(); }; }
  function dateKeyFn(col, gran) { return function (r) { var d = parseDate(r[col.index]); return d ? dateKey(d, gran || col.gran) : null; }; }
  function topN(keys, valueOf, n) {
    var arr = keys.map(function (k) { return { k: k, v: valueOf(k) }; }).sort(function (a, b) { return b.v - a.v; });
    if (arr.length <= n) return arr;
    var head = arr.slice(0, n - 1), rest = arr.slice(n - 1).reduce(function (s, x) { return s + x.v; }, 0);
    head.push({ k: "기타 (" + (arr.length - n + 1) + "개)", v: rest }); return head;
  }
  /* 기준 숫자 열 — "금액·합계"라는 이름을 먼저, 그다음 금액 성격, 그다음 합계가 큰 열 */
  function primaryNumeric() {
    var nums = state.cols.filter(function (c) { return c.type === "number" && !c.rate; });
    nums.sort(function (a, b) { return (b.score - a.score) || (b.sum - a.sum); });
    return nums[0] || null;
  }
  function unitOf(col) { return col && col.money ? "won" : "count"; }

  /* ---------- 화면 그리기 ---------- */
  function render() {
    state.charts.forEach(function (c) { try { c.destroy(); } catch (e) {} }); state.charts = [];
    chartsEl.innerHTML = "";
    var cols = state.cols, rows = state.rows;
    var typeName = { date: "날짜", number: "숫자", category: "범주", text: "글" };
    chipsEl.innerHTML = cols.map(function (c) { return '<span class="chip t-' + c.type + '" title="' + typeName[c.type] + (c.type === "category" ? " · 값 " + c.unique + "가지" : "") + '"><i></i>' + esc(c.name) + ' <span class="muted">' + typeName[c.type] + "</span></span>"; }).join("");

    var dateCol = cols.filter(function (c) { return c.type === "date"; })[0];
    var numCols = cols.filter(function (c) { return c.type === "number"; });
    var catCols = cols.filter(function (c) { return c.type === "category"; });
    var pn = primaryNumeric();

    /* 요약 타일 */
    var tiles = [{ label: "자료 줄 수", val: EFM.fmtNum(rows.length) + "<small>줄</small>" }, { label: "항목(열) 수", val: cols.length + "<small>개</small>" }];
    if (dateCol) tiles.push({ label: dateCol.name + " 범위", val: '<span style="font-size:1.1rem">' + dateKey(dateCol.minDate, "day") + " ~ " + dateKey(dateCol.maxDate, "day") + "</span>" });
    if (pn) tiles.push({ label: pn.name + " 합계", val: esc(pn.money ? EFM.fmtWonShort(pn.sum) : C.fmt(pn.sum)) });
    numCols.filter(function (c) { return c !== pn; }).forEach(function (c) {
      if (tiles.length >= 8) return;
      var u = unitOf(c);
      if (c.rate) tiles.push({ label: c.name + " 평균", val: esc(C.fmt(Math.round(c.mean * 100) / 100, u)) + '<div class="k-delta">최소 ' + esc(C.fmt(c.min, u)) + " · 최대 " + esc(C.fmt(c.max, u)) + "</div>" });
      else tiles.push({ label: c.name + " 합계", val: esc(c.money ? EFM.fmtWonShort(c.sum) : C.fmt(c.sum)) + '<div class="k-delta">평균 ' + esc(C.fmt(Math.round(c.mean), u)) + " · 최대 " + esc(C.fmt(c.max, u)) + "</div>" });
    });
    summaryEl.innerHTML = tiles.map(function (t, i) { return '<div class="kpi' + (i === 0 ? " kpi-accent" : "") + '"><div class="k-label">' + esc(t.label) + '</div><div class="k-val">' + t.val + "</div></div>"; }).join("");

    var made = 0;
    function addCard(o) {
      var div = document.createElement("div"); if (o.span2) div.className = "span2"; chartsEl.appendChild(div);
      o.el = div; var ch = C.card(o); if (ch) state.charts.push(ch); made++;
    }

    /* 1) 시계열 — 날짜 열 × 숫자 열 */
    if (dateCol) {
      var granName = { day: "일별", month: "월별", year: "연도별" }[dateCol.gran];
      var addable = numCols.filter(function (c) { return !c.rate; });
      var measures = (pn ? [pn].concat(addable.filter(function (c) { return c !== pn; })) : addable).slice(0, 3);
      if (measures.length) {
        var g0 = groupSum(dateKeyFn(dateCol), null); var labels = g0.keys.slice().sort();
        var sameUnit = measures.every(function (c) { return c.money === measures[0].money; });
        (sameUnit ? [measures] : measures.map(function (m) { return [m]; })).forEach(function (grp) {
          var ds = grp.map(function (c) { var g = groupSum(dateKeyFn(dateCol), numVal(c)); return { label: c.name, data: labels.map(function (k) { return g.map[k] ? g.map[k].sum : null; }) }; });
          addCard({ type: "line", unit: unitOf(grp[0]), title: granName + " " + grp.map(function (c) { return c.name; }).join(" · ") + " 추이", sub: dateCol.name + " 기준으로 " + granName + " 합계", data: { labels: labels, datasets: ds }, rowHeader: dateCol.name, span2: true, endLabel: ds.length === 1 });
        });
      } else {
        var gc = groupSum(dateKeyFn(dateCol), null), lk = gc.keys.slice().sort();
        addCard({ type: "bar", unit: "count", title: granName + " 건수", sub: dateCol.name + " 기준", data: { labels: lk, datasets: [{ label: "건수", data: lk.map(function (k) { return gc.map[k].n; }) }] }, rowHeader: dateCol.name, span2: true });
      }
      /* 1-b) 구분 열(값 2~6가지)이 있으면 구분별 시계열 — 예: 기탁 vs 배분, 수입 vs 지출 */
      var splitCol = catCols.filter(function (c) { return c.unique >= 2 && c.unique <= 6; }).sort(function (a, b) { return a.unique - b.unique; })[0];
      if (splitCol && pn) {
        var lab2 = groupSum(dateKeyFn(dateCol), null).keys.slice().sort();
        var cats = groupSum(catKey(splitCol), null).keys;
        var ds2 = cats.map(function (cv) { var g = groupSum(function (r) { return catKey(splitCol)(r) === cv ? dateKeyFn(dateCol)(r) : null; }, numVal(pn)); return { label: cv, data: lab2.map(function (k) { return g.map[k] ? g.map[k].sum : 0; }) }; });
        addCard({ type: "bar", unit: unitOf(pn), title: splitCol.name + "별 " + granName + " " + pn.name, sub: splitCol.name + " 값(" + cats.join(" · ") + ")으로 나누어 본 " + granName + " 합계", data: { labels: lab2, datasets: ds2 }, rowHeader: dateCol.name, span2: true });
      }
    }

    /* 2) 범주별 — 각 범주 열 × 기준 숫자(없으면 건수) */
    catCols.slice(0, 4).forEach(function (cc) {
      var g = groupSum(catKey(cc), pn ? numVal(pn) : null);
      var top = topN(g.keys, function (k) { return pn ? g.map[k].sum : g.map[k].n; }, 10);
      addCard({ type: "bar", horizontal: true, unit: pn ? unitOf(pn) : "count", share: true, title: cc.name + "별 " + (pn ? pn.name + " 합계" : "건수"), sub: "값 " + cc.unique + "가지" + (cc.unique > 10 ? " 중 상위 9개 + 기타" : ""), data: { labels: top.map(function (x) { return x.k; }), datasets: [{ label: pn ? pn.name : "건수", data: top.map(function (x) { return x.v; }) }] }, rowHeader: cc.name, tall: top.length > 6 });
    });

    /* 3) 숫자 열이 여럿이면 열끼리 합계 비교 (같은 단위끼리) */
    var moneyCols = numCols.filter(function (c) { return c.money && !c.rate; });
    if (moneyCols.length >= 2 && !dateCol) addCard({ type: "bar", unit: "won", title: "금액 항목별 합계", data: { labels: moneyCols.map(function (c) { return c.name; }), datasets: [{ label: "합계", data: moneyCols.map(function (c) { return c.sum; }) }] }, rowHeader: "항목" });

    if (!made) chartsEl.innerHTML = '<div class="empty">그래프로 만들 만한 날짜·숫자·범주 열을 찾지 못했습니다. 첫 줄이 항목 이름(머리글)인지, 숫자에 글자가 섞여 있지 않은지 확인해 주세요.</div>';

    /* 피벗 선택지 */
    var rowOpts = catCols.map(function (c) { return '<option value="c:' + c.index + '">' + esc(c.name) + "</option>"; });
    if (dateCol) rowOpts = ['<option value="d:month">' + esc(dateCol.name) + " (월별)</option>", '<option value="d:year">' + esc(dateCol.name) + " (연도별)</option>", '<option value="d:day">' + esc(dateCol.name) + " (일별)</option>"].concat(rowOpts);
    pvRow.innerHTML = rowOpts.join("") || '<option value="">(범주·날짜 열 없음)</option>';
    pvSplit.innerHTML = '<option value="">나누지 않음</option>' + catCols.filter(function (c) { return c.unique <= 8; }).map(function (c) { return '<option value="' + c.index + '">' + esc(c.name) + "</option>"; }).join("");
    pvMeasure.innerHTML = numCols.map(function (c) { return '<option value="' + c.index + '"' + (c === pn ? " selected" : "") + ">" + esc(c.name) + "</option>"; }).join("") + '<option value="__count"' + (numCols.length ? "" : " selected") + ">건수</option>";
    renderPivot();
    renderRaw();
  }

  /* ---------- 피벗 ---------- */
  function renderPivot() {
    if (pivotChart) { try { pivotChart.destroy(); } catch (e) {} pivotChart = null; }
    var rv = pvRow.value, sv = pvSplit.value, mv = pvMeasure.value, agg = pvAgg.value;
    if (!rv) { pvTable.innerHTML = '<p class="muted">행으로 쓸 범주·날짜 열이 없습니다.</p>'; pvChartEl.innerHTML = ""; return; }
    var dateCol = state.cols.filter(function (c) { return c.type === "date"; })[0];
    var rowKey = rv.charAt(0) === "d" ? dateKeyFn(dateCol, rv.slice(2)) : catKey(state.cols[+rv.slice(2)]);
    var rowName = rv.charAt(0) === "d" ? dateCol.name : state.cols[+rv.slice(2)].name;
    var mCol = mv === "__count" ? null : state.cols[+mv], valFn = mCol ? numVal(mCol) : null;
    if (!mCol) agg = "count";
    var splitCol = sv === "" ? null : state.cols[+sv];
    var splits = splitCol ? groupSum(catKey(splitCol), null).keys : [null];
    var rowKeys = groupSum(rowKey, null).keys; if (rv.charAt(0) === "d") rowKeys.sort();
    function pick(cell) { if (!cell) return null; return agg === "sum" ? cell.sum : agg === "avg" ? cell.sum / cell.n : agg === "max" ? cell.max : agg === "min" ? cell.min : cell.n; }
    var datasets = splits.map(function (s) {
      var g = groupSum(s == null ? rowKey : function (r) { return catKey(splitCol)(r) === s ? rowKey(r) : null; }, valFn);
      return { label: s == null ? (mCol ? mCol.name : "건수") + " " + { sum: "합계", avg: "평균", max: "최대", min: "최소", count: "건수" }[agg] : s, data: rowKeys.map(function (k) { return pick(g.map[k]); }) };
    });
    var unit = agg === "count" ? "count" : unitOf(mCol);
    var labels = rowKeys;
    if (rv.charAt(0) !== "d" && labels.length > 12 && datasets.length === 1) { var t = topN(labels, function (k) { return datasets[0].data[labels.indexOf(k)] || 0; }, 12); labels = t.map(function (x) { return x.k; }); datasets[0].data = t.map(function (x) { return x.v; }); }
    pvTable.innerHTML = '<div class="table-wrap">' + C.tableHTML({ labels: labels, datasets: datasets, unit: unit, rowHeader: rowName, total: agg === "sum" || agg === "count", share: datasets.length === 1 && (agg === "sum" || agg === "count") }) + "</div>";
    pvChartEl.innerHTML = "";
    pivotChart = C.card({ el: pvChartEl, type: rv.charAt(0) === "d" && datasets.length > 1 ? "line" : "bar", horizontal: rv.charAt(0) !== "d" && labels.length > 5, unit: unit, title: rowName + "별 " + datasets[0].label.replace(/ (합계|평균|최대|최소|건수)$/, "") + (splitCol ? " — " + splitCol.name + "로 나눔" : ""), data: { labels: labels, datasets: datasets }, rowHeader: rowName, tall: labels.length > 8, endLabel: datasets.length === 1 });
  }
  /* 단가·비율 열을 고르면 계산을 '평균'으로 바꿔 준다 (더하면 뜻이 없으므로) */
  pvMeasure.addEventListener("change", function () { var c = state.cols[+pvMeasure.value]; if (c && c.rate && pvAgg.value === "sum") pvAgg.value = "avg"; });
  [pvRow, pvSplit, pvMeasure, pvAgg].forEach(function (s) { s.addEventListener("change", renderPivot); });

  /* ---------- 원본 표 ---------- */
  var RAW_MAX = 300;
  function fmtCell(v, col) {
    if (isEmpty(v)) return "";
    if (col.type === "date") { var d = parseDate(v); return d ? dateKey(d, "day") : esc(String(v)); }
    if (col.type === "number") { var n = parseNumber(v); return isNaN(n) ? esc(String(v)) : C.fmt(n); }
    return esc(String(v));
  }
  function renderRaw() {
    var cols = state.cols, rows = state.rows.slice();
    var s = state.sort;
    if (s.col >= 0) {
      var c = cols[s.col];
      rows.sort(function (a, b) {
        var x = a[c.index], y = b[c.index];
        if (c.type === "number") { x = parseNumber(x); y = parseNumber(y); x = isNaN(x) ? -Infinity : x; y = isNaN(y) ? -Infinity : y; }
        else if (c.type === "date") { x = parseDate(x) || 0; y = parseDate(y) || 0; }
        else { x = String(x == null ? "" : x); y = String(y == null ? "" : y); return s.dir * x.localeCompare(y, "ko"); }
        return s.dir * (x - y);
      });
    }
    var h = '<table class="data-table"><thead><tr>' + cols.map(function (c, j) { return '<th class="sortable' + (c.type === "number" ? " num" : "") + (s.col === j ? (s.dir > 0 ? " sorted-asc" : " sorted-desc") : "") + '" data-j="' + j + '">' + esc(c.name) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.slice(0, RAW_MAX).forEach(function (r) { h += "<tr>" + cols.map(function (c) { return "<td" + (c.type === "number" ? ' class="num"' : "") + ">" + fmtCell(r[c.index], c) + "</td>"; }).join("") + "</tr>"; });
    rawEl.innerHTML = h + "</tbody></table>";
    rawInfo.textContent = rows.length > RAW_MAX ? "전체 " + EFM.fmtNum(rows.length) + "줄 중 앞 " + RAW_MAX + "줄만 보입니다. (분석에는 전체가 쓰였습니다)" : "전체 " + EFM.fmtNum(rows.length) + "줄";
    rawEl.querySelectorAll("th.sortable").forEach(function (th) { th.addEventListener("click", function () { var j = +th.dataset.j; state.sort = { col: j, dir: state.sort.col === j ? -state.sort.dir : 1 }; renderRaw(); }); });
  }

  /* ---------- 내보내기 ---------- */
  document.getElementById("exportXlsx").addEventListener("click", function () {
    var wb = XLSX.utils.book_new();
    var summary = [["파일", state.fileName], ["시트", state.sheet], ["자료 줄 수", state.rows.length], [], ["열", "성격", "값 가지수", "합계", "평균", "최소", "최대"]];
    state.cols.forEach(function (c) { summary.push([c.name, { date: "날짜", number: "숫자", category: "범주", text: "글" }[c.type], c.unique, c.sum != null ? c.sum : "", c.mean != null ? Math.round(c.mean * 100) / 100 : "", c.min != null ? c.min : "", c.max != null ? c.max : ""]); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "요약");
    /* 그래프마다 표 한 장 */
    var n = 1;
    chartsEl.querySelectorAll(".chart-card").forEach(function (card) {
      var t = card.querySelector(".chart-table table"); if (!t) return;
      var ws = XLSX.utils.table_to_sheet(t); var title = (card.querySelector("h3").textContent || "표").replace(/[\\/?*\[\]:]/g, " ").slice(0, 25);
      XLSX.utils.book_append_sheet(wb, ws, (n++) + "." + title);
    });
    var pt = pvTable.querySelector("table"); if (pt) XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(pt), "피벗");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([state.header].concat(state.rows)), "원본");
    XLSX.writeFile(wb, (state.fileName.replace(/\.[^.]+$/, "") || "분석") + "_분석결과.xlsx");
  });
  document.getElementById("printBtn").addEventListener("click", function () { window.print(); });
  document.getElementById("resetBtn").addEventListener("click", function () {
    state.charts.forEach(function (c) { try { c.destroy(); } catch (e) {} }); state.charts = []; if (pivotChart) { try { pivotChart.destroy(); } catch (e) {} pivotChart = null; }
    panel.classList.remove("ready"); state.wb = null; window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
