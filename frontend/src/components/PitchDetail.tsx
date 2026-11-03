"use client";

import React, { useState, useEffect, useMemo } from "react";
import SafeImage from "@/components/SafeImage";
import {
  ArrowLeft,
  MapPin,
  Star,
  Share2,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
  Lock,
  ArrowRight,
  QrCode,
  PhoneCall,
  Receipt,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { pitchTypeLabel, isPeakSlot } from "@/lib/pitchLabels";
import {
  joinBookingWaitlistApi,
  cancelBookingByCustomerApi,
  confirmBookingPaymentApi,
  cancelBookingApi,
} from "@/lib/pitchService";
import { broadcastBookingEvent, subscribeToBookingEvents } from "@/lib/realtimeService";

interface PitchDetailProps {
  pitch: any | null;
  onBack: () => void;
  user?: any;
}

export default function PitchDetail({ pitch, onBack, user }: PitchDetailProps) {
  const pitchId = useMemo(() => {
    if (!pitch?.id) return 1;
    const cleanId = pitch.id.toString().replace(/\D/g, "");
    return Number(cleanId) || 1;
  }, [pitch]);

  const upcomingDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      const iso = `${year}-${month}-${date}`;
      const dayOfWeek = dayNames[d.getDay()];
      const dateFormatted = `${date}/${month}`;
      const label = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : dayOfWeek;
      days.push({
        iso,
        dayOfWeek,
        dateFormatted,
        label,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0].iso);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>("ALL");
  const [depositOption, setDepositOption] = useState<"50%" | "100%">("50%");
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [pitchDetails, setPitchDetails] = useState<any>(null);
  const [matrixCourts, setMatrixCourts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [splitCount, setSplitCount] = useState(14);

  const [bookingMode, setBookingMode] = useState<"INDIVIDUAL" | "CLUB">("INDIVIDUAL");
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [selectedClubName, setSelectedClubName] = useState<string>("");
  const [customClubName, setCustomClubName] = useState<string>("");
  const [fullDayBooking, setFullDayBooking] = useState(false);

  const fixedSlotDuration = useMemo(() => {
    return pitchDetails?.slotDurationMinutes || pitch?.slotDurationMinutes || 120;
  }, [pitchDetails, pitch]);

  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const [pendingSlotItem, setPendingSlotItem] = useState<{ court: any; slot: any } | null>(null);
  const [waitlistPhone, setWaitlistPhone] = useState(user?.phone || "");
  const [isProcessingPending, setIsProcessingPending] = useState(false);

  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!user) return;
    apiRequest<any[]>("/api/v1/clubs/mine")
      .then((clubs) => {
        if (Array.isArray(clubs) && clubs.length > 0) {
          setMyClubs(clubs);
          setSelectedClubName(clubs[0].name || "");
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    async function loadPitchInfo() {
      try {
        const data = await apiRequest<any>(`/api/v1/pitches/${pitchId}`);
        if (data) setPitchDetails(data);
      } catch {
        /* fallback to pitch prop */
      }
    }
    loadPitchInfo();
  }, [pitchId]);

  const fetchPitchMatrix = async (dateStr: string, durationMin: number) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<any[]>(
        `/api/v1/pitches/${pitchId}/matrix?date=${dateStr}&duration=${durationMin}`
      );
      setMatrixCourts(Array.isArray(data) ? data : []);
    } catch {
      setMatrixCourts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchPitchMatrix(selectedDate, fixedSlotDuration);
    }
  }, [pitchId, selectedDate, fixedSlotDuration]);

  useEffect(() => {
    const unsubscribe = subscribeToBookingEvents(() => {
      if (selectedDate) {
        fetchPitchMatrix(selectedDate, fixedSlotDuration);
      }
    });
    return () => unsubscribe();
  }, [pitchId, selectedDate, fixedSlotDuration]);

  const venueData = useMemo(() => {
    return {
      name: pitchDetails?.name || pitch?.name || "Cụm sân bóng đá",
      address: pitchDetails?.address || pitch?.address || "Chưa khai báo địa chỉ",
      phone: pitchDetails?.phone || pitch?.phone || "Chưa cập nhật",
      openTime: pitchDetails?.openTime || pitch?.openTime || "14:00",
      closeTime: pitchDetails?.closeTime || pitch?.closeTime || "22:30",
      slotDuration: pitchDetails?.slotDurationMinutes || pitch?.slotDurationMinutes || 120,
      rating: pitchDetails?.rating ?? pitch?.rating ?? null,
      reviewsCount: pitchDetails?.reviewsCount ?? pitch?.reviewsCount ?? 0,
      ownerName: pitchDetails?.ownerName || pitch?.ownerName || "Chủ sân",
      mainImage:
        pitchDetails?.imageUrl ||
        pitch?.imageUrl ||
        "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1200&q=80",
    };
  }, [pitchDetails, pitch]);

  const selectedCourtData = useMemo(
    () => matrixCourts.find((c: any) => c.pitchName === selectedSlot?.courtName),
    [matrixCourts, selectedSlot]
  );
  const fullDayAvailable = useMemo(
    () =>
      !!selectedCourtData &&
      (selectedCourtData.slots || []).length > 0 &&
      (selectedCourtData.slots || []).every((s: any) => s.status === "empty"),
    [selectedCourtData]
  );
  const fullDayTotal = useMemo(
    () =>
      (selectedCourtData?.slots || []).reduce(
        (sum: number, s: any) => sum + (Number(s.priceValue) || 0),
        0
      ),
    [selectedCourtData]
  );
  const fullDayRange = useMemo(() => {
    const slots = selectedCourtData?.slots || [];
    if (!slots.length) {
      return `${venueData.openTime} - ${venueData.closeTime}`;
    }
    const first = String(slots[0].time || "").split("-")[0]?.trim() || "—";
    const last = String(slots[slots.length - 1].time || "").split("-")[1]?.trim() || "—";
    return `${first} - ${last}`;
  }, [selectedCourtData, venueData]);

  const originalPrice = fullDayBooking ? fullDayTotal : selectedSlot?.price || 0;
  const totalPrice = originalPrice;
  const depositAmount = depositOption === "50%" ? Math.round(totalPrice * 0.5) : totalPrice;
  const splitPerPlayer = Math.round(totalPrice / Math.max(1, splitCount));

  const handlePendingSlotClick = (court: any, slot: any) => {
    if (
      pendingSlotItem?.slot?.time === slot.time &&
      pendingSlotItem?.court?.pitchName === court.pitchName
    ) {
      setPendingSlotItem(null);
    } else {
      setPendingSlotItem({ court, slot });
      if (user?.phone) setWaitlistPhone(user.phone);
    }
  };

  const handleCustomerCancelHold = async (bookingId: number | string) => {
    if (!bookingId) return;
    setIsProcessingPending(true);
    try {
      await cancelBookingByCustomerApi(bookingId, "Người đặt tự hủy giữ ca");
      showToast("Đã hủy chọn ca thành công. Ca sân đã được mở lại.");
      setPendingSlotItem(null);
      await fetchPitchMatrix(selectedDate, fixedSlotDuration);
    } catch (err: any) {
      showToast(err?.message || "Không thể hủy giữ ca");
    } finally {
      setIsProcessingPending(false);
    }
  };

  const handleJoinWaitlistForPending = async (court: any, slot: any) => {
    if (!waitlistPhone.trim()) {
      showToast("Vui lòng nhập số điện thoại để đăng ký nhận ca trống.");
      return;
    }
    setIsProcessingPending(true);
    try {
      await joinBookingWaitlistApi({
        pitchId: pitch.id,
        courtName: court.pitchName,
        bookingDate: selectedDate,
        timeSlot: slot.time,
      });
      showToast("Đã đăng ký vào hàng chờ. Hệ thống sẽ ưu tiên cho bạn khi ca được mở lại.");
      setPendingSlotItem(null);
    } catch (err: any) {
      showToast(err?.message || "Không thể đăng ký hàng chờ");
    } finally {
      setIsProcessingPending(false);
    }
  };

  const handleOwnerConfirmDeposit = async (bookingId: number | string) => {
    if (!bookingId) return;
    setIsProcessingPending(true);
    try {
      await confirmBookingPaymentApi(bookingId);
      showToast("Đã xác nhận thu cọc thành công.");
      setPendingSlotItem(null);
      await fetchPitchMatrix(selectedDate, fixedSlotDuration);
    } catch (err: any) {
      showToast(err?.message || "Không thể xác nhận cọc");
    } finally {
      setIsProcessingPending(false);
    }
  };

  const handleOwnerCancelHold = async (bookingId: number | string) => {
    if (!bookingId) return;
    setIsProcessingPending(true);
    try {
      await cancelBookingApi(bookingId, "Chủ sân mở lại ca trống", "OWNER");
      showToast("Đã hủy giữ chỗ và mở lại ca trống.");
      setPendingSlotItem(null);
      await fetchPitchMatrix(selectedDate, fixedSlotDuration);
    } catch (err: any) {
      showToast(err?.message || "Không thể hủy ca");
    } finally {
      setIsProcessingPending(false);
    }
  };

  const handleSelectSlot = (court: any, slot: any) => {
    if (
      slot.status === "booked" ||
      slot.status === "playing" ||
      slot.status === "pending_payment"
    ) {
      showToast(`Ca [${slot.time}] của ${court.pitchName} đã có người giữ hoặc đặt.`);
      return;
    }
    const rawPrice =
      slot.priceValue ||
      parseInt((slot.price || "350k").toString().replace(/\D/g, "")) * 1000 ||
      350000;
    setFullDayBooking(false);
    setShowQrModal(false);
    setBookingConfirmed(null);
    setPaymentDone(false);
    setSelectedSlot({
      courtId: court.pitchId,
      courtName: court.pitchName,
      courtType: court.type,
      time: slot.time,
      price: rawPrice,
      status: slot.status,
    });
  };

  const handleStartBooking = async () => {
    if (
      !selectedSlot ||
      selectedSlot.status === "booked" ||
      selectedSlot.status === "pending_payment"
    ) {
      showToast("Vui lòng chọn một ca sân còn trống.");
      return;
    }

    if (fullDayBooking && (!selectedCourtData || !fullDayAvailable)) {
      showToast("Sân này đã có ca được đặt, không thể bao cả ngày.");
      return;
    }

    if (!user) {
      showToast("Bạn cần đăng nhập để đặt sân.");
      return;
    }

    setIsBooking(true);
    try {
      const customerName = user.fullName || user.name || "";
      const customerPhone = user.phone || "";
      if (!customerPhone) {
        showToast("Tài khoản chưa có số điện thoại. Vui lòng cập nhật SĐT trong hồ sơ.");
        return;
      }

      const clubNameFinal =
        bookingMode === "CLUB"
          ? selectedClubName === "__CUSTOM__" || !selectedClubName
            ? customClubName.trim() || "CLB Cầu Thủ"
            : selectedClubName
          : undefined;

      const bookingPayload = {
        courtName: selectedSlot.courtName,
        courtType: selectedSlot.courtType || "Sân 7 Người",
        timeSlot: fullDayBooking ? fullDayRange : selectedSlot.time,
        fullDay: fullDayBooking,
        bookingDate: selectedDate,
        customerName: customerName,
        customerPhone: customerPhone,
        depositPercent: depositOption === "100%" ? 100 : 50,
        isClubBooking: bookingMode === "CLUB",
        clubName: clubNameFinal,
        via:
          bookingMode === "CLUB"
            ? "Đại diện " + clubNameFinal + " bao sân" + (fullDayBooking ? " cả ngày" : "")
            : fullDayBooking
            ? "Bao sân cả ngày"
            : "Đặt qua Website",
      };

      const res = await apiRequest<any>(`/api/v1/pitches/${pitchId}/book`, {
        method: "POST",
        body: JSON.stringify(bookingPayload),
      });

      if (res && res.id) {
        setBookingConfirmed(res);
        setPaymentDone(false);
        setShowQrModal(true);
        fetchPitchMatrix(selectedDate, fixedSlotDuration);
        showToast("Đã tạo đơn giữ chỗ thành công.");

        broadcastBookingEvent({
          type: "BOOKING_CREATED",
          pitchId: pitchId,
          bookingId: res.id,
          code: res.code,
          customerName: customerName,
          customerPhone: customerPhone,
          courtName: selectedSlot.courtName,
          courtType: selectedSlot.courtType || "Sân 7",
          timeSlot: fullDayBooking ? fullDayRange : selectedSlot.time,
          bookingDate: selectedDate,
          totalPrice: res.totalPrice ?? totalPrice,
          via: "Đặt qua Website",
        });
      } else {
        showToast("Không tạo được đơn giữ chỗ, vui lòng thử lại.");
      }
    } catch (err: any) {
      showToast(`Lỗi đặt sân: ${err.message || "Không thể kết nối máy chủ"}`);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCompletePayment = () => {
    setPaymentDone(true);
    fetchPitchMatrix(selectedDate, fixedSlotDuration);
    showToast("Đã ghi nhận thông tin đặt sân. Vui lòng xuất trình mã vé khi đến sân.");

    if (bookingConfirmed) {
      broadcastBookingEvent({
        type: "BOOKING_CREATED",
        pitchId: pitchId,
        bookingId: bookingConfirmed.id,
        code: bookingConfirmed.code,
        customerName: bookingConfirmed.customerName,
        customerPhone: bookingConfirmed.customerPhone,
        courtName: bookingConfirmed.courtName,
        timeSlot: bookingConfirmed.timeSlot,
        bookingDate: selectedDate,
        totalPrice: bookingConfirmed.totalPrice,
        depositPaid: bookingConfirmed.depositPaid,
        via: "Đặt qua Website",
      });
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast("Đã sao chép đường dẫn sân.");
  };

  const filteredCourts = matrixCourts.filter((court) => {
    if (selectedCategory !== "ALL") {
      if (
        !court.type?.toLowerCase().includes(selectedCategory.toLowerCase()) &&
        !court.pitchName?.toLowerCase().includes(selectedCategory.toLowerCase())
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full space-y-5 pb-16 text-slate-900">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-[14px] font-bold">{toastMsg}</span>
        </div>
      )}

      {/* 1. THANH ĐIỀU HƯỚNG QUAY LẠI */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-slate-300 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[14px] flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Danh sách sân</span>
          </button>

          <ol className="hidden sm:flex items-center gap-1.5 text-[14px] text-slate-600">
            <li>Đặt sân</li>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <li className="font-bold text-slate-900 truncate max-w-md">{venueData.name}</li>
          </ol>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShare}
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-[14px] flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#0369a1]" />
            <span>{copiedLink ? "Đã chép link" : "Chia sẻ"}</span>
          </button>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(venueData.address)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-[14px] flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-[#0369a1]" />
            <span>Bản đồ</span>
          </a>
        </div>
      </nav>

      {/* 2. THÔNG TIN CỤM SÂN GỌN GÀNG (CHUẨN WEB ĐẶT SÂN TRUYỀN THỐNG) */}
      <section className="bg-white rounded-lg p-4 sm:p-5 border border-slate-300 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4 lg:col-span-3 h-[160px] sm:h-[175px] rounded-md overflow-hidden bg-slate-900 border border-slate-200">
            <SafeImage
              src={venueData.mainImage}
              alt={venueData.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="md:col-span-8 lg:col-span-9 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#0369a1] text-white text-[14px] font-bold px-2.5 py-0.5 rounded inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{pitchTypeLabel(pitchDetails?.pitchTypes?.[0]) || "Sân cỏ nhân tạo"}</span>
              </span>
              <span className="bg-slate-100 text-slate-700 text-[14px] font-semibold px-2.5 py-0.5 rounded border border-slate-300">
                {matrixCourts.length > 0 ? `${matrixCourts.length} sân con` : "Cụm sân tiêu chuẩn"}
              </span>
              {venueData.rating ? (
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-[14px] font-bold text-slate-900">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{venueData.rating}</span>
                </span>
              ) : null}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{venueData.name}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[14px] text-slate-700 pt-0.5">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{venueData.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-[#0369a1] shrink-0" />
                <span>
                  Điện thoại: <strong className="font-mono text-slate-900">{venueData.phone}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Giờ mở cửa:{" "}
                  <strong className="font-mono text-slate-900">
                    {venueData.openTime} - {venueData.closeTime}
                  </strong>{" "}
                  ({fixedSlotDuration}p/ca)
                </span>
              </div>
            </div>

            {pitchDetails?.amenities?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[14px] font-semibold text-slate-500 mr-1">Tiện ích:</span>
                {pitchDetails.amenities.map((a: string) => (
                  <span
                    key={a}
                    className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[14px] font-medium border border-slate-200"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. BẢNG LỊCH CHỌN CA SÂN (TRÁI 8 CỘT) & PHIẾU ĐẶT SÂN (PHẢI 4 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI: CHỌN NGÀY & BẢNG GIỜ TRỐNG */}
        <main className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-slate-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0369a1]" />
                <span>Chọn Ngày &amp; Khung Giờ Đặt Sân</span>
              </h2>

              {/* Chú thích trạng thái */}
              <div className="flex items-center gap-3 text-[14px] font-semibold flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-sm bg-white border border-slate-400" />
                  Còn trống
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#0369a1]">
                  <span className="w-3 h-3 rounded-sm bg-[#0369a1]" />
                  Đang chọn
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <span className="w-3 h-3 rounded-sm bg-amber-400" />
                  Chờ khóa ca
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-3 rounded-sm bg-slate-300" />
                  Đã đặt
                </span>
              </div>
            </div>

            {/* Thanh chọn 7 ngày */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {upcomingDays.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.iso);
                    setFullDayBooking(false);
                  }}
                  className={`py-2 px-2.5 rounded-md border text-center transition-colors cursor-pointer ${
                    selectedDate === d.iso
                      ? "bg-[#0369a1] text-white border-[#0369a1] font-bold"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800"
                  }`}
                >
                  <div
                    className={`text-[14px] ${
                      selectedDate === d.iso ? "text-white font-bold" : "text-slate-600 font-semibold"
                    }`}
                  >
                    {d.label}
                  </div>
                  <div className="text-[14px] font-mono font-bold">{d.dateFormatted}</div>
                </button>
              ))}
            </div>

            {/* Bộ lọc sân con & khung giờ */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "ALL", label: "Tất cả sân con" },
                  { id: "Sân 7", label: "Sân 7 người" },
                  { id: "Sân 5", label: "Sân 5 người" },
                  { id: "Sân 11", label: "Sân 11 người" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[14px] text-slate-600 font-semibold">Khung giờ:</span>
                <select
                  aria-label="Lọc giờ đá"
                  value={selectedTimeFilter}
                  onChange={(e) => setSelectedTimeFilter(e.target.value)}
                  className="bg-white px-3 py-1.5 rounded-md border border-slate-300 text-[14px] font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Tất cả giờ</option>
                  <option value="PEAK">Giờ cao điểm (17:00 - 20:00)</option>
                  <option value="OFF_PEAK">Giờ thường</option>
                </select>
              </div>
            </div>
          </div>

          {/* DANH SÁCH SÂN CON & CÁC CA TRONG NGÀY */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-lg p-12 border border-slate-300 text-center space-y-2">
                <RefreshCw className="w-7 h-7 text-[#0369a1] animate-spin mx-auto" />
                <p className="text-[14px] font-semibold text-slate-600">Đang tải lịch ca sân...</p>
              </div>
            ) : filteredCourts.length === 0 ? (
              <div className="bg-white rounded-lg p-10 border border-slate-300 text-center text-slate-600 space-y-2">
                <AlertCircle className="w-7 h-7 mx-auto text-slate-400" />
                <p className="font-bold text-[15px]">Không có sân con nào khớp với bộ lọc.</p>
              </div>
            ) : (
              filteredCourts.map((court) => {
                const courtSlots = (court.slots || []).filter((s: any) => {
                  if (selectedTimeFilter === "PEAK") return isPeakSlot(s.time);
                  if (selectedTimeFilter === "OFF_PEAK") return !isPeakSlot(s.time);
                  return true;
                });

                return (
                  <div
                    key={court.pitchId}
                    className="p-4 rounded-lg bg-white border border-slate-300 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{court.pitchName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 text-[14px] font-semibold">
                          {pitchTypeLabel(court.type)}
                        </span>
                      </div>
                      <div className="text-[14px] text-slate-600">
                        Giờ thường:{" "}
                        <strong className="text-slate-900 font-mono">
                          {(court.basePrice / 1000).toLocaleString("vi-VN")}k/ca
                        </strong>{" "}
                        • Cao điểm:{" "}
                        <strong className="text-amber-700 font-mono">
                          {(court.peakPrice / 1000).toLocaleString("vi-VN")}k/ca
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {courtSlots.map((slot: any, sIdx: number) => {
                        const isSelected =
                          selectedSlot?.courtName === court.pitchName &&
                          selectedSlot?.time === slot.time;
                        const isBooked =
                          slot.status === "booked" ||
                          slot.status === "playing" ||
                          slot.status === "pending_payment";
                        const isPeak = isPeakSlot(slot.time);

                        if (isSelected) {
                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => setSelectedSlot(null)}
                              className="py-3 px-2 rounded-md bg-[#0369a1] text-white border-2 border-[#0369a1] flex flex-col items-center justify-center cursor-pointer"
                            >
                              <span className="font-bold text-[14px] font-mono">{slot.time}</span>
                              <span className="font-bold text-[14px] mt-0.5">
                                {slot.price} • Đang chọn
                              </span>
                            </button>
                          );
                        }

                        if (isBooked) {
                          const isOwner = user?.role === "OWNER";
                          const isClub = Boolean(slot.isClubBooking || slot.clubName);
                          const isPending = slot.status === "pending_payment";

                          if (isPending) {
                            const isMyBooking = Boolean(
                              slot.isMyBooking ||
                                (user?.phone &&
                                  slot.phone &&
                                  slot.phone.includes(user.phone.slice(-4)))
                            );
                            const isThisActive =
                              pendingSlotItem?.court?.pitchName === court.pitchName &&
                              pendingSlotItem?.slot?.time === slot.time;
                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handlePendingSlotClick(court, slot)}
                                className={`py-2.5 px-2 rounded-md flex flex-col items-center justify-center border cursor-pointer ${
                                  isThisActive
                                    ? "bg-amber-100 border-amber-500 text-amber-950"
                                    : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900"
                                }`}
                              >
                                <span className="font-bold text-[14px] font-mono">{slot.time}</span>
                                <span className="text-[14px] font-bold text-amber-800 mt-0.5">
                                  {isMyBooking ? "Đang giữ chỗ" : "Chờ khóa ca"}
                                </span>
                                <span className="text-[14px] text-slate-600">
                                  {isMyBooking
                                    ? "Bấm hủy / xem"
                                    : isOwner
                                    ? "Duyệt / Mở ca"
                                    : "Đăng ký chờ"}
                                </span>
                              </button>
                            );
                          }

                          return (
                            <div
                              key={sIdx}
                              className={`py-2.5 px-2 rounded-md flex flex-col items-center justify-center border cursor-not-allowed ${
                                isClub
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                            >
                              <span className="font-semibold text-[14px] font-mono">{slot.time}</span>
                              <div className="flex items-center gap-1 mt-0.5 text-[14px] font-bold">
                                <Lock className="w-3.5 h-3.5" />
                                <span>{isClub ? "CLB bao sân" : "Đã đặt"}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSelectSlot(court, slot)}
                            className="py-3 px-2 rounded-md bg-white hover:bg-sky-50 hover:border-[#0369a1] text-slate-900 border border-slate-300 flex flex-col items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="font-bold text-[14px] font-mono text-slate-800">
                              {slot.time}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-bold text-[14px] text-[#0369a1] font-mono">
                                {slot.price}
                              </span>
                              {isPeak && (
                                <span className="text-[14px] text-amber-700 font-semibold">
                                  (Cao điểm)
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* KHUNG TÁC ĐỘNG INLINE CHO CA CHỜ KHÓA */}
                    {pendingSlotItem && pendingSlotItem.court.pitchName === court.pitchName && (
                      <div className="mt-3 p-4 rounded-md bg-amber-50 border border-amber-300 text-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                          <h4 className="font-bold text-[15px] text-amber-950">
                            Ca chờ khóa: {pendingSlotItem.slot.time} ({court.pitchName})
                          </h4>
                          <button
                            type="button"
                            onClick={() => setPendingSlotItem(null)}
                            className="text-[14px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>

                        {Boolean(
                          pendingSlotItem.slot.isMyBooking ||
                            (user?.phone &&
                              pendingSlotItem.slot.phone &&
                              pendingSlotItem.slot.phone.includes(user.phone.slice(-4)))
                        ) ? (
                          <div className="space-y-2.5">
                            <p className="text-[14px] text-amber-900">
                              Bạn đang giữ chỗ ca này. Bạn có thể hủy chọn ca để nhường lại hoặc xem thông tin đặt cọc.
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={isProcessingPending}
                                onClick={() =>
                                  handleCustomerCancelHold(pendingSlotItem.slot.bookingId)
                                }
                                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessingPending ? "Đang xử lý..." : "Hủy Chọn Ca Này"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingConfirmed({
                                    id: pendingSlotItem.slot.bookingId,
                                    code: pendingSlotItem.slot.code || "VS-HOLD",
                                    courtName: court.pitchName,
                                    timeSlot: pendingSlotItem.slot.time,
                                    totalPrice: pendingSlotItem.slot.totalPrice || 350000,
                                    depositPaid: pendingSlotItem.slot.depositPaid || 175000,
                                  });
                                  setShowQrModal(true);
                                }}
                                className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold cursor-pointer"
                              >
                                Xem Mã Giữ Chỗ
                              </button>
                            </div>
                          </div>
                        ) : user?.role === "OWNER" ? (
                          <div className="space-y-2.5">
                            <p className="text-[14px] text-slate-700">
                              Khách đặt: <strong>{pendingSlotItem.slot.customer || "Khách"}</strong> •
                              SĐT: <strong className="font-mono">{pendingSlotItem.slot.phone || "N/A"}</strong>
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={isProcessingPending}
                                onClick={() =>
                                  handleOwnerConfirmDeposit(pendingSlotItem.slot.bookingId)
                                }
                                className="px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[14px] font-bold disabled:opacity-50 cursor-pointer"
                              >
                                Xác Nhận Đã Thu Cọc
                              </button>
                              <button
                                type="button"
                                disabled={isProcessingPending}
                                onClick={() => handleOwnerCancelHold(pendingSlotItem.slot.bookingId)}
                                className="px-4 py-2 rounded-md bg-white border border-slate-300 hover:bg-rose-50 text-rose-700 text-[14px] font-bold disabled:opacity-50 cursor-pointer"
                              >
                                Hủy Giữ Chỗ / Mở Lại Ca
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <p className="text-[14px] text-slate-700">
                              Ca này đang chờ khách trước hoàn tất đặt cọc. Nhập SĐT của bạn để đăng ký nhận ca nếu khách trước hủy chọn:
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                placeholder="Số điện thoại của bạn..."
                                value={waitlistPhone}
                                onChange={(e) => setWaitlistPhone(e.target.value)}
                                className="px-3 py-2 rounded-md border border-slate-300 text-[14px] bg-white font-semibold focus:outline-none focus:border-[#0369a1] sm:w-60"
                              />
                              <button
                                type="button"
                                disabled={isProcessingPending}
                                onClick={() =>
                                  handleJoinWaitlistForPending(court, pendingSlotItem.slot)
                                }
                                className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessingPending ? "Đang gửi..." : "Đăng Ký Hàng Chờ"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* CỘT PHẢI: PHIẾU ĐẶT SÂN & MÃ GIỮ CHỖ INLINE */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          {/* HIỂN THỊ MÃ GIỮ CHỖ / VÉ ĐIỆN TỬ INLINE KHI ĐÃ ĐẶT */}
          {showQrModal && bookingConfirmed ? (
            <div className="bg-white rounded-lg p-5 border-2 border-[#0369a1] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[14px] font-bold text-emerald-700 block">
                    {paymentDone ? "Đã xác nhận giữ chỗ" : "Đơn đặt sân đã tạo"}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Phiếu Giữ Chỗ Điện Tử</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="text-[14px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="bg-slate-50 rounded-md p-3.5 border border-slate-200 space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Mã đặt sân:</span>
                  <strong className="font-mono text-[#0369a1]">{bookingConfirmed.code || "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cụm sân:</span>
                  <strong className="text-slate-900 text-right">{venueData.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sân &amp; Giờ đá:</span>
                  <strong className="text-slate-900">
                    {bookingConfirmed.courtName || selectedSlot?.courtName} •{" "}
                    {bookingConfirmed.timeSlot || selectedSlot?.time}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ngày đá:</span>
                  <strong className="font-mono text-slate-900">{selectedDate}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Số tiền cọc ({depositOption}):</span>
                  <strong className="font-mono text-[#0369a1] font-bold text-base">
                    {depositAmount.toLocaleString("vi-VN")}đ
                  </strong>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-md border border-slate-300">
                <QrCode className="w-36 h-36 text-slate-900" />
                <span className="text-[14px] font-mono font-bold text-slate-800 mt-2">
                  Mã vé: {bookingConfirmed.code || "—"}
                </span>
                <p className="text-[14px] text-slate-600 text-center mt-1">
                  Xuất trình mã này hoặc đọc số điện thoại cho chủ sân khi đến nhận sân.
                </p>
              </div>

              {!paymentDone ? (
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  className="w-full py-3 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn Tất Giữ Chỗ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    setSelectedSlot(null);
                  }}
                  className="w-full py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[14px] cursor-pointer"
                >
                  Đặt Thêm Ca Khác
                </button>
              )}
            </div>
          ) : selectedSlot ? (
            <div className="bg-white rounded-lg p-5 border border-slate-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#0369a1]" />
                  <h3 className="font-bold text-base text-slate-900">Phiếu Đặt Sân</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="text-[14px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>

              {/* Thông tin ca đã chọn */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sân con:</span>
                  <strong className="text-slate-900">
                    {pitchTypeLabel(selectedSlot.courtName) || selectedSlot.courtName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ngày đặt:</span>
                  <strong className="font-mono text-slate-900">{selectedDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Khung giờ:</span>
                  <strong className="font-mono text-[#0369a1]">
                    {fullDayBooking ? fullDayRange : selectedSlot.time}
                  </strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Tổng tiền sân:</span>
                  <strong className="text-lg font-bold text-slate-900 font-mono">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </strong>
                </div>
              </div>

              {/* Tư cách đặt sân */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 block">
                  Hình thức đứng tên đặt sân:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode("INDIVIDUAL");
                      setFullDayBooking(false);
                    }}
                    className={`py-2 px-3 rounded-md font-bold border text-[14px] cursor-pointer ${
                      bookingMode === "INDIVIDUAL"
                        ? "bg-[#0369a1] text-white border-[#0369a1]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode("CLUB")}
                    className={`py-2 px-3 rounded-md font-bold border text-[14px] cursor-pointer ${
                      bookingMode === "CLUB"
                        ? "bg-[#0369a1] text-white border-[#0369a1]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Đại diện CLB
                  </button>
                </div>

                {bookingMode === "CLUB" && (
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-300 space-y-2 text-[14px]">
                    <span className="font-bold text-slate-800 block">Tên CLB / Đội bóng:</span>
                    {myClubs.length > 0 && (
                      <select
                        value={selectedClubName}
                        onChange={(e) => setSelectedClubName(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 font-semibold text-[14px]"
                      >
                        {myClubs.map((c) => (
                          <option key={c.id || c.name} value={c.name}>
                            {c.name} ({c.memberCount || 0} thành viên)
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Nhập tên CLB khác...</option>
                      </select>
                    )}

                    {(myClubs.length === 0 || selectedClubName === "__CUSTOM__") && (
                      <input
                        type="text"
                        placeholder="Nhập tên CLB / Đội bóng..."
                        value={customClubName}
                        onChange={(e) => setCustomClubName(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 text-[14px] font-semibold"
                      />
                    )}

                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fullDayBooking}
                        disabled={!fullDayAvailable}
                        onChange={(e) => setFullDayBooking(e.target.checked)}
                        className="mt-1 accent-[#0369a1]"
                      />
                      <span className="text-[14px]">
                        <strong className="text-slate-900">Bao sân cả ngày ({fullDayRange})</strong>
                        <span className="block text-slate-600">
                          {fullDayAvailable
                            ? `Trọn ngày: ${fullDayTotal.toLocaleString("vi-VN")}đ`
                            : "Sân đã có người đặt lẻ ca nên không thể bao cả ngày."}
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Mức đặt cọc */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-slate-700 block">
                  Mức thanh toán giữ chỗ:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositOption("50%")}
                    className={`p-2.5 rounded-md border text-left cursor-pointer ${
                      depositOption === "50%"
                        ? "bg-sky-50 border-[#0369a1] text-slate-900"
                        : "bg-white border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="font-bold text-[14px]">Đặt cọc 50%</div>
                    <div className="font-mono font-bold text-[#0369a1] text-[15px]">
                      {Math.round(totalPrice * 0.5).toLocaleString("vi-VN")}đ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositOption("100%")}
                    className={`p-2.5 rounded-md border text-left cursor-pointer ${
                      depositOption === "100%"
                        ? "bg-sky-50 border-[#0369a1] text-slate-900"
                        : "bg-white border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="font-bold text-[14px]">Trả đủ 100%</div>
                    <div className="font-mono font-bold text-slate-900 text-[15px]">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </div>
                  </button>
                </div>
              </div>

              {/* Chia tiền sân nhanh */}
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Chia cho:</span>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={splitCount}
                    onChange={(e) =>
                      setSplitCount(Math.min(40, Math.max(1, Number(e.target.value) || 1)))
                    }
                    aria-label="Số người chia tiền"
                    className="w-14 px-2 py-1 rounded border border-slate-300 bg-white font-mono font-bold text-center"
                  />
                  <span className="text-slate-600">người</span>
                </div>
                <strong className="font-mono text-[#0369a1]">
                  ~{splitPerPlayer.toLocaleString("vi-VN")}đ/người
                </strong>
              </div>

              {/* Nút xác nhận đặt */}
              <button
                type="button"
                onClick={handleStartBooking}
                disabled={isBooking}
                className="w-full py-3 px-4 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBooking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>{fullDayBooking ? "Xác Nhận Bao Sân Cả Ngày" : "Xác Nhận Đặt Sân"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 border border-slate-300 text-center space-y-2">
              <Calendar className="w-8 h-8 text-[#0369a1] mx-auto" />
              <h3 className="font-bold text-base text-slate-900">Chưa chọn khung giờ</h3>
              <p className="text-[14px] text-slate-600">
                Vui lòng bấm chọn một khung giờ còn trống ở bảng bên trái để tiến hành đặt sân.
              </p>
            </div>
          )}

          {/* Thông tin liên hệ chủ sân */}
          <div className="p-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-[14px] text-slate-900 block">
                Chủ sân: {venueData.ownerName}
              </span>
              <span className="text-[14px] text-slate-600 font-mono block">
                SĐT: {venueData.phone}
              </span>
            </div>
            <a
              href={`tel:${venueData.phone}`}
              className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-[#0369a1] border border-slate-300 font-bold text-[14px] flex items-center gap-1.5 shrink-0"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Gọi điện</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
