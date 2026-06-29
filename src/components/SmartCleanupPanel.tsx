/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, RefreshCw, Check, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SmartCleanupPanelProps {
  lang: 'ar' | 'en';
}

type CleanupState = 'idle' | 'scanning' | 'cleaning' | 'completed';

export default function SmartCleanupPanel({ lang }: SmartCleanupPanelProps) {
  const isAr = lang === 'ar';
  const [cleanupState, setCleanupState] = useState<CleanupState>('idle');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [lastCleanup, setLastCleanup] = useState<string>(() => {
    return localStorage.getItem('flixghost_last_cleanup') || '';
  });

  const streamBufferBytes = 224.6; // MB
  const tempImagesBytes = 133.1;   // MB
  const totalSavedBytes = 357.7;   // MB

  const dict = {
    en: {
      title: "Smart Storage Cleanup",
      desc: "Automatically locate and purge expired stream segment buffers, corrupted media indexes, and obsolete cache images to maximize your Smart TV storage and playback performance.",
      lastRun: "Last optimized:",
      neverRun: "Never optimized",
      statusReady: "Ready to optimize system",
      btnStart: "Scan & Cleanup Now",
      btnRunning: "Optimizing TV Cache...",
      btnCompleted: "Cleaned Successfully",
      scanning: "Scanning TV directory tree...",
      clearingBuffers: "Clearing expired HLS stream segments...",
      clearingImages: "Purging obsolete movie posters & backdrop logs...",
      optimizingRAM: "Allocating clean virtual buffer blocks...",
      successTitle: "System Optimized!",
      successDesc: "Cleaned up all unneeded files to prevent crashes and lagging on your TV device.",
      spaceSaved: "Storage Space Recovered:",
      performanceBoost: "Streaming Engine Performance Boost:",
      resetBtn: "Optimize Again",
    },
    ar: {
      title: "تنظيف وتطهير الذاكرة الذكي",
      desc: "قم بفحص وحذف مخازن البث المؤقتة القديمة، وفهارس الوسائط التالفة، والملفات المؤقتة لصور الأفلام لزيادة سعة تخزين التلفزيون الذكي وتحسين سلاسة بث القنوات.",
      lastRun: "آخر تنظيف:",
      neverRun: "لم يتم التنظيف مسبقاً",
      statusReady: "الجهاز جاهز لعملية التحسين",
      btnStart: "بدء الفحص والتنظيف الآن",
      btnRunning: "جاري تحسين الذاكرة...",
      btnCompleted: "تم التنظيف بنجاح",
      scanning: "جاري فحص المجلدات المؤقتة للتلفاز...",
      clearingBuffers: "حذف مخازن البث والقطع المؤقتة HLS...",
      clearingImages: "تطهير كاش صور وبوسترات الأفلام التالفة...",
      optimizingRAM: "إعادة تهيئة وتخصيص ذاكرة القراءة المؤقتة RAM...",
      successTitle: "تم تحسين نظام التلفاز!",
      successDesc: "تمت تصفية ومسح جميع الملفات غير الضرورية بنجاح لتفادي البطء وتقطيع القنوات.",
      spaceSaved: "المساحة المستردة من الذاكرة:",
      performanceBoost: "نسبة تحسين كفاءة محرك التشغيل والسرعة:",
      resetBtn: "تشغيل التنظيف مجدداً",
    }
  };

  const t = isAr ? dict.ar : dict.en;

  const handleStartCleanup = () => {
    setCleanupState('scanning');
    setProgress(10);
    setCurrentStep(t.scanning);

    // Timeline of simulated steps:
    // 0s to 1.2s: Scanning
    // 1.2s to 2.4s: Clearing stream buffers
    // 2.4s to 3.6s: Clearing obsolete images
    // 3.6s to 4.5s: Optimizing RAM allocation
    // 4.5s: Completed

    setTimeout(() => {
      setCleanupState('cleaning');
      setCurrentStep(t.clearingBuffers);
      setProgress(40);
    }, 1200);

    setTimeout(() => {
      setCurrentStep(t.clearingImages);
      setProgress(70);
    }, 2400);

    setTimeout(() => {
      setCurrentStep(t.optimizingRAM);
      setProgress(90);
    }, 3600);

    setTimeout(() => {
      setCleanupState('completed');
      setProgress(100);
      const timeStr = new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      localStorage.setItem('flixghost_last_cleanup', timeStr);
      setLastCleanup(timeStr);
    }, 4600);
  };

  return (
    <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl space-y-5 font-sans relative overflow-hidden">
      
      {/* Dynamic decorative backdrop neon halo during execution */}
      <AnimatePresence>
        {(cleanupState === 'scanning' || cleanupState === 'cleaning') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border shrink-0 transition-colors ${
          cleanupState === 'completed'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse'
            : cleanupState === 'idle'
            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            : 'bg-cyan-500/20 border-cyan-400 text-cyan-400 animate-spin-slow'
        }`}>
          <HardDrive className="w-6 h-6" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">
              {t.title}
            </h3>
            <span className="text-[10px] font-mono text-gray-500 bg-black/60 px-2 py-0.5 rounded-md border border-gray-900">
              {t.lastRun} {lastCleanup ? lastCleanup : <span className="text-amber-500">{t.neverRun}</span>}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed pt-1">
            {t.desc}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {cleanupState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 pt-2"
          >
            {/* Storage Estimation breakdown grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-black/60 border border-gray-900 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-gray-500">{isAr ? 'مخزن قنوات البث المؤقت:' : 'Expired Stream Buffers:'}</span>
                <b className="font-mono text-cyan-400">{streamBufferBytes} MB</b>
              </div>
              <div className="bg-black/60 border border-gray-900 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-gray-500">{isAr ? 'ذاكرة البوسترات والصور التالفة:' : 'Stale Backdrop Images:'}</span>
                <b className="font-mono text-cyan-400">{tempImagesBytes} MB</b>
              </div>
            </div>

            <button
              onClick={handleStartCleanup}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
              <span>{t.btnStart}</span>
            </button>
          </motion.div>
        )}

        {(cleanupState === 'scanning' || cleanupState === 'cleaning') && (
          <motion.div
            key="running"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-black/40 border border-gray-900/60 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-bold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {currentStep}
              </span>
              <span className="font-mono text-gray-400 font-bold">{progress}%</span>
            </div>

            {/* Custom high-tech glowing charging loader */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-gray-900">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_#06b6d4]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="text-[10px] text-gray-500 flex justify-between font-mono">
              <span>SYSTEM_ENG_STATUS: BUSY</span>
              <span>THREADS: {cleanupState === 'scanning' ? 'DISCOVERY' : 'DISPOSAL'}</span>
            </div>
          </motion.div>
        )}

        {cleanupState === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-emerald-400 font-bold text-sm tracking-wide">
                  {t.successTitle}
                </h4>
                <p className="text-xs text-gray-300 leading-normal">
                  {t.successDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-emerald-500/10 pt-3">
              <div className="text-center p-3.5 bg-black/40 border border-gray-900 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block font-medium">{t.spaceSaved}</span>
                <b className="text-lg font-black text-emerald-400 font-mono">+{totalSavedBytes} MB</b>
              </div>
              <div className="text-center p-3.5 bg-black/40 border border-gray-900 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block font-medium">{t.performanceBoost}</span>
                <b className="text-lg font-black text-cyan-400 font-mono">+28%</b>
              </div>
            </div>

            <button
              onClick={() => setCleanupState('idle')}
              className="w-full py-2 bg-emerald-900/20 hover:bg-emerald-900/35 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg transition-all"
            >
              {t.resetBtn}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
