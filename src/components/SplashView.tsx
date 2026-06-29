/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import FlixGhostIcon from './FlixGhostIcon';

interface SplashViewProps {
  lang: 'ar' | 'en';
}

export default function SplashView({ lang }: SplashViewProps) {
  const isAr = lang === 'ar';
  const [statusText, setStatusText] = useState('');

  // Staggered status updates for cinematic TV booting effect
  useEffect(() => {
    const statuses = isAr ? [
      'جاري تشغيل محرك القنوات...',
      'التحقق من كود التفعيل المرفق...',
      'مزامنة قنوات الماك وتحديث البيانات...',
      'جاهز للبث فائق السرعة!'
    ] : [
      'Booting streaming engines...',
      'Verifying device license...',
      'Synchronizing remote playlists...',
      'FlixGhost Ready!'
    ];

    let current = 0;
    setStatusText(statuses[0]);

    const timer = setInterval(() => {
      current++;
      if (current < statuses.length) {
        setStatusText(statuses[current]);
      }
    }, 750);

    return () => clearInterval(timer);
  }, [isAr]);

  return (
    <div className="fixed inset-0 bg-[#02050f] flex flex-col items-center justify-center overflow-hidden z-50 select-none">
      
      {/* High-end cinematic radial halo background */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.18) 0%, rgba(2, 5, 15, 0) 65%)'
        }}
      />

      {/* Decorative Grid Lines to feel high-tech / professional / premium */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.03]" />

      {/* Main Brand Assembly */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-lg px-6">
        
        {/* Neon Ghost Logo with float animation & Framer Motion entry */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 70, 
            damping: 15,
            delay: 0.1 
          }}
          className="relative animate-float"
        >
          {/* Backlight pulsing glow */}
          <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full scale-110" />
          
          <FlixGhostIcon className="w-48 h-48 drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]" />
        </motion.div>

        {/* Brand Name Title */}
        <div className="space-y-1">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 font-display glow-cyan"
          >
            FLIXGHOST
          </motion.h1>

          {/* Slogan with wide spacing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-cyan-200/80 font-bold"
          >
            {isAr ? 'البث بلا حدود' : 'Stream Beyond Limits'}
          </motion.div>
        </div>

        {/* Loading UI / Progress Bar Container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.6 }}
          className="w-64 pt-6 space-y-3"
        >
          {/* Custom Charging Progress Line */}
          <div className="h-[2px] w-full bg-slate-900/60 rounded-full overflow-hidden border border-cyan-950/20">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.8, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-blue-500 shadow-[0_0_8px_#06b6d4]"
            />
          </div>

          {/* Loading status details */}
          <div className="h-4 flex items-center justify-center">
            <span className="text-[10px] text-gray-500 font-mono font-medium tracking-wider uppercase">
              {statusText}
            </span>
          </div>
        </motion.div>

      </div>

      {/* Corner UI details (TV aesthetic) */}
      <div className="absolute top-6 left-6 text-[9px] text-cyan-500/20 font-mono tracking-widest uppercase">
        System: BOOT_V1.0
      </div>
      <div className="absolute bottom-6 right-6 text-[9px] text-cyan-500/20 font-mono tracking-widest">
        SECURE_CONNECTION: OK
      </div>
    </div>
  );
}
