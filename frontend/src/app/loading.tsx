import LoadingGate from "@/components/LoadingGate";

/**
 * Loading UI của App Router: hiện vòng xoay khi đang chuyển trang
 * (applies cho toàn bộ route dưới app/). Giữ tối thiểu 1 giây.
 */
export default function Loading() {
  return <LoadingGate minMs={1000} className="min-h-screen w-full bg-slate-50" />;
}