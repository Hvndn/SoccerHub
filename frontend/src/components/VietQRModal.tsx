"use client";

import React, { useState, useEffect } from "react";
import { QrCode, CheckCircle2, Clock, ShieldCheck, Download, AlertTriangle } from "lucide-react";

interface VietQRModalProps {
  bookingData: {
    pitch: any;
    slot: any;
  } | null;
  onClose: () => void;
}

export default function VietQRModal({ bookingData, onClose }: VietQRModalProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    if (!bookingData || paymentDone) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [bookingData, paymentDone]);

  if (!bookingData) return null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const bookingCode = "VAOSAN-" + Math.floor(10000 + Math.random() * 90000);
  const depositAmount = 150000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold transition-colors"
        >
          ✕
        </button>

        {!paymentDone ? (
          <>
            {/* Header & Lock Warning */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Redis Lock: Ca sân đang giữ tạm trong {formatTimer(timeLeft)}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Thanh Toán Cọc VietQR</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Quét mã QR bằng ứng dụng Ngân hàng / Momo để giữ sân tức thì.</p>
            </div>

            {/* Booking Details Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Sân bóng:</span>
                <span className="font-bold text-slate-900 dark:text-white">{bookingData.pitch.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Khung giờ:</span>
                <span className="font-bold text-pitch-emerald">{bookingData.slot.time} ({bookingData.slot.pitchType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Mã giữ chỗ:</span>
                <span className="font-mono text-pitch-emerald font-bold">{bookingCode}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Số tiền cọc (50%):</span>
                <span className="font-extrabold text-pitch-emerald">{depositAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* VietQR Code Image */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-pitch-emerald stadium-shadow">
              <img
                src={`https://img.vietqr.io/image/970436-1029384756-compact2.png?amount=${depositAmount}&addInfo=${bookingCode}&accountName=VAO%20SAN%20PRO`}
                alt="VietQR Payment"
                className="w-56 h-56 object-contain"
              />
              <span className="text-[11px] font-bold text-slate-700 mt-2">Nội dung CK: <strong className="text-pitch-navy">{bookingCode}</strong></span>
            </div>

            {/* Simulate Payment Confirmation */}
            <button
              onClick={() => setPaymentDone(true)}
              className="w-full py-3.5 rounded-2xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold text-sm transition-all duration-200 shadow-lg shadow-pitch-emerald/30 flex items-center justify-center space-x-2 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-white">Xác Nhận Đã Chuyển Khoản</span>
            </button>
          </>
        ) : (
          /* QR Ticket Confirmation View */
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-pitch-emerald/20 text-pitch-emerald border-2 border-pitch-emerald mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-pitch-emerald" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-pitch-emerald/20 text-emerald-800 dark:text-pitch-emerald text-xs font-bold uppercase tracking-wider border border-emerald-300 dark:border-pitch-emerald/40">
                Đã Thanh Toán Thành Công
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Vé Vào Sân QR Code</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Vui lòng trình mã QR này tại quầy lễ tân sân bóng để check-in ca đấu.</p>
            </div>

            {/* QR Ticket Container */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-44 h-44 bg-white rounded-xl p-2 mx-auto flex items-center justify-center border border-slate-200 shadow-xs">
                <QrCode className="w-40 h-40 text-slate-900" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-mono text-pitch-emerald font-bold">MÃ VÉ: QR-TICKET-KICKON-8892</p>
                <p className="text-slate-900 dark:text-slate-200 font-bold">{bookingData.pitch.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{bookingData.slot.time} • {bookingData.slot.pitchType}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-colors"
            >
              Đóng & Xem Lịch Đã Đặt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
