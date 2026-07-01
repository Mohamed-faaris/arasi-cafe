import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

type QuantityCounterProps = {
  value: number;
  step?: number;
  min?: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onChange?: (val: number) => void;
};

export default function QuantityCounter({
  value,
  step = 1,
  min = 0,
  onDecrement,
  onIncrement,
  onChange,
}: QuantityCounterProps) {
  const [input, setInput] = useState(String(value));

  useEffect(() => {
    setInput(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v) && onChange) onChange(Math.max(min, v));
    else setInput(String(value));
  };

  return (
    <div className="flex items-center gap-2 bg-[#F9F6F2] rounded-lg p-1">
      <button
        onClick={onDecrement}
        className="w-7 h-7 rounded-md bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm"
      >
        <Minus size={12} className="text-[#1A0A0C]" />
      </button>
      <input
        type="number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => commit(input)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(input); }}
        className="w-10 text-sm font-bold text-[#1A0A0C] text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={onIncrement}
        className="w-7 h-7 rounded-md bg-[#8B1E24] flex items-center justify-center"
      >
        <Plus size={12} className="text-white" />
      </button>
    </div>
  );
}
