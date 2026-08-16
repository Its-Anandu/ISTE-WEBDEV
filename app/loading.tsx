export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f6f2ea]">
      <div className="w-[80%] max-w-[800px] flex flex-col gap-6 animate-pulse items-center mt-[-10vh]">
        {/* Skeleton Badge */}
        <div className="w-48 h-8 bg-white/5 border border-white/10 rounded-full" />
        
        {/* Skeleton Title */}
        <div className="w-full h-20 md:h-28 bg-white/5 border border-white/10 rounded-2xl" />
        <div className="w-3/4 h-20 md:h-28 bg-white/5 border border-white/10 rounded-2xl" />
        
        {/* Skeleton Subtitle */}
        <div className="w-2/3 h-4 bg-white/10 rounded mt-8" />
        <div className="w-1/2 h-4 bg-white/10 rounded" />
      </div>
    </div>
  )
}
