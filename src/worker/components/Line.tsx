export default function Line({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  labelClassName = "",
  required = false,
  errors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  required?: boolean; 
  errors?: string;
}) {
  return (
  
    <div className={`flex gap-2 items-end ${className}`}>
    
      <label
        className={`whitespace-nowrap text-sm print:text-[12px]`}
      >
        {label}
      </label>
      <input
        required={required} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className= {"flex-1 text-right bg-transparent border-0 border-b border-black/80 focus:outline-none focus:ring-0 min-h-[40px] px-2 py-2 text-base" + (errors ? " border-red-600" : "")}
      />
        {errors && <div className="text-xs text-red-600 mt-1">{errors}</div>}
      
    </div>
  );
}