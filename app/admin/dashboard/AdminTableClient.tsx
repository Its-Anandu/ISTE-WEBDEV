'use client';

import React, { useState, useMemo } from 'react';
import { RegistrationData } from '@/lib/googleSheets';
import { Search, Download, CheckCircle, Clock, ShieldCheck, LogOut, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminTableClientProps {
  initialRegistrations: RegistrationData[];
  adminEmail: string;
}

export default function AdminTableClient({
  initialRegistrations,
  adminEmail,
}: AdminTableClientProps) {
  const [registrations, setRegistrations] = useState<RegistrationData[]>(initialRegistrations);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Client-side search & filtering
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return registrations;
    const query = searchQuery.toLowerCase().trim();

    return registrations.filter(
      (r) =>
        r.fullName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.phone.includes(query) ||
        r.eventId.toLowerCase().includes(query) ||
        (r.paymentRef && r.paymentRef.toLowerCase().includes(query))
    );
  }, [registrations, searchQuery]);

  // Handle payment verification
  const handleVerifyPayment = async (registrationId: string) => {
    setVerifyingId(registrationId);
    setStatusMsg(null);

    try {
      const response = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify payment');
      }

      // Optimistically update status
      setRegistrations((prev) =>
        prev.map((r) =>
          r.registrationId === registrationId
            ? { ...r, paymentStatus: 'Confirmed' }
            : r
        )
      );

      setStatusMsg({ text: `Payment confirmed for Reg ID ${registrationId.slice(0, 8)}`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error verifying payment', type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  // Client-side CSV export
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = [
      'Timestamp',
      'Registration ID',
      'Event ID',
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Year',
      'ISTE ID',
      'Payment Status',
      'Payment Ref / UTR',
    ];

    const csvRows = filteredRegistrations.map((r) => [
      `"${r.timestamp || ''}"`,
      `"${r.registrationId}"`,
      `"${r.eventId}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.college.replace(/"/g, '""')}"`,
      `"${r.yearOfStudy}"`,
      `"${r.isteId || ''}"`,
      `"${r.paymentStatus || 'Pending'}"`,
      `"${r.paymentRef || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ISTE_Registrations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Navbar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">ISTE Event Admin Dashboard</h1>
            <p className="text-xs text-zinc-400">
              Logged in as <span className="text-amber-300 font-semibold">{adminEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={filteredRegistrations.length === 0}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export CSV ({filteredRegistrations.length})
          </button>
          <a
            href="/admin/login"
            className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-900/60 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </a>
        </div>
      </header>

      {/* Status banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-900 text-emerald-300'
              : 'bg-rose-950/60 border-rose-900 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Search Bar & Summary Stats */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, event, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            Total: <strong className="text-zinc-100">{registrations.length}</strong>
          </span>
          <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            Confirmed:{' '}
            <strong className="text-emerald-400">
              {registrations.filter((r) => r.paymentStatus === 'Confirmed').length}
            </strong>
          </span>
          <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            Awaiting:{' '}
            <strong className="text-amber-400">
              {registrations.filter((r) => r.paymentStatus === 'Awaiting Verification').length}
            </strong>
          </span>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">College / Year</th>
                <th className="px-4 py-3.5">Event</th>
                <th className="px-4 py-3.5">Payment Status</th>
                <th className="px-4 py-3.5">UTR / Ref</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No registrations found matching your query.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((r, idx) => (
                  <tr key={r.registrationId || idx} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-zinc-100">
                      <div className="font-semibold">{r.fullName}</div>
                      {r.isteId && (
                        <span className="text-[10px] text-amber-400/90 font-mono">ISTE: {r.isteId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div>{r.email}</div>
                      <div className="text-zinc-500 font-mono">{r.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>{r.college}</div>
                      <div className="text-zinc-500">{r.yearOfStudy} Year</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-400">
                      {r.eventId}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.paymentStatus === 'Confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Confirmed
                        </span>
                      ) : r.paymentStatus === 'Awaiting Verification' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Awaiting
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-300">
                      {r.paymentRef ? (
                        <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">{r.paymentRef}</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.paymentStatus === 'Confirmed' ? (
                        <span className="text-emerald-500 font-medium text-[11px]">Verified</span>
                      ) : (
                        <button
                          onClick={() => handleVerifyPayment(r.registrationId)}
                          disabled={verifyingId === r.registrationId}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-[11px] transition-all disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {verifyingId === r.registrationId ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Verify Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
