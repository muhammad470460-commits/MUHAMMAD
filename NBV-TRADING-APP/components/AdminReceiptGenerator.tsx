import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Share2,
  Eye,
  Save,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Building,
  Phone,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import type { GeneratedReceiptItem } from '../types';

interface AdminReceiptGeneratorProps {
  authToken: string;
  onAuditRefresh?: () => void;
}

type ReceiptType = 'bank_transfer' | 'cash' | 'easypaisa' | 'jazzcash' | 'other';
type ReceiptStatus = 'successful' | 'pending' | 'completed' | 'failed';
type ReceiptTheme =
  | 'meezan_receipt'
  | 'jazzcash_receipt'
  | 'easypaisa_receipt'
  | 'classic_clean'
  | 'custom_bg';

interface ReceiptFormData {
  receiptType: ReceiptType;
  senderName: string;
  senderAccountOrPhone: string;
  receiverName: string;
  receiverAccountOrPhone: string;
  amount: number | '';
  fee: number | '';
  transactionRef: string;
  transactionDateTime: string;
  status: ReceiptStatus;
  paymentMethod: string;
  bankName: string;
  purpose: string;
  notes: string;
  backgroundTheme: ReceiptTheme;
  imageDataUrl?: string | null;
}

const DEFAULT_TEMPLATES: Record<ReceiptType, Partial<ReceiptFormData>> = {
  bank_transfer: {
    receiptType: 'bank_transfer',
    senderName: 'MUHAMMAD NAEEM',
    senderAccountOrPhone: '03433370774',
    receiverName: 'SUMERA BIBI',
    receiverAccountOrPhone: '03433370774',
    amount: 14615,
    fee: 0,
    paymentMethod: 'Bank Transfer',
    bankName: 'Meezan Bank Limited',
    purpose: 'Investment Deposit',
    notes: 'Transferred via Meezan Mobile Banking — Instant Settlement',
    backgroundTheme: 'meezan_receipt',
  },
  cash: {
    receiptType: 'cash',
    senderName: 'WALK-IN INVESTOR',
    senderAccountOrPhone: '03001234567',
    receiverName: 'NBV TRADING ISLAMABAD CASH DESK',
    receiverAccountOrPhone: 'CASH-OFFICE-01',
    amount: 50000,
    fee: 0,
    paymentMethod: 'Cash Payment Voucher',
    bankName: 'NBV Cash Treasury Counter',
    purpose: 'Physical Cash Investment Deposit',
    notes: 'Official Cash Counter Voucher — Verified by Treasury Officer',
    backgroundTheme: 'classic_clean',
  },
  easypaisa: {
    receiptType: 'easypaisa',
    senderName: 'MUHAMMAD NAEEM',
    senderAccountOrPhone: '03084704644',
    receiverName: 'SUMERA BIBI',
    receiverAccountOrPhone: '03433370774',
    amount: 14615,
    fee: 0,
    paymentMethod: 'Easypaisa',
    bankName: 'Telenor Microfinance Bank',
    purpose: 'Transferred to Easypaisa Wallet',
    notes: 'Securely paid via Easypaisa App — 100% Verified',
    backgroundTheme: 'easypaisa_receipt',
  },
  jazzcash: {
    receiptType: 'jazzcash',
    senderName: 'MUHAMMAD NAEEM',
    senderAccountOrPhone: '03084704644',
    receiverName: 'Syed Ishaq Hussain Shah',
    receiverAccountOrPhone: '*******3908',
    amount: 14615,
    fee: 0,
    paymentMethod: 'JazzCash',
    bankName: 'Mobilink Microfinance Bank',
    purpose: 'Transferred to Other Wallet',
    notes: 'Securely paid via JazzCash',
    backgroundTheme: 'jazzcash_receipt',
  },
  other: {
    receiptType: 'other',
    senderName: 'INVESTOR ACCOUNT',
    senderAccountOrPhone: '03129876543',
    receiverName: 'NBV GLOBAL RECEIVING',
    receiverAccountOrPhone: 'ACC-9988776655',
    amount: 25000,
    fee: 0,
    paymentMethod: 'Direct Payment Gateway',
    bankName: 'Standard Chartered / Allied Bank',
    purpose: 'Official Trade Capital Deposit',
    notes: 'Verified Electronic Payment Order',
    backgroundTheme: 'classic_clean',
  },
};

export function AdminReceiptGenerator({ authToken, onAuditRefresh }: AdminReceiptGeneratorProps) {
  const [savedReceipts, setSavedReceipts] = useState<GeneratedReceiptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  // Form State
  const [form, setForm] = useState<ReceiptFormData>({
    receiptType: 'bank_transfer',
    senderName: 'MUHAMMAD NAEEM',
    senderAccountOrPhone: '03433370774',
    receiverName: 'SUMERA BIBI',
    receiverAccountOrPhone: '03433370774',
    amount: 14615,
    fee: 0,
    transactionRef: `7280${Math.floor(10000000 + Math.random() * 90000000)}`,
    transactionDateTime: '24 Oct 2026 at 17:47',
    status: 'successful',
    paymentMethod: 'Bank Transfer',
    bankName: 'Meezan Bank Limited',
    purpose: 'Investment Deposit',
    notes: 'Transferred via Meezan Mobile Banking — Instant Settlement',
    backgroundTheme: 'meezan_receipt',
    imageDataUrl: null,
  });

  const receiptDomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load receipts from server
  async function loadReceipts() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/receipts', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.receipts)) {
          setSavedReceipts(data.receipts);
          if (data.receipts.length > 0 && !selectedReceiptId) {
            loadReceiptIntoForm(data.receipts[0]);
          }
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipts();
  }, [authToken]);

  function loadReceiptIntoForm(item: GeneratedReceiptItem) {
    setSelectedReceiptId(item.id);
    setForm({
      receiptType: item.receiptType,
      senderName: item.senderName,
      senderAccountOrPhone: item.senderAccountOrPhone,
      receiverName: item.receiverName,
      receiverAccountOrPhone: item.receiverAccountOrPhone,
      amount: item.amount,
      fee: item.fee,
      transactionRef: item.transactionRef,
      transactionDateTime: item.transactionDateTime,
      status: item.status,
      paymentMethod: item.paymentMethod,
      bankName: item.bankName,
      purpose: item.purpose,
      notes: item.notes,
      backgroundTheme: item.backgroundTheme,
      imageDataUrl: null, // Keeps existing server file if not replaced
    });
  }

  function handleSwitchType(type: ReceiptType) {
    const template = DEFAULT_TEMPLATES[type];
    setSelectedReceiptId(null);
    setForm((prev) => ({
      ...prev,
      ...template,
      transactionRef: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      transactionDateTime: new Date().toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      imageDataUrl: null,
    }));
  }

  function handleCreateNew() {
    setSelectedReceiptId(null);
    handleSwitchType(form.receiptType);
    setStatusMessage({
      type: 'success',
      text: 'New blank receipt ready for manual editing. Fill details and click "Generate / Save".',
    });
  }

  // Handle Image Upload for Custom Receipt Design / Background
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Receipt image size must be under 5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({
          ...prev,
          imageDataUrl: reader.result as string,
          backgroundTheme: 'custom_bg',
        }));
        setStatusMessage({ type: 'success', text: 'Custom receipt image loaded into template.' });
      }
    };
    reader.readAsDataURL(file);
  }

  // Save / Update to Database
  async function handleSaveReceipt(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      ...form,
      amount: Number(form.amount) || 0,
      fee: Number(form.fee) || 0,
    };

    try {
      const url = selectedReceiptId
        ? `/api/admin/receipts/${selectedReceiptId}`
        : '/api/admin/receipts';
      const method = selectedReceiptId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save receipt.' });
        return;
      }

      const savedItem: GeneratedReceiptItem = data.receipt;
      setSelectedReceiptId(savedItem.id);
      setStatusMessage({
        type: 'success',
        text: `Receipt ${savedItem.transactionRef} saved and updated in database successfully!`,
      });
      await loadReceipts();
      onAuditRefresh?.();
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error saving receipt.' });
    } finally {
      setSaving(false);
    }
  }

  // Delete Receipt
  async function handleDeleteReceipt(id: string) {
    if (!window.confirm('Are you sure you want to delete this receipt template?')) return;
    try {
      const res = await fetch(`/api/admin/receipts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Receipt template deleted.' });
        if (selectedReceiptId === id) {
          setSelectedReceiptId(null);
          handleSwitchType('bank_transfer');
        }
        await loadReceipts();
        onAuditRefresh?.();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to delete receipt.' });
    }
  }

  // Download High-Resolution PNG via Canvas
  async function handleDownloadPng() {
    setDownloadingPng(true);
    try {
      const scale = 2; // High-resolution retina scale
      const width = 440 * scale;
      const height = 700 * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas');

      ctx.scale(scale, scale);

      // Determine colors based on theme
      const isMeezan = form.backgroundTheme === 'meezan_receipt';
      const isJazzCash = form.backgroundTheme === 'jazzcash_receipt';
      const isEasypaisa = form.backgroundTheme === 'easypaisa_receipt';

      // Background
      if (isJazzCash) {
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, 440, 700);

        // Perforated edge at top
        ctx.fillStyle = '#042416';
        for (let i = 0; i < 440; i += 18) {
          ctx.beginPath();
          ctx.arc(i + 9, 0, 6, 0, Math.PI);
          ctx.fill();
        }

        // Receipt Card Body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 24, 408, 640);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(16, 24, 408, 640);
      } else if (isMeezan) {
        // Meezan Bank Card Style
        ctx.fillStyle = '#072418';
        ctx.fillRect(0, 0, 440, 700);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 20, 408, 650);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(16, 20, 408, 650);

        // Meezan Top Header Banner
        ctx.fillStyle = '#0a3d28';
        ctx.fillRect(16, 20, 408, 60);

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MEEZAN BANK LIMITED', 220, 46);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.fillText('The Premier Islamic Bank · Funds Transfer Receipt', 220, 64);
      } else if (isEasypaisa) {
        // Easypaisa Card Style
        ctx.fillStyle = '#022115';
        ctx.fillRect(0, 0, 440, 700);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 20, 408, 650);

        // Easypaisa Top Green Header
        ctx.fillStyle = '#00a859';
        ctx.fillRect(16, 20, 408, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EASYPAISA', 220, 46);
        ctx.font = '11px sans-serif';
        ctx.fillText('Telenor Microfinance Bank · Transaction Receipt', 220, 64);
      } else {
        // Classic Clean Style
        ctx.fillStyle = '#0b1e16';
        ctx.fillRect(0, 0, 440, 700);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 20, 408, 650);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(16, 20, 408, 650);

        ctx.fillStyle = '#083c26';
        ctx.fillRect(16, 20, 408, 56);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NBV TRADING OFFICIAL RECEIPT', 220, 46);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.fillText(form.bankName || 'Verified Transaction Ledger', 220, 62);
      }

      // Title & Status
      let y = isJazzCash ? 65 : 110;
      ctx.textAlign = 'center';

      // Status Icon Circle
      ctx.beginPath();
      ctx.arc(220, y, 16, 0, 2 * Math.PI);
      ctx.fillStyle = form.status === 'successful' ? '#10b981' : form.status === 'pending' ? '#f59e0b' : '#ef4444';
      ctx.fill();

      // Checkmark icon in circle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(213, y);
      ctx.lineTo(218, y + 5);
      ctx.lineTo(228, y - 5);
      ctx.stroke();

      y += 32;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 19px sans-serif';
      const statusTitle =
        form.status === 'successful'
          ? 'Transaction Successful'
          : form.status === 'pending'
            ? 'Transaction Pending'
            : 'Transaction Completed';
      ctx.fillText(statusTitle, 220, y);

      y += 20;
      ctx.fillStyle = '#4b5563';
      ctx.font = '500 13px sans-serif';
      ctx.fillText(`TID: ${form.transactionRef}`, 220, y);

      y += 18;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.fillText(`On ${form.transactionDateTime}`, 220, y);

      // Divider Line
      y += 20;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, y);
      ctx.lineTo(404, y);
      ctx.stroke();

      // Big Amount
      y += 38;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 28px sans-serif';
      const formattedAmount = `Rs. ${Number(form.amount || 0).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      ctx.fillText(formattedAmount, 220, y);

      y += 20;
      ctx.fillStyle = '#4b5563';
      ctx.font = '500 13px sans-serif';
      ctx.fillText(form.purpose || 'Transferred to Other Wallet', 220, y);

      // Divider Line
      y += 20;
      ctx.beginPath();
      ctx.moveTo(36, y);
      ctx.lineTo(404, y);
      ctx.stroke();

      // Transaction Ledger Rows (matching JazzCash & Meezan style)
      y += 30;
      const drawRow = (label: string, value: string, subvalue?: string, boldVal: boolean = false) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#4b5563';
        ctx.font = '500 14px sans-serif';
        ctx.fillText(label, 44, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#111827';
        ctx.font = boldVal ? 'bold 14px sans-serif' : '500 14px sans-serif';
        ctx.fillText(value, 396, y);

        if (subvalue) {
          y += 16;
          ctx.fillStyle = '#6b7280';
          ctx.font = '12px sans-serif';
          ctx.fillText(subvalue, 396, y);
        }

        y += 26;
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(44, y - 10);
        ctx.lineTo(396, y - 10);
        ctx.stroke();
      };

      const feeFormatted = `Rs. ${Number(form.fee || 0).toFixed(2)}`;
      drawRow('Fee', feeFormatted);
      drawRow('To', form.receiverName, `${form.receiverAccountOrPhone} · ${form.bankName}`, true);
      drawRow('From', form.senderName, `${form.senderAccountOrPhone} · ${form.paymentMethod}`);

      if (form.notes) {
        y += 6;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6b7280';
        ctx.font = 'italic 11px sans-serif';
        ctx.fillText(form.notes, 220, y);
        y += 16;
      }

      // Footer branding
      const footerY = 640;
      ctx.textAlign = 'center';
      if (isJazzCash) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.fillText('Securely paid via JazzCash', 220, footerY);
      } else if (isMeezan) {
        ctx.fillStyle = '#0a3d28';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Meezan Bank Limited · Verified Electronic Advice', 220, footerY);
      } else if (isEasypaisa) {
        ctx.fillStyle = '#00a859';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Easypaisa · Telenor Microfinance Bank Limited', 220, footerY);
      } else {
        ctx.fillStyle = '#083c26';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('NBV Trading Corporate Treasury · Official Record', 220, footerY);
      }

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `NBV_Receipt_${form.transactionRef || 'TID'}.png`;
      link.href = dataUrl;
      link.click();

      setStatusMessage({
        type: 'success',
        text: `Receipt downloaded successfully as NBV_Receipt_${form.transactionRef}.png!`,
      });
    } catch {
      setStatusMessage({ type: 'error', text: 'Could not generate download image.' });
    } finally {
      setDownloadingPng(false);
    }
  }

  // Share Receipt
  async function handleShareReceipt() {
    const summary = `NBV Official Transaction Receipt
Status: ${form.status.toUpperCase()}
Amount: Rs. ${Number(form.amount || 0).toLocaleString()}
TID: ${form.transactionRef}
Date: ${form.transactionDateTime}
To: ${form.receiverName} (${form.receiverAccountOrPhone})
From: ${form.senderName} (${form.senderAccountOrPhone})
Method: ${form.paymentMethod} (${form.bankName})
Purpose: ${form.purpose}
Verified by NBV Trading Treasury`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transaction Receipt TID: ${form.transactionRef}`,
          text: summary,
        });
        setStatusMessage({ type: 'success', text: 'Receipt shared successfully!' });
        return;
      } catch {
        // User cancelled or share not supported, fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
      setStatusMessage({
        type: 'success',
        text: 'Receipt details copied to clipboard! You can paste and share via WhatsApp or Email.',
      });
    } catch {
      setStatusMessage({ type: 'error', text: 'Clipboard copy failed.' });
    }
  }

  const filteredReceipts = savedReceipts.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.receiverName.toLowerCase().includes(q) ||
      r.senderName.toLowerCase().includes(q) ||
      r.transactionRef.toLowerCase().includes(q) ||
      r.receiverAccountOrPhone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Explainer */}
      <div className="bg-[#042416] border border-emerald-400/25 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#083c26] text-[#facc15]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Transaction Receipt Generator
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-emerald-200/80 mt-1 max-w-2xl">
            Create, edit, preview, download, and share professional transaction receipts. Choose
            from Meezan Bank, JazzCash, Easypaisa, Cash Voucher, or custom uploaded designs.
            All details (amount, phone, TID, dates, and accounts) are fully editable anytime.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNew}
            className="min-h-[42px] px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Receipt</span>
          </button>
          <button
            type="button"
            onClick={() => void loadReceipts()}
            className="min-h-[42px] px-3.5 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/25 text-emerald-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
              : 'bg-rose-950/80 text-rose-200 border border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5 Preset Template Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { id: 'bank_transfer' as const, label: '1. Bank Transfer', desc: 'Meezan Bank Style', icon: Building },
          { id: 'cash' as const, label: '2. Cash Payment', desc: 'Official NBV Voucher', icon: FileSpreadsheet },
          { id: 'easypaisa' as const, label: '3. Easypaisa', desc: 'Telenor Wallet Receipt', icon: Phone },
          { id: 'jazzcash' as const, label: '4. JazzCash', desc: 'Mobilink Microfinance', icon: Phone },
          { id: 'other' as const, label: '5. Other Methods', desc: 'Direct Ledger Slip', icon: Sparkles },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = form.receiptType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSwitchType(item.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#facc15] text-[#042416] border-[#facc15] shadow-lg'
                  : 'bg-[#042416] text-emerald-100 border-emerald-400/20 hover:bg-[#083c26]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#042416]' : 'text-[#facc15]'}`} />
                {isSelected && <span className="text-[10px] font-extrabold uppercase">Active</span>}
              </div>
              <div className="mt-2 font-bold text-xs truncate">{item.label}</div>
              <div className={`text-[10px] truncate ${isSelected ? 'text-[#042416]/80' : 'text-emerald-300/70'}`}>
                {item.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Left Form / Right Realistic Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full Manual Edit Controls */}
        <div className="lg:col-span-7 bg-[#042416] border border-emerald-400/25 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-400/20 pb-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#facc15]" />
                <span>
                  {selectedReceiptId ? 'Edit Stored Receipt Details' : 'Manual Receipt Details Editor'}
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200/70">
                You can manually modify every value below including amount, accounts, TID, and date.
              </p>
            </div>
            {selectedReceiptId && (
              <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
                Editing #{selectedReceiptId.slice(-6)}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveReceipt} className="space-y-4">
            {/* Row 1: Amount & Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Transaction Amount (Rs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  required
                  placeholder="e.g. 14615"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white font-mono font-bold text-base focus:border-[#facc15] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Fee Charged (Rs.)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.fee}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fee: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white font-mono text-sm focus:border-[#facc15] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: TID & Date/Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Transaction ID / Ref (TID) *
                </label>
                <input
                  type="text"
                  value={form.transactionRef}
                  onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
                  required
                  placeholder="e.g. 728057293613"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white font-mono text-xs focus:border-[#facc15] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Transaction Date & Time *
                </label>
                <input
                  type="text"
                  value={form.transactionDateTime}
                  onChange={(e) => setForm({ ...form, transactionDateTime: e.target.value })}
                  required
                  placeholder="e.g. 24 Oct 2026 at 17:47"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Status & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Transaction Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ReceiptStatus })}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none cursor-pointer"
                >
                  <option value="successful">Transaction Successful (Green)</option>
                  <option value="completed">Transaction Completed (Blue)</option>
                  <option value="pending">Transaction Pending (Amber)</option>
                  <option value="failed">Transaction Failed (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  placeholder="e.g. Bank Transfer, JazzCash, Easypaisa"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Bank Name & Purpose */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Bank / Gateway Name
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. Meezan Bank Limited"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  Transfer Purpose / Title
                </label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Transferred to Other Wallet, Investment Deposit"
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Receiver (To) Details */}
            <div className="p-3.5 rounded-xl bg-[#031910] border border-emerald-400/20 space-y-3">
              <span className="text-xs font-bold text-[#facc15] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Beneficiary (Receiver / To) Details</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-emerald-200 mb-1">
                    Receiver Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.receiverName}
                    onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                    required
                    placeholder="e.g. Syed Ishaq Hussain Shah"
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#042416] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-emerald-200 mb-1">
                    Receiver Account / Phone / Masked *
                  </label>
                  <input
                    type="text"
                    value={form.receiverAccountOrPhone}
                    onChange={(e) => setForm({ ...form, receiverAccountOrPhone: e.target.value })}
                    required
                    placeholder="e.g. *******3908 or 03433370774"
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#042416] border border-emerald-400/30 text-white text-xs font-mono focus:border-[#facc15] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Sender (From) Details */}
            <div className="p-3.5 rounded-xl bg-[#031910] border border-emerald-400/20 space-y-3">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Remitter (Sender / From) Details</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-emerald-200 mb-1">
                    Sender Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.senderName}
                    onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                    required
                    placeholder="e.g. MUHAMMAD NAEEM"
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#042416] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-emerald-200 mb-1">
                    Sender Phone / Account Number *
                  </label>
                  <input
                    type="text"
                    value={form.senderAccountOrPhone}
                    onChange={(e) => setForm({ ...form, senderAccountOrPhone: e.target.value })}
                    required
                    placeholder="e.g. 03084704644"
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#042416] border border-emerald-400/30 text-white text-xs font-mono focus:border-[#facc15] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 7: Receipt Theme & Custom Image Upload */}
            <div className="p-3.5 rounded-xl bg-[#031910] border border-emerald-400/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Receipt Visual Theme & Custom Background
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#facc15] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Design Image</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'meezan_receipt' as const, label: 'Meezan Bank' },
                  { id: 'jazzcash_receipt' as const, label: 'JazzCash Slip' },
                  { id: 'easypaisa_receipt' as const, label: 'Easypaisa Slip' },
                  { id: 'classic_clean' as const, label: 'Classic Voucher' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, backgroundTheme: t.id })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center cursor-pointer ${
                      form.backgroundTheme === t.id
                        ? 'bg-[#facc15] text-[#042416] border-[#facc15]'
                        : 'bg-[#042416] text-emerald-200 border-emerald-400/20 hover:bg-[#083c26]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {form.imageDataUrl && (
                <div className="flex items-center justify-between text-xs bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30 text-emerald-200">
                  <span>Custom background image attached</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageDataUrl: null })}
                    className="text-rose-400 hover:text-rose-300 text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Row 8: Notes / Footer text */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Footer Remarks / Transaction Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Securely paid via JazzCash · Fee Rs. 0.00"
                className="w-full min-h-[42px] px-3 rounded-xl bg-[#031910] border border-emerald-400/30 text-white text-xs focus:border-[#facc15] focus:outline-none"
              />
            </div>

            {/* 4 Action Buttons Required By User Brief */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* 1. Preview */}
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="min-h-[44px] px-3 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4 text-[#facc15]" />
                <span>Preview</span>
              </button>

              {/* 2. Generate / Save */}
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-3 rounded-xl bg-gradient-to-r from-[#facc15] to-[#eab308] hover:from-[#fde047] hover:to-[#facc15] text-[#042416] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Generate & Save'}</span>
              </button>

              {/* 3. Download PNG */}
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={downloadingPng}
                className="min-h-[44px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPng ? 'Rendering...' : 'Download'}</span>
              </button>

              {/* 4. Share Receipt */}
              <button
                type="button"
                onClick={handleShareReceipt}
                className="min-h-[44px] px-3 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/30 text-emerald-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#facc15]" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Realistic Live Receipt Preview (matching JazzCash & Meezan Bank screenshots) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#facc15]" />
              <span>Real-Time Live Receipt Preview</span>
            </span>
            <span className="text-[11px] text-emerald-200/70">Updates live as you type</span>
          </div>

          {/* Receipt Paper Card */}
          <div
            ref={receiptDomRef}
            className={`w-full max-w-[390px] mx-auto rounded-3xl overflow-hidden shadow-2xl transition-all border ${
              form.backgroundTheme === 'jazzcash_receipt'
                ? 'bg-white text-gray-900 border-gray-200'
                : form.backgroundTheme === 'meezan_receipt'
                  ? 'bg-[#031910] text-gray-900 border-[#d4af37]/50'
                  : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            {/* Top Perforation / Notch for realistic JazzCash paper voucher */}
            {form.backgroundTheme === 'jazzcash_receipt' && (
              <div className="w-full bg-[#031910] pt-1 flex justify-between items-center px-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-white block -mb-1.5"
                  />
                ))}
              </div>
            )}

            {/* Meezan Bank Top Header Banner */}
            {form.backgroundTheme === 'meezan_receipt' && (
              <div className="bg-[#0a3d28] p-4 text-center border-b-2 border-[#d4af37]">
                <h4 className="font-serif font-bold text-base text-[#d4af37] tracking-wider">
                  MEEZAN BANK LIMITED
                </h4>
                <p className="text-[10px] text-emerald-100 font-sans tracking-wide">
                  The Premier Islamic Bank · Instant Funds Transfer Advice
                </p>
              </div>
            )}

            {/* Easypaisa Top Green Header */}
            {form.backgroundTheme === 'easypaisa_receipt' && (
              <div className="bg-[#00a859] p-4 text-center text-white">
                <h4 className="font-sans font-black text-lg tracking-wider">
                  EASYPAISA
                </h4>
                <p className="text-[10px] text-white/90">
                  Telenor Microfinance Bank · Transaction Receipt
                </p>
              </div>
            )}

            {/* Receipt Card Body */}
            <div className="bg-white p-6 space-y-4 text-gray-900">
              {/* Header Status */}
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      form.status === 'successful'
                        ? 'bg-emerald-100 text-emerald-600'
                        : form.status === 'pending'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {form.status === 'successful' ? (
                      <Check className="w-6 h-6 stroke-[3]" />
                    ) : form.status === 'pending' ? (
                      <Clock className="w-6 h-6" />
                    ) : (
                      <X className="w-6 h-6 stroke-[3]" />
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-900 tracking-tight">
                  {form.status === 'successful'
                    ? 'Transaction Successful'
                    : form.status === 'pending'
                      ? 'Transaction Pending'
                      : 'Transaction Completed'}
                </h3>
                <p className="text-xs font-semibold text-gray-600 font-mono">
                  TID: {form.transactionRef || '728057293613'}
                </p>
                <p className="text-[11px] text-gray-500">
                  On {form.transactionDateTime || '24 Oct 2026 at 17:47'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Big Centered Amount */}
              <div className="text-center py-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
                  Rs. {Number(form.amount || 0).toLocaleString('en-PK', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs font-medium text-gray-600 mt-1">
                  {form.purpose || 'Transferred to Other Wallet'}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Transaction Key-Value Rows (exact JazzCash style) */}
              <div className="space-y-3.5 text-xs">
                {/* Fee */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Fee</span>
                  <span className="font-semibold text-gray-900">
                    Rs. {Number(form.fee || 0).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-100" />

                {/* To (Beneficiary) */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 font-medium">To</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {form.receiverName || 'Syed Ishaq Hussain Shah'}
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono">
                      {form.receiverAccountOrPhone || '*******3908'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {form.bankName || 'Others'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* From (Remitter) */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-500 font-medium">From</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {form.senderName || 'MUHAMMAD NAEEM'}
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono">
                      {form.senderAccountOrPhone || '03084704644'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {form.paymentMethod || 'Wallet Transfer'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Note / Logo */}
              <div className="pt-3 border-t border-gray-200 text-center">
                {form.backgroundTheme === 'jazzcash_receipt' ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 font-medium">
                    <span>Securely paid via</span>
                    <span className="font-black text-[#d92228] tracking-tight">JazzCash</span>
                  </div>
                ) : form.backgroundTheme === 'meezan_receipt' ? (
                  <div className="text-[11px] text-[#0a3d28] font-bold tracking-wide">
                    Meezan Bank Limited · Secure Electronic Transaction
                  </div>
                ) : form.backgroundTheme === 'easypaisa_receipt' ? (
                  <div className="text-[11px] text-[#00a859] font-bold tracking-wide">
                    Easypaisa · Telenor Microfinance Bank
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 font-medium">
                    {form.notes || 'NBV Trading Official Payment Receipt'}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Perforations for JazzCash */}
            {form.backgroundTheme === 'jazzcash_receipt' && (
              <div className="w-full bg-[#031910] pb-1 flex justify-between items-center px-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-white block -mt-1.5"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Generated Receipts Table */}
      <div className="bg-[#042416] border border-emerald-400/25 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#facc15]" />
              <span>Saved Receipt Templates & Logs ({savedReceipts.length})</span>
            </h3>
            <p className="text-[11px] text-emerald-200/70">
              Click any receipt to reload its data for immediate editing, re-download, or updates.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receiver, TID or phone..."
              className="w-full min-h-[38px] pl-8 pr-3 rounded-xl bg-[#031910] border border-emerald-400/25 text-white text-xs placeholder:text-emerald-400/50 focus:border-[#facc15] focus:outline-none"
            />
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="p-8 text-center text-xs text-emerald-200/60 bg-[#031910] rounded-xl border border-emerald-400/10">
            No saved receipts found matching your search. Create one using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#083c26] text-emerald-200 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">TID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">To (Receiver)</th>
                  <th className="py-2.5 px-3">From (Sender)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-400/15">
                {filteredReceipts.map((r) => {
                  const isSelected = selectedReceiptId === r.id;
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-[#083c26]/60 transition-colors ${
                        isSelected ? 'bg-[#083c26] font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-emerald-300 font-bold">
                        {r.transactionRef}
                      </td>
                      <td className="py-3 px-3 capitalize text-white">
                        {r.receiptType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#facc15]">
                        Rs. {r.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-white font-medium">{r.receiverName}</div>
                        <div className="text-[11px] text-emerald-300/70 font-mono">
                          {r.receiverAccountOrPhone}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-white font-medium">{r.senderName}</div>
                        <div className="text-[11px] text-emerald-300/70 font-mono">
                          {r.senderAccountOrPhone}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'successful'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : r.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => loadReceiptIntoForm(r)}
                            className="p-1.5 rounded-lg bg-[#031910] hover:bg-[#0b4f33] border border-emerald-400/25 text-[#facc15] cursor-pointer"
                            title="Load for Editing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReceipt(r.id)}
                            className="p-1.5 rounded-lg bg-[#031910] hover:bg-rose-950 border border-rose-500/30 text-rose-400 cursor-pointer"
                            title="Delete Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full-Screen Preview Lightbox Modal */}
      {previewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative max-w-md w-full bg-[#042416] border border-emerald-400/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-400/20 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#facc15]" />
                <span>Full-Screen Receipt Inspection</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#083c26] text-white hover:bg-[#0b4f33] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: High Resolution Render of the Paper Receipt */}
            <div className="bg-white rounded-2xl p-6 text-gray-900 space-y-4 shadow-xl">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Transaction Successful</h3>
                <p className="text-xs font-semibold text-gray-600 font-mono">
                  TID: {form.transactionRef}
                </p>
                <p className="text-[11px] text-gray-500">On {form.transactionDateTime}</p>
              </div>

              <div className="border-t border-gray-200" />

              <div className="text-center py-1">
                <div className="text-3xl font-extrabold text-gray-900 font-sans">
                  Rs. {Number(form.amount || 0).toLocaleString('en-PK', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs font-medium text-gray-600 mt-1">
                  {form.purpose || 'Transferred to Other Wallet'}
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee</span>
                  <span className="font-semibold text-gray-900">
                    Rs. {Number(form.fee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{form.receiverName}</div>
                    <div className="text-gray-600 font-mono">{form.receiverAccountOrPhone}</div>
                    <div className="text-gray-500 text-[11px]">{form.bankName}</div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">From</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{form.senderName}</div>
                    <div className="text-gray-600 font-mono">{form.senderAccountOrPhone}</div>
                    <div className="text-gray-500 text-[11px]">{form.paymentMethod}</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 text-center text-xs text-gray-500 font-medium">
                {form.notes || 'Securely paid · Verified by NBV Treasury'}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={downloadingPng}
                className="min-h-[42px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPng ? 'Generating...' : 'Download Image'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareReceipt}
                className="min-h-[42px] px-3 rounded-xl bg-[#083c26] hover:bg-[#0b4f33] border border-emerald-400/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4 text-[#facc15]" />
                <span>Share Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
