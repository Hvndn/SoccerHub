import PageSpinner from "@/components/PageSpinner";

/**
 * Loading UI của App Router: hiện vòng xoay khi đang chuyển trang
 * (applies cho toàn bộ route dưới app/).
 */
export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      <PageSpinner className="min-h-screen w-full" />
    </div>
  );
}