import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, User, Phone, MapPin, IndianRupee, Hash } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getInitials } from "../lib/utils";
import { toast } from "sonner";

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-[#6B4C4F] mb-2 flex items-center gap-1.5">
        <Icon size={12} className="text-[#8B1E24]" />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AddCustomerPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const vendors = useQuery(api.vendors.getVendors) ?? [];
  const createVendor = useMutation(api.vendors.createVendor);
  const updateVendor = useMutation(api.vendors.updateVendor);
  const isEdit = Boolean(id);
  const existing = useMemo(() => id ? vendors.find((v) => v._id === id) : null, [vendors, id]);

  const [form, setForm] = useState({
    name: existing?.name || "",
    phone: existing?.phone || "",
    address: existing?.address || "",
    openingBalance: String(existing?.openingBalance || ""),
    gstin: existing?.gstin || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Enter a valid 10-digit number";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const balance = parseFloat(form.openingBalance) || 0;
    if (isEdit && existing) {
      await updateVendor({
        id: existing._id,
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ""),
        address: form.address.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
      });
      toast.success("Customer updated!");
      navigate(`/customers/${existing._id}`);
    } else {
      await createVendor({
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ""),
        avatar: getInitials(form.name.trim()),
        address: form.address.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
        dueAmount: balance,
        openingBalance: balance,
      });
      toast.success("Customer added!");
      navigate("/customers");
    }
  };

  const inputCls = (field: string) =>
    `w-full bg-[#F9F6F2] border rounded-xl px-4 py-3 text-sm text-[#1A0A0C] placeholder:text-[#6B4C4F]/50 outline-none transition-colors focus:border-[#8B1E24] focus:bg-white ${errors[field] ? "border-red-400" : "border-[#EDE0DB]"}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="pb-10">
      <div className="px-5 pt-12 pb-5 bg-gradient-to-b from-[#FFF8F4] to-white border-b border-[#EDE0DB]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white border border-[#EDE0DB] flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-[#1A0A0C]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1A0A0C]">{isEdit ? "Edit Customer" : "Add Customer"}</h1>
            <p className="text-xs text-[#6B4C4F] mt-0.5">{isEdit ? "Update customer details" : "Create a new customer account"}</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-[#FFF8F4] border-2 border-dashed border-[#EDE0DB] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#8B1E24] transition-colors">
            <User size={24} className="text-[#6B4C4F]" />
            <span className="text-xs text-[#6B4C4F] font-medium">Photo</span>
          </div>
        </div>

        <Field label="Customer Name *" icon={User}>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Rajesh Kumar" className={inputCls("name")} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </Field>

        <Field label="Phone Number *" icon={Phone}>
          <input value={form.phone} onChange={set("phone")} placeholder="10-digit mobile number" type="tel" maxLength={10} className={inputCls("phone")} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </Field>

        <Field label="Address" icon={MapPin}>
          <input value={form.address} onChange={set("address")} placeholder="Street, Area, City" className={inputCls("address")} />
        </Field>

        <Field label="GSTIN" icon={Hash}>
          <input value={form.gstin} onChange={set("gstin")} placeholder="Optional GST number" className={inputCls("gstin")} />
        </Field>

        <Field label="Opening Balance (₹)" icon={IndianRupee}>
          <input value={form.openingBalance} onChange={set("openingBalance")} placeholder="0" type="number" min="0" className={inputCls("openingBalance")} />
          <p className="text-xs text-[#6B4C4F] mt-1">Any existing outstanding amount</p>
        </Field>
      </div>

      <div className="px-5 mt-8 space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full bg-[#8B1E24] text-white rounded-xl py-4 text-sm font-bold shadow-sm shadow-[#8B1E24]/20"
        >
          {isEdit ? "Update Customer" : "Save Customer"}
        </motion.button>
        <button onClick={() => navigate(-1)} className="w-full text-[#6B4C4F] text-sm font-medium py-2">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
