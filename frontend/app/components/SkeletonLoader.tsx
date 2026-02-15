export default function SkeletonLoader() {
    return (
        <div className="glass-card rounded-2xl p-6 animate-pulse-shimmer overflow-hidden relative">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="space-y-4">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-6 bg-white/10 rounded-lg w-1/3" />
                    <div className="h-8 w-8 bg-white/10 rounded-full" />
                </div>

                {/* Content skeleton */}
                <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded w-full" />
                    <div className="h-4 bg-white/10 rounded w-5/6" />
                    <div className="h-4 bg-white/10 rounded w-4/6" />
                </div>

                {/* Large value skeleton */}
                <div className="h-12 bg-white/10 rounded-lg w-2/3 mt-6" />
            </div>
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6 h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="h-6 bg-white/10 rounded-lg w-1/4 mb-6" />
            <div className="h-[300px] bg-white/5 rounded-lg flex items-end justify-around gap-2 p-4">
                {[40, 70, 50, 80, 60].map((height, i) => (
                    <div
                        key={i}
                        className="bg-white/10 rounded-t-lg transition-all"
                        style={{ height: `${height}%`, width: '15%' }}
                    />
                ))}
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-1/3" />
                            <div className="h-3 bg-white/10 rounded w-1/2" />
                        </div>
                        <div className="h-6 bg-white/10 rounded-lg w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}
