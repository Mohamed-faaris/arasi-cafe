import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../data/store";
import { toast } from "sonner";

export default function AddSupplierPage() {
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = () => {
    if (!name.trim()) { toast.error("Supplier name is required"); return; }
    if (!phone.trim()) { toast.error("Phone number is required"); return; }
    dispatch({ type: "ADD_SUPPLIER", supplier: { name: name.trim(), phone: phone.trim(), address: address.trim() || undefined } });
    toast.success("Supplier added");
    navigate("/suppliers");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="pb-10">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 bg-gradient-to-b from-[#FFF8F4] to-white border-b border-[#EDE0DB]">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>
          <h1 className="text-xl font-bold text-[#1A0A0C]">Add Supplier</h1>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#6B4C4F] mb-1.5">Supplier Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chennai Dairy Farm"
            className="w-full bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl px-4 py-3 text-sm text-[#1A0A0C] outline-none focus:border-[#8B1E24] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6B4C4F] mb-1.5">Phone Number *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl px-4 py-3 text-sm text-[#1A0A0C] outline-none focus:border-[#8B1E24] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6B4C4F] mb-1.5">Address (optional)</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, area, city"
            className="w-full bg-[#F9F6F2] border border-[#EDE0DB] rounded-xl px-4 py-3 text-sm text-[#1A0A0C] outline-none focus:border-[#8B1E24] transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-[#8B1E24] text-white rounded-xl py-3.5 text-sm font-bold shadow-sm mt-2"
        >
          Save Supplier
        </button>
      </div>
    </motion.div>
  );
}
