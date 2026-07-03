/* Skeleton placeholders — mirror the shape of the content they stand in
   for, so screens don't jump when real data streams in. */

export function SkeletonCard({ image = false }: { image?: boolean }) {
  return (
    <div className="card overflow-hidden" style={{ padding: 0 }} aria-hidden>
      {image && <div className="skel" style={{ height: 128 }} />}
      <div className="p-[13px] flex flex-col gap-[10px]">
        <div className="skel skel-line w60" />
        <div className="skel skel-line w40" />
        <div className="skel skel-line w80" style={{ height: 9 }} />
      </div>
    </div>
  );
}

export function SkeletonList({ n = 3, image = false }: { n?: number; image?: boolean }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading">
      {Array.from({ length: n }, (_, i) => (
        <SkeletonCard key={i} image={image} />
      ))}
    </div>
  );
}
