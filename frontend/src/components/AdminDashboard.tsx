"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  listCanteenItems, createCanteenItem, updateCanteenItem, sellCanteenItem, deleteCanteenItem,
} from "@/lib/canteenService";
import { apiRequest } from "@/lib/api";
import { pitchTypeLabel, isPeakSlot } from "@/lib/pitchLabels";
import PitchHoverPreview from "@/components/PitchHoverPreview";
import { getMyPitchesApi, updatePitchGalleryApi, updateCourtImagesApi } from "@/lib/pitchService";
import { uploadChatFile } from "@/lib/groupChat";
import { SAMPLE_PITCH_PHOTOS } from "@/lib/pitchVisuals";
import { formatMoney } from "@/lib/tournamentService";
import { simulateBookings } from "@/lib/adminService";
import BusinessContacts from "@/components/BusinessContacts";
import OwnerReportExport from "@/components/OwnerReportExport";
import OwnerCharts from "@/components/OwnerCharts";
import {
 ShieldCheck,
 TrendingUp,
 Calendar,
 DollarSign,
 Settings,
 CheckCircle2,
 BarChart2,
 Zap,
 Clock,
 AlertTriangle,
 Coffee,
 Wrench,
 Sliders,
 Check,
 Layers,
 Sparkles,
 MapPin,
 RefreshCw,
 Sun,
 CloudRain,
 UserCheck,
 UserX,
 PhoneCall,
 Plus,
 QrCode,
 Search,
 Filter,
 AlertCircle,
 ArrowRight,
 X,
 Building,
 CheckCheck,
 Bell,
 Share2,
 ChevronRight,
 Download,
 Edit3,
 Trash2,
 PieChart,
 Tag,
 Activity,
 Volume2,
 Pencil,
 Camera,
 Loader2,
 Upload,
 Images,
 ImagePlus,
 Info,
 ChevronDown,
 ChevronUp,
 Package,
 FileSpreadsheet
} from "lucide-react";
import {
 playNotificationChime,
 subscribeToBookingEvents,
 broadcastBookingEvent,
 RealtimeBookingEvent
} from "@/lib/realtimeService";

interface AdminDashboardProps {
 onBackToHome?: () => void;
 onNavigateTab?: (tab: string) => void;
 /** Mở cuộc trò chuyện riêng với đối tác (dùng cho kênh liên lạc với Ban Tổ Chức). */
 onStartDm?: (partnerEmail: string, partnerName: string) => void;
}

export default function AdminDashboard({ onBackToHome, onNavigateTab, onStartDm }: AdminDashboardProps = {}) {
 const [mounted, setMounted] = useState(false);
 const [realPitches, setRealPitches] = useState<any[]>([]);
 const [activePitch, setActivePitch] = useState<any | null>(null);
 const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(true);
 const [pitchStats, setPitchStats] = useState({
 totalRevenue: 0,
 occupancyRate: 0,
 totalSlots: 0,
 bookedSlots: 0,
 onlineBookings: 0,
 counterBookings: 0
 });

 const [activeSubTab, setActiveSubTab] = useState<"matrix" | "pitches" | "pricing" | "canteen" | "reports">("matrix");
 const [matrixFilterStatus, setMatrixFilterStatus] = useState<string>("ALL");
 const [matrixFilterType, setMatrixFilterType] = useState<string>("ALL");
 const [matrixFilterTime, setMatrixFilterTime] = useState<string>("ALL");
 const [matrixFilterMethod, setMatrixFilterMethod] = useState<string>("ALL");
 const [clusterSearchQuery, setClusterSearchQuery] = useState<string>("");
 const [showMobilePitchDetails, setShowMobilePitchDetails] = useState<boolean>(false);
 const [courtFormatFilter, setCourtFormatFilter] = useState<string>("ALL");
 const [courtSearchQuery, setCourtSearchQuery] = useState<string>("");
  // Thời lượng ca cố định 2 tiếng (120 phút) — chủ sân không chọn 1h/1.5h nữa.
  const MATRIX_DURATION = 120;

 // Dynamic pricing controls
 // Nháp giá sân đang chỉnh ở tab "Giá Thuê Sân" (đối chiếu với bảng pitches)
 const [priceDraft, setPriceDraft] = useState<Record<string, { avg: string; peak: string }>>({});
 const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

 const getPriceDraft = (p: any) =>
 priceDraft[String(p.id)] ?? {
 avg: String(p.avgPricePerHour ?? ""),
 peak: String(p.peakPricePerHour ?? ""),
 };

 const savePitchPrice = async (p: any) => {
 const draft = getPriceDraft(p);
 const avg = Number(draft.avg);
 const peak = Number(draft.peak);
 if (!avg || avg <= 0) {
 showToast("Giá thường phải lớn hơn 0.");
 return;
 }
 if (peak && peak < avg) {
 showToast("Giá giờ vàng phải lớn hơn hoặc bằng giá thường.");
 return;
 }
 setSavingPriceId(String(p.id));
 try {
 await apiRequest(`/api/v1/pitches/${p.id}/price`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 avgPricePerHour: avg,
 peakPricePerHour: peak || null,
 }),
 });
 showToast(`Đã lưu giá cho ${p.name}.`);
 await fetchRealData();
 } catch (e: any) {
 showToast(e?.message || "Cập nhật giá thất bại, thử lại sau.");
 } finally {
 setSavingPriceId(null);
 }
 };
 
 // Real-time notification banner
 const [notification, setNotification] = useState<string | null>(null);
 const [simBusy, setSimBusy] = useState<"gen" | "clear" | null>(null);

 // Live Owner Matrix Data (Stateful from Real Database)
 const [pitchMatrix, setPitchMatrix] = useState<any[]>([]);

 // Canteen Sales Inventory State
  // Canteen: dữ liệu THẬT  (trước đây là mảng cứng + nút Lưu chỉ hiện toast).
  const [canteenItems, setCanteenItems] = useState<any[]>([]);
  const [canteenLoading, setCanteenLoading] = useState(false);
  const [canteenBusy, setCanteenBusy] = useState(false);
  const [canteenForm, setCanteenForm] = useState({ name: "", price: "", stock: "", unit: "" });

  const canteenErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    const name = canteenForm.name.trim();
    if (!name) {
      errs.name = "Vui lòng nhập tên món.";
    } else if (name.length < 2) {
      errs.name = "Tên món tối thiểu 2 ký tự.";
    }
    const price = Number(canteenForm.price);
    if (!price || price <= 0) {
      errs.price = "Giá bán phải lớn hơn 0đ.";
    }
    const stock = Number(canteenForm.stock);
    if (canteenForm.stock !== "" && (!Number.isInteger(stock) || stock < 0)) {
      errs.stock = "Tồn kho phải là số nguyên >= 0.";
    }
    return errs;
  }, [canteenForm]);
  const isCanteenValid = Object.keys(canteenErrors).length === 0;
  const [canteenEditingId, setCanteenEditingId] = useState<number | null>(null);

  const loadCanteen = async (pid?: number | null) => {
  setCanteenLoading(true);
  try {
  setCanteenItems(await listCanteenItems(pid ?? activePitch?.id ?? null));
  } catch (e: any) {
  console.warn('Lỗi tải danh sách canteen:', e?.message);
  setCanteenItems([]);
  } finally {
  setCanteenLoading(false);
  }
  };

  const saveCanteenItem = async () => {
  const name = canteenForm.name.trim();
  const price = Number(canteenForm.price);
  if (!name) { showToast("❌ Vui lòng nhập tên món."); return; }
  if (!price || price <= 0) { showToast("❌ Giá bán phải lớn hơn 0."); return; }
  const pitchId = activePitch?.id;
  if (!pitchId) { showToast("❌ Vui lòng chọn cụm sân trước."); return; }
  setCanteenBusy(true);
  try {
  if (canteenEditingId) {
  await updateCanteenItem(canteenEditingId, {
  name,
  price,
  stock: Number(canteenForm.stock) || 0,
  unit: canteenForm.unit.trim() || undefined,
  });
  showToast("✅ Đã cập nhật món trong kho canteen!");
  } else {
  await createCanteenItem({
  pitchId,
  name,
  price,
  stock: Number(canteenForm.stock) || 0,
  unit: canteenForm.unit.trim() || undefined,
  });
  showToast("🎉 Đã thêm món vào kho canteen!");
  }
  setCanteenForm({ name: "", price: "", stock: "", unit: "" });
  setCanteenEditingId(null);
  await loadCanteen(pitchId);
  } catch (e: any) {
  showToast("❌ Lỗi: " + (e?.message || "không lưu được món."));
  } finally {
  setCanteenBusy(false);
  }
  };

  const removeCanteenItem = async (id: number) => {
  try {
  await deleteCanteenItem(id);
  showToast("🗑️ Đã xoá món khỏi kho.");
  await loadCanteen();
  } catch (e: any) {
  showToast("❌ Lỗi: " + (e?.message || "không xoá được."));
  }
  };

  const sellOneCanteenItem = async (id: number) => {
  try {
  await sellCanteenItem(id, 1);
  await loadCanteen();
  } catch (e: any) {
  showToast("❌ Lỗi: " + (e?.message || "không bán được."));
  }
  };

  // --- KHO & VẬT TƯ NÂNG CAO ---
  type WarehouseCat = "ALL" | "CANTEEN" | "EQUIPMENT" | "MAINTENANCE" | "LOW_STOCK";
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState<WarehouseCat>("ALL");
  const [searchWarehouseQuery, setSearchWarehouseQuery] = useState<string>("");
  const [showAddWarehouseForm, setShowAddWarehouseForm] = useState<boolean>(false);
  const [restockInlineId, setRestockInlineId] = useState<number | null>(null);
  const [customRestockQty, setCustomRestockQty] = useState<string>("12");

  const detectCategory = (item: any): "CANTEEN" | "EQUIPMENT" | "MAINTENANCE" => {
    const text = `${item.name || ""} ${item.unit || ""}`.toLowerCase();
    if (
      text.includes("bóng") ||
      text.includes("áo bib") ||
      text.includes("áo lưới") ||
      text.includes("găng") ||
      text.includes("giày") ||
      text.includes("còi") ||
      text.includes("thẻ phạt") ||
      text.includes("băng đội trưởng")
    ) {
      return "EQUIPMENT";
    }
    if (
      text.includes("lưới") ||
      text.includes("đèn") ||
      text.includes("cao su") ||
      text.includes("keo") ||
      text.includes("bạt") ||
      text.includes("cờ biên") ||
      text.includes("vôi")
    ) {
      return "MAINTENANCE";
    }
    return "CANTEEN";
  };

  const restockCanteenItem = async (item: any, addQty: number) => {
    if (!addQty || addQty <= 0) return;
    try {
      setCanteenBusy(true);
      const newStock = (item.stock ?? 0) + addQty;
      await updateCanteenItem(item.id, { stock: newStock });
      showToast(`📦 Đã nhập thêm +${addQty} ${item.unit || "sản phẩm"} cho [${item.name}]. Tồn kho: ${newStock}`);
      setRestockInlineId(null);
      await loadCanteen();
    } catch (e: any) {
      showToast("❌ Lỗi nhập hàng: " + (e?.message || "không thể cộng kho."));
    } finally {
      setCanteenBusy(false);
    }
  };

  const exportWarehouseReportCsv = () => {
    if (!canteenItems || canteenItems.length === 0) {
      showToast("⚠️ Kho chưa có vật tư nào để xuất báo cáo.");
      return;
    }

    const headers = [
      "Mã SP",
      "Tên Vật Tư / Mặt Hàng",
      "Phân Loại",
      "Đơn Vị Tính",
      "Đơn Giá (VNĐ)",
      "Tồn Kho Hiện Tại",
      "Đã Bán/Xuất Hôm Nay",
      "Tổng Giá Trị Tồn (VNĐ)",
      "Tình Trạng Kho",
    ];

    const rows = canteenItems.map((item: any) => {
      const cat = detectCategory(item);
      const catName =
        cat === "EQUIPMENT"
          ? "Đồ Cho Thuê / Mượn"
          : cat === "MAINTENANCE"
          ? "Vật Tư Bảo Trì Sân"
          : "Hàng Tiêu Hao Canteen";
      const totalVal = (item.price ?? 0) * (item.stock ?? 0);
      const status =
        (item.stock ?? 0) <= 0
          ? "HẾT HÀNG"
          : (item.stock ?? 0) <= 5
          ? "SẮP HẾT"
          : "ĐỦ HÀNG";
      return [
        item.id,
        `"${(item.name || "").replace(/"/g, '""')}"`,
        `"${catName}"`,
        `"${item.unit || "Cái"}"`,
        item.price ?? 0,
        item.stock ?? 0,
        item.soldToday ?? 0,
        totalVal,
        `"${status}"`,
      ].join(",");
    });

    const totalInventoryValue = canteenItems.reduce(
      (sum, item: any) => sum + (item.price ?? 0) * (item.stock ?? 0),
      0
    );
    const totalStockQty = canteenItems.reduce(
      (sum, item: any) => sum + (item.stock ?? 0),
      0
    );
    const totalSoldToday = canteenItems.reduce(
      (sum, item: any) => sum + (item.soldToday ?? 0),
      0
    );

    rows.push("");
    rows.push(
      [
        "TỔNG KHO",
        `""`,
        `""`,
        `""`,
        `""`,
        totalStockQty,
        totalSoldToday,
        totalInventoryValue,
        `""`,
      ].join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const pitchNameClean = activePitch?.name
      ? activePitch.name.replace(/\s+/g, "_")
      : "Cum_San";
    a.download = `Bao_Cao_Ton_Kho_${pitchNameClean}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📥 Đã xuất báo cáo kiểm kê kho ra file Excel/CSV thành công!");
  };

  const applyWarehousePreset = (
    name: string,
    unit: string,
    price: string | number,
    stock: string | number
  ) => {
    setCanteenForm({
      name,
      price: String(price),
      stock: String(stock),
      unit,
    });
    setShowAddWarehouseForm(true);
    showToast(`📝 Đã chọn mẫu [${name}]! Kiểm tra và bấm Thêm Vật Tư.`);
  };

 // Modals state
 const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [inlineOfflinePitch, setInlineOfflinePitch] = useState<string | null>(null);
 const [showAddPitchModal, setShowAddPitchModal] = useState(false);
 const [showHoursModal, setShowHoursModal] = useState(false);
 const [showConfigModal, setShowConfigModal] = useState(false);
 const [selectedSlotForAction, setSelectedSlotForAction] = useState<any | null>(null);
 const [searchCodeInput, setSearchCodeInput] = useState("");
 const [toastMsg, setToastMsg] = useState<string | null>(null);

 // Cancel Reason Modal State
 const [showCancelModal, setShowCancelModal] = useState(false);
 const [cancelReasonInput, setCancelReasonInput] = useState("");
 const [slotToCancel, setSlotToCancel] = useState<any | null>(null);

 // Operating Hours & Slot Duration State (Đăng ký giờ hoạt động linh hoạt)
 const [operatingOpenTime, setOperatingOpenTime] = useState("13:00");
 const [operatingCloseTime, setOperatingCloseTime] = useState("22:30");
 const [operatingSlotDuration, setOperatingSlotDuration] = useState<number>(120); // Ca 2 tiếng (120 phút - thi đấu & giao trả ca)
 const [isUpdatingHours, setIsUpdatingHours] = useState(false);

 // New Pitch Form state
 const [newPitchName, setNewPitchName] = useState("");
 const [newPitchType, setNewPitchType] = useState("Sân 7 Người");
 const [newPitchBasePrice, setNewPitchBasePrice] = useState("450000");
 const [newPitchPeakPrice, setNewPitchPeakPrice] = useState("600000");

 const newPitchErrors = useMemo(() => {
   const errs: Record<string, string> = {};
   const name = newPitchName.trim();
   if (!name) {
     errs.name = "Vui lòng nhập tên sân con.";
   } else if (name.length < 3) {
     errs.name = "Tên sân con tối thiểu 3 ký tự (VD: Sân 7A).";
   } else if (pitchMatrix?.some((p: any) => (p?.pitchName || "").trim().toLowerCase() === name.toLowerCase())) {
     errs.name = `Sân "${name}" đã tồn tại trong cụm sân này.`;
   }

   const base = Number(newPitchBasePrice);
   if (!base || base < 50000) {
     errs.basePrice = "Giá thường từ 50.000đ trở lên.";
   } else if (base > 50000000) {
     errs.basePrice = "Giá thường tối đa 50.000.000đ.";
   }

   const peak = Number(newPitchPeakPrice);
   if (!peak || peak < (base || 0)) {
     errs.peakPrice = "Giá giờ vàng phải >= giá thường.";
   }
   return errs;
 }, [newPitchName, newPitchBasePrice, newPitchPeakPrice, pitchMatrix]);
 const isNewPitchValid = Object.keys(newPitchErrors).length === 0;

// Sửa hồ sơ cụm sân (trước đây chỉ sửa được giá + giờ mở cửa)
const [showEditInfoModal, setShowEditInfoModal] = useState(false);

 // Đã chuyển toàn bộ các form quản trị hiển thị INLINE trực tiếp tại chỗ người dùng bấm nút, không cuộn ép màn hình.
const [isSavingInfo, setIsSavingInfo] = useState(false);
const [infoName, setInfoName] = useState("");
  const [infoBankCode, setInfoBankCode] = useState("");
  const [infoBankAccount, setInfoBankAccount] = useState("");
  const [infoAccountName, setInfoAccountName] = useState("");
const [infoAddress, setInfoAddress] = useState("");
const [infoArea, setInfoArea] = useState("");
const [infoPhone, setInfoPhone] = useState("");
const [infoImageUrl, setInfoImageUrl] = useState("");
const [infoDescription, setInfoDescription] = useState("");
const [infoPitchTypes, setInfoPitchTypes] = useState<string[]>([]);
const [infoAmenities, setInfoAmenities] = useState<string[]>([]);
const [infoGallery, setInfoGallery] = useState<string[]>([]);
const [newGalleryInput, setNewGalleryInput] = useState("");
const [activeEditingCourt, setActiveEditingCourt] = useState<string | null>(null);
const [courtImagesMap, setCourtImagesMap] = useState<Record<string, string[]>>({});
const [newCourtImgInput, setNewCourtImgInput] = useState("");

// Danh sách gợi ý GỘP thêm các giá trị đang lưu trong DB. Nếu chỉ dùng danh sách
// cố định thì các tiện ích cũ (ví dụ "Giữ xe", "Áo bib", "Đèn LED") không khớp
// chip nào, bấm "Lưu Hồ Sơ" sẽ ghi đè mất chúng.
const PITCH_TYPE_OPTIONS = [
"Sân 5 Người", "Sân 7 Người", "Sân 11 Người", "Futsal", "Cỏ tự nhiên",
];
const AMENITY_OPTIONS = [
"Đèn chiếu sáng", "CCTV", "Phòng thay đồ", "Căng tin",
"Cho thuê giày", "Bãi xe", "WiFi", "Nước uống",
];
const pitchTypeOptions = Array.from(new Set([...PITCH_TYPE_OPTIONS, ...infoPitchTypes]));
const amenityOptions = Array.from(new Set([...AMENITY_OPTIONS, ...infoAmenities]));

// Mở modal sửa hồ sơ và nạp dữ liệu cụm sân hiện tại vào form
const openEditInfoModal = () => {
const p: any = activePitch;
setInfoName(p?.name ?? "");
setInfoAddress(p?.address ?? "");
setInfoArea(p?.area ?? "");
setInfoPhone(p?.phone ?? "");
  setInfoBankCode(p?.bankCode ?? "");
  setInfoBankAccount(p?.bankAccount ?? "");
  setInfoAccountName(p?.accountName ?? "");
setInfoImageUrl(p?.imageUrl ?? "");
setInfoDescription(p?.description ?? "");
setInfoPitchTypes(Array.isArray(p?.pitchTypes) ? [...p.pitchTypes] : []);
setInfoAmenities(Array.isArray(p?.amenities) ? [...p.amenities] : []);
const existingGallery = Array.isArray(p?.gallery) && p.gallery.length > 0 ? p.gallery : (p?.imageUrl ? [p.imageUrl] : []);
setInfoGallery(existingGallery);
setShowEditInfoModal(true);
};

/** Bật/tắt một mục trong danh sách bộ môn hoặc tiện ích. */
const toggleInfoList = (
value: string,
current: string[],
setter: (next: string[]) => void
) => {
setter(
current.includes(value)
? current.filter((v) => v !== value)
: [...current, value]
);
};

const toggleCourtImageEditor = (courtName: string, initialImages: string[]) => {
  if (activeEditingCourt === courtName) {
    setActiveEditingCourt(null);
  } else {
    setActiveEditingCourt(courtName);
    setNewCourtImgInput("");
    if (!courtImagesMap[courtName]) {
      setCourtImagesMap((prev) => ({
        ...prev,
        [courtName]: Array.isArray(initialImages) && initialImages.length > 0 ? [...initialImages] : []
      }));
    }
  }
};

const handleAddCourtImage = (courtName: string, url: string) => {
  if (!url || !url.trim()) return;
  const clean = url.trim();
  setCourtImagesMap((prev) => {
    const list = prev[courtName] || [];
    if (list.includes(clean)) return prev;
    return { ...prev, [courtName]: [...list, clean] };
  });
  setNewCourtImgInput("");
};

const handleRemoveCourtImage = (courtName: string, idxToRemove: number) => {
  setCourtImagesMap((prev) => {
    const list = prev[courtName] || [];
    return { ...prev, [courtName]: list.filter((_, idx) => idx !== idxToRemove) };
  });
};

const handleSaveCourtImages = async (courtName: string) => {
  const currentId = activePitch?.id || 1;
  const imgs = courtImagesMap[courtName] || [];
  try {
    await updateCourtImagesApi(currentId, courtName, imgs);
    showToast(`🎉 Đã lưu album ${imgs.length} ảnh cho sân [${courtName}]!`);
    setActiveEditingCourt(null);
    await loadMatrixAndStats(currentId);
  } catch (err: any) {
    showToast(`❌ Lỗi lưu ảnh sân: ${err.message || 'Không thể lưu'}`);
  }
};

const handleAddGalleryImage = (url: string) => {
  if (!url || !url.trim()) return;
  const clean = url.trim();
  if (infoGallery.includes(clean)) return;
  const next = [...infoGallery, clean];
  setInfoGallery(next);
  if (!infoImageUrl) setInfoImageUrl(clean);
  setNewGalleryInput("");
};

const handleRemoveGalleryImage = (idxToRemove: number) => {
  const next = infoGallery.filter((_, idx) => idx !== idxToRemove);
  setInfoGallery(next);
  if (infoImageUrl === infoGallery[idxToRemove] && next.length > 0) {
    setInfoImageUrl(next[0]);
  }
};

const handleSetMainGalleryImage = (url: string) => {
  setInfoImageUrl(url);
  showToast("⭐ Đã chọn ảnh này làm ảnh đại diện chính của cụm sân.");
};

const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
const courtFileInputRef = useRef<HTMLInputElement | null>(null);

const handleFileUpload = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ chấp nhận file hình ảnh (JPG, PNG, WebP)!");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ảnh quá lớn, tối đa 10MB!");
  }
  try {
    const res = await uploadChatFile(file);
    if (res && res.fileUrl) return res.fileUrl;
  } catch (err) {
    console.warn("Upload API failed, fallback to local FileReader:", err);
  }
  // Fallback sang Data URL nếu máy chủ offline
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const handlePickGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  setIsUploadingPhoto(true);
  try {
    const url = await handleFileUpload(file);
    handleAddGalleryImage(url);
    showToast("🎉 Đã tải ảnh từ máy tính/điện thoại vào album cụm sân!");
  } catch (err: any) {
    showToast(`❌ ${err.message || 'Lỗi tải ảnh'}`);
  } finally {
    setIsUploadingPhoto(false);
  }
};

const handlePickCourtFile = async (e: React.ChangeEvent<HTMLInputElement>, courtName: string) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file || !courtName) return;
  setIsUploadingPhoto(true);
  try {
    const url = await handleFileUpload(file);
    handleAddCourtImage(courtName, url);
    showToast(`🎉 Đã tải ảnh từ máy tính/điện thoại vào sân [${courtName}]!`);
  } catch (err: any) {
    showToast(`❌ ${err.message || 'Lỗi tải ảnh'}`);
  } finally {
    setIsUploadingPhoto(false);
  }
};

const handleSavePitchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentId = activePitch?.id;
    if (!currentId) {
      showToast("❌ Chưa chọn cụm sân cần cập nhật.");
      return;
    }
    if (!infoName.trim() || infoName.trim().length < 5) {
      showToast("❌ Tên cụm sân phải có ít nhất 5 ký tự (VD: Cụm Sân Đại Nắng)!");
      return;
    }
    if (!infoAddress.trim() || infoAddress.trim().length < 6) {
      showToast("❌ Địa chỉ cụm sân phải rõ ràng, tối thiểu 6 ký tự!");
      return;
    }
    const phoneClean = infoPhone.trim();
    if (phoneClean && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phoneClean)) {
      showToast("❌ Số điện thoại đường dây nóng phải gồm 10 chữ số hợp lệ (VD: 0908123456)!");
      return;
    }
    const bankAccClean = infoBankAccount.replace(/\s/g, "");
    if (bankAccClean) {
      if (!/^[0-9]{6,20}$/.test(bankAccClean)) {
        showToast("❌ Số tài khoản ngân hàng chỉ được gồm 6 đến 20 chữ số!");
        return;
      }
      if (!infoAccountName.trim()) {
        showToast("❌ Vui lòng nhập tên chủ tài khoản ngân hàng!");
        return;
      }
    }
setIsSavingInfo(true);
try {
await apiRequest(`/api/v1/pitches/${currentId}`, {
method: "PUT",
body: JSON.stringify({
name: infoName.trim(),
address: infoAddress.trim(),
area: infoArea.trim(),
phone: infoPhone.trim(),
  bankCode: infoBankCode.trim(),
  bankAccount: infoBankAccount.trim(),
  accountName: infoAccountName.trim(),
imageUrl: infoImageUrl.trim(),
description: infoDescription.trim(),
pitchTypes: infoPitchTypes,
amenities: infoAmenities,
gallery: infoGallery,
}),
});
await fetchRealData();
setShowEditInfoModal(false);
showToast("✅ Đã cập nhật hồ sơ cụm sân.");
} catch (err: any) {
showToast(`❌ ${err?.message || "Không lưu được hồ sơ cụm sân"}`);
} finally {
setIsSavingInfo(false);
}
};

 // Danh sách 14 ngày tới để chủ sân linh hoạt chuyển ngày xem lịch đặt
 const upcomingDays = useMemo(() => {
 const days: Array<{
 iso: string;
 dayOfWeek: string;
 dateFormatted: string;
 label: string;
 display: string;
 }> = [];
 const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
 const now = new Date();
 for (let i = 0; i < 14; i++) {
 const d = new Date(now);
 d.setDate(now.getDate() + i);
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 const iso = `${year}-${month}-${date}`;
 const dayOfWeek = dayNames[d.getDay()];
 const dateFormatted = `${date}/${month}`;
 const label = i === 0 ? "Hôm Nay" : i === 1 ? "Ngày Mai" : dayOfWeek;
 days.push({
 iso,
 dayOfWeek,
 dateFormatted,
 label,
 display: `${label} (${dateFormatted})`
 });
 }
 return days;
 }, []);

 // Ngày đang xem sơ đồ ca sân (mặc định là Hôm nay)
 const [matrixDate, setMatrixDate] = useState<string>(() => {
 const d = new Date();
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 return `${year}-${month}-${date}`;
 });

 // Offline Booking Form State (Kèm ngày đặt tại quầy)
 const [offlineDate, setOfflineDate] = useState<string>(() => {
 const d = new Date();
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 return `${year}-${month}-${date}`;
 });
 const [offlinePitchId, setOfflinePitchId] = useState("");
  const OFFLINE_DURATION = 120; // Ca đặt tại quầy cố định 2 tiếng (120 phút)
  const [offlineTime, setOfflineTime] = useState("");
 const [offlineCustomer, setOfflineCustomer] = useState("");
 const [offlinePhone, setOfflinePhone] = useState("");
 const [offlineDepositType, setOfflineDepositType] = useState<"PAID_CASH" | "TRUST">("PAID_CASH");

 const offlineErrors = useMemo(() => {
   const errs: Record<string, string> = {};
   const name = offlineCustomer.trim();
   if (!name) {
     errs.customer = "Vui lòng nhập tên khách.";
   } else if (name.length < 2) {
     errs.customer = "Tên khách tối thiểu 2 ký tự.";
   }
   const phone = offlinePhone.trim();
   if (!phone) {
     errs.phone = "Vui lòng nhập số điện thoại.";
   } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
     errs.phone = "Số điện thoại phải gồm 10 số (VD: 0909…).";
   }
   if (offlineDate) {
     const today = new Date().toISOString().split("T")[0];
     if (offlineDate < today) {
       errs.date = "Ngày đặt không thể ở quá khứ.";
     }
   }
   if (!offlineTime) {
     errs.time = "Vui lòng chọn khung giờ.";
   }
   return errs;
 }, [offlineCustomer, offlinePhone, offlineDate, offlineTime]);
 const isOfflineValid = Object.keys(offlineErrors).length === 0;

 // Realtime Live Booking Alerts State
 const [realtimeAlert, setRealtimeAlert] = useState<RealtimeBookingEvent | null>(null);
 const [alertsHistory, setAlertsHistory] = useState<RealtimeBookingEvent[]>([]);
 const lastBookedSlotsRef = React.useRef<number>(0);

 // Refs đọc đồng thời matrixDate và thời lượng ca cố định trong async callbacks
 const matrixDateRef = React.useRef<string>(matrixDate);
 matrixDateRef.current = matrixDate;



 const showToast = (msg: string) => {
 setToastMsg(msg);
 setTimeout(() => setToastMsg(null), 3500);
 };

 const loadMatrixAndStats = async (
 pitchId: number | string,
 duration = MATRIX_DURATION,
 date = matrixDateRef.current
 ) => {
 try {
 const [matrixRes, statsRes] = await Promise.all([
 apiRequest<any[]>(`/api/v1/pitches/${pitchId}/matrix?date=${date}&duration=${duration}`),
 apiRequest<any>(`/api/v1/pitches/${pitchId}/stats?date=${date}`)
 ]);
 if (matrixRes && Array.isArray(matrixRes)) {
 setPitchMatrix(matrixRes);
 if (matrixRes.length > 0 && !offlinePitchId) {
 setOfflinePitchId(matrixRes[0].pitchName);
 }
 }
 if (statsRes) {
 setPitchStats(statsRes);
 if (statsRes.openTime) setOperatingOpenTime(statsRes.openTime);
 if (statsRes.closeTime) setOperatingCloseTime(statsRes.closeTime);
 if (statsRes.slotDurationMinutes) setOperatingSlotDuration(statsRes.slotDurationMinutes);
 }
 } catch (err: any) {
 console.warn("Lỗi tải matrix/stats từ database:", err.message);
 }
 };

 // Hàm chuyển ngày xem lịch ca sân
 const handleSelectDate = (dateStr: string) => {
 setMatrixDate(dateStr);
 matrixDateRef.current = dateStr;
 const currentId = activePitch?.id || 1;
 loadMatrixAndStats(currentId, MATRIX_DURATION, dateStr);
 };

 // Fetch real pitch data from backend API & Subscribe Realtime
  // Danh sach cum san cua chu san: chi tai 1 lan khi mount.
  // KHONG dat phu thuoc activePitch.id o day — truoc day effect chay lai moi khi
  // doi cum san va fetchRealData() reset activePitch ve pitches[0], lam chon cum san
  // thu hai tu nhop ve cum san dau.
  useEffect(() => {
  setMounted(true);
  fetchRealData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tai ma tran + thong ke theo cum san dang chon.
  useEffect(() => {
  if (!activePitch?.id) return;
  loadMatrixAndStats(activePitch.id, MATRIX_DURATION, matrixDateRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePitch?.id]);

  useEffect(() => {
  // 1. Lang nghe su kien Realtime da tab / da role (0 mili-giay)
 const unsubscribe = subscribeToBookingEvents((event) => {
 if (event.type === "BOOKING_CREATED") {
 playNotificationChime();
 setRealtimeAlert(event);
 setAlertsHistory((prev) => [event, ...prev].slice(0, 10));

 const dateLabel = event.bookingDate 
 ? (event.bookingDate === matrixDateRef.current ? "Hôm nay" : event.bookingDate)
 : "Hôm nay";
 showToast(`⚡ CÓ ĐƠN ĐẶT SÂN MỚI! Khách ${event.customerName} (${event.customerPhone}) vừa cọc ca [${event.timeSlot}] ngày [${dateLabel}] của [${pitchTypeLabel(event.courtName) || event.courtName}]!`);
 
 // Cập nhật ma trận ca sân & doanh thu tức thời theo ngày đang xem
 const currentId = activePitch?.id || 1;
 loadMatrixAndStats(currentId, MATRIX_DURATION, matrixDateRef.current);
 } else if (event.type === "BOOKING_CANCELLED") {
 const currentId = activePitch?.id || 1;
 loadMatrixAndStats(currentId, MATRIX_DURATION, matrixDateRef.current);
 }
 });

 // 2. Heartbeat Polling mỗi 4 giây (Đồng bộ đa trình duyệt / đa thiết bị khác nhau theo ngày đang chọn)
 const heartbeatInterval = setInterval(async () => {
 const currentId = activePitch?.id || 1;
 try {
 const statsRes = await apiRequest<any>(`/api/v1/pitches/${currentId}/stats?date=${matrixDateRef.current}`);
 if (statsRes && typeof statsRes.bookedSlots === "number") {
 if (lastBookedSlotsRef.current > 0 && statsRes.bookedSlots > lastBookedSlotsRef.current) {
 playNotificationChime();
 showToast(`🔔 Cụm sân vừa nhận thêm đơn đặt cọc mới! Đã tự động cập nhật sơ đồ ca.`);
 loadMatrixAndStats(currentId, MATRIX_DURATION, matrixDateRef.current);
 }
 lastBookedSlotsRef.current = statsRes.bookedSlots;
 }
 } catch (e) {
 // silent fallback
 }
 }, 4000);

 return () => {
 unsubscribe();
 clearInterval(heartbeatInterval);
 };
 }, [activePitch?.id]);

 const handleUpdateOperatingHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const [openH, openM] = operatingOpenTime.split(":").map(Number);
    const [closeH, closeM] = operatingCloseTime.split(":").map(Number);
    const openTotal = (openH || 0) * 60 + (openM || 0);
    const closeTotal = (closeH || 0) * 60 + (closeM || 0);
    if (closeTotal <= openTotal) {
      showToast("❌ Giờ kết thúc đóng cửa phải sau giờ bắt đầu mở cửa!");
      return;
    }
    if (closeTotal - openTotal < operatingSlotDuration) {
      showToast(`❌ Khung giờ mở cửa phải lớn hơn hoặc bằng thời lượng 1 ca (${operatingSlotDuration} phút)!`);
      return;
    }
    const currentId = activePitch?.id || 1;
 setIsUpdatingHours(true);
 try {
 await apiRequest(`/api/v1/pitches/${currentId}/operating-hours`, {
 method: "PUT",
 body: JSON.stringify({
 openTime: operatingOpenTime,
 closeTime: operatingCloseTime,
 slotDurationMinutes: operatingSlotDuration
 })
 });
 await loadMatrixAndStats(currentId);
 setShowHoursModal(false);
 showToast(`⚡ Đã cập nhật giờ mở cửa (${operatingOpenTime} - ${operatingCloseTime}) và ca ${operatingSlotDuration} phút!`);
 } catch (err: any) {
 showToast(`❌ Lỗi cập nhật: ${err.message || 'Không thể lưu cài đặt'}`);
 } finally {
 setIsUpdatingHours(false);
 }
 };

 const fetchRealData = async () => {
 setIsLoadingBackend(true);
 try {
    // Chỉ lấy CỤM SÂN CỦA CHỦ SÂN này — dùng /pitches sẽ nạp sân của người khác
    // và các thao tác ghi (giờ mở cửa, đặt ca tại quầy, thêm sân con) sẽ rơi vào sân #1.
    const pitches = await getMyPitchesApi();
 if (pitches && pitches.length > 0) {
 setRealPitches(pitches);
  // Giu cum san chu san dang chon neu van con trong danh sach (truoc day luon reset ve [0]).
  const current = pitches.find((p) => p.id === activePitch?.id) ?? pitches[0];
  setActivePitch(current);
 }
 } catch (err: any) {
 console.warn("Backend API sync notice:", err.message);
 } finally {
 setIsLoadingBackend(false);
 }
 };

 const handleSelectPitch = async (pitch: any) => {
  // Đổi cụm sân thì kho canteen cũng phải đổi theo.
  if (activeSubTab === "canteen") loadCanteen(pitch.id);
 setActivePitch(pitch);
 await loadMatrixAndStats(pitch.id);
 showToast(`🏟️ Đã kết nối cụm sân: [${pitch.name}]`);
 };

 const filteredClusters = useMemo(() => {
   if (!clusterSearchQuery.trim()) return realPitches;
   const q = clusterSearchQuery.trim().toLowerCase();
   return realPitches.filter((p) => 
     (p.name || "").toLowerCase().includes(q) || 
     (p.address || "").toLowerCase().includes(q)
   );
 }, [realPitches, clusterSearchQuery]);

 const filteredCourts = useMemo(() => {
   return pitchMatrix.filter((c: any) => {
     if (courtFormatFilter !== "ALL") {
       const type = (c.type || "").toUpperCase();
       if (courtFormatFilter === "SAN_5" && !type.includes("5")) return false;
       if (courtFormatFilter === "SAN_7" && !type.includes("7")) return false;
       if (courtFormatFilter === "SAN_11" && !type.includes("11")) return false;
     }
     if (courtSearchQuery.trim()) {
       const q = courtSearchQuery.trim().toLowerCase();
       const name = (c.pitchName || "").toLowerCase();
       const id = String(c.pitchId || "").toLowerCase();
       if (!name.includes(q) && !id.includes(q)) return false;
     }
     return true;
   });
 }, [pitchMatrix, courtFormatFilter, courtSearchQuery]);

  // Danh sách các ca đang đá hoặc sắp kết thúc hôm nay để chủ sân giám sát trả sân
  const activeLiveSlots = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    if (matrixDate !== todayIso) return [];
    const list: Array<{
      courtName: string;
      slot: any;
      start: Date;
      end: Date;
      isNearEnd: boolean;
      isOverdue: boolean;
      remainingFormatted: string;
    }> = [];

    const nowMs = new Date().getTime();

    pitchMatrix.forEach((pitch) => {
      (pitch.slots || []).forEach((slot: any) => {
        if (slot.status === "empty") return;
        const m = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/.exec(slot.time || "");
        if (!m) return;
        const start = new Date(`${todayIso}T${m[1].padStart(2, "0")}:${m[2]}:00`);
        const end = new Date(`${todayIso}T${m[3].padStart(2, "0")}:${m[4]}:00`);
        const startMs = start.getTime();
        const endMs = end.getTime();

        // Đang diễn ra hoặc lố giờ dưới 45 phút
        if (nowMs >= startMs - 15 * 60000 && nowMs <= endMs + 45 * 60000) {
          const isOverdue = nowMs > endMs;
          const isNearEnd = !isOverdue && endMs - nowMs <= 10 * 60000;
          const targetMs = isOverdue ? nowMs - endMs : endMs - nowMs;
          const totalSec = Math.floor(targetMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          const remainingFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

          list.push({
            courtName: pitch.pitchName,
            slot,
            start,
            end,
            isNearEnd,
            isOverdue,
            remainingFormatted,
          });
        }
      });
    });

    return list;
  }, [pitchMatrix, matrixDate]);

  const handleOwnerSendReminder = async (item: any) => {
    try {
      const msg = `⚽ Lời nhắc từ quản lý cụm sân: Ca đá [${item.slot.time}] tại [${pitchTypeLabel(item.courtName) || item.courtName}] sắp kết thúc. Đề nghị quý khách thu dọn đồ đạc để bàn giao sân cho ca tiếp theo. Xin cảm ơn quý khách! 🤝`;
      if (item.slot.id) {
        await apiRequest(`/api/v1/pitches/bookings/${item.slot.id}/remind-handover`, {
          method: "POST",
          body: JSON.stringify({ message: msg }),
        });
      }
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg);
      }
      showToast(`✓ Đã phát tín hiệu nhắc trả sân & sao chép tin nhắn ca ${item.slot.time} của ${item.slot.customer}!`);
    } catch {
      showToast(`Đã sao chép lời nhắc trả sân của ca ${item.slot.time}!`);
    }
  };

 // Add new pitch handler (Lưu thật vào MySQL)
 const handleCreateNewPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    const courtName = newPitchName.trim();
    if (courtName.length < 3) {
      showToast("❌ Tên sân con phải từ 3 ký tự trở lên (VD: Sân 7A, Sân 5B)!");
      return;
    }
    const baseP = Number(newPitchBasePrice);
    if (!baseP || baseP < 50000) {
      showToast("❌ Giá giờ thường phải từ 50.000đ trở lên!");
      return;
    }
    if (baseP > 50000000) {
      showToast("❌ Giá giờ thường vượt quá giới hạn tối đa (50.000.000đ)!");
      return;
    }
    const peakP = Number(newPitchPeakPrice);
    if (!peakP || peakP < baseP) {
      showToast("❌ Giá giờ vàng phải lớn hơn hoặc bằng giá giờ thường!");
      return;
    }

 const currentId = activePitch?.id || 1;
 try {
 await apiRequest(`/api/v1/pitches/${currentId}/add-court`, {
 method: "POST",
 body: JSON.stringify({
 courtName: newPitchName.trim(),
 courtType: newPitchType,
 basePrice: Number(newPitchBasePrice) || 350000,
 peakPrice: Number(newPitchPeakPrice) || 500000
 })
 });
 await loadMatrixAndStats(currentId);
 setShowAddPitchModal(false);
 setNewPitchName("");
 showToast(`🎉 Đã thêm sân [${newPitchName}] vào cụm sân!`);
 } catch (err: any) {
 showToast(`❌ Lỗi thêm sân con: ${err.message || 'Không thể lưu vào hệ thống'}`);
 }
 };

 // Offline Booking submit (Lưu thật vào MySQL)
 const handleOfflineBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineCustomer.trim() || offlineCustomer.trim().length < 2) {
      showToast("❌ Vui lòng nhập tên khách hàng hợp lệ (tối thiểu 2 ký tự)!");
      return;
    }
    const cleanPhone = offlinePhone.trim();
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
      showToast("❌ Số điện thoại khách phải gồm 10 chữ số hợp lệ (VD: 0912345678)!");
      return;
    }
    if (!offlineTime) {
      showToast("❌ Vui lòng chọn khung giờ thi đấu cho ca đặt!");
      return;
    }

 const currentId = activePitch?.id || 1;
 try {
 const targetCourt = pitchMatrix.find(p => p.pitchName === offlinePitchId || p.pitchId === offlinePitchId) || pitchMatrix[0];
 const isPeak = isPeakSlot(offlineTime);
  // basePrice/peakPrice trong ma tran DA la gia cho ca 120 phut (slotDuration).
  // Khong nhan them hourMultiplier — truoc day gia bi nhan 2 lan.
  const price = isPeak ? (targetCourt?.peakPrice ?? 0) : (targetCourt?.basePrice ?? 0);
 const deposit = offlineDepositType === "PAID_CASH" ? Math.round(price / 2) : 0;

 await apiRequest(`/api/v1/pitches/${currentId}/book-offline`, {
 method: 'POST',
 body: JSON.stringify({
 courtName: targetCourt ? targetCourt.pitchName : offlinePitchId,
 courtType: targetCourt ? targetCourt.type : "Sân 7",
 bookingDate: offlineDate,
 timeSlot: offlineTime,
 customerName: offlineCustomer.trim(),
 customerPhone: offlinePhone.trim(),
 totalPrice: price,
 depositPaid: deposit,
 // Chủ sân chọn mức cọc 50% hoặc 100% — server kiểm tra lại.
 depositPercent: 50,
 via: offlineDepositType === "PAID_CASH" ? "Tạo Tại Quầy (Đã Cọc)" : "Tạo Tại Quầy (Giữ Ca)"
 })
 });

 // Nếu ngày đặt trùng hoặc chủ sân muốn xem ngày vừa đặt, cập nhật matrix
 setMatrixDate(offlineDate);
 matrixDateRef.current = offlineDate;
 await loadMatrixAndStats(currentId, MATRIX_DURATION, offlineDate);
 setShowOfflineModal(false);
    setInlineOfflinePitch(null);
 setOfflineCustomer("");
 setOfflinePhone("");
 showToast(`✅ Đã đặt ca thành công ngày [${offlineDate}] cho khách [${offlineCustomer}] và lưu vào database!`);

 // Phát sự kiện Realtime cho các Tab khác (bao gồm Cầu Thủ và Navbar)
 broadcastBookingEvent({
 type: "BOOKING_CREATED",
 pitchId: currentId,
 customerName: offlineCustomer.trim(),
 customerPhone: offlinePhone.trim(),
 courtName: targetCourt ? targetCourt.pitchName : offlinePitchId,
 timeSlot: offlineTime,
 bookingDate: offlineDate,
 totalPrice: price,
 depositPaid: deposit,
 via: offlineDepositType === "PAID_CASH" ? "Tạo Tại Quầy (Đã Cọc)" : "Tạo Tại Quầy (Giữ Ca)"
 });
 } catch (err: any) {
 showToast(`❌ Lỗi đặt ca: ${err.message || 'Khung giờ này đã có người đặt trước!'}`);
 }
 };

  // Render Form Đặt Ca Tại Quầy (Dùng chung cho cả vị trí Top và vị trí Inline trong từng sân con)
  const renderOfflineBookingForm = (currentContext?: string) => {
    const isInsideCourt = Boolean(currentContext && currentContext !== "TOP");
    const matchedCourt = pitchMatrix.find(p => p.pitchName === (currentContext || offlinePitchId)) || pitchMatrix[0];
    return (
      <div 
        className={`bg-white p-4 sm:p-6 rounded-2xl border-2 border-[#0369a1] space-y-3 sm:space-y-4 shadow-md animate-modal-pop w-full ${isInsideCourt ? "max-w-2xl my-2" : "max-w-xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900">
                {isInsideCourt 
                  ? `Tạo Đơn Tại Quầy: ${pitchTypeLabel(matchedCourt?.pitchName) || matchedCourt?.pitchName || "Sân"}` 
                  : "Tạo Đơn Đặt Ca Tại Quầy"}
              </h3>
              <p className="text-[13px] text-slate-500">
                Lưu trực tiếp vào hệ thống và tự động cập nhật sơ đồ ca tức thời
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { setShowOfflineModal(false); setInlineOfflinePitch(null); }} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleOfflineBookingSubmit} className="space-y-3 sm:space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 flex items-center justify-between">
                <span>Ngày Thi Đấu:</span>
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={offlineDate}
                  onChange={(e) => setOfflineDate(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
                >
                  {upcomingDays.map(d => (
                    <option key={d.iso} value={d.iso}>
                      {d.label} ({d.dateFormatted})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={offlineDate}
                  onChange={(e) => {
                    if (e.target.value) setOfflineDate(e.target.value);
                  }}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 text-[13px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800">Chọn Sân Con:</label>
              <select
                value={offlinePitchId}
                onChange={(e) => setOfflinePitchId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
              >
                {pitchMatrix.map(p => (
                  <option key={p.pitchId} value={p.pitchName}>{pitchTypeLabel(p.pitchName) || p.pitchName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800">Khung Giờ Đặt:</label>
              <select
                value={offlineTime}
                onChange={(e) => setOfflineTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
              >
                {offlineAvailableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-[13px] font-bold text-sky-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                <span>Thời lượng ca: <strong>2 tiếng (120 phút)</strong></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800">Tên Khách Đặt *</label>
              <input
                type="text"
                required
                value={offlineCustomer}
                onChange={(e) => setOfflineCustomer(e.target.value)}
                placeholder="VD: Anh Cường FC Hải Châu"
                className={`w-full p-2.5 rounded-xl border bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 text-sm ${
                  offlineErrors.customer && offlineCustomer ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-[#0369a1]"
                }`}
              />
              {offlineErrors.customer && offlineCustomer && (
                <p className="mt-1 text-[13px] font-semibold text-rose-600">{offlineErrors.customer}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800">Số Điện Thoại Khách *</label>
              <input
                type="text"
                required
                value={offlinePhone}
                onChange={(e) => setOfflinePhone(e.target.value)}
                placeholder="0914 555 789"
                className={`w-full p-2.5 rounded-xl border bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 text-sm ${
                  offlineErrors.phone && offlinePhone ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-[#0369a1]"
                }`}
              />
              {offlineErrors.phone && offlinePhone && (
                <p className="mt-1 text-[13px] font-semibold text-rose-600">{offlineErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="font-extrabold text-slate-800">Hình Thức Đặt Cọc:</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOfflineDepositType("PAID_CASH")}
                className={`p-3 rounded-xl font-bold border transition-all text-[13px] cursor-pointer ${
                  offlineDepositType === "PAID_CASH"
                    ? "bg-[#0369a1] text-white border-[#0369a1] shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                Đã Thu Cọc Mặt Quầy (50%)
              </button>
              <button
                type="button"
                onClick={() => setOfflineDepositType("TRUST")}
                className={`p-3 rounded-xl font-bold border transition-all text-[13px] cursor-pointer ${
                  offlineDepositType === "TRUST"
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                Chưa Cọc (Khách Quen Tin Tưởng)
              </button>
            </div>
          </div>

          <div className="flex space-x-2.5 pt-2">
            <button
              type="button"
              onClick={() => { setShowOfflineModal(false); setInlineOfflinePitch(null); }}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isOfflineValid}
              className="flex-1 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác Nhận Giữ Ca
            </button>
          </div>
        </form>
      </div>
    );
  };


 // Confirm Check-in (Cập nhật thật vào MySQL)
   // Xac nhan khach da thu coc online (PENDING_PAYMENT -> BOOKED) truoc khi check-in.
  const handleConfirmBookingPayment = async (slot: any) => {
  if (!slot || !slot.bookingId) return;
  try {
  await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}/confirm-payment`, { method: "PUT" });
  await loadMatrixAndStats(activePitch?.id || 1);
  setSelectedSlotForAction(null);
  showToast("✅ Đã xác nhận cọc thành công! Sân đã được giữ chính thức cho khách.");

  broadcastBookingEvent({
  type: "BOOKING_CONFIRMED",
  pitchId: activePitch?.id || 1,
  bookingId: slot.bookingId,
  customerName: slot.customer
  } as any);
  } catch (err: any) {
  showToast(`❌ Lỗi xác nhận cọc: ${err.message}`);
  }
  };

const handleConfirmCheckin = async (slot: any) => {
 if (!slot) return;
 if (slot.bookingId) {
 try {
 await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}/check-in`, { method: "PUT" });
 await loadMatrixAndStats(activePitch?.id || 1);
 setSelectedSlotForAction(null);
 showToast("⚽ Check-in thành công! Khách đã vào sân thi đấu.");

 broadcastBookingEvent({
 type: "BOOKING_CHECKED_IN",
 pitchId: activePitch?.id || 1,
 bookingId: slot.bookingId,
 customerName: slot.customer
 });
 return;
 } catch (err: any) {
 showToast(`❌ Lỗi check-in: ${err.message}`);
 }
 } else {
 setSelectedSlotForAction(null);
 showToast("⚽ Đã ghi nhận khách vào sân!");
 }
 };

  // Hoàn tất ca & tất toán tiền còn lại khi trận đấu kết thúc (PLAYING -> COMPLETED)
  const handleCompleteBooking = async (slot: any) => {
    if (!slot) return;
    if (slot.bookingId) {
      try {
        await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}/complete`, { method: "PUT" });
        await loadMatrixAndStats(activePitch?.id || 1);
        setSelectedSlotForAction(null);
        showToast("🏁 Tất toán & hoàn tất ca thành công! Ca sân đã sẵn sàng cho lượt tiếp theo.");

        broadcastBookingEvent({
          type: "BOOKING_COMPLETED",
          pitchId: activePitch?.id || 1,
          bookingId: slot.bookingId,
          customerName: slot.customer
        });
        return;
      } catch (err: any) {
        showToast(`❌ Lỗi hoàn tất ca: ${err.message}`);
      }
    } else {
      setSelectedSlotForAction(null);
      showToast("🏁 Đã hoàn tất và trả ca sân!");
    }
  };

 // Cancel Booking - Step 1: Show modal to collect reason
 const handleCancelBooking = async (slot: any) => {
 if (!slot) return;
 if (slot.bookingId) {
 // Đóng modal check-in hiện tại để tránh đè giao diện
 setSlotToCancel(slot);
 setCancelReasonInput("");
 setSelectedSlotForAction(null);
 setShowCancelModal(true);
 } else {
 setSelectedSlotForAction(null);
 }
 };

 // Cancel Booking - Step 2: Confirm with reason and call API
 const handleConfirmCancel = async () => {
 const slot = slotToCancel;
 if (!slot || !cancelReasonInput.trim()) {
 showToast("⚠️ Vui lòng nhập lý do hủy ca.");
 return;
 }
 try {
  // Dùng endpoint hủy kèm lý do (giữ đơn ở trạng thái CANCELLED + báo khách).
  let cancelRes: any = null;
  try {
  cancelRes = await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}/cancel`, {
  method: "POST",
  body: JSON.stringify({
  reason: cancelReasonInput.trim(),
  cancelledBy: "OWNER"
  })
  });
  } catch (e: any) {
  // Chỉ fallback khi backend cũ chưa có endpoint (404). Mọi lỗi khác (403, 400...)
  // phải ném ra để không xóa nhầm đơn của cụm sân khác.
  if (e?.status !== 404) throw e;
  await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}`, { method: "DELETE" });
  }

 await loadMatrixAndStats(activePitch?.id || 1);
 setSelectedSlotForAction(null);
 setShowCancelModal(false);
 setSlotToCancel(null);
 setCancelReasonInput("");
  const refundMsg = cancelRes?.refundDeposit ? ` Nhớ hoàn lại ${formatMoney(cancelRes.refundDeposit)} tiền cọc cho khách.` : "";
  showToast(`🗑️ ${cancelRes?.message || "Đã hủy ca đặt."}${refundMsg}`);

 // Broadcast event with reason so customer's Navbar gets notified
 broadcastBookingEvent({
 type: "BOOKING_CANCELLED",
 pitchId: activePitch?.id || 1,
 bookingId: slot.bookingId,
 courtName: activePitch?.name || "sân",
 timeSlot: slot.time || slot.timeSlot || "",
 cancelReason: cancelReasonInput.trim(),
 cancelledBy: "OWNER"
 } as any);
 } catch (err: any) {
 showToast(`❌ Lỗi hủy ca: ${err.message}`);
 }
 };

 // Tra cứu mã vé hoặc SĐT từ API backend
 const handleSearchBooking = async () => {
 if (!searchCodeInput.trim()) return;
 try {
 const res = await apiRequest<any[]>(`/api/v1/pitches/bookings/search?query=${encodeURIComponent(searchCodeInput.trim())}`);
 if (res && res.length > 0) {
 const found = res[0];
 setSelectedSlotForAction({
 id: `booking-${found.id}`,
 bookingId: found.id,
 customer: found.customerName,
 phone: found.customerPhone,
 time: found.timeSlot,
 price: `${found.totalPrice ? Math.round(found.totalPrice / 1000) : 0}k`,
 depositPaid: `${found.depositPaid ? Math.round(found.depositPaid / 1000) : 0}k`,
 cashDue: `${found.cashDue ? Math.round(found.cashDue / 1000) : 0}k`,
 status: found.status ? found.status.toLowerCase() : "booked",
 via: found.via || "Tạo Tại Quầy",
 code: found.code || "—"
 });
 showToast(`🔍 Tìm thấy đơn vé: [${found.code}] của khách ${found.customerName}`);
 } else {
 showToast(`❌ Không tìm thấy đơn ca nào khớp với từ khóa "${searchCodeInput}"`);
 }
 } catch (e: any) {
 showToast(`❌ Lỗi tra cứu: ${e.message}`);
 }
 };

 // Tự động tính toán các ca sân xem trước/fallback từ giờ mở, đóng cửa và thời lượng ca
 const computedFallbackSlots = useMemo(() => {
 try {
 const parseMinutes = (t: string) => {
 const [h, m] = (t || "").split(":").map(Number);
 return (h || 0) * 60 + (m || 0);
 };
 const formatTime = (totalMin: number) => {
 const h = Math.floor(totalMin / 60) % 24;
 const m = totalMin % 60;
 return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
 };
 const startMin = parseMinutes(operatingOpenTime || "14:00");
 const endMin = parseMinutes(operatingCloseTime || "22:30");
 const duration = Number(operatingSlotDuration) || 120;
 const slots: string[] = [];
 let current = startMin;
 while (current + duration <= endMin) {
 slots.push(`${formatTime(current)} - ${formatTime(current + duration)}`);
 current += duration;
 }
 return slots.length > 0 ? slots : ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 } catch {
 return ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 }
 }, [operatingOpenTime, operatingCloseTime, operatingSlotDuration]);

 // Danh sách các khung giờ thực tế (lấy từ dữ liệu ma trận hoặc từ cấu hình giờ hoạt động)
 const matrixSlots = Array.from(
 new Set(pitchMatrix.flatMap(p => (p.slots || []).map((s: any) => s.time)))
 ).filter(Boolean);

 const availableTimeSlots: string[] = matrixSlots.length > 0 ? matrixSlots : computedFallbackSlots;

 // Tính danh sách ca đặt tại quầy theo thời lượng cố định 2 tiếng (120 phút)
 const offlineAvailableSlots = useMemo(() => {
 try {
 const parseMinutes = (t: string) => {
 const [h, m] = (t || "").split(":").map(Number);
 return (h || 0) * 60 + (m || 0);
 };
 const formatTime = (totalMin: number) => {
 const h = Math.floor(totalMin / 60) % 24;
 const m = totalMin % 60;
 return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
 };
 const startMin = parseMinutes(operatingOpenTime || "14:00");
 const endMin = parseMinutes(operatingCloseTime || "22:30");
 const dur = OFFLINE_DURATION;
 const slots: string[] = [];
 let current = startMin;
 while (current + dur <= endMin) {
 slots.push(`${formatTime(current)} - ${formatTime(current + dur)}`);
 current += dur;
 }
 return slots.length > 0 ? slots : ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 } catch {
 return ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 }
 }, [operatingOpenTime, operatingCloseTime, OFFLINE_DURATION]);

 // Filter matrix slots based on state (status, type, time slot, and booking method)
 const filteredMatrix = pitchMatrix
 .filter(pitch => matrixFilterType === "ALL" || pitch.type.includes(matrixFilterType))
 .map(pitch => ({
 ...pitch,
 slots: (pitch.slots || []).filter((s: any) => {
 // 1. Lọc theo trạng thái
 if (matrixFilterStatus === "BOOKED" && s.status !== "booked") return false;
 if (matrixFilterStatus === "PLAYING" && s.status !== "playing") return false;
  if (matrixFilterStatus === "PENDING" && s.status !== "pending_payment") return false;
 if (matrixFilterStatus === "EMPTY" && s.status !== "empty") return false;
 if (matrixFilterStatus === "RESALE" && s.status !== "resale") return false;

 // 2. Lọc theo khoảng thời gian (Khung giờ)
 if (matrixFilterTime === "PEAK") {
 // Giờ vàng chiều tối (17:30 - 20:30)
 if (!isPeakSlot(s.time)) return false;
 } else if (matrixFilterTime === "OFF_PEAK") {
 // Giờ thường và ca đêm (16:00 - 17:30 và 20:30 - 22:00)
 if (isPeakSlot(s.time)) return false;
 } else if (matrixFilterTime !== "ALL") {
 if (s.time !== matrixFilterTime) return false;
 }

 // 3. Lọc theo hình thức đặt sân
 if (matrixFilterMethod === "ONLINE") {
 const via = (s.via || "").toLowerCase();
 if (!via.includes("vietqr") && !via.includes("online") && !via.includes("momo")) return false;
 } else if (matrixFilterMethod === "OFFLINE") {
 const via = (s.via || "").toLowerCase();
 if (!via.includes("quầy") && !via.includes("trực tiếp")) return false;
 } else if (matrixFilterMethod === "RESALE") {
 const via = (s.via || "").toLowerCase();
 if (!via.includes("nhượng") && s.status !== "resale") return false;
 } else if (matrixFilterMethod === "EMPTY") {
 if (s.status !== "empty") return false;
 }

 return true;
 })
 }));

 return (
 <div className="space-y-4 sm:space-y-8 animate-fade-in-up pb-16">
 {/* Toast Feedback Notification */}
 {toastMsg && (
 <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="text-[14px] font-bold">{toastMsg}</span>
 </div>
 )}

 {/* POPUP THÔNG BÁO ĐƠN ĐẶT SÂN REALTIME TỪ CẦU THỦ */}
 {realtimeAlert && (
 <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-lg shadow-2xl border-2 border-sky-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 animate-modal-pop relative overflow-hidden">
 
 
 <div className="flex items-start space-x-3.5 relative z-10">
 <div className="w-12 h-12 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-lg animate-bell-wiggle">
 <Bell className="w-6 h-6 fill-white text-white" />
 </div>
 <div className="space-y-1">
 <div className="flex items-center space-x-2">
 <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[14px] tracking-wider shadow-xs">
 ⚡ Đơn đặt sân mới tức thời
 </span>
 <span className="text-[14px] font-mono text-sky-800 font-bold">Vừa đặt cọc xong</span>
 </div>
 <h3 className="text-base sm:text-lg font-black text-slate-900 ">
 Khách hàng <span className="text-amber-600 underline underline-offset-2">{realtimeAlert.customerName}</span> ({realtimeAlert.customerPhone}) vừa cọc ca thi đấu!
 </h3>
 <p className="text-[14px] text-sky-800 font-medium flex flex-wrap items-center gap-x-2">
 <span>🏟️ {pitchTypeLabel(realtimeAlert.courtName) || realtimeAlert.courtName}</span>
 <span>•</span>
 <span>⏰ Ca: <strong className="text-slate-900 font-mono">{realtimeAlert.timeSlot}</strong></span>
 <span>•</span>
 <span>💰 Đã cọc: <strong className="text-amber-600 font-mono font-bold">{(realtimeAlert.depositPaid || 0).toLocaleString('vi-VN')}đ</strong></span>
 <span>•</span>
 <span>💳 Qua: <strong className="text-slate-900 ">{realtimeAlert.via || "Tại quầy"}</strong></span>
 </p>
 </div>
 </div>

 <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 relative z-10">
 <button
 type="button"
 onClick={() => playNotificationChime()}
 className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[14px] flex items-center space-x-1 transition-all cursor-pointer"
 title="Phát lại âm thanh chuông thông báo"
 >
 <Volume2 className="w-4 h-4" />
 <span>Phát lại chuông</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setRealtimeAlert(null);
 showToast("✓ Đã xác nhận đơn! Ma trận ca sân đã cập nhật trạng thái mới nhất.");
 }}
 className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[14px] shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Đã Nhận Đơn ✓
 </button>
 </div>
 </div>
 )}

 {/* Real-time Order Notification Banner */}
 {notification && (
 <div className="bg-[#0369a1] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-lg border border-sky-400/30 flex items-center justify-between animate-fade-in">
 <div className="flex items-center space-x-3 text-[14px] font-bold">
 <Bell className="w-4 h-4 animate-bell-wiggle text-amber-300 shrink-0" />
 <span>{notification}</span>
 </div>
 <button
 onClick={() => setNotification(null)}
 className="text-white/80 hover:text-white p-1"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* HEADER BANNER WITH REAL BACKEND DATA */}
      <div className="glass-panel p-2.5 sm:p-8 rounded-2xl sm:rounded-lg border border-slate-200 space-y-2 sm:space-y-4 shadow-sm">
        
        {/* ==================== 1. MOBILE ULTRA-COMPACT APP BAR (< sm, cao ~80px) ==================== */}
        <div className="sm:hidden space-y-1.5">
          {/* Hàng 1: Dropdown Cụm Sân + Nút Chi tiết ℹ️ + Nút Đồng bộ 🔄 */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#0369a1]">
              <Building className="w-4 h-4 text-[#0369a1] shrink-0" />
              <select
                value={activePitch?.id || ""}
                onChange={(e) => {
                  const p = realPitches.find(x => x.id.toString() === e.target.value);
                  if (p) handleSelectPitch(p);
                }}
                className="w-full bg-transparent text-[14px] font-extrabold text-slate-900 cursor-pointer truncate focus:outline-none"
              >
                {filteredClusters.length > 0 ? (
                  filteredClusters.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                ) : (
                  <option value="">Không thấy cụm sân</option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowMobilePitchDetails(!showMobilePitchDetails)}
              className={`px-2.5 py-1.5 rounded-xl text-[13px] font-bold border transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                showMobilePitchDetails
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Thông tin chi tiết cụm sân"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showMobilePitchDetails ? "Đóng" : "Info"}</span>
              {showMobilePitchDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={fetchRealData}
              title="Đồng bộ dữ liệu thật"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackend ? 'animate-spin text-[#0369a1]' : ''}`} />
            </button>
          </div>

          {/* Hàng 2: Hàng nút hành động nhanh (Đặt Ca Quầy ưu tiên số 1) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setOfflinePitchId(pitchMatrix[0]?.pitchName || ""); setOfflineTime(offlineAvailableSlots[0] ?? ""); setOfflineDate(matrixDate); setInlineOfflinePitch("TOP"); setShowOfflineModal(true); }}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer truncate"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span>Đặt Ca Quầy</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddPitchModal(true)}
              className="py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0369a1] font-bold text-[13px] transition-all active:scale-95 flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Sân Con</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHoursModal(true)}
              className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[13px] transition-all active:scale-95 flex items-center space-x-1 shrink-0 cursor-pointer"
              title="Cài đặt khung giờ mở cửa và đóng cửa"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{operatingOpenTime}-{operatingCloseTime}</span>
            </button>
          </div>

          {/* Hộp Thông Tin Mở Rộng Inline (ẩn mặc định, mở khi bấm "Info") */}
          {showMobilePitchDetails && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] space-y-1.5 animate-fade-in text-slate-600 mt-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                <span className="leading-snug">{activePitch?.address || "Chưa khai báo địa chỉ"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Hotline: <strong className="text-slate-800">{activePitch?.phone || "Chưa khai báo"}</strong></span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-sky-700 font-bold">Chủ sân: {activePitch?.ownerName || "Chưa khai báo"}</span>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("owner-onboarding")}
                    className="text-[13px] font-bold text-[#0369a1] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>+ Cụm Mới</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ==================== 2. DESKTOP FULL HEADER (>= sm) ==================== */}
        <div className="hidden sm:flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 xl:min-w-[480px]">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/20 text-[#0b4f6c] text-sm font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Bảng Điều Hành Chủ Sân</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>{activePitch ? activePitch.name.replace(/đà nẵng/i, "Đà Nẵng") : "Chưa chọn cụm sân nào"}</span>
              {isLoadingBackend && <RefreshCw className="w-5 h-5 text-[#0369a1] animate-spin" />}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium mt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{activePitch?.address || "Chưa khai báo địa chỉ"}</span>
              </span>
              <span className="hidden xl:inline">•</span>
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Đường dây nóng: <strong className="text-slate-800 ">{activePitch?.phone || "Chưa khai báo"}</strong></span>
              </span>
              <span className="hidden xl:inline">•</span>
              <span className="text-sky-700 font-bold">
                Chủ sân: {activePitch?.ownerName || "Chưa khai báo"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#0369a1]">
              <Search className="w-4 h-4 text-sky-700 shrink-0" />
              <input
                type="text"
                value={clusterSearchQuery}
                onChange={(e) => setClusterSearchQuery(e.target.value)}
                placeholder="Tìm cụm sân..."
                className="w-28 sm:w-36 bg-transparent text-[14px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-slate-500 shrink-0">Cụm:</span>
              <select
                value={activePitch?.id || ""}
                onChange={(e) => {
                  const p = realPitches.find(x => x.id.toString() === e.target.value);
                  if (p) handleSelectPitch(p);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 cursor-pointer shadow-xs max-w-[200px] truncate"
              >
                {filteredClusters.length > 0 ? (
                  filteredClusters.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                ) : (
                  <option value="">Không thấy cụm sân</option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={fetchRealData}
              title="Đồng bộ dữ liệu thật "
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 border border-slate-200 "
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBackend ? 'animate-spin text-[#0369a1]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowHoursModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[14px] sm:text-sm shadow-xs transition-all active:scale-95 flex items-center space-x-1.5 whitespace-normal sm:whitespace-nowrap shrink-0"
              title="Cài đặt khung giờ mở cửa và đóng cửa cụm sân"
            >
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Giờ Mở: {operatingOpenTime} - {operatingCloseTime}</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("owner-onboarding")}
                className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                title="Khởi tạo hoặc thiết lập cụm sân mới qua Wizard 4 bước"
              >
                <Building className="w-4 h-4 shrink-0" />
                <span>+ Cụm Sân Mới</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddPitchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Thêm Sân Con</span>
            </button>

            <button
              type="button"
              onClick={() => { setOfflinePitchId(pitchMatrix[0]?.pitchName || ""); setOfflineTime(offlineAvailableSlots[0] ?? ""); setOfflineDate(matrixDate); setInlineOfflinePitch("TOP"); setShowOfflineModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1.5 whitespace-nowrap shrink-0"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Đặt Ca Quầy</span>
            </button>
          </div>
        </div>

        {/* ==================== 3. SUB TAB NAVIGATION TOOLBAR (Cuộn ngang 1 hàng) ==================== */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab("matrix")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === "matrix"
                ? "bg-[#0369a1] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Ma Trận</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pitches")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === "pitches"
                ? "bg-[#0369a1] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Sân Con ({pitchMatrix.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pricing")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === "pricing"
                ? "bg-[#0369a1] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span>Bảng Giá</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab("canteen"); loadCanteen(); }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === "canteen"
                ? "bg-[#0369a1] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span>Canteen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("reports")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === "reports"
                ? "bg-[#0369a1] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span>Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* FORM THÊM SÂN CON MỚI VÀO CỤM (HIỂN THỊ INLINE NGAY TẠI CHỖ) */}
      {showAddPitchModal && (
        <div id="admin-inline-add-pitch" className="w-full animate-fade-in">
          <div 
            className="bg-white p-4 sm:p-6 rounded-2xl max-w-xl w-full border-2 border-sky-300 space-y-4 shadow-md animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0369a1] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Thêm Sân Con Mới Vào Cụm</h3>
                  <p className="text-[13px] text-slate-500">Khởi tạo sân bóng con và thiết lập biểu giá ca sân</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddPitchModal(false)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPitch} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 text-[13px]">Tên Sân Con Mới *</label>
                <input
                  type="text"
                  required
                  value={newPitchName}
                  onChange={(e) => setNewPitchName(e.target.value)}
                  placeholder="VD: Sân 7C Cỏ Nhân Tạo Mới"
                  className={`w-full p-3 rounded-xl border bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 text-sm ${
                    newPitchErrors.name && newPitchName ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-[#0369a1]"
                  }`}
                />
                {newPitchErrors.name && newPitchName && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{newPitchErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 text-[13px]">Loại Sân Thể Thao:</label>
                <select
                  value={newPitchType}
                  onChange={(e) => setNewPitchType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-sky-500 text-sm cursor-pointer"
                >
                  <option value="Sân 7 Người">Sân 7 Người (Cỏ Nhân Tạo Chuẩn VFF)</option>
                  <option value="Sân 5 Người">Sân 5 Người (Mini Cỏ / Futsal)</option>
                  <option value="Sân 11 Người">Sân 11 Người (Tiêu Chuẩn FIFA)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-[13px]">Giá Giờ Thường (VNĐ) *</label>
                  <input
                    type="number"
                    value={newPitchBasePrice}
                    onChange={(e) => setNewPitchBasePrice(e.target.value)}
                    className={`w-full p-3 rounded-xl border bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 text-sm ${
                      newPitchErrors.basePrice ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-[#0369a1]"
                    }`}
                  />
                  {newPitchErrors.basePrice && (
                    <p className="mt-1 text-[13px] font-semibold text-rose-600">{newPitchErrors.basePrice}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-[13px]">Giá Giờ Vàng (VNĐ) *</label>
                  <input
                    type="number"
                    value={newPitchPeakPrice}
                    onChange={(e) => setNewPitchPeakPrice(e.target.value)}
                    className={`w-full p-3 rounded-xl border bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 text-sm ${
                      newPitchErrors.peakPrice ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-[#0369a1]"
                    }`}
                  />
                  {newPitchErrors.peakPrice && (
                    <p className="mt-1 text-[13px] font-semibold text-rose-600">{newPitchErrors.peakPrice}</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[13px] font-bold text-sky-900 block">
                    Giờ hoạt động cụm: {operatingOpenTime} - {operatingCloseTime}
                  </span>
                  <span className="text-[13px] text-slate-500">
                    Độ dài ca: {operatingSlotDuration} phút/ca (Áp dụng {availableTimeSlots.length} ca tự động)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPitchModal(false);
                    setShowHoursModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Đổi Giờ
                </button>
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPitchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!isNewPitchValid}
                  className="flex-1 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo Sân Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM CẤU HÌNH GIỜ HOẠT ĐỘNG CỤM SÂN (INLINE NGAY DƯỚI HEADER) */}
      {/* MODAL 4: CÀI ĐẶT THỜI GIAN HOẠT ĐỘNG & THỜI LƯỢNG CA SÂN */}
 {showHoursModal && (
  <div id="admin-inline-hours" className="w-full animate-fade-in">
 <div 
 className="bg-white p-4 sm:p-7 rounded-lg max-w-md w-full border border-slate-200 space-y-3 sm:space-y-4 shadow-sm animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
 <div className="flex items-center space-x-2.5">
 <Clock className="w-5.5 h-5.5 text-indigo-500" />
 <h3 className="font-black text-lg text-slate-900 ">Cấu Hình Giờ Hoạt Động Cụm Sân</h3>
 </div>
 <button 
 type="button"
 onClick={() => setShowHoursModal(false)} 
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <p className="text-sm text-slate-600 leading-relaxed">
  Chủ sân thiết lập thời gian bắt đầu mở cửa và đóng cửa cụm sân. Mọi ca thi đấu đều dùng chung thời lượng <strong className="text-sky-700 font-bold">2 tiếng (120 phút)</strong>.
 </p>

 <form onSubmit={handleUpdateOperatingHours} className="space-y-3 sm:space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Giờ Bắt Đầu Mở Cửa:</label>
 <select
 value={operatingOpenTime}
 onChange={(e) => setOperatingOpenTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
 >
 {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Giờ Kết Thúc Đóng Cửa:</label>
 <select
 value={operatingCloseTime}
 onChange={(e) => setOperatingCloseTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
 >
 {["20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "24:00"].map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Thông báo cơ chế đặt linh hoạt theo yêu cầu người dùng */}
 <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-1.5">
 <div className="flex items-center space-x-2 text-sky-800 font-extrabold text-[14px]">
 <Sparkles className="w-4 h-4 text-emerald-500" />
 <span>Cơ Chế Đặt Sân Linh Hoạt</span>
 </div>
 <p className="text-[14px] text-slate-600 leading-relaxed">
  Mọi ca thi đấu dùng chung thời lượng <strong className="text-slate-900 font-bold">2 tiếng (120 phút)</strong>. Hệ thống tự động tính tiền và phân ca theo thời gian thực tế.
 </p>
 </div>

 <div className="flex space-x-2.5 pt-2">
 <button
 type="button"
 onClick={() => setShowHoursModal(false)}
 className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Đóng
 </button>
 <button
 type="submit"
 disabled={isUpdatingHours}
 className="flex-1 py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
 >
 {isUpdatingHours && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}
 <span>Lưu Giờ Hoạt Động Sân</span>
 </button>
 </div>
 </form>
 </div>
  </div>
  )}

      {/* FORM ĐẶT CA TRỰC TIẾP TẠI QUẦY (INLINE KHI BẤM NÚT ĐẶT CA QUẦY Ở HEADER) */}
      {showOfflineModal && inlineOfflinePitch === "TOP" && (
        <div id="admin-inline-offline" className="w-full animate-fade-in flex justify-start">
          {renderOfflineBookingForm("TOP")}
        </div>
      )}

      
 {/* --- SUB-TAB CONTENT 5: DOANH THU & XUAT BAO CAO (rieng biet, khong gop voi cac tab khac) --- */}
 {activeSubTab === "reports" && (
 <div className="space-y-3 sm:space-y-6">
 {/* === BIỂU ĐỒ THỐNG KÊ CHỦ SÂN (recharts) === */}
 <OwnerCharts activePitch={activePitch} />

 {/* Dữ liệu trống -> gợi ý tạo dữ liệu demo ngay tại dashboard chủ sân
 (trước đây chỉ ADMIN tạo được ở /admin, chủ sân không có cách nào) */}
 {(pitchStats.bookedSlots ?? 0) === 0 && !isLoadingBackend && (
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
 <div className="flex-1 min-w-0">
 <p className="text-[14px] font-black text-slate-700 flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
 Cụm sân chưa có đơn nào
 </p>
 <p className="text-[14px] text-slate-500 mt-0.5">
 Tạo dữ liệu demo 14 ngày trước · 7 ngày sau để có số liệu.
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 disabled={simBusy !== null}
 onClick={async () => {
 try {
 setSimBusy("gen");
 const res = await simulateBookings({
 pitchId: activePitch?.id || 1,
 pastDays: 14,
 futureDays: 7,
 perDay: 6,
 });
 showToast(`Đã tạo ${res.created} đơn giả lập cho cụm sân.`);
 // Nạp lại ma trận + thống kê để số liệu hiện ra ngay
 await loadMatrixAndStats(activePitch?.id || 1);
 } catch (e: any) {
 showToast(e?.message || "Không tạo được dữ liệu demo.");
 } finally {
 setSimBusy(null);
 }
 }}
 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold transition-all active:scale-95 disabled:opacity-50"
 >
 <Sparkles className="w-3.5 h-3.5" />
 {simBusy === "gen" ? "Đang tạo…" : "Tạo đơn giả lập"}
 </button>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 <div className="glass-panel p-3 sm:p-5 rounded-lg border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">
 Doanh Thu {matrixDate === upcomingDays[0]?.iso ? "Hôm Nay" : `Ngày ${matrixDate.split("-").reverse().join("/")}`}
 </span>
 <div className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
 {(pitchStats.totalRevenue || 0).toLocaleString("vi-VN")} VNĐ
 </div>
 <span className="text-[14px] font-bold text-sky-700 flex items-center">
 <TrendingUp className="w-4 h-4 mr-1 shrink-0" /> Online {pitchStats.onlineBookings} ca • Quầy {pitchStats.counterBookings} ca
 </span>
 </div>

 <div className="glass-panel p-3 sm:p-5 rounded-lg border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">Tỷ Lệ Lấp Đầy Ca Sân</span>
 <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
 {pitchStats.occupancyRate}%
 </div>
 <span className="text-[14px] font-bold text-emerald-500">
 Khóa {pitchStats.bookedSlots} / {pitchStats.totalSlots} ca đặt
 </span>
 </div>

 <div className="glass-panel p-3 sm:p-5 rounded-lg border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">Đơn Cọc VietQR Online</span>
 <div className="text-2xl sm:text-3xl font-black text-[#0369a1] font-mono">
 {pitchStats.onlineBookings} Ca Online
 </div>
 <span className="text-[14px] font-bold text-slate-500"></span>
 </div>

 <div className="glass-panel p-3 sm:p-5 rounded-lg border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">Khách Vàng Lai Tại Quầy</span>
 <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
 {pitchStats.counterBookings} Ca Trực Tiếp
 </div>
 <span className="text-[14px] font-bold text-amber-700"></span>
 </div>
 </div>

 {/* === XUẤT BÁO CÁO THỐNG KÊ (CSV cho Excel + gửi email) === */}
 <OwnerReportExport />
 </div>
 )}

 {/* QUICK SEARCH & CHECK-IN TOOLBAR */}
        {activeSubTab === "matrix" && (
          <div className="space-y-3">
            <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shadow-xs">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0b4f6c] flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">Tra Cứu Mã Vé & Check-in</span>
                  <span className="text-[13px] text-slate-500">Nhập mã vé hoặc số điện thoại khách để check-in tức thì</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchCodeInput}
                    onChange={(e) => setSearchCodeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearchBooking(); }}
                    placeholder="VD: VS-1-7102 hoặc SĐT khách..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchBooking}
                  className="px-6 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-bold shadow-xs shrink-0 active:scale-95 transition-all cursor-pointer"
                >
                  Tra Cứu
                </button>
              </div>
            </div>

            {/* KẾT QUẢ TRA CỨU & CHECK-IN HIỂN THỊ NGAY TẠI CHỖ */}
            {selectedSlotForAction && (
              <div id="admin-inline-slot-action" className="w-full animate-fade-in">
                <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-sky-300 shadow-md space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0369a1] flex items-center justify-center">
                        <QrCode className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-slate-900">Chi Tiết & Check-in Ca Đặt</h3>
                          {selectedSlotForAction.status === "playing" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[13px] font-bold flex items-center gap-1 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                              Đang Đá
                            </span>
                          )}
                          {selectedSlotForAction.status === "booked" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[13px] font-bold border border-sky-200">
                              Đã Khóa Ca
                            </span>
                          )}
                          {selectedSlotForAction.status === "pending_payment" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[13px] font-bold border border-amber-200">
                              Chờ Thu Cọc
                            </span>
                          )}
                          {selectedSlotForAction.status === "completed" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[13px] font-bold border border-emerald-200">
                              Đã Hoàn Thành
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-slate-500">Xác nhận check-in nhận sân hoặc thanh toán cọc trực tiếp tại quầy</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedSlotForAction(null)} 
                      className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-50 space-y-2 border border-slate-200/80">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Khách đặt:</span>
                        <strong className="text-slate-900 font-bold">{selectedSlotForAction.customer}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Số điện thoại:</span>
                        <strong className="font-mono text-slate-900 font-bold">{selectedSlotForAction.phone}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Khung giờ:</span>
                        <strong className="font-mono text-emerald-600 font-bold">{selectedSlotForAction.time}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Mã vé check-in:</span>
                        <strong className="font-mono text-[#0369a1] font-black">{selectedSlotForAction.code}</strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-center space-y-2.5">
                      <div className="flex justify-between items-center text-[13px] font-bold text-slate-900">
                        <span>Tiền cọc đã thu:</span>
                        <span className="font-mono text-sky-800 font-black text-base">{selectedSlotForAction.depositPaid}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] font-bold text-slate-900">
                        <span>Tiền còn lại thu tại quầy:</span>
                        <span className="font-mono text-rose-600 text-base font-black">{selectedSlotForAction.cashDue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                    {selectedSlotForAction.status === "pending_payment" && (
                      <button
                        type="button"
                        onClick={() => handleConfirmBookingPayment(selectedSlotForAction)}
                        className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[13px] shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác Nhận Đã Thu Cọc & Giữ Ca</span>
                      </button>
                    )}

                    {selectedSlotForAction.status === "booked" && (
                      <button
                        type="button"
                        onClick={() => handleConfirmCheckin(selectedSlotForAction)}
                        className="py-2.5 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Xác Nhận Check-in Vào Sân & Mở Đèn</span>
                      </button>
                    )}

                    {selectedSlotForAction.status === "playing" && (
                      <button
                        type="button"
                        onClick={() => handleCompleteBooking(selectedSlotForAction)}
                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tất Toán Ca & Trả Sân ({selectedSlotForAction.cashDue && selectedSlotForAction.cashDue !== "0k" ? `Thu ${selectedSlotForAction.cashDue}` : "Hoàn Tất"})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCancelBooking(selectedSlotForAction)}
                      className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[13px] border border-rose-200 transition-all flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hủy Đơn Đặt (Trả Về Ca Trống)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSlotForAction(null)}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] transition-colors ml-auto cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* HỘP THOẠI XÁC NHẬN HỦY CA ĐẶT SÂN (INLINE TẠI CHỖ) */}
            {/* MODAL HỦY CA ĐẶT SÂN KÈM LÝ DO THÔNG BÁO TỚI KHÁCH HÀNG */}
 {showCancelModal && (
 <div 
  id="admin-inline-cancel" className="w-full animate-fade-in"
  >
 <div 
 className="relative w-full max-w-md bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-modal-pop my-auto"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
 <Trash2 className="w-5 h-5 text-rose-600 " />
 </div>
 <div>
 <h3 className="font-extrabold text-base text-rose-700 ">Xác Nhận Hủy Ca Đặt Sân</h3>
 <p className="text-[14px] text-rose-600 font-medium mt-0.5">
 Ca: <strong>{slotToCancel?.time || slotToCancel?.timeSlot || "Không rõ"}</strong> &bull; Khách: <strong>{slotToCancel?.customer || "Không rõ"}</strong>
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => {
 setShowCancelModal(false);
 setSlotToCancel(null);
 setCancelReasonInput("");
 }}
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-rose-100/50 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="px-6 py-5 space-y-3 sm:space-y-4">
 <div>
 <label className="block text-[14px] font-extrabold text-slate-800 mb-2">
 Lý Do Hủy Ca <span className="text-rose-600">*</span>
 </label>

 {/* Preset reasons */}
 <div className="flex flex-wrap gap-1.5 mb-3">
 {[
 "Sân bị hư hỏng cần sửa chữa",
 "Sự kiện đặc biệt tại cụm sân",
 "Lỗi hệ thống đặt trùng giờ",
 "Điều kiện thời tiết xấu"
 ].map(reason => (
 <button
 key={reason}
 type="button"
 onClick={() => setCancelReasonInput(reason)}
 className={`px-2.5 py-1 rounded-lg text-[14px] font-bold transition-all border ${
 cancelReasonInput === reason
 ? "bg-rose-600 text-white border-rose-600 shadow-sm"
 : "bg-slate-100 text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600"
 }`}
 >
 {reason}
 </button>
 ))}
 </div>

 <textarea
 value={cancelReasonInput}
 onChange={(e) => setCancelReasonInput(e.target.value)}
 placeholder="Hoặc nhập lý do cụ thể... (tuỳ chọn)"
 rows={3}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
 />
 </div>

 <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2">
 <span className="text-sm shrink-0">⚠️</span>
 <p className="text-[14px] text-amber-700 font-medium leading-relaxed">
 Lý do hủy sẽ được gửi ngay tới thông báo của khách hàng. Khung giờ này sẽ mở lại cho người đặt mới.
 </p>
 </div>
 </div>

 {/* Footer */}
 <div className="px-6 py-4 border-t border-slate-100 flex space-x-3">
 <button
 type="button"
 onClick={() => {
 setShowCancelModal(false);
 if (slotToCancel) {
 setSelectedSlotForAction(slotToCancel);
 }
 setSlotToCancel(null);
 setCancelReasonInput("");
 }}
 className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Quay Lại
 </button>
 <button
 type="button"
 onClick={handleConfirmCancel}
 disabled={!cancelReasonInput.trim()}
 className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-1.5"
 >
 <Trash2 className="w-4 h-4" />
 <span>Xác Nhận Hủy Ca</span>
 </button>
 </div>
 </div>
 </div>
 )}
          </div>
        )}

        {/* --- SUB-TAB CONTENT 1: LIVE MATRIX VIEW --- */}
 {activeSubTab === "matrix" && (
 <div className="space-y-3 sm:space-y-6">
 <div className="glass-panel p-4 sm:p-6 rounded-lg border border-slate-200 space-y-3 sm:space-y-5">
 <div className="space-y-4 pb-4 border-b border-slate-200">
 {/* HÀNG TIÊU ĐỀ & NÚT XÓA BỘ LỌC */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0369a1] flex items-center justify-center shrink-0 border border-sky-100">
 <BarChart2 className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-900">
 Sơ Đồ Ca Sân Thời Gian Thực
 </h2>
 <p className="text-[13px] text-slate-500 mt-0.5">
 Giờ mở cửa: <strong className="font-mono text-sky-800 font-bold">{operatingOpenTime} - {operatingCloseTime}</strong> • Ca cố định 2 tiếng (120 phút)
 </p>
 </div>
 </div>

 {(matrixFilterStatus !== "ALL" || matrixFilterType !== "ALL" || matrixFilterTime !== "ALL" || matrixFilterMethod !== "ALL") && (
 <button
 type="button"
 onClick={() => {
 setMatrixFilterStatus("ALL");
 setMatrixFilterType("ALL");
 setMatrixFilterTime("ALL");
 setMatrixFilterMethod("ALL");
 }}
 className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[13px] font-bold border border-rose-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer self-start sm:self-center shadow-xs"
 title="Đặt lại tất cả các bộ lọc về mặc định"
 >
 <X className="w-4 h-4" />
 <span>Xóa Bộ Lọc</span>
 </button>
 )}
 </div>

 {/* THANH BỘ LỌC ĐỀU ĐẶN 4 CỘT CHUẨN MỰC */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 {/* Cột 1: Trạng thái ca */}
 <div className="bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 transition-colors flex items-center gap-3 shadow-xs">
 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
 <div className="min-w-0 flex-1">
 <label className="block text-[13px] font-bold text-slate-500 leading-none mb-1.5">Trạng thái ca</label>
 <select
 value={matrixFilterStatus}
 aria-label="Lọc ca theo trạng thái"
 onChange={(e) => setMatrixFilterStatus(e.target.value)}
 className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
 >
 <option value="ALL">Tất cả trạng thái</option>
 <option value="BOOKED">🟢 Đã Cọc</option>
 <option value="PLAYING">🔴 Đang Đá</option>
 <option value="PENDING">🟡 Chờ Xác Nhận Cọc</option>
 <option value="EMPTY">⚪ Ca Trống</option>
 <option value="RESALE">🟠 Sàn Nhượng Gấp</option>
 </select>
 </div>
 </div>

 {/* Cột 2: Loại sân */}
 <div className="bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 transition-colors flex items-center gap-3 shadow-xs">
 <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
 <div className="min-w-0 flex-1">
 <label className="block text-[13px] font-bold text-slate-500 leading-none mb-1.5">Loại sân bóng</label>
 <select
 value={matrixFilterType}
 aria-label="Lọc ca theo loại sân"
 onChange={(e) => setMatrixFilterType(e.target.value)}
 className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
 >
 <option value="ALL">Tất cả loại sân</option>
 <option value="Sân 5">Sân 5 Người</option>
 <option value="Sân 7">Sân 7 Người</option>
 <option value="Sân 11">Sân 11 Tiêu Chuẩn</option>
 </select>
 </div>
 </div>

 {/* Cột 3: Khung giờ ca */}
 <div className="bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 transition-colors flex items-center gap-3 shadow-xs">
 <Clock className="w-4 h-4 text-amber-500 shrink-0" />
 <div className="min-w-0 flex-1">
 <label className="block text-[13px] font-bold text-slate-500 leading-none mb-1.5">Khung giờ thi đấu</label>
 <select
 value={matrixFilterTime}
 aria-label="Lọc ca theo khung giờ"
 onChange={(e) => setMatrixFilterTime(e.target.value)}
 className="w-full bg-transparent text-sm font-bold text-slate-900 font-mono focus:outline-none cursor-pointer truncate"
 >
 <option value="ALL">Tất cả ca ({availableTimeSlots.length} ca)</option>
 <option value="PEAK">⭐ Khung Giờ Vàng (Cao Điểm)</option>
 {availableTimeSlots.map((slot) => (
 <option key={slot} value={slot}>
 {slot}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Cột 4: Hình thức đặt */}
 <div className="bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3.5 py-2.5 transition-colors flex items-center gap-3 shadow-xs">
 <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
 <div className="min-w-0 flex-1">
 <label className="block text-[13px] font-bold text-slate-500 leading-none mb-1.5">Hình thức đặt sân</label>
 <select
 value={matrixFilterMethod}
 aria-label="Lọc ca theo hình thức đặt sân"
 onChange={(e) => setMatrixFilterMethod(e.target.value)}
 className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
 >
 <option value="ALL">Tất cả hình thức</option>
 <option value="ONLINE">📱 Đặt qua Website TurfZone</option>
 <option value="OFFLINE">☎️ Tạo Tại Quầy</option>
 <option value="RESALE">🔄 Sàn Nhượng Ca Gấp</option>
 <option value="EMPTY">⚪ Ca Trống Chưa Đặt</option>
 </select>
 </div>
 </div>
 </div>
 </div>

 {/* THANH CHỌN NGÀY THI ĐẤU (QUAN TRỌNG: CHỦ SÂN XEM ĐƯỢC CA ĐẶT CỦA MỌI NGÀY) */}
 <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 <div className="flex items-center space-x-2.5">
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/15 text-[#0b4f6c] flex items-center justify-center shrink-0">
 <Calendar className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center space-x-2">
 <span className="text-[14px] font-black text-slate-700">
 Lịch Đặt Ca Ngày:
 </span>
 <span className="px-2.5 py-0.5 rounded-lg bg-[#0369a1] text-white font-black text-[14px] font-mono shadow-xs">
 {upcomingDays.find(d => d.iso === matrixDate)?.display || `Ngày ${matrixDate.split("-").reverse().join("/")}`}
 </span>
 {matrixDate === upcomingDays[0]?.iso ? (
 <span className="text-[14px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-extrabold">
 🟢 Hôm Nay
 </span>
 ) : (
 <span className="text-[14px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-extrabold">
 📅 Ngày Tương Lai
 </span>
 )}
 </div>
 <p className="hidden sm:block text-[14px] text-slate-500 mt-0.5">
 Bấm vào các ngày bên dưới để xem sơ đồ ca, khách đã cọc và doanh thu của ngày đó
 </p>
 </div>
 </div>

 <div className="flex items-center space-x-2 shrink-0">
 <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 ">
 <span className="text-[14px] font-bold text-slate-500 whitespace-nowrap">Chọn ngày khác:</span>
 <input
 type="date"
 value={matrixDate}
  aria-label="Chọn ngày xem lịch đặt ca"
 onChange={(e) => {
 if (e.target.value) handleSelectDate(e.target.value);
 }}
 className="text-[14px] font-bold font-mono text-slate-900 bg-transparent cursor-pointer focus:outline-none"
 />
 </div>
 {matrixDate !== upcomingDays[0]?.iso && (
 <button
 type="button"
 onClick={() => handleSelectDate(upcomingDays[0]?.iso || "")}
 className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#0b4f6c] font-extrabold text-[14px] transition-colors border border-sky-200 shrink-0 cursor-pointer"
 >
 ↩ Về Hôm Nay
 </button>
 )}
 </div>
 </div>

 {/* Quick Pick Date Pills - 7 ngày tuần gọn gàng 1 hàng */}
 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pb-1">
 {upcomingDays.slice(0, 7).map((day) => {
 const isSelected = matrixDate === day.iso;
 return (
 <button
 key={day.iso}
 type="button"
 onClick={() => handleSelectDate(day.iso)}
 className={`px-2.5 py-2 rounded-xl text-[13px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer border text-center ${
 isSelected
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-xs"
 : "bg-white text-slate-700 border-slate-200 hover:border-[#0369a1] hover:bg-sky-50/30"
 }`}
 >
 <span className="font-bold leading-tight">{day.label}</span>
 <span className={`text-[13px] font-mono mt-0.5 ${
 isSelected ? "text-sky-100 font-bold" : "text-slate-500"
 }`}>
 {day.dateFormatted}
 </span>
 </button>
 );
 })}
 </div>
 </div>

  {/* THEO DÕI TRỰC CA & ĐẾM NGƯỢC GIỜ SÂN CHO CHỦ SÂN */}
  {activeLiveSlots.length > 0 && (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <span className="font-bold text-slate-900 text-[14px]">
            Đồng Hồ Trực Ca Sân Hiện Tại ({activeLiveSlots.length} ca đang thi đấu)
          </span>
        </div>
        <span className="text-[13px] text-amber-800 font-semibold">
          Chống đá lố giờ & Bàn giao ca đúng giờ
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {activeLiveSlots.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 bg-white ${
              item.isOverdue
                ? "border-rose-400 bg-rose-50/40"
                : item.isNearEnd
                ? "border-amber-400 bg-amber-50/40"
                : "border-slate-200"
            }`}
          >
            <div className="min-w-0">
              <div className="font-bold text-[13px] text-slate-900 truncate">
                {pitchTypeLabel(item.courtName) || item.courtName} • {item.slot.time}
              </div>
              <p className="text-[13px] text-slate-600 truncate mt-0.5">
                Khách: <strong>{item.slot.customer || "Khách đặt"}</strong>
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`px-2 py-0.5 rounded text-[13px] font-mono font-bold ${
                  item.isOverdue
                    ? "bg-rose-100 text-rose-800"
                    : item.isNearEnd
                    ? "bg-amber-100 text-amber-900"
                    : "bg-emerald-100 text-emerald-900"
                }`}>
                  {item.isOverdue
                    ? `⚠️ Đã lố ${item.remainingFormatted}`
                    : `Còn ${item.remainingFormatted}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOwnerSendReminder(item)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[13px] font-bold text-slate-800 flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-700" />
              <span>Nhắc trả sân</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

 {/* COLOR CODES LEGEND */}
 <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm font-bold pt-1">
 <span className="flex items-center space-x-2 text-sky-700 ">
 <span className="w-3.5 h-3.5 rounded-full bg-[#0369a1] shadow-xs shrink-0" />
 <span>Đã Cọc</span>
 </span>
 <span className="flex items-center space-x-2 text-rose-600">
 <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs shrink-0" />
 <span>Đã Check-in Đá</span>
 </span>
 <span className="flex items-center space-x-2 text-amber-700">
 <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs shrink-0" />
 <span>Sàn Nhượng Ca Gấp</span>
 </span>
 <span className="flex items-center space-x-2 text-slate-500">
 <span className="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0" />
 <span>Ca Trống</span>
 </span>
 </div>

 {/* PITCH MATRIX GRID */}
 <div className="space-y-3 sm:space-y-4 pt-2">
 {filteredMatrix.length === 0 ? (
 <div className="py-12 text-center text-sm text-slate-500 bg-white/40 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
 <AlertCircle className="w-8 h-8 text-amber-700" />
 <span className="font-bold text-slate-700 ">Không tìm thấy sân con hoặc ca đá nào phù hợp</span>
 <span className="text-[14px]">Vui lòng chọn Đặt Lại bộ lọc để hiển thị toàn bộ ma trận ca sân</span>
 </div>
 ) : (
 filteredMatrix.map((pitch) => (
 <div key={pitch.pitchId} className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
 <div className="flex justify-between items-center text-sm">
 <div className="flex items-center space-x-2.5">
  <PitchHoverPreview pitchType={pitch.type} customTitle={pitch.pitchName}>
    <span className="font-black text-slate-900 text-base cursor-pointer hover:text-[#0369a1] flex items-center gap-1.5 transition-colors">
      <span>{pitchTypeLabel(pitch.pitchName) || pitch.pitchName}</span>
      <Camera className="w-3.5 h-3.5 text-slate-400 hover:text-[#0369a1]" />
    </span>
  </PitchHoverPreview>
 <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-[14px] font-mono text-slate-700 font-bold">
 {pitchTypeLabel(pitch.type)}
 </span>
 </div>
 <div className="flex items-center gap-3">
  <div className="text-[14px] font-mono text-slate-500">
    Giá: <strong className="text-slate-900 font-bold text-sm">{(pitch.basePrice/1000).toFixed(0)}k/ca</strong>
  </div>
  <button
    type="button"
    onClick={() => toggleCourtImageEditor(pitch.pitchName, pitch.images || [])}
    className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-[#0369a1] border border-sky-300 text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
    title="Quản lý thư viện hình ảnh cụ thể cho sân này"
  >
    <Images className="w-3.5 h-3.5 text-sky-600" />
    <span>Ảnh sân ({((courtImagesMap[pitch.pitchName] || pitch.images || []).length)})</span>
  </button>
</div>
 </div>

 {/* PANEL INLINE QUẢN LÝ ALBUM ẢNH CHO SÂN CON NÀY */}
{activeEditingCourt === pitch.pitchName && (
  <div className="bg-sky-50/70 border-2 border-sky-300 rounded-xl p-3.5 sm:p-4 space-y-3 animate-fade-in shadow-xs">
    <div className="flex items-center justify-between pb-2 border-b border-sky-200">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-[#0369a1]" />
        <h4 className="font-bold text-slate-900 text-sm">
          Album Hình Ảnh Sân Con: <span className="text-[#0369a1]">{pitch.pitchName}</span> ({(courtImagesMap[pitch.pitchName] || pitch.images || []).length} ảnh)
        </h4>
      </div>
      <button
        type="button"
        onClick={() => setActiveEditingCourt(null)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-sky-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Lưới ảnh hiện có của sân con */}
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {((courtImagesMap[pitch.pitchName] || pitch.images || []).length === 0) ? (
        <p className="col-span-full text-[13px] text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
          Sân này chưa có ảnh riêng. Đang hiển thị ảnh mặc định theo loại sân. Hãy thêm ảnh bên dưới!
        </p>
      ) : (
        (courtImagesMap[pitch.pitchName] || pitch.images || []).map((imgUrl, iIdx) => (
          <div key={iIdx} className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-900 h-20 shadow-2xs">
            <img src={imgUrl} alt={pitch.pitchName} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemoveCourtImage(pitch.pitchName, iIdx)}
              className="absolute top-1 right-1 p-1 rounded bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
              title="Xóa ảnh này"
            >
              <X className="w-3 h-3" />
            </button>
            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[13px] font-mono font-bold">
              #{iIdx + 1}
            </span>
          </div>
        ))
      )}
    </div>

    {/* Form thêm ảnh mới inline */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
      <input
        ref={courtFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePickCourtFile(e, pitch.pitchName)}
      />
      <button
        type="button"
        disabled={isUploadingPhoto}
        onClick={() => courtFileInputRef.current?.click()}
        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
        title="Tải ảnh từ máy tính hoặc điện thoại lên cho sân này"
      >
        {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        <span>📁 Tải từ máy</span>
      </button>
      <input
        type="text"
        inputMode="url"
        value={newCourtImgInput}
        onChange={(e) => setNewCourtImgInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCourtImage(pitch.pitchName, newCourtImgInput);
          }
        }}
        placeholder="Hoặc dán link ảnh mặt cỏ / khung thành (https://...)"
        className="flex-1 p-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1]"
      />
      <button
        type="button"
        onClick={() => handleAddCourtImage(pitch.pitchName, newCourtImgInput)}
        className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[13px] font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Thêm</span>
      </button>
      <button
        type="button"
        onClick={() => handleSaveCourtImages(pitch.pitchName)}
        className="px-3.5 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold shadow-xs cursor-pointer shrink-0"
      >
        💾 Lưu album sân
      </button>
    </div>

    {/* Chọn nhanh ảnh thực tế mẫu */}
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span className="text-[13px] font-bold text-slate-600">Chọn nhanh ảnh mẫu:</span>
      {SAMPLE_PITCH_PHOTOS.slice(2, 7).map((sp, spIdx) => (
        <button
          key={spIdx}
          type="button"
          onClick={() => handleAddCourtImage(pitch.pitchName, sp.url)}
          className="px-2 py-0.5 rounded bg-white hover:bg-sky-100 text-slate-700 text-[13px] font-medium border border-slate-300 transition-colors cursor-pointer"
        >
          + {sp.label}
        </button>
      ))}
    </div>
  </div>
)}

{/* FORM ĐẶT CA TRỰC TIẾP TẠI QUẦY (INLINE NGAY TRONG SÂN CON ĐƯỢC CHỌN) */}
        {showOfflineModal && inlineOfflinePitch === pitch.pitchName && (
          <div id={`admin-inline-offline-${pitch.pitchId}`} className="w-full animate-fade-in">
            {renderOfflineBookingForm(pitch.pitchName)}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
 {pitch.slots.length === 0 ? (
 <div className="col-span-full py-6 sm:py-8 text-center text-sm text-slate-500 bg-white/40 rounded-xl border border-dashed border-slate-200 flex items-center justify-center space-x-2">
 <AlertCircle className="w-5 h-5 text-slate-500" />
 <span>Không có ca đá nào khớp bộ lọc.</span>
 </div>
 ) : (
 pitch.slots.map((slot: any) => (
 <div
 key={slot.id}
 onClick={() => {
 if (slot.status === "empty") {
 setOfflinePitchId(pitch.pitchName);
 setOfflineTime(slot.time);
 setOfflineDate(matrixDate);
 setInlineOfflinePitch(pitch.pitchName);
 setShowOfflineModal(true);
 } else {
 setSelectedSlotForAction(slot);
 }
 }}
 className={`p-3 rounded-xl border space-y-1.5 transition-all cursor-pointer hover:scale-[1.01] shadow-xs ${
 slot.isContinuation
 ? "bg-indigo-500/10 border-indigo-400 text-indigo-700 font-bold"
 : slot.isGapSlot
 ? "bg-amber-500/10 border-dashed border-amber-400 text-amber-800 font-bold hover:bg-amber-500/20"
 : slot.status === "playing"
 ? "bg-rose-500/10 border-rose-400 text-rose-600 font-bold"
 : slot.status === "pending_payment"
  ? "bg-amber-500/10 border-amber-400 text-amber-800 font-bold"
  : slot.status === "booked"
 ? "bg-[#0369a1]/10 border-sky-400 text-sky-700 font-bold"
 : slot.status === "resale"
 ? "bg-amber-500/10 border-amber-400 text-amber-600 font-bold"
 : "bg-white border-slate-200 text-slate-500 hover:border-sky-400 hover:bg-sky-50/20"
 }`}
 >
 <div className="flex justify-between items-center text-[13px] font-mono">
 <span className="font-extrabold text-sm">{slot.time}</span>
 <div className="flex items-center gap-1.5">
   <span
     className={`w-2 h-2 rounded-full shrink-0 ${
       slot.status === "empty"
         ? "bg-slate-300"
         : slot.status === "playing"
         ? "bg-rose-500 animate-pulse"
         : slot.status === "pending_payment"
         ? "bg-amber-500"
         : "bg-[#0369a1]"
     }`}
   />
   <span className="font-black text-sm">{slot.price}</span>
 </div>
 </div>
 
 <div className="flex items-center gap-1.5 flex-wrap">
 <p className={`font-black truncate text-sm ${slot.status === "empty" ? "text-slate-500" : "text-slate-900 "}`}>
 {slot.status === "empty" ? "+ Đặt tại quầy" : slot.customer}
 </p>
 {slot.isContinuation && (
 <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 text-[14px] font-black tracking-wider">
 🔗 Ca Nối Dài
 </span>
 )}
 {slot.isFullDayBooking && (
 <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 text-[14px] font-black tracking-wider">
 🌞 Bao Sân Cả Ngày
 </span>
 )}
 {slot.isGapSlot && (
 <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 text-[14px] font-black tracking-wider">
 ⚡ Khe Trống {slot.durationMinutes}p
 </span>
 )}
 </div>

 {/* HIỂN THỊ KHUNG GIỜ THỰC TẾ NẾU ĐẶT 2 TIẾNG HOẶC LỆCH GIỜ Ô */}
 {slot.bookingTimeSlot && slot.bookingTimeSlot !== slot.time && (
 <div className="text-[14px] font-bold text-[#0369a1] bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200/60 ">
 ⏰ Giờ đá thực: <span className="font-mono">{slot.bookingTimeSlot}</span>
 </div>
 )}
 
 <div className="text-[14px] space-y-1 opacity-90 font-mono">
 <span className="block text-slate-500">
 Cọc: <strong className={slot.isContinuation ? "text-indigo-600 font-bold" : slot.status === "empty" ? "text-slate-500" : "text-sky-700 font-bold"}>
 {slot.isContinuation ? "Đã tính ở ca trước" : slot.depositPaid}
 </strong>
 </span>
 {slot.status === "booked" && !slot.isContinuation && (
 <span className="block text-rose-600 font-bold">Thu tại quầy: <strong>{slot.cashDue}</strong></span>
 )}
 {slot.isContinuation && (
 <span className="block text-slate-500 text-[14px]">Cùng đơn: #{slot.code}</span>
 )}
 </div>

 <div className="flex items-center justify-between text-[14px] pt-2 border-t border-slate-200/50 ">
 <span className="truncate font-semibold">{slot.isContinuation ? "Ca lấn giờ tiếp nối" : slot.via}</span>
 <ChevronRight className="w-4 h-4 shrink-0" />
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )))}
 </div>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 2: PITCH INVENTORY & MANAGEMENT --- */}
 {activeSubTab === "pitches" && (
 <div className="space-y-3 sm:space-y-6">
 <div className="glass-panel p-4 sm:p-6 rounded-lg border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-4">
 <div>
 <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2.5">
 <Building className="w-5.5 h-5.5 text-[#0b4f6c] " />
 <span>Danh Sách Sân Con Trong Cụm ({pitchMatrix.length} Sân)</span>
 </h2>
 <p className="hidden sm:block text-sm text-slate-500 font-medium mt-1">
 Quản lý giá thuê, tình trạng sân và tiện ích cho từng sân con trong trung tâm thể thao.
 </p>
 </div>

 <button
 type="button"
 onClick={() => setShowAddPitchModal(true)}
 className="px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span>+ Thêm Sân Con Mới</span>
 </button>
 </div>

 {/* Nút sửa hồ sơ + giờ mở cửa (trước đây thiếu API sửa hồ sơ cụm sân) */}
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
  onClick={openEditInfoModal}
  disabled={!activePitch?.name}
  title={activePitch?.name ? "Sửa hồ sơ cụm sân" : "Chờ tải xong dữ liệu cụm sân"}
 className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-sm shadow-sm transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Pencil className="w-4 h-4 text-[#0b4f6c]" />
 <span>Sửa Hồ Sơ Cụm Sân</span>
 </button>
 <button
 type="button"
 onClick={() => setShowHoursModal(true)}
 className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-sm shadow-sm transition-all flex items-center space-x-2 active:scale-95"
 >
 <Clock className="w-4 h-4 text-[#0b4f6c]" />
 <span>Giờ Mở Cửa</span>
 </button>
 </div>

 {/* FORM SỬA HỒ SƠ CỤM SÂN (INLINE TẠI CHỖ TAB SÂN CON) */}
 {/* MODAL 0: SỬA HỒ SƠ CỤM SÂN (tên, địa chỉ, SĐT, bộ môn, tiện ích, ảnh, mô tả) */}
  {showEditInfoModal && (
  <div id="admin-inline-edit-info" className="w-full animate-fade-in">
  <div className="bg-white rounded-lg shadow-sm w-full max-w-2xl my-8 border border-slate-200 overflow-hidden">
  <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
  <div className="flex items-center gap-2.5">
  <Pencil className="w-5 h-5 text-[#0369a1]" />
  <h3 className="font-black text-lg text-slate-900">Sửa Hồ Sơ Cụm Sân</h3>
  </div>
  <button
  type="button"
  onClick={() => setShowEditInfoModal(false)}
  className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
  aria-label="Đóng"
  >
  <X className="w-5 h-5" />
  </button>
  </div>

  <p className="px-5 sm:px-6 pt-4 text-[14px] text-slate-500 leading-relaxed">
  Thông tin này hiển thị công khai cho cầu thủ khi tìm sân. Giá thuê và giờ mở cửa được sửa ở tab riêng.
  </p>

  <form onSubmit={handleSavePitchInfo} className="px-5 sm:px-6 py-4 space-y-3.5">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div className="space-y-3 sm:col-span-2 bg-slate-100/80 p-4 rounded-xl border border-slate-200">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Images className="w-4 h-4 text-[#0369a1]" />
      <label className="font-black text-slate-900 text-sm">Thư Viện Album Ảnh Cụm Sân ({infoGallery.length} ảnh)</label>
    </div>
    <span className="text-[13px] text-slate-500">Ảnh đầu tiên hoặc có ngôi sao là ảnh đại diện</span>
  </div>

  {/* Lưới ảnh hiện có */}
  {infoGallery.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
      {infoGallery.map((img, idx) => {
        const isMain = infoImageUrl === img || (idx === 0 && !infoImageUrl);
        return (
          <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-900 h-24 shadow-2xs">
            <img src={img} alt="Ảnh cụm sân" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
              {!isMain && (
                <button
                  type="button"
                  onClick={() => handleSetMainGalleryImage(img)}
                  className="px-2 py-1 rounded bg-[#0369a1] text-white text-[13px] font-bold shadow-xs hover:bg-[#075985]"
                  title="Đặt làm ảnh đại diện chính"
                >
                  Chọn chính
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemoveGalleryImage(idx)}
                className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                title="Xóa ảnh này khỏi album"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {isMain && (
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[13px] shadow-xs">
                ⭐ Ảnh chính
              </span>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <p className="text-[13px] text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-200">
      Chưa có ảnh nào trong album cụm sân. Hãy dán link hoặc chọn từ các ảnh mẫu bên dưới.
    </p>
  )}

  {/* Thêm link ảnh mới */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
    <input
      ref={galleryFileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handlePickGalleryFile}
    />
    <button
      type="button"
      disabled={isUploadingPhoto}
      onClick={() => galleryFileInputRef.current?.click()}
      className="px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
      title="Chọn ảnh JPG/PNG từ máy tính hoặc chụp ảnh từ điện thoại"
    >
      {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      <span>📁 Tải ảnh từ máy</span>
    </button>
    <div className="flex items-center gap-2 flex-1">
      <input
        type="text"
        inputMode="url"
        value={newGalleryInput}
        onChange={(e) => setNewGalleryInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddGalleryImage(newGalleryInput);
          }
        }}
        placeholder="Hoặc dán đường dẫn ảnh mới (https://...)"
        className="flex-1 p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1]"
      />
      <button
        type="button"
        onClick={() => handleAddGalleryImage(newGalleryInput)}
        className="px-3.5 py-2.5 rounded-lg bg-[#0369a1] text-white text-[13px] font-bold hover:bg-[#075985] shrink-0 cursor-pointer flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        <span>Thêm</span>
      </button>
    </div>
  </div>

  {/* Gợi ý ảnh mẫu chất lượng cao */}
  <div className="pt-1 space-y-1">
    <span className="text-[13px] font-bold text-slate-600 block">Chọn nhanh ảnh mẫu chất lượng cao cho cụm sân:</span>
    <div className="flex flex-wrap gap-1.5">
      {SAMPLE_PITCH_PHOTOS.map((sp, sIdx) => (
        <button
          key={sIdx}
          type="button"
          onClick={() => handleAddGalleryImage(sp.url)}
          className="px-2.5 py-1 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0369a1] border border-slate-300 text-[13px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>+ {sp.label}</span>
        </button>
      ))}
    </div>
  </div>
</div>
</div>

  {/* Bộ môn — chủ sân tự khai báo, không bịa sẵn */}
  <div className="space-y-2">
  <label className="font-extrabold text-slate-800 text-sm">Bộ môn thể thao</label>
  <div className="flex flex-wrap gap-2">
  {pitchTypeOptions.map((t) => (
  <button
  key={t}
  type="button"
  onClick={() => toggleInfoList(t, infoPitchTypes, setInfoPitchTypes)}
  className={`px-3 py-1.5 rounded-xl text-[14px] font-bold border transition-colors ${
  infoPitchTypes.includes(t)
  ? "bg-[#0369a1] text-white border-[#0369a1]"
  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
  }`}
  >
  {pitchTypeLabel(t) || t}
  </button>
  ))}
  </div>
  </div>

  {/* Tiện ích */}
  <div className="space-y-2">
  <label className="font-extrabold text-slate-800 text-sm">Tiện ích đi kèm</label>
  <div className="flex flex-wrap gap-2">
  {amenityOptions.map((a) => (
  <button
  key={a}
  type="button"
  onClick={() => toggleInfoList(a, infoAmenities, setInfoAmenities)}
  className={`px-3 py-1.5 rounded-xl text-[14px] font-bold border transition-colors ${
  infoAmenities.includes(a)
  ? "bg-[#0369a1] text-white border-[#0369a1]"
  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
  }`}
  >
  {a}
  </button>
  ))}
  </div>
  </div>

  <div className="space-y-1.5">
  <label className="font-extrabold text-slate-800 text-sm">Mô tả cụm sân</label>
  <textarea
  value={infoDescription}
  onChange={(e) => setInfoDescription(e.target.value)}
  rows={3}
  placeholder="Mô tả chất lượng mặt cỏ, vị trí, chỗ để xe..."
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm resize-y"
  />
  </div>

  <div className="flex gap-3 pt-2">
  <button
  type="button"
  onClick={() => setShowEditInfoModal(false)}
  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
  >
  Huỷ Bỏ
  </button>
  <button
  type="submit"
  disabled={isSavingInfo || !infoName.trim() || !infoAddress.trim()}
  className="flex-1 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
  {isSavingInfo ? "Đang lưu…" : "Lưu Hồ Sơ"}
  </button>
  </div>
  </form>
  </div>
  </div>
  )}

 <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
   <div className="flex flex-wrap items-center gap-1.5">
     <span className="text-[14px] font-bold text-slate-500 mr-1">Lọc loại sân:</span>
     {(["ALL", "SAN_5", "SAN_7", "SAN_11"] as const).map((fmt) => (
       <button
         key={fmt}
         type="button"
         onClick={() => setCourtFormatFilter(fmt)}
         className={`px-3 py-1 rounded-lg text-[14px] font-bold transition-all ${
           courtFormatFilter === fmt
             ? "bg-[#0369a1] text-white shadow-xs"
             : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
         }`}
       >
         {fmt === "ALL" ? `Tất cả (${pitchMatrix.length})` : fmt === "SAN_5" ? "Sân 5" : fmt === "SAN_7" ? "Sân 7" : "Sân 11"}
       </button>
     ))}
   </div>
   <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[14px] focus-within:ring-2 focus-within:ring-[#0369a1]">
     <Search className="w-3.5 h-3.5 text-sky-700 shrink-0" />
     <input
       type="text"
       value={courtSearchQuery}
       onChange={(e) => setCourtSearchQuery(e.target.value)}
       placeholder="Tìm tên sân con..."
       className="w-36 bg-transparent text-[14px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
     />
   </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
 {filteredCourts.length === 0 ? (
   <div className="col-span-full p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-slate-500 text-[14px] font-medium">
     Không tìm thấy sân con nào phù hợp với bộ lọc.
   </div>
 ) : (
 filteredCourts.map((pitch) => (
 <div key={pitch.pitchId} className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 sm:space-y-4">
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center space-x-2.5">
 <h3 className="font-black text-lg text-slate-900 ">{pitch.pitchName}</h3>
 <span className="px-2.5 py-0.5 rounded-lg bg-[#0369a1]/10 text-[#0b4f6c] text-[14px] font-mono font-bold">
 {pitchTypeLabel(pitch.type)}
 </span>
 </div>
 <span className="text-[14px] text-slate-500 font-medium mt-0.5 block">Mã sân: {pitch.pitchId}</span>
 </div>

 <span className="px-3 py-1 rounded-full bg-[#0369a1]/10 text-emerald-500 text-[14px] font-bold border border-[#0369a1]/20">
 Đang hoạt động
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3 text-sm font-mono p-3.5 rounded-xl bg-white border border-slate-200 ">
 <div>
 <span className="text-slate-500 block text-[14px] font-semibold">Giá giờ thường</span>
 <strong className="text-slate-900 font-extrabold text-sm sm:text-base">{pitch.basePrice.toLocaleString("vi-VN")} đ/ca</strong>
 </div>
 <div>
 <span className="text-slate-500 block text-[14px] font-semibold">Giá giờ vàng</span>
 <strong className="text-amber-700 font-black text-sm sm:text-base">{pitch.peakPrice.toLocaleString("vi-VN")} đ/ca</strong>
 </div>
 </div>

 <div className="flex items-center justify-between text-sm pt-2">
 <span className="text-slate-500 text-[14px] sm:text-sm">
 Tiện ích:{" "}
 {activePitch?.amenities?.length
 ? activePitch.amenities.join(", ")
 : "Chưa khai báo tiện ích trong hồ sơ sân"}
 </span>
 <button
 onClick={() => setActiveSubTab("pricing")}
 className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-300 transition-colors shadow-2xs"
 >
 Sửa Giá Sân
 </button>
 </div>
 </div>
 )))
 }
 </div>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 3: GIÁ THUÊ SÂN (ghi vào bảng pitches qua API) --- */}
 {activeSubTab === "pricing" && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
 <div className="glass-panel p-4 sm:p-6 rounded-lg border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center space-x-2">
 <Sliders className="w-5 h-5 text-[#0b4f6c] " />
 <h3 className="font-extrabold text-base text-slate-900 ">Giá Thuê Sân Hiện Tại</h3>
 </div>
 </div>

 <p className="hidden sm:block text-[14px] text-slate-500">
 Cập nhật giá ca thường và ca giờ vàng của từng sân. Ca bắt đầu từ 17:00, 18:00 và
 19:00 được tính theo giá giờ vàng khi thanh toán.
 </p>

 <div className="space-y-3 sm:space-y-4 pt-2">
 {realPitches.length === 0 ? (
 <p className="text-[14px] text-slate-500 p-4 rounded-2xl bg-slate-50 border border-slate-200 ">
 Chưa có cụm sân nào .
 </p>
 ) : (
 realPitches.map((p: any) => {
 const draft = getPriceDraft(p);
 const saving = savingPriceId === String(p.id);
 return (
 <div
 key={String(p.id)}
 className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
 >
 <div className="flex items-center justify-between gap-3">
 <span className="font-extrabold text-sm text-slate-900 truncate">
 {p.name}
 </span>
 <span className="text-[14px] font-mono text-slate-500 shrink-0">
 {p.openTime ?? "—"} - {p.closeTime ?? "—"}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <label className="space-y-1">
 <span className="text-[14px] font-bold text-slate-500">
 Giá thường (đ/ca)
 </span>
 <input
 type="number"
 step={10000}
 value={draft.avg}
 onChange={(e) =>
 setPriceDraft({
 ...priceDraft,
 [String(p.id)]: { ...draft, avg: e.target.value },
 })
 }
 className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0369a1]"
 />
 </label>
 <label className="space-y-1">
 <span className="text-[14px] font-bold text-slate-500">
 Giá giờ vàng (đ/ca)
 </span>
 <input
 type="number"
 step={10000}
 value={draft.peak}
 onChange={(e) =>
 setPriceDraft({
 ...priceDraft,
 [String(p.id)]: { ...draft, peak: e.target.value },
 })
 }
 className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0369a1]"
 />
 </label>
 </div>
 <button
 type="button"
 disabled={saving}
 onClick={() => savePitchPrice(p)}
 className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
 >
 {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
 {saving ? "Đang lưu..." : "Lưu giá sân"}
 </button>
 </div>
 );
 })
 )}
 </div>
 </div>

 <div className="glass-panel p-4 sm:p-6 rounded-lg border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 <h3 className="font-extrabold text-base text-slate-900 ">Tiền Cọc & Giữ Chỗ</h3>
 </div>

 <div className="space-y-3 sm:space-y-4 text-[14px]">
 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
 <span className="font-extrabold text-slate-900 block">
 Cọc khi đặt qua web / app: 50% giá ca
 </span>
 <p className="hidden sm:block text-[14px] text-slate-500">
 Màn thanh toán VietQR hiển thị số cọc = 50% giá ca đã chọn; phần còn lại thu tại quầy
 khi khách check-in.
 </p>
 </div>

 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
 <span className="font-extrabold text-slate-900 block">
 Cọc đặt tại quầy: do chủ sân nhập
 </span>
 <p className="hidden sm:block text-[14px] text-slate-500">
 Khi đặt offline, số tiền cọc được nhập cùng đơn và hiển thị trong ma trận
 (đã cọc / còn phải thu).
 </p>
 </div>

 <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-1.5">
 <span className="font-extrabold text-amber-700 block">
 Khách không đến (no-show)
 </span>
 <p className="hidden sm:block text-[14px] text-slate-500">
 Hệ thống không tự động phạt cọc. Chủ sân đóng ca tại tab Ma trận với lý do
 “khách không đến”, phần cọc và phạt do hai bên tự thoả thuận ngoài hệ thống.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 4: QUẢN LÝ KHO VẬT TƯ & CANTEEN SÂN BÓNG --- */}
      {activeSubTab === "canteen" && (
        <div className="glass-panel p-3.5 sm:p-6 rounded-2xl border border-slate-200 space-y-4 sm:space-y-6">
          {/* HEADER TO RÕ + NÚT CHỨC NĂNG */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0369a1]/10 flex items-center justify-center text-[#0369a1] shrink-0">
                <Package className="w-5 h-5 text-[#0369a1]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  Quản Lý Kho Vật Tư & Canteen Sân Bóng
                </h2>
                <p className="text-[13px] text-slate-500 font-medium">
                  Kiểm soát xuất - nhập - tồn nước uống, đồ thể thao cho mượn và vật tư bảo trì sân
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={exportWarehouseReportCsv}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-[13px] font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Xuất bảng kiểm kê kho ra file Excel CSV tiếng Việt"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                <span>Xuất Excel Báo Cáo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddWarehouseForm(!showAddWarehouseForm);
                  if (canteenEditingId) {
                    setCanteenEditingId(null);
                    setCanteenForm({ name: "", price: "", stock: "", unit: "" });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddWarehouseForm || canteenEditingId ? "Đóng Form Nhập" : "+ Thêm Vật Tư Mới"}</span>
              </button>

              <button
                type="button"
                onClick={() => loadCanteen()}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Tải lại
              </button>
            </div>
          </div>

          {/* 4 THẺ KPI KHO VẬT TƯ (TỐI GIẢN - ĐỒNG BỘ SLATE & TURF BLUE) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                <span>Tổng Mặt Hàng</span>
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {canteenItems.length}
              </p>
              <p className="text-[13px] text-slate-500">Mặt hàng đang quản lý</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                <span>Tổng Số Lượng Tồn</span>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {canteenItems.reduce((acc, it) => acc + (Number(it.stock) || 0), 0)}
              </p>
              <p className="text-[13px] text-slate-500">Tổng hiện vật trong kho</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                <span>Giá Trị Tồn Kho</span>
                <span className="text-[13px] font-bold text-slate-400">VNĐ</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#0369a1] font-mono">
                {(
                  canteenItems.reduce(
                    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.stock) || 0),
                    0
                  ) / 1000000
                ).toFixed(1)}{" "}
                <span className="text-[13px] font-bold">Tr</span>
              </p>
              <p className="text-[13px] text-slate-500">Quy đổi theo đơn giá</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                <span>Cần Nhập Thêm</span>
                <AlertCircle className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {canteenItems.filter((it) => (Number(it.stock) || 0) <= 5).length}
              </p>
              <p className="text-[13px] text-slate-500">Mặt hàng có tồn kho &le; 5</p>
            </div>
          </div>

          {/* FORM INLINE THÊM / SỬA MÓN & NHẬP KHO */}
          {(showAddWarehouseForm || canteenEditingId) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-[14px] font-extrabold text-slate-900">
                  {canteenEditingId ? "✏️ Cập Nhật Thông Tin Mặt Hàng" : "➕ Thêm Mặt Hàng / Vật Tư Mới Vào Kho"}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] text-slate-500">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => applyWarehousePreset("Nước khoáng đóng chai", "Chai", "10000", "48")}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    🥤 Nước khoáng
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWarehousePreset("Quả bóng đá số 5 FIFA", "Quả", "350000", "8")}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    ⚽ Bóng số 5
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWarehousePreset("Áo bib phân đội (bộ 10 áo)", "Bộ", "150000", "5")}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    🎽 Bộ Áo Bib
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWarehousePreset("Bao hạt cao su bảo trì sân (25kg)", "Bao", "220000", "15")}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    🛠️ Hạt cao su
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Tên vật tư / món hàng</label>
                  <input
                    value={canteenForm.name}
                    onChange={(e) => setCanteenForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Nước Revive chanh muối / Bóng số 5 / Lưới 7 người"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                  />
                  {canteenErrors.name && canteenForm.name && (
                    <p className="text-[13px] font-semibold text-rose-600 mt-0.5">{canteenErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Đơn vị tính</label>
                  <input
                    value={canteenForm.unit}
                    onChange={(e) => setCanteenForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="Chai, Quả, Bộ, Bao, Cái..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                  <input
                    value={canteenForm.price}
                    onChange={(e) => setCanteenForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="VD: 15000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[14px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                  />
                  {canteenErrors.price && canteenForm.price && (
                    <p className="text-[13px] font-semibold text-rose-600 mt-0.5">{canteenErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Số lượng tồn kho ban đầu</label>
                  <input
                    value={canteenForm.stock}
                    onChange={(e) => setCanteenForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="VD: 24"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[14px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                  />
                </div>

                <div className="sm:col-span-3 flex items-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={saveCanteenItem}
                    disabled={canteenBusy || !isCanteenValid}
                    className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {canteenBusy ? "Đang lưu..." : canteenEditingId ? "Cập Nhật Thông Tin" : "Lưu Vào Kho Hàng"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCanteenEditingId(null);
                      setCanteenForm({ name: "", price: "", stock: "", unit: "" });
                      setShowAddWarehouseForm(false);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-[14px] font-bold hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BỘ LỌC DANH MỤC & TÌM KIẾM THEO TÊN (ĐỒNG BỘ TOÀN BỘ VỀ TONE SLATE VÀ TURF BLUE) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* 5 Chips phân loại */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "ALL" as const, label: "Tất cả", count: canteenItems.length },
                {
                  id: "CANTEEN" as const,
                  label: "🥤 Nước & Canteen",
                  count: canteenItems.filter((i) => detectCategory(i) === "CANTEEN").length,
                },
                {
                  id: "EQUIPMENT" as const,
                  label: "⚽ Đồ Cho Mượn",
                  count: canteenItems.filter((i) => detectCategory(i) === "EQUIPMENT").length,
                },
                {
                  id: "MAINTENANCE" as const,
                  label: "🛠️ Vật Tư Sân",
                  count: canteenItems.filter((i) => detectCategory(i) === "MAINTENANCE").length,
                },
                {
                  id: "LOW_STOCK" as const,
                  label: "Cần Nhập Thêm",
                  count: canteenItems.filter((i) => (Number(i.stock) || 0) <= 5).length,
                },
              ].map((chip) => {
                const isActive = warehouseCategoryFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setWarehouseCategoryFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-[#0369a1] text-white shadow-xs"
                        : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[13px] font-mono font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ô tìm kiếm nhanh */}
            <div className="w-full sm:w-64">
              <input
                value={searchWarehouseQuery}
                onChange={(e) => setSearchWarehouseQuery(e.target.value)}
                placeholder="🔍 Tìm vật tư theo tên..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
              />
            </div>
          </div>

          {/* DANH SÁCH THẺ VẬT TƯ & KHO HÀNG (CLEAN MINIMALIST SAAS) */}
          {canteenLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Package className="w-8 h-8 opacity-30 text-slate-400" />
              <p className="text-[14px] font-medium text-slate-500">Đang tải kho vật tư sân...</p>
            </div>
          ) : canteenItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
              <Package className="w-10 h-10 text-slate-300" />
              <p className="text-[14px] font-bold text-slate-700">Kho vật tư hiện chưa có mặt hàng nào.</p>
              <p className="text-[13px] text-slate-500 max-w-md">
                Bấm nút <strong>"+ Thêm Vật Tư Mới"</strong> hoặc chọn nhanh các mẫu gợi ý để bắt đầu quản lý.
              </p>
              <button
                type="button"
                onClick={() => setShowAddWarehouseForm(true)}
                className="px-4 py-2 rounded-xl bg-[#0369a1] text-white text-[13px] font-bold shadow-xs hover:bg-[#075985]"
              >
                + Khởi Tạo Mặt Hàng Đầu Tiên
              </button>
            </div>
          ) : (
            (() => {
              const filteredList = canteenItems.filter((item: any) => {
                const cat = detectCategory(item);
                if (warehouseCategoryFilter === "CANTEEN" && cat !== "CANTEEN") return false;
                if (warehouseCategoryFilter === "EQUIPMENT" && cat !== "EQUIPMENT") return false;
                if (warehouseCategoryFilter === "MAINTENANCE" && cat !== "MAINTENANCE") return false;
                if (warehouseCategoryFilter === "LOW_STOCK" && (Number(item.stock) || 0) > 5) return false;
                if (searchWarehouseQuery.trim()) {
                  const q = searchWarehouseQuery.trim().toLowerCase();
                  const name = (item.name || "").toLowerCase();
                  const unit = (item.unit || "").toLowerCase();
                  if (!name.includes(q) && !unit.includes(q)) return false;
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-500 text-[14px]">
                    Không tìm thấy vật tư nào phù hợp với bộ lọc hiện tại.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredList.map((item: any) => {
                    const cat = detectCategory(item);
                    const stockNum = Number(item.stock) || 0;
                    const isLow = stockNum <= 5 && stockNum > 0;
                    const isOut = stockNum <= 0;
                    const isRestocking = restockInlineId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-3"
                      >
                        {/* Header của thẻ: Phân loại & Chỉ thị tình trạng tinh tế */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Badge phân loại đồng bộ tone Slate */}
                              <span className="px-2 py-0.5 rounded-md text-[13px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {cat === "EQUIPMENT"
                                  ? "⚽ Cho Mượn"
                                  : cat === "MAINTENANCE"
                                  ? "🛠️ Vật Tư Sân"
                                  : "🥤 Canteen"}
                              </span>

                              {/* Tình trạng hàng dạng Dot tinh tế */}
                              {isOut ? (
                                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-rose-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Hết hàng</span>
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-amber-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Sắp hết</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Đủ hàng</span>
                                </span>
                              )}
                            </div>

                            <h3 className="font-extrabold text-[15px] text-slate-900 leading-snug line-clamp-2 pt-0.5">
                              {item.name}
                            </h3>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-slate-900 text-[15px] block">
                              {Number(item.price ?? 0).toLocaleString("vi-VN")}đ
                            </span>
                            <span className="text-[13px] text-slate-400 font-medium">/{item.unit || "Cái"}</span>
                          </div>
                        </div>

                        {/* Chỉ số Tồn kho & Đã xuất hôm nay (Slate Neutral) */}
                        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-[13px] font-mono">
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[13px] font-sans">Tồn kho hiện tại:</span>
                            <span
                              className={`text-base font-black ${
                                isOut ? "text-rose-600" : isLow ? "text-amber-700" : "text-[#0369a1]"
                              }`}
                            >
                              {item.stock ?? 0}{" "}
                              <span className="text-[13px] font-normal text-slate-500 font-sans">
                                {item.unit || "cái"}
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-slate-500 text-[13px] font-sans">Đã xuất hôm nay:</span>
                            <span className="text-base font-black text-slate-900">
                              {item.soldToday ?? 0}{" "}
                              <span className="text-[13px] font-normal text-slate-500 font-sans">
                                {item.unit || "cái"}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* PANEL NHẬP KHO NHANH INLINE (ĐỒNG BỘ TONE SLATE) */}
                        {isRestocking ? (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-[13px] font-bold text-slate-800">
                              <span>📦 Nhập thêm vào kho:</span>
                              <button
                                type="button"
                                onClick={() => setRestockInlineId(null)}
                                className="text-slate-400 hover:text-slate-600 text-[13px] cursor-pointer"
                              >
                                Đóng
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => restockCanteenItem(item, 6)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-100"
                              >
                                +6
                              </button>
                              <button
                                type="button"
                                onClick={() => restockCanteenItem(item, 12)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-100"
                              >
                                +12 (1 lốc)
                              </button>
                              <button
                                type="button"
                                onClick={() => restockCanteenItem(item, 24)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-100"
                              >
                                +24 (1 thùng)
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <input
                                type="number"
                                min="1"
                                value={customRestockQty}
                                onChange={(e) => setCustomRestockQty(e.target.value)}
                                placeholder="Số khác..."
                                className="w-24 px-2 py-1 rounded-lg border border-slate-300 bg-white text-[13px] font-mono font-bold text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => restockCanteenItem(item, Number(customRestockQty) || 0)}
                                className="px-3 py-1 rounded-lg bg-[#0369a1] text-white text-[13px] font-bold hover:bg-[#075985] cursor-pointer"
                              >
                                Nhập
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {/* HÀNG NÚT THAO TÁC NGHIỆP VỤ (ĐỒNG BỘ NỀN TRẮNG VIỀN SLATE NHẸ) */}
                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Nút Xuất/Bán 1 */}
                            <button
                              type="button"
                              onClick={() => sellOneCanteenItem(item.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-[13px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Bán hoặc xuất kho 1 sản phẩm"
                            >
                              <span>Xuất/Bán 1</span>
                            </button>

                            {/* Với đồ cho mượn: Nút Trả lại (+1 vào tồn) */}
                            {cat === "EQUIPMENT" && (
                              <button
                                type="button"
                                onClick={() => restockCanteenItem(item, 1)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-[13px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Khách trả bóng/áo: cộng lại 1 vào kho"
                              >
                                <span>↩️ Trả (+1)</span>
                              </button>
                            )}

                            {/* Nút Nhập Thêm Hàng */}
                            <button
                              type="button"
                              onClick={() => {
                                setRestockInlineId(isRestocking ? null : item.id);
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-[#0369a1] hover:bg-sky-50 text-[13px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Nhập thêm hàng hóa vào kho"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Nhập Kho</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Nút Sửa */}
                            <button
                              type="button"
                              onClick={() => {
                                setCanteenEditingId(item.id);
                                setCanteenForm({
                                  name: item.name ?? "",
                                  price: String(item.price ?? ""),
                                  stock: String(item.stock ?? 0),
                                  unit: item.unit ?? "",
                                });
                                setShowAddWarehouseForm(true);
                              }}
                              className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                              title="Sửa thông tin mặt hàng"
                            >
                              <Edit3 className="w-4 h-4 text-slate-600" />
                            </button>

                            {/* Nút Xoá */}
                            <button
                              type="button"
                              onClick={() => removeCanteenItem(item.id)}
                              className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Xóa mặt hàng khỏi kho"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

 
 </div>
 );
}

