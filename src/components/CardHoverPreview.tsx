/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, VolumeX } from 'lucide-react';

interface CardHoverPreviewProps {
  url: string;
  isAr: boolean;
  onPlayClick?: (e: React.MouseEvent) => void;
}

export default function CardHoverPreview({ url, isAr, onPlayClick }: CardHoverPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle Hover state transitions
  const handleMouseEnter = () => {
    setIsHovered(true);
    setLoadError(false);
    
    // 500ms delay to prevent accidental loading while scrolling
    hoverTimerRef.current = setTimeout(() => {
      setShouldLoad(true);
    }, 550);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShouldLoad(false);
    setIsPlaying(false);
    setLoadError(false);

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Setup HLS or Direct play once shouldLoad is true
  useEffect(() => {
    if (!shouldLoad || !url) {
      // Cleanup when loading is cancelled or mouse leaves
      cleanupPlayer();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Resolve URL to bypass CORS/mixed-content blocks using our server proxy
    let playUrl = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      playUrl = `/api/proxy/stream?url=${encodeURIComponent(url)}`;
    }

    const isHls = url.toLowerCase().includes('.m3u8') || 
                  url.toLowerCase().includes('/hls/') || 
                  url.toLowerCase().includes('m3u8');

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 10,
          maxMaxBufferLength: 20
        });
        
        hlsRef.current = hls;
        hls.loadSource(playUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            if (err.name !== 'AbortError') {
              console.warn('[HoverPreview] HLS autoplay blocked/failed:', err);
            }
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.warn('[HoverPreview] HLS fatal error:', data.type, data.details);
            setLoadError(true);
            cleanupPlayer();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari/iOS)
        video.src = playUrl;
        video.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('[HoverPreview] native autoplay failed:', err);
          }
        });
      } else {
        setLoadError(true);
      }
    } else {
      // Normal direct video streams (MP4/WebM)
      video.src = playUrl;
      video.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('[HoverPreview] direct video play failed:', err);
        }
        setLoadError(true);
      });
    }

    // Set playing state when playback actually starts
    const onPlaying = () => {
      setIsPlaying(true);
      setLoadError(false);
    };

    const onError = (e: Event) => {
      const vid = videoRef.current;
      const mediaError = vid ? vid.error : null;
      
      // Ignore normal media load abort/interruption codes
      if (mediaError && (mediaError.code === 1 || mediaError.code === 3)) {
        // MEDIA_ERR_ABORTED = 1, MEDIA_ERR_DECODE = 3
        return;
      }
      
      console.warn('[HoverPreview] Video element error event:', mediaError ? mediaError.message : e);
      setLoadError(true);
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      cleanupPlayer();
    };
  }, [shouldLoad, url]);

  const cleanupPlayer = () => {
    setIsPlaying(false);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      cleanupPlayer();
    };
  }, []);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 w-full h-full z-20 cursor-pointer"
    >
      {/* Dimmed indicator when hovered but not yet playing */}
      {isHovered && !isPlaying && !loadError && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 scale-90">
            {/* Elegant glowing spinner */}
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <span className="text-[10px] text-cyan-400 font-bold tracking-tight font-mono">
              {isAr ? 'جاري التحميل...' : 'LOADING...'}
            </span>
          </div>
        </div>
      )}

      {/* Actual video element */}
      {shouldLoad && !loadError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 bg-black ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          playsInline
          loop
          autoPlay
        />
      )}

      {/* Beautiful audio badge overlay while playing to indicate it is muted preview */}
      {isPlaying && (
        <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md text-[10px] text-gray-300 py-1 px-1.5 rounded-lg border border-white/5 flex items-center gap-1.5 shadow-lg animate-fade-in z-30">
          <VolumeX className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-[9px] font-bold tracking-wider">
            {isAr ? 'معاينة صامتة' : 'PREVIEW'}
          </span>
        </div>
      )}

      {/* Centered Floating Play Icon when hovered and playing */}
      {isHovered && isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[1px] transition-all duration-300 z-30">
          <button
            onClick={(e) => {
              if (onPlayClick) {
                onPlayClick(e);
              }
            }}
            className="group/play-btn bg-cyan-500 hover:bg-cyan-400 text-black p-4 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-cyan-300/40 flex items-center justify-center"
          >
            <Play className="w-6 h-6 fill-black translate-x-[1px]" />
          </button>
          
          <div className="absolute bottom-8 left-0 right-0 text-center animate-bounce px-2">
            <span className="text-[10px] font-black tracking-tight text-cyan-400 bg-black/90 border border-cyan-500/20 px-2 py-1 rounded-xl shadow-lg uppercase font-sans">
              {isAr ? 'اضغط للتشغيل الفوري ⚡' : 'CLICK TO PLAY DIRECT ⚡'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
