import { useState, useEffect } from 'react';
import { FileText, DollarSign, Download, Printer, Building2, CreditCard } from 'lucide-react';
import { formatBaht } from '../../lib/utils';
import { formatThaiDateTime } from '../../lib/thai-time';

export function AdminReports() {
  const [report, setReport] = useState<{ revenueByLot: any[]; recentPayments: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/reports/revenue', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalSystemRevenue = report?.revenueByLot.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-sky-600" />
            รายงานสรุปรายได้และธุรกรรมการเงิน (Financial Reports)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สรุปยอดรายได้แยกตามลานจอดรถ พร้อมรายการชำระเงินล่าสุด
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>พิมพ์รายงาน / บันทึก PDF</span>
        </button>
      </div>

      {loading || !report ? (
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      ) : (
        <div className="space-y-8">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-sky-200 block">
                ยอดรายได้รวมทั้งระบบ
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold mt-1">
                {formatBaht(totalSystemRevenue)}
              </div>
              <p className="text-xs text-sky-100 mt-1">
                จากลานจอดทั้งหมด {report.revenueByLot.length} แห่ง
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Revenue by Lot Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 font-bold text-base text-slate-900">
              รายได้แยกตามลานจอดรถ
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">ชื่อลานจอด</th>
                    <th className="py-3.5 px-4">พื้นที่</th>
                    <th className="py-3.5 px-4">จำนวนการจอง</th>
                    <th className="py-3.5 px-4 text-right">ยอดเงินรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.revenueByLot.map((lot: any) => (
                    <tr key={lot.Lot_ID} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {lot.LotName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {lot.District || (lot.Location ? lot.Location.split(' ')[0] : 'อ.เมือง')}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {lot.totalBookings ?? lot.bookingCount ?? 0} ครั้ง
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">
                        {formatBaht(lot.totalRevenue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments Stream */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 font-bold text-base text-slate-900">
              ประวัติการชำระเงินล่าสุด (Transactions)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">รหัส</th>
                    <th className="py-3.5 px-4">ผู้ชำระ</th>
                    <th className="py-3.5 px-4">ประเภท</th>
                    <th className="py-3.5 px-4">ช่องทาง</th>
                    <th className="py-3.5 px-4">เวลา</th>
                    <th className="py-3.5 px-4 text-right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">ยังไม่มีรายการชำระเงิน</td>
                    </tr>
                  ) : (
                    report.recentPayments.map((p: any) => (
                      <tr key={p.Payment_ID} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          #{p.Payment_ID}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {p.Username}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.Payment_Type === 'Deposit' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.Payment_Type === 'Deposit' ? 'มัดจำ' : 'ค่าจอดจริง'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.Payment_Method}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {formatThaiDateTime(p.Payment_Date)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ฿{p.Amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
