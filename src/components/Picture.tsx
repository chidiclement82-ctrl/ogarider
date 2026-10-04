/** An uploaded picture, or an emoji tile when there is none. Size and shape come from className. */
export function Picture({
  image,
  emoji,
  color = "#f5f5f4",
  className = "",
}: {
  image: string;
  emoji: string;
  color?: string;
  className?: string;
}) {
  if (image) {
    // Uploaded files are served by /uploads/[name]; next/image optimisation is not needed here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/uploads/${image}`} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <span className={`grid place-items-center ${className}`} style={{ backgroundColor: color }}>
      {emoji}
    </span>
  );
}
