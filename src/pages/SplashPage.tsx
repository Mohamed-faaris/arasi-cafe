import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/dashboard", { replace: true }), 2800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FFF8F4] z-50">
      {/* Background decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#8B1E24]/5 -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#C99A4B]/8 translate-y-1/3 -translate-x-1/3" />

      <div className="flex flex-col items-center gap-6 px-8">
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-3xl bg-[#8B1E24] flex items-center justify-center shadow-2xl shadow-[#8B1E24]/30">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <path d="M26 8C26 8 14 16 14 26C14 32.627 19.373 38 26 38C32.627 38 38 32.627 38 26C38 16 26 8 26 8Z" fill="#FFF8F4" fillOpacity="0.9"/>
              <path d="M26 38V44" stroke="#C99A4B" strokeWidth="3" strokeLinecap="round"/>
              <path d="M20 44H32" stroke="#C99A4B" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="26" cy="25" r="5" fill="#C99A4B"/>
            </svg>
          </div>
          {/* Gold ring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute -inset-2 rounded-[28px] border-2 border-[#C99A4B]/30"
          />
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-[#8B1E24]">
            Arasi Cafe
          </h1>
          <p className="mt-2 text-[#6B4C4F] text-base font-medium tracking-widest uppercase text-sm">
            Fresh · Simple · Trusted
          </p>
        </motion.div>

        {/* Gold divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-12 h-0.5 bg-[#C99A4B] rounded-full"
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-[#6B4C4F] text-sm text-center"
        >
          Business Management Made Beautiful
        </motion.p>
      </div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-16 left-8 right-8"
      >
        <div className="h-1 bg-[#EDE0DB] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.3, duration: 1.3, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-[#8B1E24] to-[#C99A4B] rounded-full"
          />
        </div>
        <p className="mt-3 text-center text-[#6B4C4F] text-xs font-medium">
          Loading your cafe...
        </p>
      </motion.div>
    </div>
  );
}
