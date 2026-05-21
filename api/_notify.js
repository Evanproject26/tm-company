// 알리고 SMS/LMS 발송 공유 모듈
// 알리고가 친구톡 자유메시지 API(/akv10/friendtalk/send/) 폐기 → 404
// 대체: SMS/LMS (/send/) 로 우선 발송. 같은 apikey/userid/sender 재사용.
// 카톡으로 보내려면 알리고 콘솔에서 브랜드메시지 템플릿 등록 후 별도 작업.
// ADMIN_PHONE 은 콤마 구분 다중 번호 지원 ("01057411114,01043008739")

export const TYPE_LABEL = {
  OFF: '휴무',
  HALF_AM: '오전반차',
  HALF_PM: '오후반차',
  MONTHLY: '월차',
  ANNUAL: '연차',
  SICK: '병가',
  HOLIDAY: '공휴일',
  UNAUTHORIZED: '무단결근',
  WORK: '근무',
};

export const ALIGO = {
  apikey:    process.env.ALIGO_API_KEY   || 'pw8x8s9kajo31bcd96nv2os4bkqcl1wf',
  userid:    process.env.ALIGO_USER_ID   || 'tami98',
  senderkey: process.env.ALIGO_SENDERKEY || '422ebc0f44745b54bc7caf91696161873f4690b4',
  sender:    process.env.ALIGO_SENDER    || '18009678',
  // 대표 폰 + 추가 2번호 동시 발송 — 대표 지시
  admin:     process.env.ADMIN_PHONE     || '01057411114,01043008739,01057551630',
  cron:      process.env.CRON_SECRET     || 'c93513d3de07036d44106e7148bceaedd417074b544cbd259d409b52d892ebed',
};

// 일회성 단일번호 강제 발송 날짜 (대표 지시) — 이 날 KST 0시~23시59분에는
// ADMIN_PHONE 무시하고 SINGLE_ONLY_RECEIVER 한 번호로만 발송.
// 날짜 지나면 자동으로 ADMIN_PHONE 3번호 발송으로 복원.
const SINGLE_ONLY_DATE     = '2026-05-21';
const SINGLE_ONLY_RECEIVER = '01043008739';

// EXCLUDE_PHONES — 콤마 구분 번호 목록. 비워두면 ADMIN_PHONE 전체 발송.
// 대표 지시: "내가 말하면 8739 제외" → 그때 Vercel 환경변수에 01043008739 등록.
export function adminReceivers() {
  if (kstToday() === SINGLE_ONLY_DATE) {
    return [SINGLE_ONLY_RECEIVER];
  }
  const exclude = new Set(
    String(process.env.EXCLUDE_PHONES || '')
      .split(/[,\s]+/)
      .map(s => s.replace(/[^0-9]/g, ''))
      .filter(Boolean)
  );
  return String(ALIGO.admin || '')
    .split(/[,\s]+/)
    .map(s => s.replace(/[^0-9]/g, ''))
    .filter(s => s.length >= 10 && !exclude.has(s));
}

export function kstToday() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 알리고 SMS/LMS 단건 발송 — 90바이트 초과 시 자동 LMS 전환
// RELAY_URL+RELAY_API_KEY 설정 시 도쿄 EC2 릴레이 경유 (고정 IP 43.206.72.219).
// 미설정 시 알리고 직접 호출 (기존 동작 — Vercel egress IP 화이트리스트 의존).
async function sendOne({ message, receiver, subject }) {
  const msg_type = message.length > 90 ? 'LMS' : 'SMS';
  const payload = {
    key: ALIGO.apikey,
    user_id: ALIGO.userid,
    sender: ALIGO.sender,
    receiver, msg: message, title: subject,
    msg_type, testmode_yn: 'N',
  };

  const relayUrl = process.env.RELAY_URL;
  const relayKey = process.env.RELAY_API_KEY;
  let res, text;
  if (relayUrl && relayKey) {
    res = await fetch(`${relayUrl}/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-relay-key': relayKey },
      body: JSON.stringify(payload),
    });
    text = await res.text();
  } else {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) form.append(k, v);
    res = await fetch('https://apis.aligo.in/send/', { method: 'POST', body: form });
    text = await res.text();
  }

  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  const okBody = String(json?.result_code) === '1';
  return { receiver, status: res.status, ok: res.ok && okBody, body: json };
}

// 다중 수신자 발송 — ADMIN_PHONE 콤마 구분 모두에 1건씩 전송
// overrideReceivers 지정 시 그 번호로만 발송 (테스트용, 대표 지시)
export async function sendAdminFriendtalk({ message, subject, overrideReceivers }) {
  const receivers = Array.isArray(overrideReceivers) && overrideReceivers.length
    ? overrideReceivers.map(s => String(s).replace(/[^0-9]/g, '')).filter(Boolean)
    : adminReceivers();
  if (!receivers.length) return { ok: false, error: 'no-admin-phone', sent: [] };
  const results = await Promise.all(
    receivers.map(r => sendOne({ message, receiver: r, subject }))
  );
  const okAll = results.every(r => r.ok);
  return { ok: okAll, sent: results };
}

// 알리고 알림톡 단건 — 템플릿코드 UH_9702 (휴무 알림)
// 카톡 실패 시 failover=Y 로 알리고가 자동 SMS 대체발송 (콘솔 등록된 대체문구 사용)
export const ALIMTALK_TPL_CODE = process.env.ALIMTALK_TPL_OFF || 'UH_9702';
export function buildAlimtalkOffBody({ name, date, type }) {
  const label = TYPE_LABEL[type] || type;
  // 템플릿 본문과 글자단위 일치 — 변수 외 공백/줄바꿈 변경 금지
  return `[티엠컴퍼니 휴무 알림]\n 직원명: ${name}\n 일자: ${date}\n 휴무유형: ${label}`;
}
async function sendOneAlimtalk({ name, date, type, receiver }) {
  const body = buildAlimtalkOffBody({ name, date, type });
  const payload = {
    apikey:    ALIGO.apikey,
    userid:    ALIGO.userid,
    senderkey: ALIGO.senderkey,
    tpl_code:  ALIMTALK_TPL_CODE,
    sender:    ALIGO.sender,
    receiver_1: receiver,
    subject_1:  '[티엠컴퍼니 휴무 알림]',
    message_1:  body,
    failover:   'Y',
    re_subject_1: '[티엠컴퍼니 휴무 알림]',
    re_message_1: body,
    testmode_yn: 'N',
  };

  const relayUrl = process.env.RELAY_URL;
  const relayKey = process.env.RELAY_API_KEY;
  let res, text;
  if (relayUrl && relayKey) {
    res = await fetch(`${relayUrl}/alimtalk`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-relay-key': relayKey },
      body: JSON.stringify(payload),
    });
    text = await res.text();
  } else {
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) form.append(k, v);
    res = await fetch('https://kakaoapi.aligo.in/akv10/alimtalk/send/', {
      method: 'POST', body: form,
    });
    text = await res.text();
  }

  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  const okBody = String(json?.code) === '0';
  return { receiver, status: res.status, ok: res.ok && okBody, body: json };
}
export async function sendAdminAlimtalk({ name, date, type, overrideReceivers }) {
  const receivers = Array.isArray(overrideReceivers) && overrideReceivers.length
    ? overrideReceivers.map(s => String(s).replace(/[^0-9]/g, '')).filter(Boolean)
    : adminReceivers();
  if (!receivers.length) return { ok: false, error: 'no-admin-phone', sent: [] };
  const results = await Promise.all(
    receivers.map(r => sendOneAlimtalk({ name, date, type, receiver: r }))
  );
  const okAll = results.every(r => r.ok);
  return { ok: okAll, sent: results };
}

// 휴무자 1건 메시지 ([티엠컴퍼니 휴무 알림] — 직원명/일자/휴무유형 카드)
export function buildOffMessage({ rows, date, header }) {
  const blocks = rows.map((r, i) =>
    `${i+1}. 직원명: ${r.name}\n   일자: ${date}\n   휴무유형: ${TYPE_LABEL[r.type] || r.type}`
  );
  const title = header || '[티엠컴퍼니 휴무 알림]';
  return `${title}
총 ${rows.length}명 — ${date}

${blocks.join('\n\n')}

— 자동 발송`;
}

// 단일 휴무 즉시 알림 (등록/승인 시점)
// kind: 'REGISTERED' | 'APPROVED' | 'REJECTED'
export function buildSingleOffMessage({ name, date, type, kind }) {
  const label = TYPE_LABEL[type] || type;
  const head =
    kind === 'APPROVED'  ? '[티엠컴퍼니 휴무 승인]' :
    kind === 'REJECTED'  ? '[티엠컴퍼니 휴무 반려]' :
                           '[티엠컴퍼니 휴무 등록]';
  return `${head}
직원명: ${name}
일자: ${date}
휴무유형: ${label}

— 자동 발송 (등록·승인 즉시)`;
}
