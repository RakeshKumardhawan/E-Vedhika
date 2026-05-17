import React, { useState, useRef } from "react";
import { FileUp, Printer, FileSpreadsheet, X } from "lucide-react";
import "./ExcelPrinterTool.css";

export function ExcelPrinterTool() {
  const [data, setData] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      const XLSX = await import("xlsx");
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const dataArr = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      setData(dataArr);
    };
    reader.readAsBinaryString(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFile = () => {
    setData([]);
    setFileName("");
  };

  return (
    <div className="excel-printer-container">
      {/* Non-printable controls */}
      <div className="no-print bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Excel to A4 Print</h2>
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Preview & Print without missing letters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!data.length ? (
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2">
                <FileUp size={18} />
                <span>Upload Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={clearFile}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-2"
                >
                  <X size={18} />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Printer size={18} />
                  <span>Print A4</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Preview Area */}
      {data.length > 0 && (
        <div className="bg-slate-100 p-8 rounded-[32px] no-print">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            A4 Print Preview (Scroll horizontal if needed)
          </p>
          <div className="print-area-wrapper">
             <div className="printable-a4" ref={printRef}>
              <div className="print-header">
                <h2>{fileName}</h2>
              </div>
              <table className="excel-table">
                <tbody>
                  {data.map((row, rIndex) => (
                    <tr key={rIndex}>
                      {row.map((cell, cIndex) => (
                        <td key={cIndex}>{cell !== undefined ? String(cell) : ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actual elements used ONLY during printing (rendered outside usual layout via CSS logic if needed, but here we just rely on @media print modifying the above) */}
    </div>
  );
}
