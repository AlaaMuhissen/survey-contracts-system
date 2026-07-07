


export default function LinedArea({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const lineHeight = 30;
  const height = rows * lineHeight + 10;
  return (
    <div>
      <div className="text-sm mb-2">{label}:</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height,
          lineHeight: `${lineHeight}px`,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${
            lineHeight - 1
          }px, rgba(0,0,0,0.7) ${lineHeight - 1}px, rgba(0,0,0,0.7) ${lineHeight}px)`,
          backgroundSize: "100% 100%",
        }}
        className="w-full bg-transparent outline-none resize-none p-2"
      />
    </div>
  );
}
    