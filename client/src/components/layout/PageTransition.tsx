import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router";

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <motion.main
      key={location.pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.main>
  );
}
