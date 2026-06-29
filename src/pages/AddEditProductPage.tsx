import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function AddEditProductPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const products = useQuery(api.products.getProducts) ?? [];
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const isEdit = Boolean(id);

  const existing = useMemo(() => id ? products.find((p) => p._id === id) : null, [products, id]);

  const [form, setForm] = useState({
    name: existing?.name || "",
    type: (existing?.type || "B") as "A" | "B",
    defaultPrice: String(existing?.defaultPrice || ""),
    purchasePrice: String(existing?.purchasePrice || ""),
    defaultQty: String(existing?.defaultQty || "1"),
    uom: existing?.uom || "",
    cgst: String(existing?.cgst || "0"),
    sgst: String(existing?.sgst || "0"),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.defaultPrice || parseFloat(form.defaultPrice) <= 0) errs.defaultPrice = "Enter a valid selling price";
    if (!form.purchasePrice || parseFloat(form.purchasePrice) <= 0) errs.purchasePrice = "Enter a valid purchase price";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const product = {
      name: form.name.trim(),
      type: form.type,
      defaultPrice: parseFloat(form.defaultPrice),
      purchasePrice: parseFloat(form.purchasePrice),
      defaultQty: parseFloat(form.defaultQty) || 1,
      uom: form.uom.trim() || undefined,
      cgst: parseFloat(form.cgst) || 0,
      sgst: parseFloat(form.sgst) || 0,
    };

    if (isEdit && existing) {
      await updateProduct({ id: existing._id, ...product });
      toast.success("Product updated!");
    } else {
      await createProduct(product);
      toast.success("Product added!");
    }
    navigate("/products");
  };

  const inputCls = (field: string) =>
    `w-full bg-[#F9F6F2] border rounded-xl px-4 py-3 text-sm text-[#1A0A0C] placeholder:text-[#6B4C4F]/50 outline-none transition-colors focus:border-[#8B1E24] focus:bg-white ${errors[field] ? "border-red-400" : "border-[#EDE0DB]"}`;

  const margin = form.defaultPrice && form.purchasePrice
    ? (((parseFloat(form.defaultPrice) - parseFloat(form.purchasePrice)) / parseFloat(form.defaultPrice)) * 100).toFixed(1)
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pb-10">
      <div className="px-5 pt-12 pb-5 bg-gradient-to-b from-[#FFF8F4] to-white border-b border-[#EDE0DB]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A0A0C]">{isEdit ? "Edit Product" : "Add Product"}</h1>
            <p className="text-xs text-[#6B4C4F] mt-0.5">{isEdit ? "Update product details" : "Add to your catalog"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Product Name *</p>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Full Cream Milk" className={inputCls("name")} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Unit of Measure</p>
          <div className="flex gap-2">
            {["kg", "L", "g", "piece", "dozen"].map((u) => (
              <button
                key={u}
                onClick={() => setForm((f) => ({ ...f, uom: f.uom === u ? "" : u }))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${form.uom === u ? "bg-[#8B1E24] text-white border-[#8B1E24]" : "bg-[#F9F6F2] text-[#6B4C4F] border-[#EDE0DB]"}`}
              >
                {u}
              </button>
            ))}
          </div>
          <input value={form.uom} onChange={set("uom")} placeholder="or type custom unit" className={`${inputCls("uom")} mt-2`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Selling Price *</p>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm text-[#6B4C4F]">₹</span>
              <input value={form.defaultPrice} onChange={set("defaultPrice")} type="number" min="0" placeholder="0" className={`${inputCls("defaultPrice")} pl-8`} />
            </div>
            {errors.defaultPrice && <p className="text-xs text-red-500 mt-1">{errors.defaultPrice}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Purchase Price *</p>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm text-[#6B4C4F]">₹</span>
              <input value={form.purchasePrice} onChange={set("purchasePrice")} type="number" min="0" placeholder="0" className={`${inputCls("purchasePrice")} pl-8`} />
            </div>
            {errors.purchasePrice && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice}</p>}
          </div>
        </div>

        {margin && (
          <div className="bg-[#F0FDF4] border border-green-100 rounded-xl px-4 py-3 flex justify-between items-center">
            <p className="text-sm text-[#16A34A] font-medium">Profit Margin</p>
            <p className="text-sm font-bold text-[#16A34A]">{margin}%</p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">Default Quantity</p>
          <input value={form.defaultQty} onChange={set("defaultQty")} type="number" min="0.5" step="0.5" className={inputCls("defaultQty")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">CGST %</p>
            <input value={form.cgst} onChange={set("cgst")} type="number" min="0" step="0.5" placeholder="0" className={inputCls("cgst")} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2">SGST %</p>
            <input value={form.sgst} onChange={set("sgst")} type="number" min="0" step="0.5" placeholder="0" className={inputCls("sgst")} />
          </div>
        </div>
        {(parseFloat(form.cgst) + parseFloat(form.sgst)) > 0 && (
          <p className="text-xs text-[#6B4C4F] -mt-3">Total GST: {parseFloat(form.cgst) + parseFloat(form.sgst)}%</p>
        )}
      </div>

      <div className="px-5 mt-8 space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full bg-[#8B1E24] text-white rounded-xl py-4 text-sm font-bold shadow-sm shadow-[#8B1E24]/20"
        >
          {isEdit ? "Update Product" : "Add Product"}
        </motion.button>
        <button onClick={() => navigate(-1)} className="w-full text-[#6B4C4F] text-sm font-medium py-2">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
