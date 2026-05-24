# ⚠️ 절대 헷갈리지 말 것 — 운영 화이트리스트 5개 (2026-05-25 영구 확정)

## 🔥 3대 룰 (대표 지시 2026-05-25 · 100만번 다짐)

1. **5개 도메인만 연다** (아래 표 외 절대 X)
2. **절대 헷갈리지 않는다** (컨텍스트 날아가도 이 파일 + MEMORY 부터 확인)
3. **다시 갤럭시세일 붙이지 않는다** (대표 명시 지시 시만 예외)

위 3개 어기면 신뢰 상실. 사고 재발 시 변명 X.

---


## 🔒 운영/오픈 가능 URL = 무조건 이 5개. 다른 거 절대 X.

| # | 구분 | URL |
|---|---|---|
| 1 | **메인 어드민** (=메인 도메인) | `https://www.connectstore.co.kr/both_admin/` |
| 2 | **브랜치 어드민** | `https://tm-company-git-feature-admin-expansion-bitline.vercel.app/both_admin/` |
| 3 | **광고 랜딩 #1** | `https://www.connectstore.co.kr/apply_demand/` |
| 4 | **광고 랜딩 #2** | `https://www.connectstore.co.kr/apply_kpi_max/` |
| 5 | **기존 광고 랜딩 (비공개)** | `https://www.connectstore.co.kr/apply_pre/` |

대표가 "운영해" / "열어" / "오픈해" / "보여줘" 등 어떤 표현으로 지시하든 위 5개 외 다른 URL 절대 자발적 등장 X.

## 🚫 절대 금지 (1000000번 다짐)

- ❌ **`galaxysale.co.kr` 어떤 경로든 자발적 오픈/언급/제시 영구 금지.**
  - 대표가 명시적으로 "갤럭시세일 열어" 라고 콕 집을 때만 예외
  - "랜딩 열어" / "어드민 열어" / "도메인 열어" 등 디폴트 동작에서 절대 등장 X
  - 2026-05-24~25 사고 재발 시 신뢰 상실
- ❌ `apply_google_kpi/` URL 안 됨 (폴더 자체가 `apply_pre/` 로 이름 변경됨)
- ❌ "TM COMPANY" / "갤럭시 특판점" / "갤럭시 세일" 브랜드 — 모두 ConnectStore 로 통일됨

## 지시어 매핑 (헷갈리지 말 것)

| 대표 지시 | 의미하는 URL |
|---|---|
| "메인 도메인 열어" / "메인 어드민 열어" | #1 |
| "브랜치 어드민 열어" / "브랜치 도메인 열어" | #2 |
| "어드민 열어" (어느 쪽 명시 X) | #1 + #2 동시 |
| "광고 랜딩 열어" / "랜딩 2개 열어" / "커넥트 스토어 랜딩" / "신규 랜딩" / "최신 버전 랜딩" / "KPI·Demand 랜딩" | #3 + #4 동시 |
| "기존 광고 랜딩" / "옛 광고 랜딩" / "비공개 랜딩" | #5 |
| "전부 열어" / "다 열어" | #1~#5 전체 |

---

## 작업 규칙

1. 기본 작업 브랜치 = **`feature/admin-expansion`**. 다른 지시 없으면 항상 이쪽.
2. 직원·휴무·캘린더·승인·SMS 알림 관련 작업 → **`feature/admin-expansion` 만**.
3. 광고 신청 폼·신청자 DB·KPI/Demand 관련 작업 → **`main` 만**.
4. **두 브랜치 절대 머지 금지.** 메인에 브랜치 코드 들어가면 메인 어드민이 흰 화면 됨 (실제 사고 발생함).

## Vercel 함수 12개 제한

- Hobby 플랜이라 한 deployment 당 함수 12개 한도. 초과하면 빌드 실패.
- 함수 늘릴 일 있으면 dispatcher 또는 vercel.json rewrites 로 합쳐서 12개 이하 유지.
- 현재 `vercel.json` 에 rewrites 4개 (att/cancel·pending, auth/pending·ip-groups) 가 dispatcher endpoint 로 연결되어 있음.
