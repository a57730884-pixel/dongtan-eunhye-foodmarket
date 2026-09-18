/* ============================================================
   함께한 순간들 — 사진 갤러리 · 크게 보기
   ------------------------------------------------------------
   · 사진 설명은 현수막에 적힌 내용을 그대로 옮긴 것입니다.
   · 사진을 더하려면 images/gallery/ 에 파일을 넣고 PHOTOS 에 한 줄 추가하면 됩니다.
     (g00.jpg = 크게 보기용, g00-t.jpg = 목록용 작은 사진)
   ============================================================ */
(function () {
  var PHOTOS = [
    { f: "g01", date: "2026. 3. 9",   title: "은혜푸드뱅크 창립 10주년 기념",            note: "2016년 3월 문을 연 뒤 열 해째 되는 날, 함께 일해 온 분들이 모였습니다." },
    { f: "g02", date: "2023. 8. 25",  title: "우진미트 유한회사 물품 기탁",              note: "등갈비 및 양지소갈비 461Box · 8,234kg · 기부금액 60,896,267원" },
    { f: "g03", date: "2019. 12. 12", title: "㈜램코리아 냉동돼지족 기탁",               note: "냉동돼지족 932Box · 27,960,000원" },
    { f: "g04", date: "2019. 10. 1",  title: "㈜건승 · ㈜명신에프엔에스 신발 기증",       note: "신발 7,274켤레" },
    { f: "g05", date: "2024. 8. 1",   title: "미트리㈜ 한부모 가정 등 지원",             note: "고객과 함께하는 LOVE PROJECT · 4,700,000원 상당 자사제품 기부" },
    { f: "g06", date: "2024. 7. 22",  title: "㈜유림식품 떡볶이떡 기탁",                 note: "떡볶이떡 7,648봉 · 기부금액 13,263,500원" },
    { f: "g07", date: "2024. 6. 20",  title: "㈜유림식품 떡볶이떡 기탁",                 note: "떡볶이떡 250g · 2kg · 기부금액 30,870,000원" },
    { f: "g08", date: "2024. 7. 24",  title: "기탁받은 의류를 품목별로 정리",            note: "받은 물품은 접수하면서 품목과 수량을 적고, 나갈 때도 같은 방식으로 남깁니다." },
    { f: "g09", date: "2024. 7. 24",  title: "나눔으로 함께 웃는, 의류 나눔 물품",        note: "경기 사회복지공동모금회와 함께한 의류 나눔." },
    { f: "g10", date: "2024. 6. 27",  title: "물류센터에서 기탁 물품 상차",              note: "양이 많으면 차량으로 찾아가 직접 싣고 옵니다." },
    { f: "g11", date: "2020. 2. 24",  title: "동탄 은혜푸드마켓 사업장",                 note: "평일 10시부터 5시까지, 그냥드림 코너가 열려 있습니다." },
    { f: "g12", date: "",             title: "물품을 실어 나르는 배송 차량",             note: "거동이 불편한 가정과 복지시설에는 정해진 날 저희가 찾아갑니다." }
  ];

  var grid = document.getElementById("galleryGrid");
  if (!grid) return;
  var esc = window.EFM ? EFM.esc : function (s) { return String(s == null ? "" : s); };

  grid.innerHTML = PHOTOS.map(function (p, i) {
    return '<button type="button" class="g-item" data-i="' + i + '" aria-label="' + esc(p.title) + ' 크게 보기">' +
      '<span class="g-thumb"><img src="images/gallery/' + p.f + '-t.jpg" alt="' + esc(p.title) + '" loading="lazy" width="560" height="420" /></span>' +
      (p.date ? '<span class="g-date">' + esc(p.date) + "</span>" : '<span class="g-date">&nbsp;</span>') +
      '<span class="g-title">' + esc(p.title) + "</span>" +
      "</button>";
  }).join("");

  /* ---- 크게 보기 ---- */
  var lb = document.createElement("div");
  lb.className = "lb";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "사진 크게 보기");
  lb.innerHTML =
    '<figure class="lb-fig"><img id="lbImg" src="" alt="" />' +
    '<figcaption class="lb-cap"><span class="c-date" id="lbDate"></span><span class="c-title" id="lbTitle"></span><span class="c-note" id="lbNote"></span></figcaption></figure>' +
    '<button type="button" class="lb-close" id="lbClose" aria-label="닫기">✕</button>' +
    '<button type="button" class="lb-prev" id="lbPrev" aria-label="이전 사진"><svg class="ico"><use href="images/icons.svg#arrow-l"/></svg></button>' +
    '<button type="button" class="lb-next" id="lbNext" aria-label="다음 사진"><svg class="ico"><use href="images/icons.svg#arrow-r"/></svg></button>' +
    '<span class="lb-idx" id="lbIdx"></span>';
  document.body.appendChild(lb);

  var img = lb.querySelector("#lbImg"), cur = 0, opener = null;

  function show(n) {
    cur = (n + PHOTOS.length) % PHOTOS.length;
    var p = PHOTOS[cur];
    img.src = "images/gallery/" + p.f + ".jpg";
    img.alt = p.title;
    lb.querySelector("#lbDate").textContent = p.date;
    lb.querySelector("#lbTitle").textContent = p.title;
    lb.querySelector("#lbNote").textContent = p.note || "";
    lb.querySelector("#lbIdx").textContent = (cur + 1) + " / " + PHOTOS.length;
  }
  function open(n) {
    opener = document.activeElement;
    show(n);
    lb.classList.add("open");
    document.body.classList.add("menu-lock");
    lb.querySelector("#lbClose").focus();
  }
  function close() {
    lb.classList.remove("open");
    document.body.classList.remove("menu-lock");
    if (opener && opener.focus) opener.focus();
  }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".g-item");
    if (b) open(+b.dataset.i);
  });
  lb.querySelector("#lbPrev").addEventListener("click", function () { show(cur - 1); });
  lb.querySelector("#lbNext").addEventListener("click", function () { show(cur + 1); });
  lb.querySelector("#lbClose").addEventListener("click", close);
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-fig")) close(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
})();
