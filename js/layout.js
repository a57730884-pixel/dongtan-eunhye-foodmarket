/* ============================================================
   동탄 은혜푸드마켓 — 공통 레이아웃 (모든 페이지가 이 파일 하나를 씁니다)
   헤더(사진 위 투명 → 스크롤하면 짙은 회색) · 모바일 메뉴 · 4단 푸터 · 맨 위로 · 공통 유틸
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
  function icon(id, cls) { return '<svg class="ico' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="images/icons.svg#' + id + '"/></svg>'; }

  var logo = '<a href="index.html" class="logo" aria-label="' + esc(O.name) + ' 첫 화면"><span class="logo-kr">' + esc(O.nameShort || "은혜푸드마켓") + '</span><i class="logo-dot"></i><span class="logo-en">' + esc(O.nameEn || "") + "</span></a>";

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

  var hasDark = !!document.querySelector(".hero, .page-banner");
  document.body.insertAdjacentHTML("afterbegin",
    '<a class="skip" href="#main">본문 바로가기</a>' +
    '<header id="header"' + (hasDark ? "" : ' class="solid"') + '>' +
      '<div class="nav-inner">' + logo +
        '<nav class="nav-menu" aria-label="주 메뉴">' + navLinks + "</nav>" +
        '<a class="nav-cta" href="donate.html">기탁 · 후원 문의 &nbsp;›</a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>' +
      "</div>" +
    "</header>" +
    '<div class="mobile-menu" id="mobileMenu">' + mobile + '<a class="mm-cta" href="donate.html">기탁 · 후원 문의</a>' +
      '<p class="mm-meta">' + esc(O.phone || "") + " · " + esc(O.hours || "") + "</p></div>"
  );

  var toggle = document.getElementById("navToggle"), mm = document.getElementById("mobileMenu");
  toggle.addEventListener("click", function () {
    var open = mm.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-lock", open);
    document.getElementById("header").classList.toggle("solid", open || !hasDark);
  });
  mm.addEventListener("click", function (e) { if (e.target.tagName === "A") { mm.classList.remove("open"); toggle.classList.remove("open"); document.body.classList.remove("menu-lock"); } });

  var header = document.getElementById("header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 40); var t = document.getElementById("toTop"); if (t) t.classList.toggle("show", window.scrollY > 500); }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ===== 푸터 (4단) ===== */
  var year = new Date().getFullYear();
  document.body.insertAdjacentHTML("beforeend",
    '<footer class="footer"><div class="container footer-inner">' +
      "<div>" + logo +
        "<p>" + esc(O.legalNames) + "<br>운영 " + esc(O.operator) + " · 대표 " + esc(O.rep) + "<br>기부식품등 제공사업장 · 화성시 그냥드림 동탄권 거점</p>" +
      "</div>" +
      "<div><h4>Contact</h4><p style=\"margin-top:0\">" + esc(O.address) + "<br>전화 " + esc(O.phone) + (O.fax ? "<br>팩스 " + esc(O.fax) : "") + "<br>" + esc(O.hours) + "<br>" + esc(O.hoursNote) + "</p></div>" +
      '<div><h4>Navigation</h4><nav class="footer-nav">' +
        '<a href="about.html">사업안내</a><a href="donate.html">기탁 · 후원</a><a href="use.html">이용안내</a><a href="archive.html">아카이브</a><a href="transparency.html">투명 공개</a><a href="analyze.html">데이터 분석</a>' +
      "</nav></div>" +
      '<div><h4>Programs</h4><nav class="footer-nav">' +
        '<a href="use.html#how">푸드마켓</a><a href="use.html#how">푸드뱅크</a><a href="use.html#gnd">그냥드림</a><a href="donate.html#how">물품 기탁</a><a href="donate.html#money">현금 후원</a><a href="transparency.html#finance">재정 결산</a>' +
        '<a href="' + esc(O.mapKakao) + '" target="_blank" rel="noopener">오시는 길 (카카오맵)</a>' +
      "</nav></div>" +
      '<div class="footer-meta"><span>© ' + year + " " + esc(O.name) + ". All rights reserved.</span><span>「식품등 기부 활성화에 관한 법률」에 따라 운영 · <a href=\"https://www.foodbank1377.org\" target=\"_blank\" rel=\"noopener\">전국푸드뱅크</a> · <a href=\"https://www.kg1377.or.kr\" target=\"_blank\" rel=\"noopener\">경기나눔푸드뱅크</a></span></div>" +
    "</div></footer>" +
    '<button id="toTop" aria-label="맨 위로">↑</button>'
  );
  document.getElementById("toTop").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  onScroll();

  /* 앵커 탭(배너) 활성 표시 */
  function markTabs() {
    var h = location.hash; if (!h) return;
    document.querySelectorAll(".ph-tabs a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === h); });
  }
  window.addEventListener("hashchange", markTabs); markTabs();

  /* ===== 공통 유틸 ===== */
  window.EFM = window.EFM || {};
  EFM.esc = esc;
  EFM.icon = icon;
  EFM.fmtNum = function (n) { return n == null || isNaN(n) ? "-" : Math.round(n).toLocaleString("ko-KR"); };
  EFM.fmtWon = function (n) { return n == null || isNaN(n) ? "-" : Math.round(n).toLocaleString("ko-KR") + "원"; };
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
