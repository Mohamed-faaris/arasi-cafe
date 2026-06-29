import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Home, Share2, Receipt } from "lucide-react";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount") || "0";
  const customer = searchParams.get("customer") || "Customer";
  const remaining = searchParams.get("remaining") || "0";

  return (
    <div className="min-h-screen bg-[#FFF8F4] flex flex-col items-center justify-center px-5 pb-10">
      {/* Success animation */}
      <div className="relative mb-8">
        {/* Outer gold ring */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.1 }}
          className="w-32 h-32 rounded-full border-4 border-[#C99A4B]/30 flex items-center justify-center"
        >
          {/* Inner maroon circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
            className="w-24 h-24 rounded-full bg-[#16A34A] flex items-center justify-center shadow-lg shadow-green-500/20"
          >
            {/* Checkmark */}
            <motion.svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.path
                d="M10 22 L18 30 L34 14"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
              />
            </motion.svg>
          </motion.div>
        </motion.div>

        {/* Sparkle dots */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div
            key={deg}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ delay: 0.6 + i * 0.07, duration: 0.6 }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateY(-68px) translateX(-4px)`,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: i % 2 === 0 ? "#C99A4B" : "#8B1E24",
            }}
          />
        ))}
      </div>

      {/* Text */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-[#1A0A0C]">Payment Recorded!</h1>
        <p className="text-[#6B4C4F] mt-2">Payment received from {customer}</p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="w-full bg-white border border-[#EDE0DB] rounded-2xl shadow-sm overflow-hidden mb-6"
      >
        <div className="px-5 py-4 border-b border-[#EDE0DB]">
          <p className="text-xs text-[#6B4C4F] font-medium">Amount Paid</p>
          <p className="text-3xl font-bold text-[#16A34A] mt-0.5">₹{parseFloat(amount).toFixed(0)}</p>
        </div>
        <div className="px-5 py-3 flex justify-between items-center border-b border-[#EDE0DB]">
          <p className="text-sm text-[#6B4C4F]">Customer</p>
          <p className="text-sm font-semibold text-[#1A0A0C]">{customer}</p>
        </div>
        <div className="px-5 py-3 flex justify-between items-center border-b border-[#EDE0DB]">
          <p className="text-sm text-[#6B4C4F]">Date</p>
          <p className="text-sm font-semibold text-[#1A0A0C]">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="px-5 py-3 flex justify-between items-center">
          <p className="text-sm text-[#6B4C4F]">Remaining Balance</p>
          <p className={`text-sm font-bold ${parseFloat(remaining) > 0 ? "text-[#8B1E24]" : "text-[#16A34A]"}`}>
            ₹{parseFloat(remaining).toFixed(0)}
          </p>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="w-full space-y-3"
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center justify-center gap-2 bg-[#8B1E24] text-white rounded-xl py-4 text-sm font-bold shadow-sm"
        >
          <Home size={16} /> Back to Dashboard
        </button>
        <button
          onClick={() => navigate("/payments")}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDE0DB] text-[#1A0A0C] rounded-xl py-3.5 text-sm font-semibold shadow-sm"
        >
          <Receipt size={16} className="text-[#6B4C4F]" /> View Payment History
        </button>
      </motion.div>
    </div>
  );
}
