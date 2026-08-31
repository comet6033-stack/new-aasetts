import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Home, Wallet, BarChart3, Settings, Plus, Pencil, Trash2, Download,
  Upload, Shield, X, ChevronRight, RotateCcw, TrendingUp, Check, Eye, Bell, Info
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, LabelList
} from 'recharts';

/* ----------------------------- theme ----------------------------- */

const C = {
  bg: '#0A0E1A',
  bgAlt: '#0D1220',
  card: '#111726',
  cardAlt: '#171F32',
  border: '#212B41',
  borderRed: '#3A2233',
  cardRed: '#181119',
  mint: '#4ADE9E',
  mintDim: '#2F6B54',
  mintDark: '#06251A',
  blue: '#60A5FA',
  amber: '#FBBF24',
  red: '#F87171',
  redBg: '#241417',
  redBg2: '#2A0A0A',
  purple: '#C084FC',
  pink: '#F472B6',
  indigo: '#818CF8',
  green2: '#34D399',
  gray: '#8A93A6',
  muted: '#818EA3',
  faint: '#525E77',
  soft: '#C7CEDD',
  white: '#F5F7FB',
};

const DISPLAY = { fontFamily: "'Playfair Display', Georgia, serif" };
const BODY_FONT = "'Inter', system-ui, -apple-system, sans-serif";
const TAB = { fontVariantNumeric: 'tabular-nums' };
const EYEBROW = { letterSpacing: '0.18em', fontWeight: 600, fontSize: 11 };

/* ----------------------------- constants ----------------------------- */

const RECORDS_KEY = 'my-asset-records-v1';
const HIDDEN_KEY = 'my-asset-hidden-v1';

const CATEGORIES = [
  { key: 'usStock', label: '미국 주식', color: C.mint },
  { key: 'krStock', label: '한국 주식', color: C.blue },
  { key: 'crypto', label: '크립토', color: C.amber },
  { key: 'pensionMe', label: '연금 · 나', color: C.red },
  { key: 'pensionSpouse1', label: '연금 · 연우', color: C.purple },
  { key: 'pensionSpouse2', label: '연금 · 연서', color: C.pink },
  { key: 'realEstate', label: '부동산', color: C.indigo },
  { key: 'cash', label: '현금성 자산', color: C.green2 },
  { key: 'etc', label: '기타', color: C.gray },
];

const PNL_CATEGORIES = [
  { key: 'usStock', label: '미국 주식', color: C.mint },
  { key: 'krStock', label: '한국 주식', color: C.blue },
  { key: 'crypto', label: '크립토', color: C.amber },
  { key: 'pensionMe', label: '연금 · 나', color: C.red },
  { key: 'pensionSpouse1', label: '연금 · 연우', color: C.purple },
  { key: 'pensionSpouse2', label: '연금 · 연서', color: C.pink },
];

// 홈 "투자 성과" 카드에는 매매형 자산(주식/크립토)만 표시
const BAR_PNL_CATEGORIES = PNL_CATEGORIES.slice(0, 3);
const INVEST_KEYS = ['usStock', 'krStock', 'crypto'];

const emptyAssets = () => CATEGORIES.reduce((acc, c) => ({ ...acc, [c.key]: 0 }), {});
const emptyPnl = () => PNL_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.key]: 0 }), {});

function seedRecords() {
  return [
    {
      id: 'seed-2025-ab',
      period: '2025-AB',
      recordDate: '2025-12',
      note: '',
      assets: {
        usStock: 42000000, krStock: 22000000, crypto: 4000000,
        pensionMe: 11000000, pensionSpouse1: 12000000, pensionSpouse2: 7650000,
        realEstate: 8000000, cash: 6000000, etc: 0,
      },
      pnl: {
        usStock: 7612650, krStock: 5927330, crypto: 1231400,
        pensionMe: 0, pensionSpouse1: 0, pensionSpouse2: 0,
      },
    },
    {
      id: 'seed-2026-a',
      period: '2026-A',
      recordDate: '2026-06',
      note: '',
      assets: {
        usStock: 83716470, krStock: 33486588, crypto: 5581098,
        pensionMe: 16743294, pensionSpouse1: 18603660, pensionSpouse2: 11162196,
        realEstate: 9301830, cash: 7441464, etc: 0,
      },
      pnl: {
        usStock: 14258000, krStock: -7960000, crypto: -2049000,
        pensionMe: 4932000, pensionSpouse1: 7917820, pensionSpouse2: 785757,
      },
    },
  ];
}

/* ------------------------------ helpers ------------------------------ */

function won(n) {
  const v = Math.round(n || 0);
  return `\u20a9${v.toLocaleString('ko-KR')}`;
}
function eok(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}${(Math.abs(n) / 1e8).toFixed(2)}\uc5b5`;
}
function manSigned(n) {
  const sign = n >= 0 ? '+' : '-';
  const v = Math.round(Math.abs(n) / 10000);
  return `${sign}${v.toLocaleString('ko-KR')}\ub9cc`;
}
function formatM(n) {
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(2)}\uc5b5`;
  if (abs >= 10000) return `${sign}${Math.round(abs / 10000).toLocaleString('ko-KR')}\ub9cc`;
  return `${sign}${won(abs)}`;
}
function amountKr(n) {
  const abs = Math.abs(n);
  if (abs >= 1e8) return `${(abs / 1e8).toFixed(2)}\uc5b5`;
  if (abs >= 10000) return `${Math.round(abs / 10000).toLocaleString('ko-KR')}\ub9cc`;
  return won(abs);
}
// 숫자 자릿수가 늘어나도 한 줄 안에 들어가도록 폰트 크기를 자동으로 줄여줌
function fitFontSize(str, { base = 42, min = 20, threshold = 9, rate = 2.6 } = {}) {
  const len = (str || '').length;
  if (len <= threshold) return base;
  const shrink = (len - threshold) * rate;
  return Math.max(min, Math.round(base - shrink));
}
function pctSigned(n) {
  if (!isFinite(n)) return '\u2014';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}
function moneySigned(n) {
  const sign = n >= 0 ? '+' : '-';
  return `${sign}${won(Math.abs(n))}`;
}
function toDate(ym) {
  return new Date(`${ym}-01T00:00:00`);
}
function mask(str) {
  return '\u2022'.repeat(Math.max(6, Math.min(str.length, 12)));
}
function humanPeriod(recordDate) {
  const year = recordDate.slice(0, 4);
  const month = parseInt(recordDate.slice(5, 7), 10);
  const quarter = Math.ceil(month / 3);
  return {
    label: `${year} · ${quarter}\ubd84\uae30`,
    dateLine: `${year}\ub144 ${month}\uc6d4 \uae30\uc900`,
    axis: `${year}.${quarter}Q`,
  };
}
function sumKeys(rec, keys, hidden) {
  return keys.filter((k) => !hidden.has(k)).reduce((s, k) => s + (rec.assets[k] || 0), 0);
}

/* ------------------------------- toggle ------------------------------- */

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full relative shrink-0"
      style={{ width: 46, height: 27, backgroundColor: on ? C.mint : '#242F47', transition: 'background-color .2s' }}
      aria-pressed={on}
    >
      <span
        className="absolute rounded-full"
        style={{
          top: 2, left: 2, width: 23, height: 23, backgroundColor: C.bg,
          transform: on ? 'translateX(19px)' : 'translateX(0)', transition: 'transform .2s',
        }}
      />
    </button>
  );
}

/* ------------------------------ tooltip ------------------------------ */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-xl" style={{ backgroundColor: C.bgAlt, border: `1px solid ${C.border}` }}>
      <div className="text-xs mb-1" style={{ color: C.muted }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="text-sm" style={{ color: p.color, fontWeight: 600, ...TAB }}>
          {p.name} {won(p.value)}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ top header ------------------------------ */

function TopHeader({ onBell }) {
  return (
    <div className="flex items-center justify-between mb-9">
      <div className="flex items-center gap-2.5">
        <div className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <TrendingUp size={14} style={{ color: C.mint }} />
        </div>
        <div>
          <div className="text-sm" style={{ fontWeight: 700, letterSpacing: '0.02em' }}>MY ASSET</div>
          <div className="text-[10px] mt-0.5" style={{ color: C.faint }}>Private Wealth Dashboard</div>
        </div>
      </div>
      <button onClick={onBell} className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, color: C.faint }}>
        <Bell size={17} />
      </button>
    </div>
  );
}

/* -------------------------------- app --------------------------------- */

export default function MyAssetApp() {
  const [tab, setTab] = useState('home');
  const [records, setRecords] = useState([]);
  const [hidden, setHidden] = useState(new Set());
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null);
  const [range, setRange] = useState('all');
  const [privacy, setPrivacy] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  useEffect(() => {
    (async () => {
      let r = null;
      try {
        const res = await window.storage.get(RECORDS_KEY, false);
        r = res ? JSON.parse(res.value) : null;
      } catch { r = null; }
      if (!r) {
        r = seedRecords();
        try { await window.storage.set(RECORDS_KEY, JSON.stringify(r), false); } catch {}
      }
      setRecords(r);

      let h = new Set();
      try {
        const res = await window.storage.get(HIDDEN_KEY, false);
        h = res ? new Set(JSON.parse(res.value)) : new Set();
      } catch { h = new Set(); }
      setHidden(h);
      setReady(true);
    })();
  }, []);

  const persistRecords = useCallback(async (next) => {
    setRecords(next);
    try { await window.storage.set(RECORDS_KEY, JSON.stringify(next), false); } catch {}
  }, []);
  const persistHidden = useCallback(async (nextSet) => {
    setHidden(nextSet);
    try { await window.storage.set(HIDDEN_KEY, JSON.stringify([...nextSet]), false); } catch {}
  }, []);

  const sorted = useMemo(
    () => [...records].sort((a, b) => a.recordDate.localeCompare(b.recordDate)),
    [records]
  );
  const latest = sorted[sorted.length - 1] || null;
  const prev = sorted[sorted.length - 2] || null;

  const netWorthOf = useCallback(
    (rec) => CATEGORIES.reduce((s, c) => (hidden.has(c.key) ? s : s + (rec.assets[c.key] || 0)), 0),
    [hidden]
  );
  const pnlTotalOf = useCallback(
    (rec) => PNL_CATEGORIES.reduce((s, c) => (hidden.has(c.key) ? s : s + (rec.pnl[c.key] || 0)), 0),
    [hidden]
  );

  const latestNW = latest ? netWorthOf(latest) : 0;
  const prevNW = prev ? netWorthOf(prev) : null;
  const yoyDiff = prevNW !== null ? latestNW - prevNW : null;
  const yoyPct = prevNW ? (yoyDiff / prevNW) * 100 : null;
  const latestPnl = latest ? pnlTotalOf(latest) : 0;

  const rangedRecords = useMemo(() => {
    if (!latest) return [];
    if (range === 'all') return sorted;
    const years = range === '1y' ? 1 : range === '3y' ? 3 : 5;
    const cutoff = toDate(latest.recordDate);
    cutoff.setFullYear(cutoff.getFullYear() - years);
    return sorted.filter((r) => toDate(r.recordDate) >= cutoff);
  }, [sorted, range, latest]);

  // 누적 손익(원금 라인 계산용) — 전체 기록 기준으로 누적해 정확한 원금을 유지
  const cumPnlById = useMemo(() => {
    let running = 0;
    const map = {};
    sorted.forEach((r) => { running += pnlTotalOf(r); map[r.id] = running; });
    return map;
  }, [sorted, pnlTotalOf]);

  const growthSeries = rangedRecords.map((r) => {
    const nw = netWorthOf(r);
    const principal = nw - (cumPnlById[r.id] || 0);
    return { ...humanPeriod(r.recordDate), netWorth: nw, principal };
  });

  const donutData = useMemo(() => {
    if (!latest) return [];
    return CATEGORIES.filter((c) => !hidden.has(c.key) && (latest.assets[c.key] || 0) > 0).map(
      (c) => ({ name: c.label, value: latest.assets[c.key] || 0, color: c.color })
    );
  }, [latest, hidden]);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  const pnlMax = latest ? Math.max(1, ...BAR_PNL_CATEGORIES.map((c) => Math.abs(latest.pnl[c.key] || 0))) : 1;
  const pnlProfit = latest ? BAR_PNL_CATEGORIES.reduce((s, c) => s + Math.max(0, latest.pnl[c.key] || 0), 0) : 0;
  const pnlLoss = latest ? BAR_PNL_CATEGORIES.reduce((s, c) => s + Math.max(0, -(latest.pnl[c.key] || 0)), 0) : 0;

  const pnlDetail = useMemo(() => {
    if (!latest) return [];
    return PNL_CATEGORIES.filter((c) => !hidden.has(c.key)).map((c) => ({ ...c, value: latest.pnl[c.key] || 0 }));
  }, [latest, hidden]);

  const pnlShareByKey = useMemo(() => {
    const map = {};
    donutData.forEach((d) => { map[d.name] = donutTotal ? Math.round((d.value / donutTotal) * 100) : 0; });
    return map;
  }, [donutData, donutTotal]);

  const maxRec = sorted.length ? sorted.reduce((m, r) => (netWorthOf(r) > netWorthOf(m) ? r : m)) : null;
  const minRec = sorted.length ? sorted.reduce((m, r) => (netWorthOf(r) < netWorthOf(m) ? r : m)) : null;
  const cumPnl = sorted.reduce((s, r) => s + pnlTotalOf(r), 0);
  const firstRec = sorted[0] || null;
  const sinceFirstPct = firstRec && netWorthOf(firstRec)
    ? ((latestNW - netWorthOf(firstRec)) / netWorthOf(firstRec)) * 100 : null;

  const netWorthLineSeries = sorted.map((r) => ({ ...humanPeriod(r.recordDate), netWorth: netWorthOf(r) }));
  const pnlBarSeries = sorted.map((r) => ({ year: r.recordDate.slice(0, 4), pnl: pnlTotalOf(r) }));

  const changeBreakdown = useMemo(() => {
    if (!firstRec || !latest || firstRec.id === latest.id) return null;
    const totalDelta = netWorthOf(latest) - netWorthOf(firstRec);
    const investDelta = sumKeys(latest, INVEST_KEYS, hidden) - sumKeys(firstRec, INVEST_KEYS, hidden);
    const cashDelta = sumKeys(latest, ['cash'], hidden) - sumKeys(firstRec, ['cash'], hidden);
    const reDelta = sumKeys(latest, ['realEstate'], hidden) - sumKeys(firstRec, ['realEstate'], hidden);
    const otherDelta = totalDelta - investDelta - cashDelta - reDelta;
    const pct = (v) => (totalDelta !== 0 ? Math.round((v / totalDelta) * 100) : 0);
    return {
      total: totalDelta,
      items: [
        { key: 'invest', label: '투자 수익', color: C.mint, value: investDelta, pct: pct(investDelta) },
        { key: 'cash', label: '현금 증가', color: C.amber, value: cashDelta, pct: pct(cashDelta) },
        { key: 're', label: '부동산', color: C.purple, value: reDelta, pct: pct(reDelta) },
        { key: 'other', label: '기타', color: C.blue, value: otherDelta, pct: pct(otherDelta) },
      ],
    };
  }, [firstRec, latest, netWorthOf, hidden]);

  function openNew() {
    setEditing({ id: null, period: '', recordDate: '', note: '', assets: emptyAssets(), pnl: emptyPnl() });
  }
  function openEdit(rec) { setEditing(JSON.parse(JSON.stringify(rec))); }
  async function saveEditing() {
    if (!editing.period.trim() || !editing.recordDate) { showToast('기간과 기준월을 입력해주세요'); return; }
    let next;
    if (editing.id) next = records.map((r) => (r.id === editing.id ? editing : r));
    else next = [...records, { ...editing, id: `rec-${Date.now()}` }];
    await persistRecords(next);
    setEditing(null);
    showToast('저장했어요');
  }
  async function deleteRecord(id) {
    if (!window.confirm('이 기록을 삭제할까요? 되돌릴 수 없어요.')) return;
    await persistRecords(records.filter((r) => r.id !== id));
    showToast('삭제했어요');
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function exportJson() {
    downloadBlob(JSON.stringify({ records, hidden: [...hidden] }, null, 2),
      `my-asset-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('JSON 백업을 저장했어요');
  }
  function exportCsv() {
    const header = ['period', 'recordDate', 'note', ...CATEGORIES.map((c) => c.label), ...PNL_CATEGORIES.map((c) => `${c.label} 손익`)];
    const rows = sorted.map((r) => [
      r.period, r.recordDate, JSON.stringify(r.note || ''),
      ...CATEGORIES.map((c) => r.assets[c.key] || 0),
      ...PNL_CATEGORIES.map((c) => r.pnl[c.key] || 0),
    ]);
    const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    downloadBlob('\uFEFF' + csv, `my-asset-records-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('CSV를 저장했어요');
  }
  function triggerImport() { fileInputRef.current?.click(); }
  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.records)) throw new Error('invalid');
      if (!window.confirm('불러온 기록으로 현재 데이터를 덮어쓸까요?')) return;
      await persistRecords(parsed.records);
      if (Array.isArray(parsed.hidden)) await persistHidden(new Set(parsed.hidden));
      showToast('불러오기를 완료했어요');
    } catch { showToast('파일을 읽을 수 없어요'); }
    finally { e.target.value = ''; }
  }
  async function resetAll() {
    await persistRecords([]);
    setConfirmReset(false);
    showToast('모든 기록을 삭제했어요');
  }
  function toggleHidden(key) {
    const next = new Set(hidden);
    next.has(key) ? next.delete(key) : next.add(key);
    persistHidden(next);
  }
  function showAll() { persistHidden(new Set()); }
  function hideAll() { persistHidden(new Set(CATEGORIES.map((c) => c.key))); }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <div className="text-sm" style={{ color: C.mint, letterSpacing: '0.2em' }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, color: C.white, fontFamily: BODY_FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #26314A; border-radius: 999px; }
        input, textarea { color: #fff; }
        input::placeholder, textarea::placeholder { color: #45516B; }
        input[type=month]::-webkit-calendar-picker-indicator { filter: invert(1); }
        button { color: inherit; font-family: inherit; }
      `}</style>

      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        {toast && (
          <div
            className="fixed left-1/2 z-50 text-sm px-4 py-2 rounded-full shadow-lg"
            style={{ top: 16, transform: 'translateX(-50%)', backgroundColor: C.mint, color: C.mintDark, fontWeight: 600 }}
          >
            {toast}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pt-6" style={{ paddingBottom: 116 }}>
          <TopHeader onBell={() => showToast('준비 중인 기능이에요')} />

          {tab === 'home' && (
            <HomeTab
              latest={latest} latestNW={latestNW} yoyDiff={yoyDiff} yoyPct={yoyPct}
              latestPnl={latestPnl} privacy={privacy} setPrivacy={setPrivacy}
              range={range} setRange={setRange} growthSeries={growthSeries}
              pnlMax={pnlMax} pnlProfit={pnlProfit} pnlLoss={pnlLoss}
              donutData={donutData} donutTotal={donutTotal} setTab={setTab}
              openNew={openNew} pnlDetail={pnlDetail} pnlShareByKey={pnlShareByKey}
            />
          )}
          {tab === 'records' && (
            <RecordsTab
              sorted={sorted} netWorthOf={netWorthOf} privacy={privacy}
              openNew={openNew} openEdit={openEdit} deleteRecord={deleteRecord}
            />
          )}
          {tab === 'analysis' && (
            <AnalysisTab
              sorted={sorted} maxRec={maxRec} minRec={minRec} netWorthOf={netWorthOf}
              cumPnl={cumPnl} firstRec={firstRec} latest={latest} sinceFirstPct={sinceFirstPct}
              netWorthLineSeries={netWorthLineSeries} pnlBarSeries={pnlBarSeries}
              changeBreakdown={changeBreakdown} privacy={privacy} openNew={openNew}
            />
          )}
          {tab === 'settings' && (
            <SettingsTab
              hidden={hidden} toggleHidden={toggleHidden} showAll={showAll} hideAll={hideAll}
              exportJson={exportJson} exportCsv={exportCsv} triggerImport={triggerImport}
              confirmReset={confirmReset} setConfirmReset={setConfirmReset} resetAll={resetAll}
            />
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        <BottomNav tab={tab} setTab={setTab} />
        {editing && <RecordEditor editing={editing} setEditing={setEditing} onSave={saveEditing} onClose={() => setEditing(null)} />}
      </div>
    </div>
  );
}

/* -------------------------------- home -------------------------------- */

function HomeTab({
  latest, latestNW, yoyDiff, yoyPct, latestPnl, privacy, setPrivacy,
  range, setRange, growthSeries, pnlMax, pnlProfit, pnlLoss, donutData, donutTotal, setTab, openNew,
  pnlDetail, pnlShareByKey,
}) {
  const [showPnlModal, setShowPnlModal] = useState(false);
  if (!latest) return <EmptyState onAdd={openNew} />;

  const year = latest.recordDate.slice(0, 4);
  const rangeStart = growthSeries[0];
  const rangeEnd = growthSeries[growthSeries.length - 1];
  const rangeDiff = rangeStart && rangeEnd ? rangeEnd.netWorth - rangeStart.netWorth : 0;

  return (
    <div className="space-y-11">
      <div>
        <div style={{ ...EYEBROW, color: C.mint, marginBottom: 10 }}>YEARLY WEALTH · {year}</div>
        <h1 className="text-[28px] leading-[1.3]" style={DISPLAY}>
          지금, 내 자산은
          <br />어디에 와 있을까.
        </h1>
        <p className="text-sm mt-3" style={{ color: C.muted }}>지난 기록과 비교해 자산의 흐름을 확인하세요.</p>
      </div>

      {/* hero card */}
      <button
        onClick={() => setTab('records')}
        className="w-full text-left rounded-2xl p-6 block"
        style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
            <Eye size={13} /> 현재 순자산
          </div>
          <ChevronRight size={15} style={{ color: C.faint }} />
        </div>
        {(() => {
          const heroStr = privacy ? mask(won(latestNW)) : won(latestNW);
          const heroSize = fitFontSize(heroStr, { base: 42, min: 22, threshold: 9 });
          return (
            <div
              className="leading-tight mt-3"
              style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: heroSize, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...TAB }}
            >
              {heroStr}
            </div>
          );
        })()}
        <div className="flex gap-9 mt-6">
          {(() => {
            const yoyStr = yoyDiff !== null ? `${manSigned(yoyDiff)} · ${pctSigned(yoyPct)}` : '\u2014';
            const yoySize = fitFontSize(yoyStr, { base: 17, min: 13, threshold: 20 });
            const pnlStr = privacy ? mask(moneySigned(latestPnl)) : moneySigned(latestPnl);
            const pnlSize = fitFontSize(pnlStr, { base: 17, min: 13, threshold: 17 });
            return (
              <>
                <div style={{ minWidth: 0 }}>
                  <div className="text-xs mb-1 flex items-center gap-0.5" style={{ color: C.muted }}>전년 대비 <ChevronRight size={11} /></div>
                  <div style={{ fontWeight: 600, color: yoyDiff >= 0 ? C.mint : C.red, fontSize: yoySize, whiteSpace: 'nowrap', ...TAB }}>
                    {yoyStr}
                  </div>
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); setShowPnlModal(true); }}
                  role="button"
                  className="text-left"
                  style={{ minWidth: 0 }}
                >
                  <div className="text-xs mb-1 flex items-center gap-0.5" style={{ color: C.muted }}>투자 평가손익 <ChevronRight size={11} /></div>
                  <div style={{ fontWeight: 600, color: latestPnl >= 0 ? C.mint : C.red, fontSize: pnlSize, whiteSpace: 'nowrap', ...TAB }}>
                    {pnlStr}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </button>

      <div className="flex items-center justify-end -mt-8">
        <button
          onClick={(e) => { e.stopPropagation(); setPrivacy((p) => !p); }}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-md"
          style={{ color: privacy ? C.mint : C.faint }}
        >
          <Shield size={12} /> {privacy ? '금액 표시' : '금액 가리기'}
        </button>
      </div>

      {showPnlModal && (
        <PnlDetailModal period={humanPeriod(latest.recordDate).label} items={pnlDetail} total={latestPnl} privacy={privacy} onClose={() => setShowPnlModal(false)} />
      )}

      {/* flow chart */}
      <div>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-base" style={{ fontWeight: 700 }}>자산의 흐름</h2>
            <p className="text-xs mt-1" style={{ color: C.muted }}>기록이 쌓일수록 변화가 선명해집니다.</p>
          </div>
          <div className="flex rounded-full p-0.5 gap-0.5" style={{ backgroundColor: C.cardAlt }}>
            {[['1y', '1년'], ['3y', '3년'], ['5y', '5년'], ['all', '전체']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ fontWeight: 500, backgroundColor: range === key ? C.mint : 'transparent', color: range === key ? C.mintDark : C.muted }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 210, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthSeries} margin={{ top: 10, right: 26, left: 26, bottom: 0 }}>
              <CartesianGrid stroke="#161F33" vertical={false} />
              <XAxis dataKey="axis" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <YAxis
                hide
                domain={[
                  (dataMin) => (dataMin > 0 ? dataMin * 0.85 : dataMin * 1.15),
                  (dataMax) => (dataMax > 0 ? dataMax * 1.1 : dataMax * 0.9),
                ]}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="principal" name="투입 원금" stroke={C.faint} strokeWidth={1.75} strokeDasharray="3 4"
                dot={{ r: 2.5, fill: C.faint, strokeWidth: 0 }} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="netWorth" name="순자산" stroke={C.mint} strokeWidth={2.5}
                dot={{ r: 3, fill: C.mint, strokeWidth: 0 }} activeDot={{ r: 5, fill: C.mint }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-5 justify-center mt-1 text-xs" style={{ color: C.muted }}>
          <span className="flex items-center gap-1.5"><span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: C.mint, display: 'inline-block' }} />순자산</span>
          <span className="flex items-center gap-1.5"><span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: C.faint, display: 'inline-block' }} />투입 원금</span>
        </div>

        {rangeStart && rangeEnd && (
          <div className="flex items-center gap-3 mt-5 rounded-xl px-4 py-3.5" style={{ backgroundColor: C.cardAlt }}>
            <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 30, height: 30, backgroundColor: 'rgba(74,222,158,0.12)' }}>
              <TrendingUp size={14} style={{ color: C.mint }} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div className="text-xs" style={{ color: C.muted }}>순자산 증가</div>
              <div className="text-sm" style={{ fontWeight: 700, color: C.mint, ...TAB }}>{formatM(rangeDiff)}</div>
            </div>
          </div>
        )}
      </div>

      {/* performance */}
      <div>
        <div className="flex items-start justify-between">
          <h2 className="text-base" style={{ fontWeight: 700 }}>투자 성과</h2>
          <ChevronRight size={15} style={{ color: C.faint, marginTop: 3 }} />
        </div>
        <p className="text-xs mt-1" style={{ color: C.muted }}>{year}년 누적 투자 손익</p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {BAR_PNL_CATEGORIES.map((c) => {
            const val = latest.pnl[c.key] || 0;
            const valStr = privacy ? mask(moneySigned(val)) : moneySigned(val);
            const valSize = fitFontSize(valStr, { base: 14, min: 9, threshold: 10, rate: 0.55 });
            return (
              <div key={c.key} className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs mb-1.5" style={{ color: C.muted }}>
                  <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: c.color, display: 'inline-block' }} />
                  {c.label}
                </div>
                <div style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: valSize, fontWeight: 700, color: val > 0 ? C.mint : val < 0 ? C.red : C.soft, ...TAB }}>
                    {valStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6 rounded-xl px-4 py-3.5 text-xs" style={{ backgroundColor: C.cardAlt }}>
          <div className="text-center">
            <div className="mb-1" style={{ color: C.muted }}>총 이익</div>
            <div style={{ fontWeight: 600, color: C.mint, ...TAB }}>{moneySigned(pnlProfit)}</div>
          </div>
          <div className="text-center">
            <div className="mb-1" style={{ color: C.muted }}>총 손실</div>
            <div style={{ fontWeight: 600, color: pnlLoss > 0 ? C.red : C.white, ...TAB }}>
              {pnlLoss > 0 ? `-${won(pnlLoss)}` : `+${won(0)}`}
            </div>
          </div>
          <div className="text-center">
            <div className="mb-1" style={{ color: C.muted }}>총 순손익</div>
            <div style={{ fontWeight: 600, color: C.mint, ...TAB }}>{moneySigned(pnlProfit - pnlLoss)}</div>
          </div>
        </div>
      </div>

      {/* allocation donut */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base" style={{ fontWeight: 700 }}>자산 구성</h2>
            <p className="text-xs mt-1" style={{ color: C.muted }}>현재 순자산의 구성입니다.</p>
          </div>
          <button onClick={() => setTab('settings')} className="text-xs flex items-center gap-0.5" style={{ color: C.muted }}>
            관리 <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex items-center gap-7 mt-6">
          <div className="relative" style={{ width: 132, height: 132, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-sm" style={{ fontWeight: 700, ...TAB }}>{privacy ? '••••' : amountKr(donutTotal)}</div>
              <div className="text-[10px] mt-0.5" style={{ color: C.faint }}>순자산</div>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: d.color, display: 'inline-block' }} />
                  <span style={{ color: C.soft }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{donutTotal ? Math.round((d.value / donutTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl px-4 py-4 flex items-center gap-3" style={{ backgroundColor: C.cardAlt }}>
        <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: 'rgba(74,222,158,0.12)' }}>
          <TrendingUp size={15} style={{ color: C.mint }} />
        </div>
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>나의 자산, 더 나은 내일을 위해</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>지금 기록하고, 꾸준히 관리하세요.</div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- pnl detail modal --------------------------- */

function PnlDetailModal({ period, items, total, privacy, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl p-6"
        style={{ backgroundColor: C.card, borderTop: `1px solid ${C.border}`, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl" style={DISPLAY}>투자 평가손익 내역</h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: C.muted }}>
          {period} 기준 · 보이는 투자 자산의 원금 대비 평가액 차이예요.
        </p>

        <div className="mt-6 space-y-4">
          {items.map((it) => (
            <div key={it.key} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: C.soft }}>{it.label}</span>
              <span className="text-sm" style={{ fontWeight: 700, color: it.value >= 0 ? C.mint : C.red, ...TAB }}>
                {privacy ? mask(moneySigned(it.value)) : moneySigned(it.value)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
          <span className="text-sm" style={{ color: C.soft }}>합계</span>
          <span className="text-base" style={{ fontWeight: 700, color: total >= 0 ? C.mint : C.red, ...TAB }}>
            {privacy ? mask(moneySigned(total)) : moneySigned(total)}
          </span>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: C.cardAlt, color: C.white, fontWeight: 600 }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- records ------------------------------ */

function RecordsTab({ sorted, netWorthOf, privacy, openNew, openEdit, deleteRecord }) {
  const desc = [...sorted].reverse();
  return (
    <div className="space-y-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div style={{ ...EYEBROW, color: C.mint, marginBottom: 10 }}>QUARTERLY RECORDS</div>
          <h1 className="text-[28px]" style={DISPLAY}>분기별, 한 장씩.</h1>
          <p className="text-sm mt-3" style={{ color: C.muted }}>한 시점의 자산을 기록하고 긴 흐름을 남겨보세요.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontWeight: 700 }}>{desc.length}개의 기록</div>
          <p className="text-xs mt-1" style={{ color: C.muted }}>가장 최근 기록부터 확인할 수 있어요.</p>
        </div>
        <button
          onClick={openNew}
          className="shrink-0 rounded-full px-4 py-2.5 text-xs flex items-center gap-1.5"
          style={{ backgroundColor: C.mint, color: C.mintDark, fontWeight: 700 }}
        >
          <Plus size={14} /> 기록 추가
        </button>
      </div>

      {desc.length === 0 && <EmptyState onAdd={openNew} />}

      <div className="space-y-3">
        {desc.map((r, i) => {
          const h = humanPeriod(r.recordDate);
          const idxInSorted = sorted.length - 1 - i;
          const prevRec = idxInSorted > 0 ? sorted[idxInSorted - 1] : null;
          const diff = prevRec ? netWorthOf(r) - netWorthOf(prevRec) : null;
          return (
            <div key={r.id} className="rounded-xl p-5" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base" style={{ fontWeight: 700 }}>{h.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: C.faint, backgroundColor: C.cardAlt }}>{r.period}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2.5 flex-wrap">
                    <div className="text-xl" style={{ fontWeight: 700, ...TAB }}>
                      {privacy ? mask(won(netWorthOf(r))) : won(netWorthOf(r))}
                    </div>
                    {diff !== null && (
                      <span className="text-[11px]" style={{ fontWeight: 600, color: diff >= 0 ? C.mint : C.red, ...TAB }}>
                        {diff >= 0 ? '▲' : '▼'} {manSigned(diff)} · 전분기 대비
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>{h.dateLine}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(r)} className="rounded-lg flex items-center justify-center" style={{ width: 34, height: 34, backgroundColor: C.cardAlt, color: C.soft }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteRecord(r.id)} className="rounded-lg flex items-center justify-center" style={{ width: 34, height: 34, backgroundColor: C.cardAlt, color: C.red }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- analysis ------------------------------ */

function AnalysisTab({
  sorted, maxRec, minRec, netWorthOf, cumPnl, firstRec, latest, sinceFirstPct,
  netWorthLineSeries, pnlBarSeries, changeBreakdown, privacy, openNew,
}) {
  if (!latest) return <EmptyState onAdd={openNew} />;
  const years = sorted.length;
  const firstH = humanPeriod(firstRec.recordDate);
  const latestH = humanPeriod(latest.recordDate);

  return (
    <div className="space-y-11">
      <div>
        <div style={{ ...EYEBROW, color: C.mint, marginBottom: 10 }}>LONG-TERM VIEW</div>
        <h1 className="text-[28px]" style={DISPLAY}>장기 흐름</h1>
        <p className="text-sm mt-3" style={{ color: C.muted }}>짧은 변화보다, 쌓여온 흐름을 봅니다.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="최고 순자산" value={eok(netWorthOf(maxRec))} sub={humanPeriod(maxRec.recordDate).label} privacy={privacy} />
        <StatCard label="최저 순자산" value={eok(netWorthOf(minRec))} sub={humanPeriod(minRec.recordDate).label} privacy={privacy} />
        <StatCard label="누적 투자 손익" value={formatM(cumPnl)} sub={`기록 기간 누적`} accent privacy={privacy} />
        <StatCard label="첫 기록 대비" value={pctSigned(sinceFirstPct)} sub={`${firstH.label.slice(2)} → ${latestH.label.slice(2)}`} accent />
      </div>

      {/* net worth line */}
      <div>
        <h2 className="text-base" style={{ fontWeight: 700 }}>순자산 추이</h2>
        <p className="text-xs mt-1" style={{ color: C.muted }}>{firstH.axis} ~ {latestH.axis}</p>
        <div style={{ height: 200, marginTop: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthLineSeries} margin={{ top: 10, right: 26, left: 26, bottom: 0 }}>
              <CartesianGrid stroke="#161F33" vertical={false} />
              <XAxis dataKey="axis" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <YAxis
                hide
                domain={[
                  (dataMin) => (dataMin > 0 ? dataMin * 0.85 : dataMin * 1.15),
                  (dataMax) => (dataMax > 0 ? dataMax * 1.1 : dataMax * 0.9),
                ]}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="netWorth" name="순자산" stroke={C.mint} strokeWidth={2.5}
                dot={{ r: 3, fill: C.mint, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* annual pnl bar */}
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-base" style={{ fontWeight: 700 }}>연간 투자 손익</h2>
          <Info size={13} style={{ color: C.faint }} />
        </div>
        <div style={{ height: 170, marginTop: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlBarSeries} margin={{ top: 24, right: 18, left: 18, bottom: 0 }}>
              <CartesianGrid stroke="#161F33" vertical={false} />
              <XAxis dataKey="year" stroke={C.faint} fontSize={10} tickLine={false} axisLine={false} interval={0} />
              <YAxis hide />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {pnlBarSeries.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? C.mint : C.red} />)}
                <LabelList
                  dataKey="pnl"
                  position="top"
                  formatter={(v) => formatM(v)}
                  style={{ fill: C.soft, fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* change breakdown */}
      {changeBreakdown && (
        <div className="rounded-xl p-5" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}>
          <div style={{ fontWeight: 700 }}>순자산 변화 분석</div>
          <div className="text-xs mt-1" style={{ color: C.muted }}>{firstH.label} → {latestH.label}</div>
          <div className="text-2xl mt-3" style={{ fontWeight: 700, color: changeBreakdown.total >= 0 ? C.mint : C.red, ...TAB }}>
            {formatM(changeBreakdown.total)}
          </div>
          <div className="mt-5 space-y-3.5">
            {changeBreakdown.items.map((it) => (
              <div key={it.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: it.color, display: 'inline-block' }} />
                  <span style={{ color: C.soft }}>{it.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ fontWeight: 600, color: it.value >= 0 ? C.mint : C.red, ...TAB }}>
                    {privacy ? mask(moneySigned(it.value)) : moneySigned(it.value)}
                  </span>
                  <span className="text-xs" style={{ color: C.faint, width: 34, textAlign: 'right' }}>{it.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl px-4 py-4 text-sm leading-relaxed" style={{ backgroundColor: C.cardAlt, color: C.soft }}>
        {firstH.label} 이후 {years}번의 기록 동안 순자산이{' '}
        <span style={{ whiteSpace: 'nowrap', color: C.mint, fontWeight: 600 }}>{formatM(netWorthOf(latest) - netWorthOf(firstRec))}</span> 늘었습니다.
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, privacy }) {
  return (
    <div className="rounded-xl p-4" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}>
      <div className="text-xs mb-2" style={{ color: C.muted }}>{label}</div>
      <div className="text-lg" style={{ fontWeight: 700, color: accent ? C.mint : C.white, ...TAB }}>
        {privacy ? mask(value) : value}
      </div>
      <div className="text-[10px] mt-1" style={{ color: C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
    </div>
  );
}

/* ------------------------------- settings ------------------------------ */

function SettingsTab({ hidden, toggleHidden, showAll, hideAll, exportJson, exportCsv, triggerImport, confirmReset, setConfirmReset, resetAll }) {
  return (
    <div className="space-y-11">
      <div>
        <div style={{ ...EYEBROW, color: C.mint, marginBottom: 10 }}>QUIET CONTROL</div>
        <h1 className="text-[28px]" style={DISPLAY}>내 기록을 돌보는 곳</h1>
        <p className="text-sm mt-3" style={{ color: C.muted }}>데이터는 자동으로 안전하게 저장되고, 보이는 방식은 언제든 바꿀 수 있어요.</p>
      </div>

      <div className="rounded-xl" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}>
        <SettingsRow icon={<Download size={15} />} title="JSON 백업" desc="기록과 표시 설정을 하나의 파일로 저장해요." action="저장" onClick={exportJson} first />
        <SettingsRow icon={<Upload size={15} />} title="JSON 불러오기" desc="다른 기기에서 백업한 기록을 가져와요." action="불러오기" onClick={triggerImport} />
        <SettingsRow icon={<Download size={15} />} title="CSV 내보내기" desc="스프레드시트에서 기록을 살펴볼 수 있어요." action="저장" onClick={exportCsv} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <div style={{ fontWeight: 700 }}>표시할 자산</div>
          <div className="flex gap-2">
            <button onClick={showAll} className="text-[11px] px-3 py-1.5 rounded-full" style={{ backgroundColor: C.cardAlt, color: C.soft }}>모두 표시</button>
            <button onClick={hideAll} className="text-[11px] px-3 py-1.5 rounded-full" style={{ backgroundColor: C.cardAlt, color: C.soft }}>모두 숨김</button>
          </div>
        </div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>숨긴 자산은 합계와 차트에서만 제외됩니다.</p>
        <div className="rounded-xl px-4" style={{ border: `1px solid ${C.border}`, backgroundColor: C.card }}>
          {CATEGORIES.map((c, i) => (
            <div key={c.key} className="flex items-center justify-between py-4" style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
              <span className="text-sm" style={{ color: C.soft }}>{c.label}</span>
              <Toggle on={!hidden.has(c.key)} onClick={() => toggleHidden(c.key)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1" style={{ fontWeight: 700 }}>데이터 초기화</div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>모든 기록을 삭제합니다.</p>
        <div className="rounded-xl flex items-center justify-between px-4 py-4" style={{ border: `1px solid ${C.borderRed}`, backgroundColor: C.cardRed }}>
          <div className="flex items-center gap-3">
            <RotateCcw size={15} style={{ color: C.red }} />
            <div>
              <div className="text-sm" style={{ fontWeight: 600 }}>전체 기록 삭제</div>
              <div className="text-xs mt-0.5" style={{ color: C.muted }}>이 작업은 되돌릴 수 없습니다.</div>
            </div>
          </div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ color: C.red, backgroundColor: C.redBg, fontWeight: 600 }}>
              <Trash2 size={12} /> 초기화
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: C.cardAlt, color: C.soft }}>취소</button>
              <button onClick={resetAll} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: C.red, color: C.redBg2, fontWeight: 600 }}>확인 삭제</button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl px-4 py-4 text-xs leading-relaxed" style={{ backgroundColor: C.cardAlt, color: C.muted }}>
        데이터는 이 대화의 저장 공간에 안전하게 보관돼요. 다른 기기로 옮기려면 JSON 백업을 이용해주세요.
      </div>
    </div>
  );
}

function SettingsRow({ icon, title, desc, action, onClick, first }) {
  return (
    <div className="flex items-center justify-between p-4 gap-3" style={{ borderTop: first ? 'none' : `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 34, height: 34, backgroundColor: C.cardAlt, color: C.mint }}>{icon}</div>
        <div className="min-w-0">
          <div className="text-sm" style={{ fontWeight: 600 }}>{title}</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>{desc}</div>
        </div>
      </div>
      <button onClick={onClick} className="shrink-0 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: C.cardAlt, color: C.mint, fontWeight: 600 }}>
        {action}
      </button>
    </div>
  );
}

/* ------------------------------ empty state ---------------------------- */

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-xl p-8 text-center" style={{ border: `1px dashed ${C.border}` }}>
      <div className="text-sm mb-4" style={{ color: C.muted }}>아직 기록이 없어요. 첫 기록을 남겨보세요.</div>
      <button onClick={onAdd} className="rounded-lg px-4 py-2.5 text-sm inline-flex items-center gap-1.5" style={{ backgroundColor: C.mint, color: C.mintDark, fontWeight: 700 }}>
        <Plus size={15} /> 기록 추가
      </button>
    </div>
  );
}

/* ------------------------------- bottom nav ----------------------------- */

function BottomNav({ tab, setTab }) {
  const items = [
    { key: 'home', label: '홈', icon: Home },
    { key: 'records', label: '기록', icon: Wallet },
    { key: 'analysis', label: '분석', icon: BarChart3 },
    { key: 'settings', label: '설정', icon: Settings },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto flex items-center justify-between px-3 py-3"
        style={{ backgroundColor: 'rgba(10,14,26,0.97)', borderTop: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2 pr-1 shrink-0">
          <div className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, backgroundColor: C.mint }}>
            <TrendingUp size={16} style={{ color: C.mintDark }} strokeWidth={2.5} />
          </div>
          <div className="leading-tight hidden xs:block">
            <div className="text-[10px]" style={{ fontWeight: 800 }}>MY</div>
            <div className="text-[10px]" style={{ fontWeight: 800, marginTop: -2 }}>ASSET</div>
          </div>
        </div>
        <div className="flex items-center justify-around flex-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} className="flex flex-col items-center gap-1.5 px-3 py-1">
              <Icon size={19} style={{ color: active ? C.mint : C.faint }} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px]" style={{ fontWeight: active ? 600 : 400, color: active ? C.mint : C.faint }}>{label}</span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- currency input ---------------------------- */

function CurrencyInput({ value, onChange, placeholder, style, allowNegative }) {
  const [digits, setDigits] = useState(value ? String(Math.abs(value)) : '');
  const [neg, setNeg] = useState((value || 0) < 0);

  const display = digits === '' ? '' : Number(digits).toLocaleString('ko-KR');

  function handleChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setDigits(raw);
    const num = raw === '' ? 0 : Number(raw);
    onChange(neg ? -num : num);
  }
  function toggleSign() {
    const nextNeg = !neg;
    setNeg(nextNeg);
    const num = digits === '' ? 0 : Number(digits);
    onChange(nextNeg ? -num : num);
  }

  return (
    <div className="flex-1 flex items-center gap-1.5">
      {allowNegative && (
        <button
          type="button"
          onClick={toggleSign}
          className="rounded-lg shrink-0 flex items-center justify-center"
          style={{ width: 30, height: 30, fontWeight: 700, fontSize: 15, backgroundColor: neg ? C.redBg : C.card, color: neg ? C.red : C.faint }}
        >
          {neg ? '−' : '+'}
        </button>
      )}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm text-right"
        style={style}
      />
    </div>
  );
}

/* ----------------------------- record editor ---------------------------- */

function RecordEditor({ editing, setEditing, onSave, onClose }) {
  function setField(field, value) { setEditing({ ...editing, [field]: value }); }
  function setAsset(key, num) { setEditing({ ...editing, assets: { ...editing.assets, [key]: num } }); }
  function setPnl(key, num) { setEditing({ ...editing, pnl: { ...editing.pnl, [key]: num } }); }
  const total = CATEGORIES.reduce((s, c) => s + (editing.assets[c.key] || 0), 0);

  const inputStyle = { backgroundColor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, outline: 'none' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-t-2xl overflow-y-auto" style={{ backgroundColor: C.bgAlt, borderTop: `1px solid ${C.border}`, maxHeight: '92vh' }}>
        <div className="sticky top-0 flex items-center justify-between px-5 pt-5 pb-4" style={{ backgroundColor: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
          <div className="text-lg" style={{ fontWeight: 700 }}>{editing.id ? '기록 수정' : '기록 추가'}</div>
          <button onClick={onClose} className="rounded-lg flex items-center justify-center" style={{ width: 34, height: 34, backgroundColor: C.cardAlt }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: C.muted }}>기간 (예: 2026-A)</label>
              <input value={editing.period} onChange={(e) => setField('period', e.target.value)} placeholder="2026-A"
                className="w-full px-3 py-2.5 text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: C.muted }}>기준월</label>
              <input type="month" value={editing.recordDate} onChange={(e) => setField('recordDate', e.target.value)}
                className="w-full px-3 py-2.5 text-sm" style={inputStyle} />
            </div>
          </div>
          <p className="text-[11px] -mt-3" style={{ color: C.faint }}>분기 말(3월/6월/9월/12월)을 기준월로 남기면 표기가 자연스러워요.</p>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: C.muted }}>메모 (선택)</label>
            <textarea value={editing.note} onChange={(e) => setField('note', e.target.value)} rows={2}
              placeholder="예: 코인 비중 조정, 손절 반영"
              className="w-full px-3 py-2.5 text-sm resize-none" style={inputStyle} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm" style={{ fontWeight: 600 }}>자산 항목</div>
              <div className="text-xs" style={{ color: C.muted, ...TAB }}>합계 {won(total)}</div>
            </div>
            <div className="space-y-3">
              {CATEGORIES.map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: c.color, display: 'inline-block' }} />
                  <span className="text-sm shrink-0" style={{ color: C.soft, width: 96 }}>{c.label}</span>
                  <CurrencyInput
                    key={`${editing.id || 'new'}-${c.key}`}
                    recordKey={editing.id || 'new'} fieldKey={c.key}
                    value={editing.assets[c.key] || 0} onChange={(num) => setAsset(c.key, num)}
                    placeholder="0" style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm mb-3" style={{ fontWeight: 600 }}>투자 평가손익</div>
            <div className="space-y-3">
              {PNL_CATEGORIES.map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: c.color, display: 'inline-block' }} />
                  <span className="text-sm shrink-0" style={{ color: C.soft, width: 96 }}>{c.label}</span>
                  <CurrencyInput
                    key={`${editing.id || 'new'}-${c.key}`}
                    recordKey={editing.id || 'new'} fieldKey={c.key}
                    value={editing.pnl[c.key] || 0} onChange={(num) => setPnl(c.key, num)}
                    placeholder="0" style={inputStyle} allowNegative
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 p-5 flex gap-3" style={{ backgroundColor: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm" style={{ backgroundColor: C.cardAlt, color: C.soft, fontWeight: 600 }}>취소</button>
          <button onClick={onSave} className="flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-1.5" style={{ backgroundColor: C.mint, color: C.mintDark, fontWeight: 700 }}>
            <Check size={16} /> 저장
          </button>
        </div>
      </div>
    </div>
  );
}
