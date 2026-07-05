"use client";

import { motion } from "framer-motion";
import { Video, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 mx-4 mt-4 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
          <Video className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
          AI Meet
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
        <Link href="#features" className="hover:text-zinc-900 transition-colors">
          Features
        </Link>
        <Link href="#security" className="hover:text-zinc-900 transition-colors">
          Security
        </Link>
        <Link href="#pricing" className="hover:text-zinc-900 transition-colors">
          Pricing
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100">
            Sign In
          </Button>
        </Link>
        <Link href="/register">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_4_15px_rgba(79,70,229,0.2)] gap-2">
            <Sparkles className="w-4 h-4" />
            Get Started
          </Button>
        </Link>
      </div>
    </motion.header>
  );
}
