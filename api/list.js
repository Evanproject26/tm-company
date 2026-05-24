import { sql, ensureSchema } from './_db.js';

// 통합 리스트: 자체광고(applications) + 업체 업로드(db_pool) 모두 반환
// 각 항목은 같은 형태로 정규화: id, source(A/B), source_code, source_label, source_color,
//                                name, phone, carrier, model, created_at(=유입일시), downloaded_at
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await ensureSchema();

    // 1. 자체광고 (KPI/Demand) — 기존 applications 테이블
    const apps = await sql`
      SELECT id, source, name, phone, carrier, model, created_at, downloaded_at
      FROM applications
      ORDER BY created_at DESC
      LIMIT 5000
    `;

    // 2. 업체 업로드 + 자체광고 통합 풀 — db_pool 테이블 (KEY: inflow_at = 유입/업로드 일시)
    const pool = await sql`
      SELECT
        p.id,
        p.name, p.phone, p.carrier, p.model,
        p.upload_batch, p.inflow_at, p.assigned_to, p.assigned_at, p.status,
        s.code AS source_code, s.label AS source_label, s.color AS source_color
      FROM db_pool p
      JOIN db_sources s ON s.id = p.source_id
      WHERE p.status != 'DELETED'
      ORDER BY p.inflow_at DESC
      LIMIT 5000
    `;

    // source 코드 → 어드민 라벨 매핑
    // A: 기존 apply_google_kpi (비공개 처리됨)
    // B: 기존 apply_google_demand (삭제됨)
    // C: apply_google3 / D: apply_google4
    // E: apply_kpi_max / F: apply_demand (신규 활성 랜딩)
    const SRC_MAP = {
      A: { code: 'SELF_KPI',       label: 'KPI(자체)',      color: '#7c3aed' },
      B: { code: 'SELF_DEMAND',    label: 'Demand(자체)',   color: '#0ea5e9' },
      C: { code: 'SELF_GOOGLE3',   label: 'google3',        color: '#16a34a' },
      D: { code: 'SELF_GOOGLE4',   label: 'google4',        color: '#f59e0b' },
      E: { code: 'SELF_KPI_MAX',   label: 'kpi_max',        color: '#db2777' },
      F: { code: 'SELF_DEMAND_NEW',label: 'demand',         color: '#0891b2' },
    };

    // 정규화: 둘 다 동일 형태로
    const normalizedApps = apps.map(a => {
      const m = SRC_MAP[a.source] || { code: 'UNKNOWN', label: a.source || '?', color: '#6b7280' };
      return {
      id: 'A' + a.id,
      origin: 'application',
      source: a.source,
      source_code: m.code,
      source_label: m.label,
      source_color: m.color,
      name: a.name,
      phone: a.phone,
      carrier: a.carrier,
      model: a.model,
      created_at: a.created_at,         // 유입 일시
      downloaded_at: a.downloaded_at,
      assigned_name: null,
      status: a.downloaded_at ? 'DONE' : 'NEW'
      };
    });

    const normalizedPool = pool.map(p => ({
      id: 'P' + p.id,
      origin: 'pool',
      source: p.source_code === 'SELF' ? 'A' : 'X',     // legacy mapping
      source_code: p.source_code,
      source_label: p.source_label,
      source_color: p.source_color,
      name: p.name,
      phone: p.phone,
      carrier: p.carrier,
      model: p.model,
      created_at: p.inflow_at,          // 유입 일시 = 업로드 일시
      downloaded_at: p.assigned_at,     // 분배 = 다운/처리됨 으로 매핑
      assigned_name: null,
      status: p.status,
      upload_batch: p.upload_batch
    }));

    // 합쳐서 시간역순
    const merged = [...normalizedApps, ...normalizedPool]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5000);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, items: merged });
  } catch (e) {
    console.error('list error:', e);
    return res.status(500).json({ error: 'server error', detail: String(e.message || e) });
  }
}
