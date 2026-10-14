import { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Table, 
  Search, 
  RefreshCw, 
  Key, 
  Link2, 
  Eye, 
  Download, 
  ShieldCheck, 
  Users, 
  Building2, 
  Car, 
  Calendar, 
  Ticket, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  Heart, 
  ArrowRight, 
  Layers, 
  FileCode2, 
  GitBranch, 
  CheckCircle2, 
  ChevronRight, 
  X,
  Copy,
  Info,
  Code,
  Terminal,
  Play,
  FileDown,
  Check
} from 'lucide-react';
import { formatThaiDateTime } from '../../lib/thai-time';

interface AttributeMeta {
  name: string;
  oracleType: string;
  constraint: string;
  isNullable: boolean;
  desc: string;
}

interface EntityMeta {
  entityName: string;
  displayNameThai: string;
  category: string;
  description: string;
  primaryKey: string;
  oracleTable: string;
  color: string;
  icon: string;
  attributesCount?: number;
  recordCount?: number;
  attributes: AttributeMeta[];
}

interface ERRelationship {
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
  relation: string;
  desc: string;
}

interface DataFlowStage {
  role: string;
  title: string;
  entities: string[];
  description: string;
}

export function AdminDatabaseInspector() {
  const [entities, setEntities] = useState<EntityMeta[]>([]);
  const [selectedEntityName, setSelectedEntityName] = useState<string>('Customer');
  const [entityData, setEntityData] = useState<{
    entity: EntityMeta;
    records: any[];
    totalRecords: number;
    relations: { incoming: ERRelationship[]; outgoing: ERRelationship[] };
  } | null>(null);

  const [relationships, setRelationships] = useState<ERRelationship[]>([]);
  const [flowStages, setFlowStages] = useState<DataFlowStage[]>([]);
  
  const [activeTab, setActiveTab] = useState<'records' | 'dictionary' | 'erd' | 'flows' | 'sql-ddl' | 'sql-query'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // SQL DDL & Query Console States
  const [ddlScript, setDdlScript] = useState<string>('');
  const [loadingDdl, setLoadingDdl] = useState(false);
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [sqlInput, setSqlInput] = useState<string>(
    'SELECT r.Booking_ID, c.Username, d.LicensePlate, d.StartTime, d.EndTime, d.Reservation_Status, d.Totalfee\nFROM Reservation r\nJOIN Customer c ON r.Customer_ID = c.Customer_ID\nJOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID\nORDER BY r.Booking_ID DESC\nLIMIT 20;'
  );
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    durationMs: number;
  } | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // 1. Fetch Entities summary list, ER relationships, and Data Flows
  useEffect(() => {
    fetchEntityList();
    fetchERD();
    fetchFlows();
  }, []);

  const fetchEntityList = () => {
    setLoadingList(true);
    const token = localStorage.getItem('token');
    fetch('/api/admin/database/entities', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.entities) {
          setEntities(data.entities);
          if (!selectedEntityName && data.entities.length > 0) {
            setSelectedEntityName(data.entities[0].entityName);
          }
        }
        setLoadingList(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingList(false);
      });
  };

  const fetchERD = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/database/erd', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.relationships) {
          setRelationships(data.relationships);
        }
      })
      .catch(console.error);
  };

  const fetchFlows = () => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/database/data-flows', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stages) {
          setFlowStages(data.stages);
        }
      })
      .catch(console.error);
  };

  // 2. Fetch data of selected entity
  useEffect(() => {
    if (!selectedEntityName) return;
    setLoadingData(true);
    const token = localStorage.getItem('token');
    const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    fetch(`/api/admin/database/entities/${selectedEntityName}${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const pk = data.entity?.primaryKey;
          if (pk && Array.isArray(data.records)) {
            data.records.sort((a: any, b: any) => {
              const valA = a[pk];
              const valB = b[pk];
              const numA = Number(valA);
              const numB = Number(valB);
              if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
              }
              return String(valA || '').localeCompare(String(valB || ''));
            });
          }
          setEntityData(data);
        }
        setLoadingData(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingData(false);
      });
  }, [selectedEntityName, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  useEffect(() => {
    if (activeTab === 'sql-ddl' && !ddlScript) {
      fetchDdl();
    }
  }, [activeTab]);

  const fetchDdl = () => {
    setLoadingDdl(true);
    const token = localStorage.getItem('token');
    fetch('/api/admin/database/ddl-script', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ddl) {
          setDdlScript(data.ddl);
        }
        setLoadingDdl(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingDdl(false);
      });
  };

  const handleRunQuery = (customSql?: string) => {
    const sqlToRun = (customSql !== undefined ? customSql : sqlInput).trim();
    if (!sqlToRun) return;
    setQueryLoading(true);
    setQueryError(null);
    const token = localStorage.getItem('token');
    fetch('/api/admin/database/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sql: sqlToRun })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQueryResult(data);
          setQueryError(null);
        } else {
          setQueryError(data.error || 'เกิดข้อผิดพลาดในการรัน SQL');
          setQueryResult(null);
        }
        setQueryLoading(false);
      })
      .catch(err => {
        setQueryError(err.message);
        setQueryLoading(false);
      });
  };

  const downloadDdlFile = () => {
    const text = ddlScript || '';
    const blob = new Blob([text], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parksmart_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentEntity = entities.find(e => e.entityName === selectedEntityName) || entityData?.entity;

  // Categories
  const categories = [
    { name: 'User Management', label: '👤 ข้อมูลผู้ใช้และสิทธิ์' },
    { name: 'Parking Management', label: '🚗 การจัดการลานและช่องจอด' },
    { name: 'Booking & Transactions', label: '📋 ธุรกรรมการจองและเข้าจอด' },
    { name: 'Finance & Support', label: '💳 การเงินและข้อร้องเรียน' }
  ];

  const totalRecordsAll = entities.reduce((sum, e) => sum + (e.recordCount || 0), 0);

  // Helper to extract value from row in a case-insensitive & flexible manner
  const getRowValue = (row: any, colName: string): any => {
    if (!row || typeof row !== 'object') return undefined;
    if (row[colName] !== undefined) return row[colName];

    // Case-insensitive exact match
    const targetLower = colName.toLowerCase();
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === targetLower) {
        return row[k];
      }
    }

    // Ignore underscores and hyphens (e.g. Phone_Number vs phonenumber vs phoneNumber)
    const targetClean = targetLower.replace(/[_-]/g, '');
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().replace(/[_-]/g, '') === targetClean) {
        return row[k];
      }
    }

    return undefined;
  };

  // Compute clean, aligned, and properly ordered table columns
  const displayColumns = useMemo(() => {
    if (!entityData?.records || entityData.records.length === 0) return [];

    // 1. Gather all unique non-internal keys present in the records
    const allRecordKeys = new Set<string>();
    entityData.records.forEach((r: any) => {
      if (r && typeof r === 'object') {
        Object.keys(r).forEach(k => {
          // Exclude internal sync metadata like _firebase_synced_at from the main table view
          if (!k.startsWith('_firebase') && !k.startsWith('__')) {
            allRecordKeys.add(k);
          }
        });
      }
    });

    const schemaAttrs: string[] = currentEntity?.attributes?.map((a: any) => a.name) || [];
    const pk = currentEntity?.primaryKey;

    const orderedCols: string[] = [];
    const matchedRecordKeys = new Set<string>();

    // 1. Primary Key first
    if (pk) {
      let matchedPkKey: string | undefined;
      for (const rk of allRecordKeys) {
        if (rk.toLowerCase() === pk.toLowerCase() || 
            rk.toLowerCase().replace(/[_-]/g, '') === pk.toLowerCase().replace(/[_-]/g, '')) {
          matchedPkKey = rk;
          break;
        }
      }
      orderedCols.push(pk);
      if (matchedPkKey) matchedRecordKeys.add(matchedPkKey);
    }

    // 2. Add other schema attributes in defined schema order if they exist in records
    schemaAttrs.forEach(attr => {
      if (pk && attr.toLowerCase() === pk.toLowerCase()) return;

      let matchedKey: string | undefined;
      for (const rk of allRecordKeys) {
        if (rk.toLowerCase() === attr.toLowerCase() || 
            rk.toLowerCase().replace(/[_-]/g, '') === attr.toLowerCase().replace(/[_-]/g, '')) {
          matchedKey = rk;
          break;
        }
      }

      // Include schema column if records contain data for it
      if (matchedKey) {
        orderedCols.push(attr);
        matchedRecordKeys.add(matchedKey);
      }
    });

    // 3. Add any remaining keys from records (not covered in schema)
    allRecordKeys.forEach(rk => {
      if (!matchedRecordKeys.has(rk) && !orderedCols.some(c => c.toLowerCase() === rk.toLowerCase())) {
        orderedCols.push(rk);
      }
    });

    // Fallback if no schema attributes matched: show all non-internal record keys
    if (orderedCols.length === 0) {
      allRecordKeys.forEach(rk => orderedCols.push(rk));
    }

    return orderedCols;
  }, [entityData, currentEntity]);

  // Sort modal attributes: PK first, then schema attrs in order, then extra, then internal sync meta last
  const sortedRecordEntries = useMemo(() => {
    if (!selectedRecord) return [];

    const pk = currentEntity?.primaryKey;
    const schemaAttrs = currentEntity?.attributes || [];
    const entries = Object.entries(selectedRecord);

    return entries.sort(([keyA], [keyB]) => {
      // 1. Primary key first
      if (pk && keyA.toLowerCase() === pk.toLowerCase()) return -1;
      if (pk && keyB.toLowerCase() === pk.toLowerCase()) return 1;

      // 2. System metadata last
      const isSysA = keyA.startsWith('_firebase') || keyA.startsWith('__');
      const isSysB = keyB.startsWith('_firebase') || keyB.startsWith('__');
      if (isSysA && !isSysB) return 1;
      if (!isSysA && isSysB) return -1;

      // 3. Schema attributes order
      const idxA = schemaAttrs.findIndex((a: any) => a.name.toLowerCase() === keyA.toLowerCase());
      const idxB = schemaAttrs.findIndex((a: any) => a.name.toLowerCase() === keyB.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      // 4. Alphabetical for others
      return keyA.localeCompare(keyB);
    });
  }, [selectedRecord, currentEntity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-lg">
                Admin Database Inspector
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                โครงสร้างฐานข้อมูลเชิงสัมพันธ์ (Relational SQL Schema)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Database className="w-8 h-8 text-purple-400 shrink-0" />
              <span>ระบบตรวจสอบโครงสร้างฐานข้อมูล (Database Schema & Inspector)</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ตรวจสอบความถูกต้องของข้อมูล โครงสร้างตาราง (Schema) และความสัมพันธ์ระหว่าง Entity ในระบบ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[95px] shadow-inner">
              <span className="text-2xl font-black text-white">{entities.length || 11}</span>
              <span className="text-[11px] text-purple-200 block mt-0.5 font-medium">Entities</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[95px] shadow-inner">
              <span className="text-2xl font-black text-emerald-400">{totalRecordsAll}</span>
              <span className="text-[11px] text-purple-200 block mt-0.5 font-medium">ระเบียนข้อมูล</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-[95px] shadow-inner">
              <span className="text-2xl font-black text-amber-300">{relationships.length || 12}</span>
              <span className="text-[11px] text-purple-200 block mt-0.5 font-medium">ความสัมพันธ์</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs - Clean Segmented Control with shrink-0 & whitespace-nowrap */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'records'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
          }`}
        >
          <Table className="w-4 h-4 shrink-0" />
          <span>สำรวจข้อมูลระเบียนจริง (Live Data)</span>
        </button>

        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'dictionary'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
          }`}
        >
          <FileCode2 className="w-4 h-4 shrink-0" />
          <span>พจนานุกรมข้อมูล (Data Dictionary)</span>
        </button>

        <button
          onClick={() => setActiveTab('erd')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'erd'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
          }`}
        >
          <GitBranch className="w-4 h-4 shrink-0" />
          <span>ความสัมพันธ์ระหว่างตาราง (ER Diagram)</span>
        </button>

        <button
          onClick={() => setActiveTab('flows')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'flows'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
          }`}
        >
          <ArrowRight className="w-4 h-4 shrink-0" />
          <span>เส้นทางการทำงาน (Data Flow)</span>
        </button>

        <button
          onClick={() => setActiveTab('sql-ddl')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'sql-ddl'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
          }`}
        >
          <Code className="w-4 h-4 shrink-0" />
          <span>สคริปต์ SQL DDL</span>
        </button>

        <button
          onClick={() => setActiveTab('sql-query')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'sql-query'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
          }`}
        >
          <Terminal className="w-4 h-4 shrink-0" />
          <span>คอนโซลคำสั่ง SQL (Query Console)</span>
        </button>
      </div>

      {/* Main Content Layout */}
      {(activeTab === 'records' || activeTab === 'dictionary') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar: Entity List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  ตาราง Entity ทั้งหมด ({entities.length})
                </h3>
                <button
                  onClick={fetchEntityList}
                  title="รีเฟรชข้อมูล"
                  className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {categories.map(cat => {
                const catEntities = entities.filter(e => e.category === cat.name);
                if (catEntities.length === 0) return null;

                return (
                  <div key={cat.name} className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 block px-2 pt-1">
                      {cat.label}
                    </span>
                    <div className="space-y-1">
                      {catEntities.map(entity => {
                        const isSelected = selectedEntityName === entity.entityName;
                        return (
                          <button
                            key={entity.entityName}
                            onClick={() => {
                              setSelectedEntityName(entity.entityName);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs font-semibold ${
                              isSelected
                                ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-sm font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-600' : 'bg-slate-300'}`} />
                              <span className="truncate">{entity.entityName}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {entity.recordCount || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Selected Entity Detail */}
          <div className="lg:col-span-9 space-y-5">
            {/* Entity Header Banner */}
            {currentEntity && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
                        Entity: {currentEntity.entityName}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                        PK: {currentEntity.primaryKey}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {currentEntity.displayNameThai}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {currentEntity.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleCopy(JSON.stringify(entityData?.records || [], null, 2))}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
                      title="คัดลอก JSON"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText ? 'คัดลอกแล้ว!' : 'Export JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Foreign Key Relations tags */}
                {entityData?.relations && (entityData.relations.incoming.length > 0 || entityData.relations.outgoing.length > 0) && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">ความสัมพันธ์:</span>
                    {entityData.relations.outgoing.map((rel, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-blue-500" />
                        <span>FK ไปยัง <strong>{rel.toTable}</strong> ({rel.fromCol})</span>
                      </span>
                    ))}
                    {entityData.relations.incoming.map((rel, idx) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-emerald-500" />
                        <span>ถูกอ้างอิงโดย <strong>{rel.fromTable}</strong></span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Live Records */}
            {activeTab === 'records' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Search & Actions Bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`ค้นหาในตาราง ${selectedEntityName} (พิมพ์คำค้นหา)...`}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>พบทั้งหมด: <strong className="text-slate-900 font-bold">{entityData?.records?.length || 0}</strong> ระเบียน</span>
                  </div>
                </div>

                {/* Table */}
                {loadingData ? (
                  <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-purple-600" />
                    <p className="text-xs">กำลังโหลดข้อมูลระเบียน...</p>
                  </div>
                ) : !entityData || entityData.records.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">ไม่พบระเบียนข้อมูลในตาราง {selectedEntityName}</p>
                    <p className="text-xs text-slate-400 mt-1">ยังไม่มีการบันทึกข้อมูล หรือคำค้นหาไม่ตรงกับข้อมูลใดๆ</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4 w-12 text-center text-slate-400 font-mono">#</th>
                          {displayColumns.map(col => {
                            const isPk = col.toLowerCase() === currentEntity?.primaryKey?.toLowerCase();
                            const attrDef = currentEntity?.attributes?.find(
                              (a: any) => a.name.toLowerCase() === col.toLowerCase()
                            );
                            return (
                              <th key={col} className="py-3.5 px-4 whitespace-nowrap" title={attrDef?.desc || col}>
                                <div className="flex items-center gap-1.5">
                                  {isPk && <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                  <span className={isPk ? "text-purple-900 font-black" : "text-slate-700 font-bold"}>
                                    {col}
                                  </span>
                                  {attrDef?.oracleType && (
                                    <span className="text-[9px] font-mono text-slate-400 font-normal lowercase bg-slate-200/60 px-1.5 py-0.5 rounded">
                                      {attrDef.oracleType.split('(')[0]}
                                    </span>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                          <th className="py-3.5 px-4 text-center text-slate-500 whitespace-nowrap">รายละเอียด</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entityData.records.map((row, index) => (
                          <tr key={index} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                              {index + 1}
                            </td>
                            {displayColumns.map(col => {
                              const isPk = col.toLowerCase() === currentEntity?.primaryKey?.toLowerCase();
                              const val = getRowValue(row, col);
                              const isNullOrUndef = val === null || val === undefined || val === '';
                              let displayVal = isNullOrUndef ? '-' : String(val);

                              // Normalize ISO timestamp strings (e.g. 2026-10-14T16:45:00.881Z) to YYYY-MM-DD HH:mm:ss
                              if (!isNullOrUndef && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
                                const d = new Date(val);
                                if (!isNaN(d.getTime())) {
                                  const pad = (n: number) => String(n).padStart(2, '0');
                                  displayVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                                }
                              }

                              // Status badges
                              let badge = null;
                              if (col.toLowerCase().includes('status') && !isNullOrUndef) {
                                const st = String(val);
                                const stLower = st.toLowerCase();
                                let color = "bg-slate-100 text-slate-700 border-slate-200";
                                if (['active', 'available', 'confirmed', 'completed', 'paid', 'success', 'approved'].includes(stLower)) {
                                  color = "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
                                } else if (['reserved', 'pending', 'pending_payment', 'processing'].includes(stLower)) {
                                  color = "bg-amber-50 text-amber-700 border-amber-200 font-bold";
                                } else if (['occupied', 'checked_in', 'cancelled', 'inactive', 'suspended', 'rejected'].includes(stLower)) {
                                  color = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
                                }
                                badge = (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${color}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                    {st}
                                  </span>
                                );
                              }

                              return (
                                <td 
                                  key={col} 
                                  className={`py-3.5 px-4 max-w-xs truncate whitespace-nowrap ${
                                    isPk ? 'font-mono font-bold text-purple-700 bg-purple-50/20' : 'text-slate-700'
                                  }`}
                                  title={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                                >
                                  {badge || (
                                    isNullOrUndef ? (
                                      <span className="text-slate-300 italic font-mono">-</span>
                                    ) : isPk ? (
                                      <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-700 bg-purple-100/70 border border-purple-200/60 px-2 py-0.5 rounded-md">
                                        <Key className="w-3 h-3 text-amber-500 shrink-0" />
                                        {displayVal}
                                      </span>
                                    ) : col.toLowerCase().includes('password') ? (
                                      <span className="font-mono text-slate-400 tracking-wider">••••••••</span>
                                    ) : (
                                      displayVal
                                    )
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedRecord(row)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-purple-600 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-lg transition-colors text-xs font-medium"
                                title="เปิดดูระเบียนทั้งหมด"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>ดูข้อมูล</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Data Dictionary & Attributes */}
            {activeTab === 'dictionary' && currentEntity && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-purple-600" />
                    <span>พจนานุกรมข้อมูล (Data Dictionary: ตาราง {currentEntity.entityName})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    แสดงโครงสร้าง Attribute ทุกตัว ชนิดข้อมูล Oracle SQL และคำอธิบายความหมายตามหลักสูตรวิชา Database
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">ชื่อ Attribute</th>
                        <th className="py-3 px-4">Oracle Data Type</th>
                        <th className="py-3 px-4">ข้อกำหนด (Constraints)</th>
                        <th className="py-3 px-4">ความหมายและวัตถุประสงค์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentEntity.attributes.map((attr, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-purple-800 flex items-center gap-1.5">
                            {attr.constraint.includes('PK') && <Key className="w-3.5 h-3.5 text-amber-500" />}
                            <span>{attr.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sky-700 bg-sky-50/40 font-semibold">
                            {attr.oracleType}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                              attr.constraint.includes('PK')
                                ? 'bg-amber-100 text-amber-800 font-bold'
                                : attr.constraint.includes('FK')
                                ? 'bg-blue-100 text-blue-800 font-bold'
                                : attr.constraint.includes('NOT NULL')
                                ? 'bg-slate-100 text-slate-700'
                                : 'text-slate-400'
                            }`}>
                              {attr.constraint}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {attr.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Oracle DDL Syntax Box */}
                <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 font-mono text-xs space-y-2 overflow-x-auto">
                  <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 text-[11px]">
                    <span>Oracle SQL DDL Statement</span>
                    <button
                      onClick={() => {
                        const sql = `CREATE TABLE ${currentEntity.entityName} (\n` +
                          currentEntity.attributes.map(a => `  ${a.name} ${a.oracleType} ${a.constraint !== '-' ? a.constraint : ''}`).join(',\n') +
                          '\n);';
                        handleCopy(sql);
                      }}
                      className="hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> คัดลอก SQL
                    </button>
                  </div>
                  <pre className="text-emerald-400 leading-relaxed">
{`CREATE TABLE ${currentEntity.entityName} (
` + currentEntity.attributes.map(a => `  ${a.name.padEnd(18)} ${a.oracleType.padEnd(16)} ${a.constraint !== '-' ? a.constraint : ''}`).join(',\n') + `
);`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ER Diagram & Relationships */}
      {activeTab === 'erd' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-purple-600" />
              <span>ผังความสัมพันธ์โครงสร้างฐานข้อมูล (Entity-Relationship Mappings)</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              โครงสร้างความสัมพันธ์แบบ 1 ต่อ กลุ่ม (1:N) และข้อกำหนด Foreign Keys ทั้งหมดในโปรเจกต์ 
              เชื่อมโยงระหว่างผู้ใช้งาน (Customer), เจ้าของลาน (Parking_Owner), ลานจอด (ParkingLot), การจอง (Reservation), การชำระเงิน (Payment) และข้อร้องเรียน (Complaint)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {relationships.map((rel, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      ความสัมพันธ์ {rel.relation}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      FK #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-sky-700">
                      {rel.fromTable}
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-purple-700">
                      {rel.toTable}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-mono text-slate-500">
                      {rel.fromTable}.<strong className="text-slate-800">{rel.fromCol}</strong> = {rel.toTable}.<strong className="text-slate-800">{rel.toCol}</strong>
                    </p>
                    <p className="text-slate-600 text-[11px] leading-tight pt-1">
                      {rel.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Real-world User & Owner Flows */}
      {activeTab === 'flows' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowRight className="w-6 h-6 text-purple-600" />
                <span>เส้นทางการจัดเก็บข้อมูลจากการใช้งานเว็บจริง (Real-World Web Flow Trace)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                จำลองและติดตามขั้นตอนที่ผู้ใช้งาน (Customer) และเจ้าของลาน (Parking_Owner) ดำเนินการผ่านหน้าเว็บจริง ว่าส่งผลต่อตารางและ Attribute ใดในฐานข้อมูล
              </p>
            </div>

            <div className="space-y-4">
              {flowStages.map((stage, idx) => (
                <div 
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-purple-50/30 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {stage.title}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 w-fit">
                      บทบาท: {stage.role}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-9">
                    {stage.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pl-9 pt-1">
                    <span className="text-[11px] font-bold text-purple-700">ตาราง Entity ที่ได้รับผลกระทบ:</span>
                    {stage.entities.map(e => (
                      <button
                        key={e}
                        onClick={() => {
                          setSelectedEntityName(e);
                          setActiveTab('records');
                        }}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-purple-100 text-purple-900 hover:bg-purple-200 transition-colors border border-purple-200 flex items-center gap-1"
                      >
                        <Table className="w-3 h-3 text-purple-600" />
                        <span>{e}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SQL DDL Schema Script */}
      {activeTab === 'sql-ddl' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Relational Schema DDL
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Oracle & SQL Standards
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-6 h-6 text-purple-600" />
                  <span>สคริปต์สร้างฐานข้อมูล (SQL DDL Script ตาม Relational Diagram PDF)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  คำสั่ง SQL สำหรับสร้างตาราง Entity ทั้ง 11 ตาราง พร้อมการผูก Foreign Keys, Composite Keys, Unique Constraints และ Audit Attributes
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    handleCopy(ddlScript);
                    setCopiedDdl(true);
                    setTimeout(() => setCopiedDdl(false), 2000);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {copiedDdl ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedDdl ? 'คัดลอกสำเร็จ!' : 'คัดลอก SQL Script'}</span>
                </button>

                <button
                  onClick={downloadDdlFile}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all flex items-center gap-1.5 border border-slate-200 active:scale-95"
                >
                  <FileDown className="w-4 h-4 text-slate-600" />
                  <span>ดาวน์โหลดไฟล์ .sql</span>
                </button>
              </div>
            </div>

            {loadingDdl ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                <span className="text-sm">กำลังโหลดสคริปต์ SQL...</span>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-200 shadow-inner">
                <pre className="leading-relaxed whitespace-pre-wrap selection:bg-purple-800">
                  {ddlScript}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Interactive SQL Query Console */}
      {activeTab === 'sql-query' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Interactive SQL Runner
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Live SQLite Query Console
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-purple-600" />
                  <span>คอนโซลรันคำสั่ง SQL กับฐานข้อมูลจริง (Query Console)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ทดสอบและประมวลผลคำสั่ง SQL (SELECT, JOIN, GROUP BY, WHERE) โดยตรงกับไฟล์ฐานข้อมูล <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-bold">server/parking.db</code>
                </p>
              </div>
            </div>

            {/* Query Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                เลือกคำสั่ง SQL ตัวอย่าง (คลิกเพื่อรันทันที):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  {
                    title: '1. ข้อมูลการจอง + ลูกค้า (JOIN)',
                    sql: 'SELECT r.Booking_ID, c.Username, d.LicensePlate, d.StartTime, d.EndTime, d.Reservation_Status, d.Totalfee\nFROM Reservation r\nJOIN Customer c ON r.Customer_ID = c.Customer_ID\nJOIN Reservation_Detail d ON r.Booking_ID = d.Booking_ID\nORDER BY r.Booking_ID DESC LIMIT 20;'
                  },
                  {
                    title: '2. รายชื่อลานจอดรถและราคา (ParkingLot)',
                    sql: 'SELECT Lot_ID, LotName, Location, OpenTime, CloseTime, FeeRate, FeeRate_Per_Hour, ParkingLot_Status\nFROM ParkingLot;'
                  },
                  {
                    title: '3. บันทึกการเข้า-ออกจริง (UsageLog)',
                    sql: 'SELECT Log_ID, Booking_ID, Slot_ID, Actual_Check_In, Actual_Check_Out, Created_At\nFROM UsageLog ORDER BY Log_ID DESC LIMIT 20;'
                  },
                  {
                    title: '4. ประวัติการชำระเงิน (Payment)',
                    sql: 'SELECT Payment_ID, Booking_ID, Amount, Payment_Type, Payment_Method, Payment_Status, Payment_Date\nFROM Payment ORDER BY Payment_ID DESC LIMIT 20;'
                  },
                  {
                    title: '5. สรุปช่องจอดตามสถานะ (GROUP BY)',
                    sql: 'SELECT ParkingSlot_Status, count(*) AS Slot_Count\nFROM ParkingSlot\nGROUP BY ParkingSlot_Status;'
                  },
                  {
                    title: '6. ข้อร้องเรียนและสถานะ (Complaint)',
                    sql: 'SELECT Complaint_ID, Customer_ID, Title, Complaint_Status, Complaint_Date\nFROM Complaint ORDER BY Complaint_ID DESC;'
                  }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSqlInput(preset.sql);
                      handleRunQuery(preset.sql);
                    }}
                    className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-300 text-xs transition-all space-y-1 group"
                  >
                    <span className="font-bold text-slate-800 group-hover:text-purple-900 block truncate">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {preset.sql.replace(/\n/g, ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Input Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">
                  คำสั่ง SQL ที่ต้องการประมวลผล:
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  (รองรับ SELECT, PRAGMA, EXPLAIN)
                </span>
              </div>
              <textarea
                value={sqlInput}
                onChange={e => setSqlInput(e.target.value)}
                rows={5}
                className="w-full p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-inner"
                placeholder="SELECT * FROM Customer LIMIT 10;"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  กดปุ่ม Execute Query เพื่อส่งคำสั่งไปยัง SQLite Engine
                </span>
                <button
                  onClick={() => handleRunQuery()}
                  disabled={queryLoading || !sqlInput.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-purple-600/20 active:scale-95"
                >
                  {queryLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{queryLoading ? 'กำลังประมวลผล...' : 'รันคำสั่ง SQL (Execute)'}</span>
                </button>
              </div>
            </div>

            {/* Query Error Notice */}
            {queryError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">เกิดข้อผิดพลาดในการประมวลผล SQL:</strong>
                  <span>{queryError}</span>
                </div>
              </div>
            )}

            {/* Query Result Table */}
            {queryResult && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">ผลลัพธ์การคิวรี (Query Results):</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px]">
                      {queryResult.rowCount} แถว (Rows)
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      ในเวลา {queryResult.durationMs} ms
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(JSON.stringify(queryResult.rows, null, 2))}
                    className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกเป็น JSON</span>
                  </button>
                </div>

                {queryResult.rows.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขคำสั่ง SQL (0 Rows Returned)
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[500px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-slate-400">#</th>
                          {queryResult.columns.map(col => (
                            <th key={col} className="py-2.5 px-3 font-bold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-2 px-3 text-slate-400 select-none">
                              {rIdx + 1}
                            </td>
                            {queryResult.columns.map(col => (
                              <td key={col} className="py-2 px-3 text-slate-800 whitespace-nowrap max-w-xs truncate">
                                {row[col] === null || row[col] === undefined ? (
                                  <span className="text-slate-300 italic">NULL</span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Inspect Modal Drawer */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  รายละเอียดระเบียนในตาราง {selectedEntityName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-3">
              {sortedRecordEntries.map(([key, val]: [string, any], idx) => {
                const isSys = key.startsWith('_firebase') || key.startsWith('__');
                const isPk = key.toLowerCase() === currentEntity?.primaryKey?.toLowerCase();
                const attrInfo = currentEntity?.attributes?.find(
                  (a: any) => a.name.toLowerCase() === key.toLowerCase()
                );
                const isFk = attrInfo?.constraint?.includes('FK');

                return (
                  <div key={idx} className={`p-3.5 rounded-2xl border transition-all ${
                    isPk 
                      ? 'bg-purple-50/50 border-purple-200' 
                      : isSys 
                        ? 'bg-slate-50/60 border-slate-200/60 opacity-80' 
                        : 'bg-white border-slate-200/80 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isPk && <Key className="w-3.5 h-3.5 text-amber-500" />}
                        {isFk && <Link2 className="w-3.5 h-3.5 text-blue-500" />}
                        <span className={`font-mono font-bold ${
                          isPk ? 'text-purple-800' : isFk ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {key}
                        </span>
                        {isPk && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            PK
                          </span>
                        )}
                        {isFk && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            FK
                          </span>
                        )}
                        {isSys && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            System Sync Meta
                          </span>
                        )}
                      </div>
                      {attrInfo?.oracleType && (
                        <span className="text-slate-400 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                          {attrInfo.oracleType}
                        </span>
                      )}
                    </div>
                    {attrInfo?.desc && (
                      <p className="text-[11px] text-slate-500 mb-2">
                        {attrInfo.desc}
                      </p>
                    )}
                    <div className="text-xs font-semibold text-slate-800 break-all p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono select-all">
                      {val === null || val === undefined ? (
                        <span className="text-slate-400 italic font-normal">NULL</span>
                      ) : typeof val === 'object' ? (
                        JSON.stringify(val, null, 2)
                      ) : (
                        String(val)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleCopy(JSON.stringify(selectedRecord, null, 2))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกระเบียนนี้ (JSON)</span>
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
