// 그 날 휴무자 알림 — 매일 2회 자동 발송 (대표 지시)
//   1) 00:01 KST (15:01 UTC) — 자정 직후 알림
//   2) 07:30 KST (22:30 UTC) — 출근 전 리마인드
// 발송 로직은 api/_notify.js 공유 모듈로 분리 (즉시 발송에서도 같은 함수 사용)

import { sql } from '../_db.js';
import { ALIGO, kstToday, buildOffMessage, sendAdminFriendtalk, sendAdminAlimtalk } from '../_notify.js';

export default async function handler(req, res) {
  // Vercel Cron 만 호출 가능 (Authorization: Bearer CRON_SECRET)
  // 수동 테스트도 같은 헤더로 가능 (?force=1 도 허용)
  const auth = req.headers.authorization || '';
  const isCron = auth === `Bearer ${ALIGO.cron}`;
  const isManual = req.query.force === '1';
  if (!isCron && !isManual) {
    return res.status(401).json({ error: 'unauthorized — Bearer CRON_SECRET 또는 ?force=1 필요' });
  }

  // 우리 함수의 외부 IP 확인 — 알리고 화이트리스트 등록용 (대표 지시)
  // ?whoami=1 → ipify 호출해서 우리 서버 외부 IP 반환
  if (req.query.whoami === '1') {
    const samples = [];
    for (let i = 0; i < 5; i++) {
      try {
        const r = await fetch('https://api.ipify.org?format=json');
        const j = await r.json();
        samples.push(j.ip);
      } catch (e) { samples.push('err:' + e.message); }
    }
    return res.status(200).json({ samples, unique: [...new Set(samples)] });
  }

  // 테스트 발송 — ?test=1 알림톡 UH_9702 직접 발송 (가짜 휴무자 1건)
  // 응답에 알리고 raw 결과 포함 → senderkey/템플릿 매칭 즉시 판정
  if (req.query.test === '1') {
    const r = await sendAdminAlimtalk({
      name: '테스트', date: kstToday(), type: 'OFF',
      overrideReceivers: req.query.to
        ? String(req.query.to).split(/[,\s]+/).filter(Boolean) : null,
    });
    return res.status(200).json({ ok: r.ok, mode: 'alimtalk-test', aligo: r.sent });
  }

  // ?date=YYYY-MM-DD 로 임의 날짜 미리 발송 (대표 지시 — 테스트용)
  const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : kstToday();
  // ?to=01043008739,01012345678 — 특정 번호로만 발송 (테스트 1회용, 대표 지시)
  const overrideReceivers = req.query.to
    ? String(req.query.to).split(/[,\s]+/).filter(Boolean)
    : null;

  // 오늘 휴무자 — REJECTED 만 제외하고 REQUESTED/APPROVED 둘 다 메시지 포함 (대표 지시)
  const rows = await sql`
    SELECT a.type, u.name, u.tier
    FROM attendance_records a
    JOIN users u ON u.id = a.user_id
    WHERE a.work_date = ${today}
      AND a.status <> 'REJECTED'
      AND a.type <> 'WORK'
      AND u.name NOT IN ('2','3')
    ORDER BY u.tier ASC, u.name ASC
  `;

  if (!rows.length) {
    return res.status(200).json({ ok: true, date: today, count: 0, sent: false, note: '오늘 휴무자 없음 — 발송 안 함' });
  }

  // 알림톡(UH_9702)은 휴무자 1명 단위 템플릿 — 다중 휴무 시 N건 발송
  // 카톡 실패 시 알리고 콘솔 대체발송 문자(SMS)로 자동 폴백
  const perPerson = await Promise.all(
    rows.map(r => sendAdminAlimtalk({
      name: r.name, date: today, type: r.type, overrideReceivers,
    }))
  );
  const message = buildOffMessage({ rows, date: today });
  const result = {
    ok: perPerson.every(p => p.ok),
    sent: perPerson.flatMap(p => p.sent || []),
  };

  return res.status(200).json({
    ok: result.ok,
    date: today,
    count: rows.length,
    sent: true,
    aligo: result.sent,
    preview: message,
  });
}
