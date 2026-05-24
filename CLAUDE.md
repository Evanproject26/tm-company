# ⚠️ 절대 헷갈리지 말 것 — 도메인 / 랜딩 / 어드민 분리

## 📌 광고 랜딩 2개 (2026-05-25 부터 영구 확정)

**모든 광고 랜딩 작업/오픈은 무조건 아래 2개 URL 만 사용.**

| # | URL |
|---|---|
| 1 | **`https://www.connectstore.co.kr/apply_kpi_max/`** |
| 2 | **`https://www.connectstore.co.kr/apply_demand/`** |

- 브랜드: **ConnectStore (커넥트 스토어)**
- 도메인: **connectstore.co.kr** (www. 정규)
- 폴더: `apply_kpi_max/` + `apply_demand/` (main 브랜치)
- 디자인: "공식 도매특가" 빅 텍스트 + Galaxy S26 / S26+ / S26 Ultra

### 🚫 절대 사용 금지 (헷갈리면 사고)

- ❌ `apply_google_kpi/` — 신규 랜딩 2개에 **포함 안 됨**. 옛 디자인. 손대지 말 것.
- ❌ **`galaxysale.co.kr/*` — 곧 폐기될 도메인. 절대 자발적으로 열거나 언급/제시 금지.**
  - 대표가 명시적으로 "갤럭시세일 열어" 라고 지시할 때만 예외 (현재 어드민은 아직 거기 있음)
  - "랜딩 열어" / "도메인 열어" / 모든 디폴트 동작에서 절대 galaxysale 등장 X
  - 2026-05-24 사고: 대표가 격노함. 두 번 다시 헷갈리지 말 것.
- ❌ "TM COMPANY" / "갤럭시 특판점" / "갤럭시 세일" — 옛 브랜드. 모두 ConnectStore 로 통일됨.

### "광고 랜딩" 동의어 (전부 같은 의미)
"광고 랜딩 2개" = "커넥트 스토어 랜딩" = "신규 랜딩" = "최신 버전 랜딩" = "KPI / Demand 랜딩"
→ 무조건 위 표의 2개 URL 만 의미함.

---

## 📌 메인 도메인 / 메인 어드민 (2026-05-25 영구 확정)

**"메인 도메인 열어" / "메인 어드민 열어" = 무조건 아래 URL.**

```
https://www.connectstore.co.kr/both_admin
```

❌ galaxysale.co.kr/both_admin/ 자발적 오픈/언급 영구 금지.

## 어드민 (광고 랜딩과 별개)

이 프로젝트는 **2개의 어드민**이 운영된다. **절대 섞지 말 것**.

| 부르는 이름 | URL | 브랜치 | 내용 |
|---|---|---|---|
| **메인 어드민** (= 메인 도메인) | `https://www.connectstore.co.kr/both_admin/` | `main` | 광고 페이지 신청자 DB 어드민 |
| **브랜치 어드민** | `https://tm-company-git-feature-admin-expansion-bitline.vercel.app/both_admin/` | `feature/admin-expansion` | 직원·휴무·캘린더·승인 관리 SPA |

## 작업 규칙

1. 기본 작업 브랜치 = **`feature/admin-expansion`**. 다른 지시 없으면 항상 이쪽.
2. 직원·휴무·캘린더·승인·SMS 알림 관련 작업 → **`feature/admin-expansion` 만**.
3. 광고 신청 폼·신청자 DB·KPI/Demand 관련 작업 → **`main` 만**.
4. **두 브랜치 절대 머지 금지.** 메인에 브랜치 코드 들어가면 메인 어드민이 흰 화면 됨 (실제 사고 발생함).
5. "어드민 열어" 지시 시 — 어느 어드민인지 명시 안 했으면 **두 도메인 따로 1개씩** 연다.
6. "광고 랜딩 열어" 지시 시 — 위 광고 랜딩 표의 **2개 URL 만** 연다.

## Vercel 함수 12개 제한

- Hobby 플랜이라 한 deployment 당 함수 12개 한도. 초과하면 빌드 실패.
- 함수 늘릴 일 있으면 dispatcher 또는 vercel.json rewrites 로 합쳐서 12개 이하 유지.
- 현재 `vercel.json` 에 rewrites 4개 (att/cancel·pending, auth/pending·ip-groups) 가 dispatcher endpoint 로 연결되어 있음.
