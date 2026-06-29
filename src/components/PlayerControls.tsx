/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, SkipForward, ArrowLeft, Monitor, List, Check,
  ShieldCheck, Settings, RefreshCw
} from 'lucide-react';
import { PlaylistItem } from '../types';

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  item: PlaylistItem;
  onClose: () => void;
  lang: 'ar' | 'en';
  themeColor: string;
  // Side channel quick-switcher
  allChannelsInGroup: PlaylistItem[];
  onChannelSelect?: (channel: PlaylistItem) => void;
}

export default function PlayerControls({
  videoRef,
  item,
  onClose,
  lang,
  themeColor,
  allChannelsInGroup,
  onChannelSelect
}: PlayerControlsProps) {
  const colorName = themeColor === 'elegant' ? 'amber' : themeColor === 'crimson' ? 'rose' : themeColor;
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'auto' | '16:9' | '4:3' | 'cover'>('auto');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showChannelSwitcher, setShowChannelSwitcher] = useState(false);
  const [aspectMenuOpen, setAspectMenuOpen] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Labels dictionary
  const dict = {
    en: {
      playing: "Playing",
      live: "LIVE",
      vod: "VOD",
      aspect: "Aspect Ratio",
      quickSwitch: "Quick Channel Switcher",
      disclaimer: "FLIX GHOST Player: This content is loaded directly from user-provided link. App owns 0% liability.",
      auto: "Auto",
      fit: "Stretch 16:9",
      standard: "Standard 4:3",
      cover: "Zoom / Fill",
      volume: "Volume",
      exit: "Back",
      channels: "Channels"
    },
    ar: {
      playing: "جاري التشغيل",
      live: "مباشر",
      vod: "فيديو",
      aspect: "أبعاد الشاشة",
      quickSwitch: "مبدل القنوات السريع",
      disclaimer: "مشغل FLIX GHOST: يتم تشغيل هذا المحتوى من رابط العميل. التطبيق غير مسؤول نهائياً.",
      auto: "تلقائي",
      fit: "ملء 16:9",
      standard: "تقليدي 4:3",
      cover: "تكبير الشاشة",
      volume: "الصوت",
      exit: "رجوع",
      channels: "القنوات"
    }
  }[lang];

  // Monitor video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);

    // Initial state
    setIsPlaying(!video.paused);
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);
    setVolume(video.volume);
    setIsMuted(video.muted);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [videoRef, item]);

  // Hide controls after inactivity
  const resetControlsTimeout = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showChannelSwitcher && !aspectMenuOpen) {
        setControlsVisible(false);
      }
    }, 4000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showChannelSwitcher, aspectMenuOpen]);

  // Key handlers for TV remote emulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimeout();

      switch(e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (lang === 'ar') seekForward(); else seekBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (lang === 'ar') seekBackward(); else seekForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'c':
        case 'C':
          setShowChannelSwitcher(prev => !prev);
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          cycleAspectRatio();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, isMuted, isPlaying, lang, aspectRatio]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(err => console.log("Play failed: ", err));
    } else {
      video.pause();
    }
  };

  const seekBackward = () => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const seekForward = () => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(duration, video.currentTime + 10);
  };

  const adjustVolume = (amount: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = Math.min(1, Math.max(0, video.volume + amount));
    video.volume = newVolume;
    video.muted = newVolume === 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.log(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen to external fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const changeAspectRatio = (ratio: typeof aspectRatio) => {
    const video = videoRef.current;
    if (!video) return;

    setAspectRatio(ratio);
    setAspectMenuOpen(false);

    if (ratio === '16:9') {
      video.style.objectFit = 'fill';
      video.style.aspectRatio = '16/9';
    } else if (ratio === '4:3') {
      video.style.objectFit = 'fill';
      video.style.aspectRatio = '4/3';
    } else if (ratio === 'cover') {
      video.style.objectFit = 'cover';
      video.style.aspectRatio = 'auto';
    } else {
      video.style.objectFit = 'contain';
      video.style.aspectRatio = 'auto';
    }
  };

  const cycleAspectRatio = () => {
    const ratios: Array<'auto' | '16:9' | '4:3' | 'cover'> = ['auto', '16:9', '4:3', 'cover'];
    const currentIndex = ratios.indexOf(aspectRatio);
    const nextIndex = (currentIndex + 1) % ratios.length;
    changeAspectRatio(ratios[nextIndex]);
  };

  // Helper to format time (HH:MM:SS)
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = parseFloat(e.target.value);
    }
  };

  const isLive = item.type === 'live' || duration === Infinity || isNaN(duration) || duration === 0;

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-50 flex flex-col justify-between select-none font-sans bg-transparent cursor-pointer transition-opacity duration-300 ${
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={resetControlsTimeout}
      onMouseMove={resetControlsTimeout}
    >
      {/* Top Header Controls */}
      <div className="p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-3 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full transition-all duration-200"
            title={dict.exit}
          >
            <ArrowLeft className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
                isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white'
              }`}>
                {isLive ? dict.live : dict.vod}
              </span>
              <span className="text-gray-400 text-xs font-mono">
                {item.group}
              </span>
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white mt-1">
              {item.name}
            </h1>
          </div>
        </div>

        {/* Top Right Buttons */}
        <div className="flex items-center gap-2">
          {allChannelsInGroup.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowChannelSwitcher(prev => !prev); }}
              className={`p-3 rounded-full flex items-center gap-2 text-white font-medium text-sm transition-all duration-200 ${
                showChannelSwitcher ? 'bg-white/30 scale-105' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <List className="w-5 h-5" />
              <span>{dict.channels} ({allChannelsInGroup.length})</span>
            </button>
          )}

          {/* Legal Disclaimer Watermark badge */}
          <div className="hidden lg:flex items-center gap-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-medium max-w-sm text-right">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">{dict.disclaimer}</span>
          </div>
        </div>
      </div>

      {/* Middle Interactive Zone (Click to play/pause) */}
      <div 
        className="flex-1 flex items-center justify-center bg-transparent"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            togglePlay();
          }
        }}
      >
        {!isPlaying && (
          <div className={`p-6 bg-${colorName}-600 text-${colorName === 'amber' ? 'black' : 'white'} rounded-full scale-125 shadow-2xl opacity-90 transition-transform duration-300 hover:scale-135 active:scale-110`}>
            <Play className="w-10 h-10 fill-current ml-1" />
          </div>
        )}
      </div>

      {/* Side Quick Channel Switcher Overlay (Slides from Right/Left based on Lang) */}
      {showChannelSwitcher && allChannelsInGroup.length > 0 && (
        <div 
          className={`absolute top-0 bottom-0 w-80 bg-black/95 border-gray-800 backdrop-blur-md z-50 flex flex-col pointer-events-auto shadow-2xl transition-all duration-300 ${
            lang === 'ar' ? 'left-0 border-r' : 'right-0 border-l'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-medium text-md flex items-center gap-2">
              <List className="w-5 h-5" />
              <span>{dict.quickSwitch}</span>
            </h3>
            <button 
              onClick={() => setShowChannelSwitcher(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {allChannelsInGroup.map((ch, idx) => {
              const isCurrent = ch.url === item.url;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    if (onChannelSelect) onChannelSelect(ch);
                    setShowChannelSwitcher(false);
                  }}
                  className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                      : 'hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                    {ch.logo ? (
                      <img src={ch.logo} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`font-medium text-sm truncate ${isCurrent ? 'text-blue-400' : 'text-white'}`}>
                      {ch.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{ch.group}</p>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Main Controller Bar */}
      <div className="p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col gap-4 pointer-events-auto">
        
        {/* Timeline Slider (only for Video-on-Demand (VOD)) */}
        {!isLive && (
          <div className="flex items-center gap-4 w-full">
            <span className="text-gray-300 text-sm font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleTimelineChange}
              className={`flex-1 h-1.5 rounded-lg bg-white/20 appearance-none cursor-pointer accent-blue-500 focus:outline-none`}
              style={{
                background: `linear-gradient(to right, #2563eb ${((currentTime / (duration || 1)) * 100)}%, rgba(255,255,255,0.2) ${((currentTime / (duration || 1)) * 100)}%)`
              }}
            />
            <span className="text-gray-300 text-sm font-mono">{formatTime(duration)}</span>
          </div>
        )}

        {/* Lower row controls */}
        <div className="flex items-center justify-between w-full">
          {/* Left Block: Standard Action Buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-3 text-white hover:text-blue-400 transition-colors duration-200"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {!isLive && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); seekBackward(); }}
                  className="p-3 text-white hover:text-blue-400 transition-colors duration-200"
                  title="-10s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); seekForward(); }}
                  className="p-3 text-white hover:text-blue-400 transition-colors duration-200"
                  title="+10s"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-1 group/volume ml-2">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="p-3 text-white hover:text-blue-400 transition-colors duration-200"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) {
                    video.volume = parseFloat(e.target.value);
                    video.muted = video.volume === 0;
                  }
                }}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1.5 rounded-lg bg-white/20 appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Right Block: Aspect Ratio, Fullscreen, and Exit */}
          <div className="flex items-center gap-2">
            
            {/* Quick Aspect Ratio Toggle (Cycle) */}
            <button 
              onClick={(e) => { e.stopPropagation(); cycleAspectRatio(); }}
              className="px-3 py-2 text-white hover:text-cyan-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95"
              title={lang === 'ar' ? "تبديل سريع لأبعاد الشاشة" : "Quick cycle aspect ratios (Auto, 16:9, 4:3, Fit)"}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {aspectRatio === 'auto' ? 'Auto' : aspectRatio === '16:9' ? '16:9' : aspectRatio === '4:3' ? '4:3' : 'Fit'}
              </span>
            </button>

            {/* Aspect Ratio Selector */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setAspectMenuOpen(prev => !prev); }}
                className={`p-3 text-white hover:text-blue-400 transition-colors duration-200 flex items-center gap-1 ${
                  aspectMenuOpen ? 'text-blue-400' : ''
                }`}
                title={dict.aspect}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-xs font-semibold uppercase">{aspectRatio}</span>
              </button>

              {aspectMenuOpen && (
                <div className="absolute bottom-14 right-0 bg-black/95 border border-gray-800 rounded-lg py-1 w-40 z-50 shadow-xl overflow-hidden font-sans">
                  <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-900 font-medium">
                    {dict.aspect}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); changeAspectRatio('auto'); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-white/10 ${
                      aspectRatio === 'auto' ? 'text-blue-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{dict.auto}</span>
                    {aspectRatio === 'auto' && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); changeAspectRatio('16:9'); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-white/10 ${
                      aspectRatio === '16:9' ? 'text-blue-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{dict.fit}</span>
                    {aspectRatio === '16:9' && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); changeAspectRatio('4:3'); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-white/10 ${
                      aspectRatio === '4:3' ? 'text-blue-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{dict.standard}</span>
                    {aspectRatio === '4:3' && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); changeAspectRatio('cover'); }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-white/10 ${
                      aspectRatio === 'cover' ? 'text-blue-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{dict.cover}</span>
                    {aspectRatio === 'cover' && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="p-3 text-white hover:text-blue-400 transition-colors duration-200"
            >
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Small Legal Footnote (Always visible in bottom controller bar to meet app store policies) */}
        <div className="text-[10px] text-gray-500 text-center select-none border-t border-gray-800/50 pt-2 font-sans">
          {dict.disclaimer}
        </div>
      </div>
    </div>
  );
}
