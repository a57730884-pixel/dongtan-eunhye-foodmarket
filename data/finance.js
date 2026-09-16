/* ============================================================
   투명 공개 — 회계·운영 통계 데이터
   ------------------------------------------------------------
   ★ meta.sample 이 true 이면 화면에 "예시 데이터" 띠가 표시됩니다.
     실제 결산 자료로 바꾼 뒤 false 로 고치세요.
   · 금액 단위: 원   · 인원 단위: 명   · 건수 단위: 건
   · 월별 엑셀 대장을 "데이터 분석" 페이지에 올리면 합계를 바로 확인할 수
     있으니, 그 숫자를 여기에 옮겨 적으면 됩니다.
   ============================================================ */
window.FINANCE = {
  meta: {
    sample: true,
    updated: "2026-09-01",
    basis: "기부식품등 제공사업 운영 실적 · 연간 결산서",
    note: "기부물품 금액은 기탁 시 기부자가 제시한 시가 또는 「식품등 기부 활성화에 관한 법률」에 따른 평가액 기준입니다."
  },

  /* 연도별 운영 실적 */
  years: [
    { year: 2021, donated: 182500000, distributed: 176900000, donors: 38, users: 412, households: 296, visits: 5120, agencies: 9 },
    { year: 2022, donated: 214300000, distributed: 207100000, donors: 44, users: 468, households: 331, visits: 5870, agencies: 11 },
    { year: 2023, donated: 251800000, distributed: 244600000, donors: 51, users: 521, households: 372, visits: 6640, agencies: 12 },
    { year: 2024, donated: 289400000, distributed: 281200000, donors: 57, users: 583, households: 419, visits: 7390, agencies: 14 },
    { year: 2025, donated: 326700000, distributed: 318500000, donors: 63, users: 654, households: 468, visits: 8210, agencies: 15 }
  ],

  /* 올해 월별 실적 (진행 중인 해) — gnd 는 그냥드림 이용 건수 */
  monthly: {
    year: 2026,
    rows: [
      { m: 1, donated: 24800000, distributed: 23100000, visits: 690, gnd: 310 },
      { m: 2, donated: 27300000, distributed: 26400000, visits: 720, gnd: 420 },
      { m: 3, donated: 26100000, distributed: 25800000, visits: 745, gnd: 480 },
      { m: 4, donated: 29500000, distributed: 28200000, visits: 770, gnd: 530 },
      { m: 5, donated: 36200000, distributed: 33900000, visits: 810, gnd: 590 },
      { m: 6, donated: 28900000, distributed: 29600000, visits: 780, gnd: 610 },
      { m: 7, donated: 30400000, distributed: 29100000, visits: 795, gnd: 640 },
      { m: 8, donated: 33700000, distributed: 31800000, visits: 860, gnd: 720 }
    ]
  },

  /* 기부물품 유형별 (최근 확정 연도) */
  categories: {
    year: 2025,
    rows: [
      { name: "쌀 · 곡류", value: 74200000 },
      { name: "가공식품 · 통조림", value: 68900000 },
      { name: "라면 · 즉석식품", value: 52300000 },
      { name: "음료 · 유제품", value: 41600000 },
      { name: "신선식품 (채소 · 과일 · 육류)", value: 38700000 },
      { name: "생활용품 · 위생용품", value: 35400000 },
      { name: "기타", value: 15600000 }
    ]
  },

  /* 기탁처 유형별 (최근 확정 연도) */
  donorTypes: {
    year: 2025,
    rows: [
      { name: "기업 · 제조사", value: 128400000 },
      { name: "유통 · 마트", value: 71200000 },
      { name: "경기 · 전국푸드뱅크 배분", value: 64300000 },
      { name: "종교단체 · 시민단체", value: 42500000 },
      { name: "개인", value: 20300000 }
    ]
  },

  /* 재정 결산 (최근 확정 연도) — 물품이 아닌 현금 수입·지출 */
  budget: {
    year: 2025,
    income: [
      { name: "보조금 (국비 · 도비 · 시비)", value: 96000000 },
      { name: "후원금 (지정 · 비지정)", value: 31500000 },
      { name: "협동조합 사업수입", value: 12800000 },
      { name: "기타 수입 (이자 등)", value: 900000 }
    ],
    expense: [
      { name: "인건비", value: 72400000 },
      { name: "운영비 (임차 · 차량 · 공과금)", value: 38100000 },
      { name: "사업비 (물품 구입 · 배분 · 행사)", value: 26700000 },
      { name: "기타 (수수료 · 예비비)", value: 2300000 }
    ]
  },

  /* 공개 문서 — 파일을 docs/ 폴더에 넣고 경로를 적으면 내려받기 링크가 생깁니다 */
  documents: [
    { year: 2025, title: "2025년 결산서 및 운영실적 보고", file: "" },
    { year: 2024, title: "2024년 결산서 및 운영실적 보고", file: "" },
    { year: 2025, title: "기부식품등 제공사업장 지정 확인", file: "" }
  ]
};
