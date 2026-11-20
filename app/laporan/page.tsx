"use client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Download, Printer } from "lucide-react";
import { useDB } from "@/lib/store";
import {
  Badge,
  Button,
  Card,
  Modal,
  Notice,
  PageHeader,
  Row,
  Select,
  Table,
  Td,
  THead,
  useToast,
  cn,
} from "@/components/ui";
import { daysAgo, iso, num, rp, saleCalc, short, sum } from "@/lib/utils";

const keyOf = (t: string, g: string) => {
  if (g === "bulan") return t.slice(0, 7);
  if (g === "minggu") {
    const d = new Date(t + "T00:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return iso(d);
  }
  return t;
};
const labelOf = (k: string, g: string) =>
  g === "bulan"
    ? new Date(k + "-01T00:00:00").toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
      })
    : new Date(k + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
const COLORS = [
  "#059669",
  "#34d399",
  "#f59e0b",
  "#64748b",
  "#94a3b8",
  "#fbbf24",
  "#a7f3d0",
  "#cbd5e1",
  "#047857",
];
const tip = {
  contentStyle: { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 },
};
const axis = {
  tick: { fontSize: 11, fill: "#94a3b8" },
  tickLine: false,
  axisLine: false,
} as any;

export default function Laporan() {
  const { db } = useDB();
  const toast = useToast();
  const [range, setRange] = useState(30),
    [g, setG] = useState("hari"),
    [prev, setPrev] = useState(false);
  const from = daysAgo(range - 1);
  const sales = db.sales.filter((s) => s.tgl >= from),
    exps = db.expenses.filter((e) => e.tgl >= from);
  const rev = sum(sales.map((s) => saleCalc(s).rev)),
    hpp = sum(sales.map((s) => saleCalc(s).hpp)),
    gross = rev - hpp,
    opex = sum(exps.map((e) => e.jumlah)),
    net = gross - opex;
  const unpaid = sum(
    sales.filter((s) => s.status === "Belum Lunas").map((s) => saleCalc(s).rev),
  );
  const series = useMemo(() => {
    const m: Record<string, { Pendapatan: number; Laba: number }> = {};
    sales.forEach((s) => {
      const k = keyOf(s.tgl, g),
        c = saleCalc(s);
      m[k] = m[k] || { Pendapatan: 0, Laba: 0 };
      m[k].Pendapatan += c.rev;
      m[k].Laba += c.profit;
    });
    return Object.keys(m)
      .sort()
      .map((k) => ({ k: labelOf(k, g), ...m[k] }));
  }, [sales, g]);
  const prodM = useMemo(() => {
    const m: Record<string, number> = {};
    db.productions
      .filter((p) => p.status === "Selesai")
      .forEach((p) => {
        const k = p.tgl.slice(0, 7);
        m[k] = (m[k] || 0) + p.hasil - p.rusak;
      });
    return Object.keys(m)
      .sort()
      .map((k) => ({ k: labelOf(k, "bulan"), Unit: m[k] }));
  }, [db.productions]);
  const prof = db.products
    .map((p) => {
      const its = sales
        .flatMap((s) => s.items)
        .filter((i) => i.productId === p.id);
      const qty = sum(its.map((i) => i.qty)),
        r = sum(its.map((i) => i.qty * i.harga)),
        h = sum(its.map((i) => i.qty * i.hpp));
      return {
        nama: p.nama,
        qty,
        rev: r,
        hpp: h,
        laba: r - h,
        margin: r ? ((r - h) / r) * 100 : 0,
      };
    })
    .filter((p) => p.qty > 0)
    .sort((a, b) => b.laba - a.laba);
  const expPie = Object.entries(
    exps.reduce((a: any, e) => {
      a[e.kategori] = (a[e.kategori] || 0) + e.jumlah;
      return a;
    }, {}),
  )
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);
  const cost = db.productions.filter(
    (p) => p.status === "Selesai" && p.tgl >= from,
  );
  const csv = () => {
    const rows = [
      [
        "Laporan Keuangan (estimasi)",
        db.settings.nama,
        `${range} hari terakhir`,
      ],
      [],
      ["Ringkasan"],
      ["Pendapatan", rev],
      ["HPP", hpp],
      ["Laba kotor", gross],
      ["Biaya operasional", opex],
      ["Estimasi laba bersih", net],
      [],
      ["Produk", "Terjual", "Pendapatan", "HPP", "Laba kotor", "Margin %"],
      ...prof.map((p) => [
        p.nama,
        p.qty,
        p.rev,
        Math.round(p.hpp),
        Math.round(p.laba),
        p.margin.toFixed(1),
      ]),
    ];
    const blob = new Blob(
      [rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-${iso()}.csv`;
    a.click();
    toast("CSV diunduh");
  };
  const Sum = () => (
    <div className="rounded-xl border border-slate-200 px-4 py-2">
      <Row k="Total pendapatan" v={rp(rev)} />
      <Row k="Harga pokok penjualan (HPP)" v={`−${rp(hpp)}`} />
      <Row
        bold
        k="Laba kotor"
        v={<span className="text-emerald-700">{rp(gross)}</span>}
      />
      <Row k="Biaya operasional" v={`−${rp(opex)}`} />
      <Row
        bold
        k="Estimasi laba bersih"
        v={
          <span className={net >= 0 ? "text-emerald-700" : "text-red-600"}>
            {rp(net)}
          </span>
        }
      />
    </div>
  );
  const ProfTable = () => (
    <Table>
      <THead>
        <th className="px-4 py-2.5">Produk</th>
        <th className="px-4 py-2.5 text-right">Terjual</th>
        <th className="px-4 py-2.5 text-right">Pendapatan</th>
        <th className="px-4 py-2.5 text-right">HPP</th>
        <th className="px-4 py-2.5 text-right">Laba Kotor</th>
        <th className="px-4 py-2.5 text-right">Margin</th>
      </THead>
      <tbody>
        {prof.map((p) => (
          <tr key={p.nama}>
            <Td className="font-medium">{p.nama}</Td>
            <Td right>{num(p.qty, 0)}</Td>
            <Td right>{rp(p.rev)}</Td>
            <Td right>{rp(p.hpp)}</Td>
            <Td right className="text-emerald-700">
              {rp(p.laba)}
            </Td>
            <Td right>
              <Badge
                tone={
                  p.margin >= 30 ? "green" : p.margin >= 15 ? "amber" : "red"
                }
              >
                {num(p.margin, 1)}%
              </Badge>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
  return (
    <div>
      <PageHeader
        title="Laporan Keuangan"
        desc="Pantau pendapatan, modal, dan laba usaha tanpa perlu ilmu akuntansi."
        actions={
          <>
            <Button variant="outline" onClick={() => setPrev(true)}>
              <Printer size={16} />
              Pratinjau Cetak
            </Button>
            <Button variant="outline" onClick={csv}>
              <Download size={16} />
              Ekspor CSV
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {[
            [7, "7 Hari"],
            [30, "30 Hari"],
            [90, "90 Hari"],
            [365, "1 Tahun"],
          ].map(([v, l]: any) => (
            <button
              key={v}
              onClick={() => {
                setRange(v);
                setG(v >= 90 ? "minggu" : "hari");
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                range === v
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <Select
          className="w-40"
          value={g}
          onChange={(e: any) => setG(e.target.value)}
          aria-label="Kelompokkan"
        >
          <option value="hari">Per hari</option>
          <option value="minggu">Per minggu</option>
          <option value="bulan">Per bulan</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total pendapatan", rev, "penjualan"],
          ["HPP", hpp, "modal produk terjual"],
          ["Laba kotor", gross, "pendapatan − HPP"],
          ["Biaya operasional", opex, "di luar HPP"],
          ["Estimasi laba bersih", net, "laba kotor − operasional"],
        ].map(([l, v, s]: any, i) => (
          <Card
            key={l}
            className={cn(
              "p-4",
              i === 4 && "border-emerald-200 bg-emerald-50/40",
            )}
          >
            <p className="text-sm text-slate-500">{l}</p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold",
                v < 0 && "text-red-600",
              )}
            >
              {rp(v)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{s}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <Notice tone="blue">
          <b>Estimasi:</b> angka ini adalah laba menurut catatan di aplikasi,
          bukan saldo kas.{" "}
          {unpaid > 0 ? (
            <>
              Ada penjualan belum lunas sebesar <b>{rp(unpaid)}</b> yang sudah
              dihitung sebagai pendapatan tapi uangnya belum diterima.{" "}
            </>
          ) : (
            ""
          )}
          Pembelian bahan tidak dihitung sebagai biaya saat dibeli — baru
          menjadi HPP ketika dipakai produksi dan terjual.
        </Notice>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Pendapatan vs laba kotor</h2>
          <div className="h-64">
            {series.length ? (
              <ResponsiveContainer>
                <LineChart data={series} margin={{ left: -10 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="k" {...axis} />
                  <YAxis {...axis} tickFormatter={short} />
                  <Tooltip formatter={(v: any) => rp(v)} {...tip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="Pendapatan"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Laba"
                    name="Laba kotor"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-24 text-center text-sm text-slate-400">
                Belum ada penjualan pada periode ini
              </p>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Volume produksi per bulan</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={prodM} margin={{ left: -10 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="k" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tip} />
                <Bar
                  dataKey="Unit"
                  name="Unit siap jual"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Keuntungan per produk</h2>
          <div className="h-64">
            {prof.length ? (
              <ResponsiveContainer>
                <BarChart
                  data={prof.map((p) => ({
                    ...p,
                    nama: p.nama.replace("Keripik Singkong ", ""),
                  }))}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" {...axis} tickFormatter={short} />
                  <YAxis type="category" dataKey="nama" width={80} {...axis} />
                  <Tooltip formatter={(v: any) => rp(v)} {...tip} />
                  <Bar
                    dataKey="laba"
                    name="Laba kotor"
                    fill="#10b981"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-24 text-center text-sm text-slate-400">
                Belum ada data
              </p>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">
            Distribusi pengeluaran operasional
          </h2>
          <div className="h-64">
            {expPie.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={expPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {expPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => rp(v)} {...tip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-24 text-center text-sm text-slate-400">
                Belum ada pengeluaran
              </p>
            )}
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold">Profitabilitas produk</h2>
          <p className="text-xs text-slate-500">
            Margin = laba kotor ÷ pendapatan. Berdasarkan HPP saat transaksi
            terjadi.
          </p>
        </div>
        {prof.length ? (
          <ProfTable />
        ) : (
          <p className="p-8 text-center text-sm text-slate-400">
            Belum ada penjualan pada periode ini
          </p>
        )}
      </Card>
      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold">Analisis biaya produksi</h2>
          <p className="text-xs text-slate-500">
            Biaya aktual produksi selesai pada periode ini
          </p>
        </div>
        {cost.length ? (
          <Table>
            <THead>
              <th className="px-4 py-2.5">Produksi</th>
              <th className="px-4 py-2.5 text-right">Hasil</th>
              <th className="px-4 py-2.5 text-right">Biaya bahan</th>
              <th className="px-4 py-2.5 text-right">Tenaga & overhead</th>
              <th className="px-4 py-2.5 text-right">Terbuang & tambahan</th>
              <th className="px-4 py-2.5 text-right">HPP aktual</th>
            </THead>
            <tbody>
              {cost.map((p) => (
                <tr key={p.id}>
                  <Td>
                    {p.id} · {p.nama}
                  </Td>
                  <Td right>{p.hasil - p.rusak}</Td>
                  <Td right>{rp(p.biayaBahan)}</Td>
                  <Td right>{rp(p.biayaLain)}</Td>
                  <Td right>{rp(p.biayaWaste + p.biayaTambahan)}</Td>
                  <Td right className="font-medium">
                    {rp(p.hppAktual)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="p-8 text-center text-sm text-slate-400">
            Belum ada produksi selesai pada periode ini
          </p>
        )}
      </Card>
      <Modal
        open={prev}
        onClose={() => setPrev(false)}
        size="lg"
        title={`Laporan Keuangan — ${db.settings.nama}`}
        desc={`Periode ${range} hari terakhir · estimasi`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPrev(false)}>
              Tutup
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={15} />
              Cetak
            </Button>
          </>
        }
      >
        <Sum />
        <h3 className="mb-2 mt-5 text-sm font-semibold">
          Profitabilitas produk
        </h3>
        <div className="rounded-xl border border-slate-200">
          <ProfTable />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Angka merupakan estimasi berdasarkan catatan aplikasi dan bukan
          laporan akuntansi resmi.
        </p>
      </Modal>
    </div>
  );
}
