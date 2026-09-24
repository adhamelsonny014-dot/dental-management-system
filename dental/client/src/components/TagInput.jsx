import { useState } from "react";

const TagInput = ({ label, values = [], onChange, placeholder, color = "blue" }) => {
  const [input, setInput] = useState("");

  const colorMap = {
    red:  "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber:"bg-amber-50 text-amber-700 border-amber-200",
  };
  const tagClass = colorMap[color] || colorMap.blue;

  const add = () => {
    const val = input.trim();
    if (!val || values.includes(val)) { setInput(""); return; }
    onChange([...values, val]);
    setInput("");
  };

  const remove = (v) => onChange(values.filter((x) => x !== v));

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${tagClass}`}>
            {v}
            <button type="button" onClick={() => remove(v)} className="hover:opacity-60 transition-opacity">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="btn-ghost text-sm px-3 border border-dental-border"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default TagInput;
