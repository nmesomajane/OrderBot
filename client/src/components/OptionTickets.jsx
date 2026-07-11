export default function OptionTickets({ options, onSelect, disabled }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt.value}
          disabled={disabled}
          onClick={() => onSelect(opt.value)}
          className="group flex items-stretch text-left rounded-lg overflow-hidden border border-[#3A332C]
                     bg-[#1B1815] hover:border-[#C6742B] transition-colors disabled:opacity-40"
        >
          <span
            className="flex items-center justify-center w-11 shrink-0 font-mono text-[13px]
                       text-[#171412] bg-[#E2A33D] group-hover:bg-[#C6742B] transition-colors"
          >
            {opt.value}
          </span>
          <span className="flex items-center px-3 py-2 text-[14px] text-[#F5EFE6]">
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}