/* ============================================================
   동탄 은혜푸드마켓 — 공통 레이아웃 (모든 페이지가 이 파일 하나를 씁니다)
   헤더(대메뉴+하위메뉴) · 모바일 메뉴 · 푸터 · 맨 위로 버튼 · 공통 유틸
   ============================================================ */
(function () {
  var O = window.ORG || {};

  var NAV = [
    { href: "about.html", label: "사업안내", sub: [
      { href: "about.html#greeting", label: "인사말" },
      { href: "about.html#vision", label: "비전 · 목표" },
      { href: "about.html#system", label: "운영체계" },
      { href: "about.html#history", label: "걸어온 길" },
      { href: "about.html#directions", label: "오시는 길" }
    ] },
    { href: "donate.html", label: "기탁 · 후원", sub: [
      { href: "donate.html#how", label: "기탁 방법" },
      { href: "donate.html#items", label: "기탁 가능 물품" },
      { href: "donate.html#tax", label: "세제 혜택" },
      { href: "donate.html#donors", label: "함께한 기탁처" }
    ] },
    { href: "use.html", label: "이용안내", sub: [
      { href: "use.html#who", label: "이용 대상" },
      { href: "use.html#how", label: "이용 방법" },
      { href: "use.html#apply", label: "신청 절차" },
      { href: "use.html#gnd", label: "그냥드림" }
    ] },
    { href: "archive.html", label: "아카이브", sub: [
      { href: "archive.html#press", label: "언론 보도" },
      { href: "archive.html#activity", label: "활동 소식" },
      { href: "archive.html#report", label: "운영 실적" },
      { href: "archive.html#notice", label: "공지사항" }
    ] },
    { href: "transparency.html", label: "투명 공개", sub: [
      { href: "transparency.html#summary", label: "한눈에 보기" },
      { href: "transparency.html#donation", label: "기부물품 통계" },
      { href: "transparency.html#users", label: "이용 현황" },
      { href: "transparency.html#finance", label: "재정 결산" }
    ] },
    { href: "analyze.html", label: "데이터 분석" }
  ];

  var path = location.pathname.split("/").pop() || "index.html";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ===== 헤더 ===== */
  var navLinks = NAV.map(function (n) {
    var active = path === n.href.split("#")[0] ? ' class="active"' : "";
    if (!n.sub) return '<div class="nav-item"><a href="' + n.href + '"' + active + ">" + n.label + "</a></div>";
    var subs = n.sub.map(function (s) { return '<a href="' + s.href + '">' + s.label + "</a>"; }).join("");
    return '<div class="nav-item has-sub"><a href="' + n.href + '"' + active + ">" + n.label + "</a>" +
      '<div class="nav-dropdown"><div class="nav-dropdown-inner">' + subs + "</div></div></div>";
  }).join("");

  var mobile = NAV.map(function (n) {
    var subs = n.sub ? '<div class="mm-sub">' + n.sub.map(function (s) { return '<a href="' + s.href + '">' + s.label + "</a>"; }).join("") + "</div>" : "";
    return '<div class="mm-group"><a href="' + n.href + '">' + n.label + "</a>" + subs + "</div>";
  }).join("");

  document.body.insertAdjacentHTML("afterbegin",
    '<a class="skip" href="#main">본문 바로가기</a>' +
    '<header id="header">' +
      '<div class="nav-inner">' +
        '<a href="index.html" class="logo" aria-label="' + esc(O.name) + ' 첫 화면">' +
          '<img class="logo-mark" src="images/logo.svg" alt="" />' +
          '<span class="logo-text"><span class="logo-kr">' + esc(O.name || "은혜푸드마켓") + '</span><span class="logo-en">' + esc(O.nameEn || "") + "</span></span>" +
        "</a>" +
        '<nav class="nav-menu" aria-label="주 메뉴">' + navLinks + "</nav>" +
        '<a class="nav-cta" href="donate.html">🤝 기탁 · 후원하기</a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>' +
      "</div>" +
    "</header>" +
    '<div class="mobile-menu" id="mobileMenu">' + mobile + '<a class="mm-cta" href="donate.html">기탁 · 후원하기</a>' +
      '<p class="small muted mt-3">' + esc(O.phone || "") + " · " + esc(O.hours || "") + "</p></div>"
  );

  var toggle = document.getElementById("navToggle"), mm = document.getElementById("mobileMenu");
  toggle.addEventListener("click", function () {
    var open = mm.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-lock", open);
  });
  mm.addEventListener("click", function (e) { if (e.target.tagName === "A") { mm.classList.remove("open"); toggle.classList.remove("open"); document.body.classList.remove("menu-lock"); } });

  var header = document.getElementById("header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); var t = document.getElementById("toTop"); if (t) t.classList.toggle("show", window.scrollY > 400); }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ===== 푸터 ===== */
  var year = new Date().getFullYear();
  document.body.insertAdjacentHTML("beforeend",
    '<footer class="footer"><div class="container footer-inner">' +
      '<div>' +
        '<div class="logo"><img class="logo-mark" src="images/logo.svg" alt="" /><span class="logo-text"><span class="logo-kr">' + esc(O.name) + '</span><span class="logo-en">' + esc(O.nameEn) + "</span></span></div>" +
        "<p>" + esc(O.legalNames) + " · 운영 " + esc(O.operator) + " (대표 " + esc(O.rep) + ")<br>" +
        esc(O.address) + "<br>☎ " + esc(O.phone) + (O.fax ? " · FAX " + esc(O.fax) : "") + " · " + esc(O.hours) + " (" + esc(O.hoursNote) + ")</p>" +
        '<span class="footer-badge">🔍 기탁 · 배분 · 회계를 모두 공개합니다 <a href="transparency.html" style="color:#fff;text-decoration:underline">투명 공개 보기</a></span>' +
      "</div>" +
      '<div><h4>바로가기</h4><nav class="footer-nav">' +
        '<a href="about.html">사업안내</a><a href="donate.html">기탁 · 후원</a><a href="use.html">이용안내</a><a href="archive.html">아카이브</a><a href="transparency.html">투명 공개</a><a href="analyze.html">데이터 분석</a>' +
      "</nav></div>" +
      '<div><h4>찾아오시는 길</h4><nav class="footer-nav">' +
        '<a href="about.html#directions">약도 · 대중교통</a><a href="' + esc(O.mapKakao) + '" target="_blank" rel="noopener">카카오맵에서 열기 ↗</a><a href="' + esc(O.mapNaver) + '" target="_blank" rel="noopener">네이버지도에서 열기 ↗</a>' +
        '<a href="https://www.foodbank1377.org" target="_blank" rel="noopener">전국푸드뱅크 ↗</a><a href="https://www.kg1377.or.kr" target="_blank" rel="noopener">경기나눔푸드뱅크 ↗</a>' +
      "</nav></div>" +
      '<div class="footer-meta"><span>ⓒ ' + year + " " + esc(O.name) + ". All rights reserved.</span><span>기부식품등 제공사업장 · 「식품등 기부 활성화에 관한 법률」에 따라 운영</span></div>" +
    "</div></footer>" +
    '<button id="toTop" aria-label="맨 위로">↑</button>'
  );
  document.getElementById("toTop").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  onScroll();

  /* 앵커 탭(페이지 상단) 활성 표시 */
  function markTabs() {
    var h = location.hash; if (!h) return;
    document.querySelectorAll(".ph-tabs a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === h); });
  }
  window.addEventListener("hashchange", markTabs); markTabs();

  /* ===== 공통 유틸 ===== */
  window.EFM = window.EFM || {};
  EFM.esc = esc;
  EFM.fmtNum = function (n) { return n == null || isNaN(n) ? "-" : Math.round(n).toLocaleString("ko-KR"); };
  EFM.fmtWon = function (n) { return n == null || isNaN(n) ? "-" : Math.round(n).toLocaleString("ko-KR") + "원"; };
  /* 큰 금액을 읽기 쉽게: 1억 2,345만원 */
  EFM.fmtWonShort = function (n) {
    if (n == null || isNaN(n)) return "-";
    var neg = n < 0; n = Math.abs(Math.round(n));
    var eok = Math.floor(n / 1e8), man = Math.round((n % 1e8) / 1e4);
    var s = "";
    if (eok) s += eok.toLocaleString("ko-KR") + "억";
    if (man) s += (s ? " " : "") + man.toLocaleString("ko-KR") + "만";
    if (!s) s = n.toLocaleString("ko-KR");
    return (neg ? "-" : "") + s + "원";
  };
  EFM.fmtDate = function (d) { if (!d) return ""; var s = String(d); return s.length >= 10 ? s.slice(0, 10).replace(/-/g, ".") : s.replace(/-/g, "."); };
  EFM.catLabel = { press: "언론 보도", activity: "활동 소식", report: "운영 실적", notice: "공지사항" };
})();
