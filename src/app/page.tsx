"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-[128px]" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 shadow-sm mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-medium text-zinc-600">Introducing the Meeting OS of the Future</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 max-w-4xl leading-[1.1]"
        >
          Collaborate at the speed of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">thought.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 text-lg md:text-xl text-zinc-500 max-w-2xl"
        >
          AI Meet goes beyond video conferencing. It’s an intelligent meeting operating system with real-time translations, AI coaching, and zero-trust security.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-[0_4_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105">
              Start for free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 bg-white shadow-sm">
              Watch Demo
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Feature grid preview */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Bot className="w-6 h-6 text-indigo-600" />,
              title: "AI Co-Pilot",
              description: "Live summaries, automated action items, and real-time notes powered by advanced LLMs."
            },
            {
              icon: <Zap className="w-6 h-6 text-amber-500" />,
              title: "Ultra Low Latency",
              description: "4K adaptive video powered by WebRTC and LiveKit for seamless collaboration."
            },
            {
              icon: <Shield className="w-6 h-6 text-emerald-500" />,
              title: "Zero Trust Security",
              description: "End-to-End encryption, face verification, and enterprise-grade access control."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-3">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
