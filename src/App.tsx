/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Film, Clapperboard, Settings, ShieldAlert, Globe, 
  Search, Lock, Star, ChevronRight, Play, RefreshCw, Key, 
  Sparkles, Check, ChevronDown, ListPlus, Volume2, Info, 
  ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, HelpCircle, HardDrive, Cpu, Maximize, VolumeX, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  Playlist, PlaylistItem, PlaylistItemType, AppSettings, 
  ActivePlayback, CategoryGroup, SeriesEpisode, SeriesSeason 
} from './types';
import { parseM3U } from './utils/m3uParser';
import { DEMO_CHANNELS, DEMO_EPISODES } from './utils/demoData';
import { getApiUrl } from './utils/api';
import PlayerControls from './components/PlayerControls';
import PortalView from './components/PortalView';
import DisclaimerView from './components/DisclaimerView';
import FlixGhostIcon from './components/FlixGhostIcon';
import SplashView from './components/SplashView';
import SmartCleanupPanel from './components/SmartCleanupPanel';
import CardHoverPreview from './components/CardHoverPreview';
import Hls from 'hls.js';

export default function App() {
  // Device MAC & Key persistence
  const [macAddress, setMacAddress] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string>('demo');
  
  // App UI State
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'movies' | 'series' | 'portal' | 'settings' | 'disclaimer'>('live');
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('flixnet_lang');
    if (saved === 'ar' || saved === 'en') return saved;
    const browserLang = (typeof navigator !== 'undefined' && navigator.language) || '';
    const detected = browserLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
    try {
      localStorage.setItem('flixnet_lang', detected);
    } catch (e) {
      console.error(e);
    }
    return detected;
  }); // Default to device language (Arabic if browser is Arabic, else English)
  const [theme, setTheme] = useState<'blue' | 'emerald' | 'crimson' | 'onyx' | 'elegant'>('elegant');
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Channel & Video Playback State
  const [allItems, setAllItems] = useState<PlaylistItem[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [recentlyWatched, setRecentlyWatched] = useState<PlaylistItem[]>(() => {
    const saved = localStorage.getItem('flixnet_recently_watched');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PlaylistItem[];
        // Auto-migrate demo channel URLs to the latest working ones in DEMO_CHANNELS
        return parsed.map(item => {
          if (item.id && item.id.startsWith('demo-')) {
            const latest = DEMO_CHANNELS.find(ch => ch.id === item.id);
            if (latest) {
              return { ...item, url: latest.url, logo: latest.logo || item.logo };
            }
          }
          return item;
        });
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const addToRecentlyWatched = (item: PlaylistItem) => {
    if (item.type !== 'live') return;
    setRecentlyWatched(prev => {
      const filtered = prev.filter(p => p.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('flixnet_recently_watched', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyWatched = () => {
    setRecentlyWatched([]);
    localStorage.removeItem('flixnet_recently_watched');
  };
  
  // Selected detail pages (Movies / Series)
  const [selectedMovie, setSelectedMovie] = useState<PlaylistItem | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<PlaylistItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // Active Playback Video
  const [activePlayback, setActivePlayback] = useState<ActivePlayback | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showFullscreenPlayer, setShowFullscreenPlayer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Parental PIN Lock
  const [parentalPin, setParentalPin] = useState('0000');
  const [parentalEnabled, setParentalEnabled] = useState(false);
  const [lockedCategories, setLockedCategories] = useState<string[]>([]);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [onPinSuccess, setOnPinSuccess] = useState<(() => void) | null>(null);
  const [pinError, setPinError] = useState(false);

  // Mode Check (Device / Smart TV player vs General Website Portal)
  const [isDeviceMode, setIsDeviceMode] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasPortalParam = urlParams.get('mode') === 'portal' || urlParams.get('portal') === 'true';
    const savedMode = localStorage.getItem('flixnet_device_mode');
    
    // Default to true (Web Media Player mode) unless mode=portal is explicitly requested
    if (hasPortalParam) return false;
    if (savedMode === 'false') return false;
    
    return true;
  });

  // Stream connection proxy mode ('always', 'auto', 'direct')
  const [proxyMode, setProxyMode] = useState<'always' | 'auto' | 'direct'>(() => {
    return (localStorage.getItem('flixnet_proxy_mode') as 'always' | 'auto' | 'direct') || 'auto';
  });

  const toggleDeviceMode = (val: boolean) => {
    setIsDeviceMode(val);
    localStorage.setItem('flixnet_device_mode', val ? 'true' : 'false');
    const url = new URL(window.location.href);
    if (val) {
      url.searchParams.delete('mode');
      url.searchParams.delete('device');
    } else {
      url.searchParams.set('mode', 'portal');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Subscription Activation State
  const [deviceStatus, setDeviceStatus] = useState<{
    status: 'trial' | 'active' | 'expired';
    expiryDate: string;
    daysLeft: number;
    mac: string;
    key: string;
  } | null>(null);
  const [activatingCode, setActivatingCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Handle cinematic splash screen display timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // Setup virtual MAC Address and Device Key on mount
  useEffect(() => {
    let mac = localStorage.getItem('flixnet_mac');
    let key = localStorage.getItem('flixnet_key');
    let savedLang = localStorage.getItem('flixnet_lang') as 'ar' | 'en';
    let savedTheme = (localStorage.getItem('flixnet_theme') as typeof theme) || 'elegant';
    let savedFavs = localStorage.getItem('flixnet_favs');
    let savedPin = localStorage.getItem('flixnet_pin');
    let savedPinEnabled = localStorage.getItem('flixnet_pin_enabled') === 'true';
    let savedLocked = localStorage.getItem('flixnet_locked_cats');

    if (!mac) {
      // Generate a realistic MAC Address
      const hexChars = '0123456789ABCDEF';
      let generatedMac = 'FN'; // FlixNet Prefix
      for (let i = 0; i < 5; i++) {
        generatedMac += ':' + hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
      }
      localStorage.setItem('flixnet_mac', generatedMac);
      mac = generatedMac;
    }

    if (!key) {
      // Generate 6-digit Device PIN Key
      const generatedKey = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('flixnet_key', generatedKey);
      key = generatedKey;
    }

    if (savedLang) setLang(savedLang);
    if (savedTheme) setTheme(savedTheme);
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedPin) setParentalPin(savedPin);
    setParentalEnabled(savedPinEnabled);
    if (savedLocked) setLockedCategories(JSON.parse(savedLocked));

    setMacAddress(mac);
    setDeviceKey(key);

    // Initial load of server-linked playlists & device activation status
    fetchPlaylists(mac);
    fetchDeviceStatus(mac, key);

    // Live Clock Interval
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString(savedLang === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update clock language when lang changes
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateClock();
  }, [lang]);

  // Fetch playlist directories linked to this MAC from Express API
  const fetchPlaylists = async (mac: string) => {
    setLoadingPlaylists(true);
    setSyncStatus('syncing');
    try {
      const res = await fetch(getApiUrl(`/api/playlist/get?mac=${encodeURIComponent(mac)}`));
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // Fetch device activation status from server
  const fetchDeviceStatus = async (mac: string, key: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/device/status?mac=${encodeURIComponent(mac)}&key=${encodeURIComponent(key)}`));
      if (res.ok) {
        const data = await res.json();
        setDeviceStatus({
          status: data.status,
          expiryDate: data.expiryDate,
          daysLeft: data.daysLeft,
          mac: data.mac,
          key: data.key
        });
      }
    } catch (err) {
      console.error("Failed to load device activation status:", err);
    }
  };

  // Activate device with code
  const handleActivateDevice = async (code: string) => {
    if (!code) {
      setActivationError(lang === 'ar' ? 'يرجى إدخال رمز تفعيل صالح' : 'Please enter a valid activation code');
      return;
    }
    setIsActivating(true);
    setActivationError('');
    setActivationSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/device/activate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: macAddress, key: deviceKey, code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivationSuccess(lang === 'ar' ? 'تم تفعيل جهازك بنجاح!' : 'Your device was activated successfully!');
        setActivatingCode('');
        // Refresh device status
        fetchDeviceStatus(macAddress, deviceKey);
      } else {
        setActivationError(data.error || (lang === 'ar' ? 'كود تفعيل غير صحيح أو مستخدم' : 'Invalid or used activation code.'));
      }
    } catch (err) {
      console.error(err);
      setActivationError(lang === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Network error. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  // Simulated direct online billing renewal (1 Year added)
  const handleSimulatePayment = async () => {
    setIsActivating(true);
    setActivationError('');
    setActivationSuccess('');
    try {
      const res = await fetch(getApiUrl('/api/device/activate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: macAddress, key: deviceKey, action: 'simulate_payment' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivationSuccess(lang === 'ar' ? 'تم التجديد التلقائي لعام كامل بنجاح!' : 'Simulated payment complete. Device renewed for 1 Year!');
        fetchDeviceStatus(macAddress, deviceKey);
      } else {
        setActivationError(data.error || 'Renewal failed.');
      }
    } catch (err) {
      setActivationError('Connection error.');
    } finally {
      setIsActivating(false);
    }
  };

  // Sync playlists manually
  const handleSyncPlaylists = () => {
    if (macAddress) {
      fetchPlaylists(macAddress);
      fetchDeviceStatus(macAddress, deviceKey);
    }
  };

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivePlaylistId(e.target.value);
  };

  const loadDemoPlaylist = () => {
    setActivePlaylistId('demo');
  };

  const handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Auto-switch to newly added or active playlist when custom list is detected
  useEffect(() => {
    if (playlists.length > 0 && activePlaylistId === 'demo') {
      setActivePlaylistId(playlists[playlists.length - 1].id);
    } else if (playlists.length === 0 && activePlaylistId !== 'demo') {
      setActivePlaylistId('demo');
      setAllItems([]);
    }
  }, [playlists, activePlaylistId]);

  // Load the selected playlist channels (either Demo or parsed M3U)
  useEffect(() => {
    const loadSelectedPlaylist = async () => {
      if (activePlaylistId === 'demo') {
        setAllItems(DEMO_CHANNELS);
        return;
      }

      // Find selected playlist details
      const activePl = playlists.find(p => p.id === activePlaylistId);
      if (!activePl) return;

      setLoadingPlaylists(true);
      try {
        if (activePl.type === 'm3u') {
          // Fetch M3U through server CORS proxy
          const proxyUrl = `/api/proxy/m3u?url=${encodeURIComponent((activePl as any).url)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const m3uText = await response.text();
            const parsed = parseM3U(m3uText);
            setAllItems(parsed);
          } else {
            alert(lang === 'ar' ? 'فشل تحميل القنوات. تأكد من رابط M3U المرفق.' : 'Failed to fetch M3U file. Ensure the URL is accessible.');
          }
        } else {
          // Xtream Codes integration proxy
          const xtreamPl = activePl as any;
          // 1. Fetch live channels
          const proxyUrlLive = `/api/proxy/xtream?host=${encodeURIComponent(xtreamPl.host)}&username=${encodeURIComponent(xtreamPl.username)}&password=${encodeURIComponent(xtreamPl.password)}&action=get_live_streams`;
          const response = await fetch(proxyUrlLive);
          if (response.ok) {
            const liveData = await response.json();
            if (Array.isArray(liveData)) {
              const xtreamItems: PlaylistItem[] = liveData.map((item: any) => ({
                id: `xt-${item.stream_id}`,
                name: item.name || item.num,
                logo: item.stream_icon || '',
                group: item.category_name || 'Xtream Channels',
                url: `${xtreamPl.host}/live/${xtreamPl.username}/${xtreamPl.password}/${item.stream_id}.m3u8`,
                type: 'live',
                streamId: item.stream_id
              }));
              setAllItems(xtreamItems);
            }
          }
        }
      } catch (err) {
        console.error("Error loading playlist: ", err);
      } finally {
        setLoadingPlaylists(false);
      }
    };

    loadSelectedPlaylist();
  }, [activePlaylistId, playlists, lang]);

  // Recalculate Categories based on the channels list and current view type (VOD vs Live)
  useEffect(() => {
    let typeFilter: PlaylistItemType = 'live';
    if (activeTab === 'movies') typeFilter = 'movie';
    if (activeTab === 'series') typeFilter = 'series';

    const filteredByType = allItems.filter(item => item.type === typeFilter);
    
    // Group categories
    const groupsMap: Record<string, number> = {};
    filteredByType.forEach(item => {
      groupsMap[item.group] = (groupsMap[item.group] || 0) + 1;
    });

    const categoryList: CategoryGroup[] = Object.keys(groupsMap).map(name => ({
      name,
      count: groupsMap[name],
      type: typeFilter
    })).sort((a, b) => a.name.localeCompare(b.name));

    setCategories(categoryList);

    // Default select first category if exists, or select "All"
    if (categoryList.length > 0) {
      setSelectedCategory(categoryList[0].name);
    } else {
      setSelectedCategory('');
    }
  }, [allItems, activeTab]);

  // Programmatic HLS player and Stream Proxy integration
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activePlayback?.streamUrl) return;

    let hls: Hls | null = null;
    const originalUrl = activePlayback.streamUrl;
    
    // Resolve external URLs to our stream proxy to bypass CORS/Mixed-Content blocks
    let playUrl = originalUrl;
    console.log(`[Playback] Original URL: ${originalUrl}, Proxy Mode: ${proxyMode}`);
    if (proxyMode === 'always') {
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        playUrl = `/api/proxy/stream?url=${encodeURIComponent(originalUrl)}`;
      }
    } else if (proxyMode === 'auto') {
      // Only proxy HTTP links because HTTPS links are safe from Mixed-Content blocks 
      // and streaming them directly avoids server datacenter IP bans / CDN blocking (403 errors).
      if (originalUrl.startsWith('http://')) {
        playUrl = `/api/proxy/stream?url=${encodeURIComponent(originalUrl)}`;
      }
    }
    console.log(`[Playback] Resolved Play URL: ${playUrl}`);

    const isHls = originalUrl.toLowerCase().includes('.m3u8') || 
                  originalUrl.toLowerCase().includes('/hls/') || 
                  originalUrl.toLowerCase().includes('m3u8');
    console.log(`[Playback] Is HLS: ${isHls}`);

    if (isHls) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(playUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            console.log("Auto-play blocked or failed", err);
          });
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network error in playback, trying to recover...");
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error in playback, trying to recover...");
                hls?.recoverMediaError();
                break;
              default:
                console.log("Unrecoverable playback error, destroying hls player");
                hls?.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = playUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => {
            console.log("Native HLS auto-play failed", err);
          });
        });
      } else {
        video.src = playUrl;
        video.play().catch(err => {
          console.log("Standard fallback video auto-play failed", err);
        });
      }
    } else {
      // Direct stream formats (mp4, mkv, ts, etc.)
      video.src = playUrl;
      video.load();
      video.play().catch(err => {
        console.log("Direct source auto-play failed", err);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeAttribute('src');
    };
  }, [activePlayback?.streamUrl, activePlayback, showFullscreenPlayer, proxyMode]);

  // Handle category change with parental PIN protection
  const handleCategoryClick = (categoryName: string) => {
    if (parentalEnabled && lockedCategories.includes(categoryName)) {
      promptPin(() => {
        setSelectedCategory(categoryName);
      });
    } else {
      setSelectedCategory(categoryName);
    }
  };

  // Helper for Parental Lock Protection
  const promptPin = (onSuccess: () => void) => {
    setPinInput('');
    setPinError(false);
    setOnPinSuccess(() => onSuccess);
    setPinPromptOpen(true);
  };

  const handleVerifyPin = () => {
    if (pinInput === parentalPin) {
      setPinPromptOpen(false);
      setPinError(false);
      if (onPinSuccess) onPinSuccess();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Favorites handling
  const toggleFavorite = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated = [...favorites];
    if (favorites.includes(itemId)) {
      updated = updated.filter(id => id !== itemId);
    } else {
      updated.push(itemId);
    }
    setFavorites(updated);
    localStorage.setItem('flixnet_favs', JSON.stringify(updated));
  };

  // Theme Config Classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'elegant':
        return {
          bgGrad: 'from-[#0c0c0e] via-[#0a0a0c] to-[#08080a]',
          borderActive: 'border-amber-500 shadow-amber-500/20 text-amber-500',
          bgActive: 'bg-amber-500 !text-black font-bold shadow-lg shadow-amber-500/20',
          textHover: 'hover:text-amber-400',
          glowClass: 'glow-amber',
          colorName: 'amber'
        };
      case 'emerald':
        return {
          bgGrad: 'from-emerald-950 via-slate-950 to-black',
          borderActive: 'border-emerald-500 shadow-emerald-900/40 text-emerald-400',
          bgActive: 'bg-emerald-600',
          textHover: 'hover:text-emerald-400',
          glowClass: 'glow-emerald',
          colorName: 'emerald'
        };
      case 'crimson':
        return {
          bgGrad: 'from-rose-950 via-slate-950 to-black',
          borderActive: 'border-rose-600 shadow-rose-900/40 text-rose-500',
          bgActive: 'bg-rose-600',
          textHover: 'hover:text-rose-500',
          glowClass: 'glow-crimson',
          colorName: 'crimson'
        };
      case 'onyx':
        return {
          bgGrad: 'from-neutral-950 via-neutral-900 to-black',
          borderActive: 'border-white shadow-white/10 text-white',
          bgActive: 'bg-neutral-800',
          textHover: 'hover:text-white',
          glowClass: '',
          colorName: 'onyx'
        };
      case 'blue':
      default:
        return {
          bgGrad: 'from-slate-950 via-blue-950/20 to-slate-950',
          borderActive: 'border-blue-500 shadow-blue-900/40 text-blue-400',
          bgActive: 'bg-blue-600',
          textHover: 'hover:text-blue-400',
          glowClass: 'glow-blue',
          colorName: 'blue'
        };
    }
  };

  const activeTheme = getThemeClasses();

  const getThemeSpecificClasses = (type: 'button' | 'card' | 'activeItem' | 'badge' | 'secondaryButton') => {
    switch (theme) {
      case 'elegant': // amber
        if (type === 'button') {
          return 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10';
        } else if (type === 'card') {
          return 'p-2 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/20';
        } else if (type === 'activeItem') {
          return 'border-amber-500 bg-amber-500/10 text-amber-400';
        } else if (type === 'badge') {
          return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
        } else if (type === 'secondaryButton') {
          return 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20';
        }
        break;
      case 'emerald': // emerald
        if (type === 'button') {
          return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10';
        } else if (type === 'card') {
          return 'p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/20';
        } else if (type === 'activeItem') {
          return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
        } else if (type === 'badge') {
          return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
        } else if (type === 'secondaryButton') {
          return 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20';
        }
        break;
      case 'crimson': // rose / red
        if (type === 'button') {
          return 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10';
        } else if (type === 'card') {
          return 'p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/20';
        } else if (type === 'activeItem') {
          return 'border-rose-500 bg-rose-500/10 text-rose-400';
        } else if (type === 'badge') {
          return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
        } else if (type === 'secondaryButton') {
          return 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20';
        }
        break;
      case 'onyx': // onyx / gray
        if (type === 'button') {
          return 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg shadow-gray-800/10';
        } else if (type === 'card') {
          return 'p-2 bg-neutral-800 text-white rounded-xl border border-neutral-700';
        } else if (type === 'activeItem') {
          return 'border-gray-500 bg-gray-500/10 text-gray-300';
        } else if (type === 'badge') {
          return 'bg-gray-800 border-gray-700 text-gray-300';
        } else if (type === 'secondaryButton') {
          return 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-800';
        }
        break;
      case 'blue':
      default:
        if (type === 'button') {
          return 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/10';
        } else if (type === 'card') {
          return 'p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20';
        } else if (type === 'activeItem') {
          return 'border-blue-500 bg-blue-500/10 text-blue-400';
        } else if (type === 'badge') {
          return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
        } else if (type === 'secondaryButton') {
          return 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20';
        }
        break;
    }
    return '';
  };

  // Filter items (Live, Movies, Series) based on Category, Search query and Favorites
  const getFilteredItems = (): PlaylistItem[] => {
    let typeFilter: PlaylistItemType = 'live';
    if (activeTab === 'movies') typeFilter = 'movie';
    if (activeTab === 'series') typeFilter = 'series';

    let filtered = allItems.filter(item => item.type === typeFilter);

    // Filter by Category
    if (selectedCategory === '⭐ Favorites' || selectedCategory === '⭐ المفضلة') {
      filtered = filtered.filter(item => favorites.includes(item.id));
    } else if (selectedCategory) {
      filtered = filtered.filter(item => item.group === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.group && item.group.toLowerCase().includes(q))
      );
    }

    return filtered;
  };

  // Toggle Language
  const changeLanguage = (newLang: 'ar' | 'en') => {
    setLang(newLang);
    localStorage.setItem('flixnet_lang', newLang);
  };

  const isAr = lang === 'ar';

  // Arabic/English Dictionary
  const trans = {
    en: {
      appName: "Ghost Player",
      liveTv: "Live TV Channels",
      movies: "Movies (VOD)",
      series: "TV Series",
      uploadPortal: "Sync Playlist Portal",
      settings: "Device Settings",
      smartTvPlan: "Smart TV Blueprint",
      disclaimer: "Legal Disclaimer",
      noPlaylists: "No IPTV Playlists Sync\'d",
      macAddress: "MAC Address:",
      deviceKey: "Device Key:",
      portalInstruction: "Enter this MAC address on our Web Sync Portal to upload your playlist files.",
      portalBtn: "Launch Upload Portal",
      demoBtn: "Activate Free IPTV Demo List",
      favorites: "Favorites",
      all: "All Groups",
      searchPlaceholder: "Search channels, movies, and series...",
      activePl: "Active Playlist:",
      reload: "Sync Playlists",
      play: "PLAY NOW",
      exitPlayer: "Exit Player",
      parentalPin: "Parental Control PIN",
      enableParental: "Enable Parental Filter",
      lockedGroups: "Locked Categories",
      theme: "App Interface Theme",
      blue: "Cinematic Navy",
      emerald: "Emerald Glow",
      crimson: "Crimson Velvet",
      onyx: "Onyx Dark",
      clearCache: "Reset App & Clear Cache",
      pinPrompt: "Parental Lock: Enter 4-Digit PIN",
      pinError: "Incorrect PIN. Try again.",
      submit: "Unlock",
      cancel: "Cancel",
      activeStream: "Now Streaming",
      resolution: "Direct HLS Stream",
      aspectRatio: "Aspect Ratio",
      metaRating: "Rating:",
      metaReleased: "Released:",
      metaDuration: "Duration:",
      metaDirector: "Director:",
      metaCast: "Cast:",
      metaSynopsis: "Synopsis",
      episodes: "Episodes",
      seasons: "Seasons",
      seasonLabel: "Season",
      unlocked: "Unlocked",
      locked: "Locked",
      epCount: "Episodes Available",
      deviceStatus: "Active Device Sync Link"
    },
    ar: {
      appName: "مشغل Ghost Player",
      liveTv: "البث التلفزيوني المباشر",
      movies: "الأفلام والسينما (VOD)",
      series: "المسلسلات والدراما",
      uploadPortal: "بوابة رفع ملفات القنوات",
      settings: "إعدادات الجهاز",
      smartTvPlan: "مخطط التلفزيون الذكي",
      disclaimer: "إخلاء المسؤولية القانونية",
      noPlaylists: "لا توجد قوائم قنوات مضافة حالياً",
      macAddress: "عنوان الـ MAC للجهاز:",
      deviceKey: "رمز التحكم (Key):",
      portalInstruction: "أدخل عنوان الـ MAC والرمز في بوابة الرفع لإضافة اشتراكاتك و ملفات القنوات الخاصة بك.",
      portalBtn: "افتح بوابة رفع القنوات",
      demoBtn: "تفعيل قنوات الديمو المجانية للتجربة",
      favorites: "المفضلة",
      all: "كل المجموعات",
      searchPlaceholder: "ابحث عن قنوات، أفلام، أو مسلسلات...",
      activePl: "قائمة التشغيل النشطة:",
      reload: "تحديث الاشتراكات",
      play: "تشغيل الآن ⚡",
      exitPlayer: "خروج من المشغل",
      parentalPin: "الرقم السري للمراقبة الأبوية",
      enableParental: "تفعيل الرقابة الأبوية والقفل",
      lockedGroups: "المجموعات المقفلة برقم سري",
      theme: "طابع واجهة التطبيق (Theme)",
      blue: "الأزرق السينمائي",
      emerald: "الأخضر الزمردي",
      crimson: "الأحمر المخملي",
      onyx: "الأسود الفخم",
      clearCache: "إعادة ضبط المصنع ومسح الكاش",
      pinPrompt: "قفل الرقابة الأبوية: أدخل رمز الـ PIN المكون من 4 أرقام",
      pinError: "الرمز غير صحيح، يرجى المحاولة مجدداً.",
      submit: "فتح القفل",
      cancel: "إلغاء",
      activeStream: "البث الحالي",
      resolution: "بث مباشر HLS",
      aspectRatio: "أبعاد الشاشة",
      metaRating: "التقييم:",
      metaReleased: "سنة الإنتاج:",
      metaDuration: "المدة:",
      metaDirector: "المخرج:",
      metaCast: "الممثلين:",
      metaSynopsis: "قصة العمل والقصة",
      episodes: "الحلقات",
      seasons: "المواسم",
      seasonLabel: "الموسم",
      unlocked: "نشط وغير مقفل",
      locked: "مغلق ومحمي",
      epCount: "حلقات متوفرة",
      deviceStatus: "حالة مزامنة الجهاز للتلفاز"
    }
  }[lang];

  if (showSplash) {
    return <SplashView lang={lang} />;
  }

  if (!isDeviceMode) {
    return (
      <div 
        className="min-h-screen bg-[#02050f] text-gray-300 flex flex-col font-sans relative select-none overflow-x-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Web Portal Header */}
        <header className="px-6 py-4 bg-black/60 border-b border-gray-900/60 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Flix Ghost" 
                className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.45)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-display">
                {isAr ? 'جوشت بلاير' : 'Ghost Player'}
              </h1>
              <span className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase font-bold">
                {isAr ? 'البوابة الرسمية للبث بلا حدود' : 'STREAM BEYOND LIMITS'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Switch to player mode */}
            <button
              onClick={() => toggleDeviceMode(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>📺</span>
              <span>{isAr ? 'مشغل الوسائط (تجربة)' : 'Open Media Player (Test)'}</span>
            </button>
          </div>
        </header>

        {/* Web Portal Main Content */}
        <main className="flex-1 px-4 py-8 md:py-12 max-w-6xl mx-auto w-full space-y-8">
          
          {/* Stunning Web Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto py-4">
            <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 text-xs font-black rounded-full uppercase tracking-wider border border-cyan-500/15 animate-pulse">
              👻 {isAr ? 'عرض خاص: شهر كامل مجاناً لكل جهاز!' : 'Special Offer: 30 Days Free Trial Per Device!'}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {isAr ? 'إدارة قنوات واشتراكات جهازك بكل سهولة' : 'Configure Your IPTV Playlists From Anywhere'}
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              {isAr 
                ? 'تطبيق جوشت بلاير هو المشغل الأسرع والأكثر استقراراً لشاشات سامسونج Tizen وإل جي webOS وأجهزة أندرويد. أدخل عنوان الماك الخاص بجهازك بالأسفل لرفع قوائم M3U أو ربط خوادم Xtream Codes فوراً.'
                : 'Ghost Player is the premium software media player for Samsung Tizen, LG WebOS, Android TV and Apple TV. Enter your TV\'s MAC Address below to upload M3U playlists or configure Xtream Code servers instantly.'}
            </p>
          </div>

          {/* Marketing features / info grids */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 bg-gray-950/60 border border-gray-900 rounded-2xl space-y-1.5">
              <span className="text-lg">👻</span>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">{isAr ? 'تجربة مجانية كاملة' : '30-Day Free Trial'}</h4>
              <p className="text-gray-500 text-[11px] leading-normal">{isAr ? 'بمجرد كتابة عنوان الماك، ستحصل تلقائياً على 30 يوماً مجاناً لتجربة المشغل بكامل قنواته دون التزام.' : 'Every registered TV or media box instantly receives 30 days of premium media playback free to fully test Ghost Player.'}</p>
            </div>
            <div className="p-4 bg-gray-950/60 border border-gray-900 rounded-2xl space-y-1.5">
              <span className="text-lg">⚡</span>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">{isAr ? 'ربط فوري وآمن' : 'Instant Cloud Sync'}</h4>
              <p className="text-gray-500 text-[11px] leading-normal">{isAr ? 'لا حاجة لكتابة الروابط الطويلة على شاشة التلفاز بالريموت. اكتبها هنا وسيتم بثها ومزامنتها على التلفاز فوراً.' : 'Tired of typing long URLs on your TV remote? Type them here and they instantly synchronize with your TV screen.'}</p>
            </div>
            <div className="p-4 bg-gray-950/60 border border-gray-900 rounded-2xl space-y-1.5">
              <span className="text-lg">🛡️</span>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">{isAr ? 'مشغل بروتوكول آمن' : '100% Secure & Pure'}</h4>
              <p className="text-gray-500 text-[11px] leading-normal">{isAr ? 'تطبيقنا مشغل وسائط برمجي فقط. قنواتك وبياناتك مشفرة ومحمية بالكامل ولا نبيع أو نوفر أي محتوى بث.' : 'We are a pure media player software. Your files and Xtream passwords are secure. We do not sell or host any streams.'}</p>
            </div>
          </div>

          {/* Centralized Upload Portal Area */}
          <div className="bg-slate-950/40 rounded-3xl p-2 border border-gray-900/60 shadow-2xl">
            <PortalView
              deviceMac={macAddress}
              deviceKey={deviceKey}
              lang={lang}
              themeColor={theme}
              onPlaylistsChanged={() => fetchPlaylists(macAddress)}
            />
          </div>

        </main>

        {/* Web Portal Footer */}
        <footer className="py-8 bg-black/40 border-t border-gray-900/60 text-center space-y-3 shrink-0">
          <p className="text-xs text-gray-500 max-w-2xl mx-auto px-4 leading-normal">
            {isAr 
              ? 'تنويه قانوني: تطبيق جوشت بلاير (Ghost Player) هو مشغل وسائط برمجي مخصص لتشغيل ملفات وقوائم المستخدم الخاصة. لا يوفر التطبيق أي قنوات بث أو اشتراكات تلفزيونية بشكل مسبق، ويتحمل العميل المسؤولية الكاملة عن مصادر قنواته.' 
              : 'Legal Disclaimer: Ghost Player is a professional software media player. Ghost Player does not supply, broadcast, sell, or host any media playlists or streaming subscriptions. Users must provide their own valid stream URLs.'}
          </p>
          <p className="text-[10px] text-gray-600 font-mono">
            &copy; {new Date().getFullYear()} Ghost Player. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex flex-col bg-slate-950 bg-gradient-to-br ${activeTheme.bgGrad} text-white font-sans overflow-hidden select-none`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top TV Bar: Logo, Active Playlist, Time & Device Info */}
      <header className="px-6 py-4 bg-black/60 border-b border-gray-900/60 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Flix Ghost" 
                className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.45)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tighter ${activeTheme.glowClass}`}>
                {trans.appName}
              </h1>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Smart TV OS</span>
            </div>
          </div>

          {/* Active Playlist Switcher dropdown */}
          {playlists.length > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 bg-gray-900/60 border border-gray-800 rounded-xl px-2 py-1.5 md:px-3 md:py-1.5 ml-1 sm:ml-2 md:ml-4 max-w-[130px] sm:max-w-[200px] md:max-w-none truncate shrink">
              <span className="text-[10px] md:text-xs text-gray-500 hidden sm:inline">{trans.activePl}</span>
              <select 
                value={activePlaylistId} 
                onChange={handlePlaylistChange}
                className="bg-transparent text-[10px] md:text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 max-w-full truncate"
              >
                {playlists.map(pl => (
                  <option key={pl.id} value={pl.id} className="bg-slate-950 text-white">📡 {pl.name}</option>
                ))}
              </select>
              
              <button 
                onClick={handleSyncPlaylists}
                disabled={loadingPlaylists}
                className="p-1 text-gray-400 hover:text-white transition-colors shrink-0"
                title={trans.reload}
              >
                <RefreshCw className={`w-3 h-3 md:w-3.5 md:h-3.5 ${loadingPlaylists ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Right Info blocks */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden lg:flex flex-col text-right text-gray-500">
            <span>MAC: <b className="text-gray-300">{macAddress}</b></span>
            <span>KEY: <b className="text-gray-300">{deviceKey}</b></span>
          </div>
          
          {/* Real Live Clock */}
          <div className="bg-gray-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-xl font-bold text-cyan-400 text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)] select-none">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono tracking-tight">{currentTimeStr}</span>
          </div>
        </div>
      </header>

      {/* Main Grid: Sidebar Menu & Module Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Navigation (or Right Side if RTL) */}
        <nav className="hidden md:flex md:w-64 bg-black/45 border-r border-gray-900/40 p-4 flex flex-col justify-between shrink-0 z-10">
          <div className="space-y-2">
            <button
              onClick={() => { setActiveTab('live'); setSelectedMovie(null); setSelectedSeries(null); }}
              className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'live' 
                  ? `${activeTheme.bgActive} text-white shadow-lg` 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Tv className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-sm">{trans.liveTv}</span>
            </button>

            <button
              onClick={() => { setActiveTab('movies'); setSelectedMovie(null); setSelectedSeries(null); }}
              className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'movies' 
                  ? `${activeTheme.bgActive} text-white shadow-lg` 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Film className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-sm">{trans.movies}</span>
            </button>

            <button
              onClick={() => { setActiveTab('series'); setSelectedMovie(null); setSelectedSeries(null); }}
              className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'series' 
                  ? `${activeTheme.bgActive} text-white shadow-lg` 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Clapperboard className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-sm">{trans.series}</span>
            </button>

            <div className="h-px bg-gray-900/60 my-4" />

            <button
              onClick={() => { setActiveTab('portal'); setSelectedMovie(null); setSelectedSeries(null); }}
              className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'portal' 
                  ? `${activeTheme.bgActive} text-white shadow-lg` 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Globe className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-sm">{trans.uploadPortal}</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSelectedMovie(null); setSelectedSeries(null); }}
              className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                activeTab === 'settings' 
                  ? `${activeTheme.bgActive} text-white shadow-lg` 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-sm">{trans.settings}</span>
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => { setActiveTab('disclaimer'); setSelectedMovie(null); setSelectedSeries(null); }}
              className={`w-full p-3 md:px-4 md:py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 border border-transparent ${
                activeTab === 'disclaimer' 
                  ? 'bg-yellow-600/10 border-yellow-500/20 text-yellow-500' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline font-bold text-xs">{trans.disclaimer}</span>
            </button>

            {/* Quick mini-credits */}
            <div className="hidden md:block text-center text-[10px] text-gray-600 font-mono">
              v1.0.0 (LG/SAMSUNG TV READY)
            </div>
          </div>
        </nav>

        {/* Content Panel Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 bg-black/20 relative z-0">


          {/* SUBSCRIPTION EXPIRED / CHANNELS LOCKED OVERLAY */}
          {deviceStatus?.status === 'expired' && ['live', 'movies', 'series'].includes(activeTab) && (
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-fade-in font-sans">
              <div className="inline-flex p-5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
                <Lock className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight glow-amber">
                  {isAr ? 'انتهت فترة التجربة / الاشتراك' : 'Subscription Period Expired'}
                </h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                  {isAr 
                    ? 'الرجاء تفعيل جهازك للاستمرار في مشاهدة القنوات. يمكنك تفعيل الجهاز فوراً من هنا بإدخال رمز التفعيل أو تجديد الاشتراك من موقعنا.'
                    : 'Your active subscription or trial has expired. To restore unlimited streaming and restore channel list access, please enter an activation code.'}
                </p>
              </div>

              {/* Box displaying credentials for TV users */}
              <div className="bg-gray-950/80 border border-gray-900 rounded-2xl p-5 grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="text-center space-y-1">
                  <span className="text-xs text-gray-500 block uppercase tracking-wider">{trans.macAddress}</span>
                  <span className="text-sm md:text-base font-black text-white font-mono select-all">{macAddress}</span>
                </div>
                <div className="text-center space-y-1 border-l border-gray-900">
                  <span className="text-xs text-gray-500 block uppercase tracking-wider">{trans.deviceKey}</span>
                  <span className="text-sm md:text-base font-black text-white font-mono select-all">{deviceKey}</span>
                </div>
              </div>

              {/* Direct Activation PIN input inside the Player */}
              <div className="bg-gray-950/80 border border-amber-500/10 p-6 rounded-2xl max-w-md mx-auto space-y-4 shadow-xl">
                <h3 className="text-white font-bold text-sm text-left flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'أدخل كود تفعيل (PIN)' : 'Enter Activation Key / PIN'}</span>
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activatingCode}
                    onChange={(e) => setActivatingCode(e.target.value)}
                    placeholder={isAr ? 'مثال: IBO-PRO-1YEAR-7788' : 'e.g. IBO-PRO-1YEAR-7788'}
                    className="flex-1 bg-black border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans focus:outline-none"
                  />
                  <button
                    onClick={() => handleActivateDevice(activatingCode)}
                    disabled={isActivating}
                    className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
                  >
                    {isActivating ? (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>{isAr ? 'تفعيل' : 'Activate'}</span>
                  </button>
                </div>

                {activationError && (
                  <p className="text-xs text-rose-500 font-semibold text-left">⚠️ {activationError}</p>
                )}
                {activationSuccess && (
                  <p className="text-xs text-emerald-500 font-semibold text-left">✅ {activationSuccess}</p>
                )}

                {/* Simulated Payment / Renewal Quick Trigger for testing and validation */}
                <div className="pt-2 border-t border-gray-900/60 flex flex-col gap-2">
                  <p className="text-[10px] text-gray-500 text-center leading-normal">
                    {isAr 
                      ? 'للتجربة والتقييم السريع على الـ VPS، يمكنك الضغط على زر التجديد التجريبي الفوري لتمديد الصلاحية 1 سنة تلقائياً.' 
                      : 'For evaluation, you can use the instant simulator to auto-renew the trial by 1 year.'}
                  </p>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isActivating}
                    className="w-full py-2 px-3 bg-gray-900 hover:bg-gray-800 text-amber-500 border border-gray-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    🚀 {isAr ? 'محاكاة التجديد والدفع السريع (1 سنة)' : 'Simulate Direct Online Renewal (1 Year)'}
                  </button>
                </div>
              </div>

              {/* Predefined / Pre-seeded evaluation keys help block */}
              <div className="max-w-md mx-auto p-4 bg-gray-950/40 border border-gray-900 rounded-xl text-left space-y-2">
                <span className="text-[10px] text-amber-500 uppercase font-black tracking-wider block">🔑 {isAr ? 'مفاتيح تفعيل تجريبية جاهزة للاستخدام:' : 'Demo Activation Keys (Available for immediate use):'}</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-gray-400">
                  <div className="bg-black/40 p-1.5 rounded border border-gray-900 text-center">
                    <span className="text-white font-bold select-all">IBO-PRO-1YEAR-7788</span>
                    <span className="block text-[8px] text-gray-500">{isAr ? 'اشتراك سنة كاملة' : '1 Year Active'}</span>
                  </div>
                  <div className="bg-black/40 p-1.5 rounded border border-gray-900 text-center">
                    <span className="text-white font-bold select-all">IBO-PRO-LIFETIME-9900</span>
                    <span className="block text-[8px] text-gray-500">{isAr ? 'اشتراك مدى الحياة' : 'Lifetime Active'}</span>
                  </div>
                </div>
              </div>

              {/* Footer instruction linking to Portal */}
              <p className="text-xs text-gray-500 pt-2">
                {isAr 
                  ? 'يمكنك تفعيل هذا الجهاز وإضافة ملفات القنوات الخاصة بك في أي وقت عبر الانتقال إلى '
                  : 'Alternatively, you can activate this device or manage files at any time via the '}
                <button onClick={() => setActiveTab('portal')} className="text-amber-500 hover:underline font-bold">
                  {isAr ? 'بوابة رفع ملفات القنوات' : 'Upload Portal'}
                </button>
              </p>
            </div>
          )}
          
          {/* ZERO PLAYLISTS LOADING STATE / WELCOME LANDING */}
          {playlists.length === 0 && activePlaylistId === 'demo' && allItems.length === 0 && deviceStatus?.status !== 'expired' && (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="inline-flex p-4 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                <Tv className="w-12 h-12" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {isAr ? 'مرحباً بك في مشغل Ghost Player' : 'Welcome to Ghost Player'}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
                {trans.portalInstruction}
              </p>

              {/* Box displaying credentials */}
              <div className="bg-gray-950 border border-gray-900 rounded-2xl p-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="text-center space-y-1">
                  <span className="text-xs text-gray-500 block">{trans.macAddress}</span>
                  <span className="text-lg font-black text-white font-mono">{macAddress}</span>
                </div>
                <div className="text-center space-y-1 border-l border-gray-900">
                  <span className="text-xs text-gray-500 block">{trans.deviceKey}</span>
                  <span className="text-lg font-black text-white font-mono">{deviceKey}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center max-w-sm mx-auto">
                <button
                  onClick={() => setActiveTab('portal')}
                  className={`w-full ${getThemeSpecificClasses('button')} py-3.5 px-6 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2`}
                >
                  <Globe className="w-4.5 h-4.5" />
                  <span>{trans.portalBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC TAB SWITCHING PANELS */}
          {activeTab === 'live' && allItems.length > 0 && deviceStatus?.status !== 'expired' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[500px]">
              
              {/* Left Column: Categories and Search (lg:col-span-3) */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative shrink-0">
                  <Search className={`absolute top-3.5 w-4.5 h-4.5 text-gray-500 ${isAr ? 'left-3' : 'right-3'}`} />
                  <input
                    type="text"
                    placeholder={trans.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-950/80 border border-gray-900/60 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Categories List */}
                <div className="bg-gray-950/40 border border-gray-900/50 rounded-xl p-2 flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto scrollbar-none max-h-[120px] lg:max-h-[600px] gap-2 lg:space-y-1">
                  <button
                    onClick={() => handleCategoryClick('')}
                    className={`shrink-0 lg:w-full text-right p-2.5 rounded-lg text-sm font-semibold flex items-center justify-between gap-2.5 transition-all ${
                      selectedCategory === '' 
                        ? `${activeTheme.bgActive} text-white` 
                        : 'text-gray-400 bg-white/5 lg:bg-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{trans.all}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-400">
                      {allItems.filter(item => item.type === 'live').length}
                    </span>
                  </button>

                  {favorites.length > 0 && (
                    <button
                      onClick={() => handleCategoryClick('⭐ Favorites')}
                      className={`shrink-0 lg:w-full text-right p-2.5 rounded-lg text-sm font-semibold flex items-center justify-between gap-2.5 transition-all ${
                        selectedCategory === '⭐ Favorites' || selectedCategory === '⭐ المفضلة'
                          ? 'bg-amber-600 text-white' 
                          : 'text-amber-500 bg-amber-500/5 lg:bg-transparent hover:bg-amber-500/10'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Star className="w-4 h-4 fill-current shrink-0" />
                        <span className="truncate">{isAr ? 'المفضلة' : 'Favorites'}</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-400">
                        {allItems.filter(item => item.type === 'live' && favorites.includes(item.id)).length}
                      </span>
                    </button>
                  )}

                  {categories.map((cat) => {
                    const isLocked = parentalEnabled && lockedCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                        className={`shrink-0 lg:w-full text-right p-2.5 rounded-lg text-sm font-semibold flex items-center justify-between gap-2.5 transition-all ${
                          selectedCategory === cat.name 
                            ? `${activeTheme.bgActive} text-white` 
                            : 'text-gray-400 bg-white/5 lg:bg-transparent hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          {isLocked && <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-gray-400 shrink-0">
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Middle Column: Channel List & Recently Watched (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-4 h-full min-h-[500px]">
                {/* Recently Watched Section */}
                {recentlyWatched.length > 0 && (
                  <div className="bg-gray-950/40 border border-gray-900/50 rounded-xl p-4 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{isAr ? 'شوهد مؤخراً' : 'Recently Watched'}</span>
                      </h3>
                      <button
                        onClick={clearRecentlyWatched}
                        className="text-[10px] text-gray-500 hover:text-rose-400 font-medium transition-colors"
                      >
                        {isAr ? 'مسح السجل' : 'Clear History'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recentlyWatched.map((channel) => (
                        <div
                          key={`recent-${channel.id}`}
                          onClick={() => {
                            setActivePlayback({ item: channel, playlistId: activePlaylistId, index: 0, streamUrl: channel.url });
                            addToRecentlyWatched(channel);
                          }}
                          className={`group p-2 bg-black/40 hover:bg-black/80 border rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] ${
                            activePlayback?.item.id === channel.id
                              ? getThemeSpecificClasses('activeItem')
                              : 'border-gray-900/40 hover:border-gray-800'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-black/60 border border-gray-900 flex items-center justify-center overflow-hidden shrink-0">
                            {channel.logo ? (
                              <img src={channel.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Tv className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs truncate text-white">{channel.name}</h4>
                            <span className="text-[9px] text-gray-500 truncate block">{channel.group}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Channel List Grid */}
                <div className="bg-gray-950/40 border border-gray-900/50 rounded-xl p-4 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="text-white font-bold text-sm">
                      {selectedCategory || (isAr ? 'جميع القنوات' : 'All Channels')}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/40 text-gray-400 font-mono">
                      {getFilteredItems().length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[580px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-900">
                    {getFilteredItems().length > 0 ? (
                      getFilteredItems().map((channel) => (
                        <div
                          key={channel.id}
                          onClick={() => {
                            setActivePlayback({ item: channel, playlistId: activePlaylistId, index: 0, streamUrl: channel.url });
                            addToRecentlyWatched(channel);
                          }}
                          className={`group p-2.5 bg-black/20 hover:bg-black/60 border rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] ${
                            activePlayback?.item.id === channel.id
                              ? getThemeSpecificClasses('activeItem')
                              : 'border-gray-900/40 hover:border-gray-800'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-black/60 border border-gray-900 flex items-center justify-center overflow-hidden shrink-0">
                            {channel.logo ? (
                              <img src={channel.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Tv className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs truncate text-white">{channel.name}</h4>
                            <span className="text-[10px] text-gray-500 truncate block">{channel.group}</span>
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(channel.id, e)}
                            className="text-gray-500 hover:text-amber-500 p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                          >
                            <Star className={`w-3.5 h-3.5 ${favorites.includes(channel.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 text-gray-600 space-y-3">
                        <Tv className="w-10 h-10 mx-auto text-gray-800 stroke-1" />
                        <p className="text-xs">
                          {isAr ? 'لم يتم العثور على قنوات' : 'No channels found'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Mini-Player & Stream Specs (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <h3 className="text-white font-bold text-md px-1">{trans.activeStream}</h3>
                
                <div className="bg-gray-950/80 border border-gray-900 p-4 rounded-2xl space-y-4">
                  {activePlayback && activePlayback.item.type === 'live' ? (
                    <div className="space-y-4">
                      {/* Interactive HTML5 Video Window */}
                      <div 
                        onClick={() => setShowFullscreenPlayer(true)}
                        className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl cursor-pointer group"
                      >
                        {!showFullscreenPlayer ? (
                          <video
                            ref={videoRef}
                            className="w-full h-full object-contain"
                            autoPlay
                            controls={false}
                            muted={isMuted}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-gray-500 text-xs gap-2">
                            <Tv className="w-8 h-8 animate-pulse text-gray-700" />
                            <span>{isAr ? 'يعمل في الشاشة الكاملة' : 'Streaming in Fullscreen'}</span>
                          </div>
                        )}
                        
                        {/* Interactive Hover Overlay to signify click-to-fullscreen */}
                        {!showFullscreenPlayer && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                            <Maximize className="w-8 h-8 text-white drop-shadow animate-bounce" />
                            <span className="text-xs font-bold tracking-wide">
                              {isAr ? 'عرض ملء الشاشة' : 'Click for Fullscreen'}
                            </span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold font-mono animate-pulse uppercase tracking-wider">
                          LIVE
                        </div>
                      </div>

                      {/* Specs info */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-black border border-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                          {activePlayback.item.logo ? (
                            <img src={activePlayback.item.logo} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Tv className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-bold text-md truncate">{activePlayback.item.name}</h4>
                          <span className="text-xs text-gray-500 block truncate">{activePlayback.item.group}</span>
                        </div>
                      </div>

                      {/* Stream details & Full Screen CTA */}
                      <div className="space-y-2 pt-2 border-t border-gray-900/60 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-gray-500">FORMAT:</span>
                          <span className="text-emerald-500 font-bold">{trans.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">LATENCY:</span>
                          <span className="text-gray-400">0.2s (Peak Fast Buffer)</span>
                        </div>
                      </div>

                      {/* Interactive Mute and Fullscreen Control triggers */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(prev => !prev);
                          }}
                          className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-gray-900 rounded-xl text-xs font-bold text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isMuted ? (
                            <>
                              <VolumeX className="w-4 h-4 text-rose-500" />
                              <span>{isAr ? 'كتم الصوت' : 'Muted'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4 text-emerald-500" />
                              <span>{isAr ? 'الصوت مفعّل' : 'Unmuted'}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFullscreenPlayer(true);
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${getThemeSpecificClasses('secondaryButton')}`}
                        >
                          <Maximize className="w-4 h-4" />
                          <span>{isAr ? 'كامل الشاشة' : 'Fullscreen'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-600 space-y-4">
                      <Tv className="w-12 h-12 mx-auto text-gray-800 stroke-1" />
                      <p className="text-xs max-w-xs mx-auto leading-relaxed">
                        {isAr 
                          ? 'اختر أي قناة تلفزيونية من القائمة للبدء بالبث الفوري ومعاينة الصورة والتحكم بالجودة.' 
                          : 'Select any television channel from the list to start streaming instantly with quick aspect and specs controls.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            
          {/* MOVIES MODULE TAB */}
          {activeTab === 'movies' && allItems.length > 0 && !selectedMovie && deviceStatus?.status !== 'expired' && (
            <div className="space-y-6">
              {/* Category buttons slider */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-900/60 scrollbar-none">
                <button
                  onClick={() => handleCategoryClick('')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === '' ? 'bg-white text-black' : 'bg-gray-900 hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  {trans.all} ({allItems.filter(item => item.type === 'movie').length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === cat.name ? 'bg-white text-black' : 'bg-gray-900 hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>

              {/* Movies Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9 gap-2.5 sm:gap-3.5">
                {getFilteredItems().map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group bg-gray-950/60 border border-gray-900/40 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    <div className="aspect-[2/3] bg-black relative overflow-hidden flex items-center justify-center">
                      {movie.logo ? (
                        <img src={movie.logo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <Film className="w-10 h-10 text-gray-800" />
                      )}
                      {movie.rating && (
                        <span className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-md text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-400/20 font-mono z-30">
                          ⭐ {movie.rating}
                        </span>
                      )}
                      {movie.url && (
                        <CardHoverPreview 
                          url={movie.url} 
                          isAr={lang === 'ar'} 
                          onPlayClick={(e) => {
                            e.stopPropagation();
                            setActivePlayback({ item: movie, playlistId: activePlaylistId, index: 0, streamUrl: movie.url });
                            setShowFullscreenPlayer(true);
                          }}
                        />
                      )}
                    </div>
                    <div className="p-2 sm:p-2.5">
                      <h4 className="font-bold text-[11px] sm:text-xs truncate text-white group-hover:text-cyan-400 transition-colors">{movie.name}</h4>
                      <div className="flex justify-between items-center mt-1 text-[9px] sm:text-[10px]">
                        <span className="text-gray-500 font-mono">{movie.releaseDate || 'VOD'}</span>
                        <span className="text-gray-500 truncate max-w-[65px] sm:max-w-[80px]">{movie.group}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SELECTED MOVIE BACKDROP DETAIL VIEW */}
          {activeTab === 'movies' && selectedMovie && deviceStatus?.status !== 'expired' && (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedMovie(null)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all mb-4"
              >
                <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                <span>{isAr ? 'العودة لسينما الأفلام' : 'Back to Cinema Catalog'}</span>
              </button>

              {/* Cinematic Bento Layout */}
              <div 
                className="relative rounded-2xl overflow-hidden border border-gray-900 bg-cover bg-center min-h-[450px]"
                style={{ 
                  backgroundImage: `linear-gradient(to right, rgba(2,6,23,0.95) 40%, rgba(2,6,23,0.5) 100%), url(${selectedMovie.backdrop || selectedMovie.logo})` 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent lg:hidden" />
                
                <div className="relative p-6 md:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
                  
                  {/* Poster left */}
                  <div className="lg:col-span-3 aspect-[2/3] max-w-[240px] mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                    <img src={selectedMovie.logo} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Details block right */}
                  <div className="lg:col-span-9 space-y-4 text-left">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-600/10 border border-blue-500/20 text-blue-400">
                        {selectedMovie.group}
                      </span>
                      {selectedMovie.rating && (
                        <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
                          {trans.metaRating} {selectedMovie.rating}
                        </span>
                      )}
                      {selectedMovie.releaseDate && (
                        <span className="text-xs text-gray-400 font-mono">
                          {selectedMovie.releaseDate}
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                      {selectedMovie.name}
                    </h1>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-y border-gray-900 py-3 text-xs text-gray-400 font-mono">
                      {selectedMovie.duration && (
                        <div>
                          <span className="text-gray-600 block">{trans.metaDuration}</span>
                          <span className="text-white font-medium">{selectedMovie.duration}</span>
                        </div>
                      )}
                      {selectedMovie.director && (
                        <div>
                          <span className="text-gray-600 block">{trans.metaDirector}</span>
                          <span className="text-white font-medium">{selectedMovie.director}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 block">ENCODER:</span>
                        <span className="text-emerald-500 font-medium">H264 Fast MP4</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-300">
                      <h4 className="font-bold text-white uppercase tracking-wider">{trans.metaSynopsis}</h4>
                      <p className="leading-relaxed text-gray-400 max-w-3xl">
                        {selectedMovie.plot || "No description provided for this VOD asset. Full media stream remains active. Streamed via client configuration."}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="pt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setActivePlayback({ item: selectedMovie, playlistId: activePlaylistId, index: 0, streamUrl: selectedMovie.url });
                          setShowFullscreenPlayer(true);
                        }}
                        className={`py-3.5 px-8 rounded-xl font-bold text-sm tracking-tight shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${getThemeSpecificClasses('button')}`}
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                        <span>{trans.play}</span>
                      </button>

                      <button
                        onClick={() => toggleFavorite(selectedMovie.id)}
                        className={`p-3 rounded-xl border transition-all ${
                          favorites.includes(selectedMovie.id)
                            ? 'bg-amber-600/10 border-amber-500/20 text-amber-500'
                            : 'border-gray-800 hover:bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${favorites.includes(selectedMovie.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* SERIES MODULE TAB */}
          {activeTab === 'series' && allItems.length > 0 && !selectedSeries && deviceStatus?.status !== 'expired' && (
            <div className="space-y-6">
              {/* Category slider */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-900/60 scrollbar-none">
                <button
                  onClick={() => handleCategoryClick('')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === '' ? 'bg-white text-black' : 'bg-gray-900 hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  {trans.all} ({allItems.filter(item => item.type === 'series').length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                      selectedCategory === cat.name ? 'bg-white text-black' : 'bg-gray-900 hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>

              {/* Series grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9 gap-2.5 sm:gap-3.5">
                {getFilteredItems().map((series) => (
                  <div
                    key={series.id}
                    onClick={() => { setSelectedSeries(series); setSelectedSeason(1); }}
                    className="group bg-gray-950/60 border border-gray-900/40 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    <div className="aspect-[2/3] bg-black relative overflow-hidden flex items-center justify-center">
                      {series.logo ? (
                        <img src={series.logo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <Clapperboard className="w-10 h-10 text-gray-800" />
                      )}
                      {series.rating && (
                        <span className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-md text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-400/20 font-mono z-30">
                          ⭐ {series.rating}
                        </span>
                      )}
                      {series.url && (
                        <CardHoverPreview 
                          url={series.url} 
                          isAr={lang === 'ar'} 
                          onPlayClick={(e) => {
                            e.stopPropagation();
                            const episodes = DEMO_EPISODES[series.id] || [];
                            const firstEp = episodes[0];
                            if (firstEp) {
                              setActivePlayback({ 
                                item: series, 
                                playlistId: activePlaylistId, 
                                index: 0, 
                                streamUrl: firstEp.url, 
                                seasonNum: firstEp.seasonNum, 
                                episodeId: firstEp.id 
                              });
                            } else {
                              setActivePlayback({ 
                                item: series, 
                                playlistId: activePlaylistId, 
                                index: 0, 
                                streamUrl: series.url 
                              });
                            }
                            setShowFullscreenPlayer(true);
                          }}
                        />
                      )}
                    </div>
                    <div className="p-2 sm:p-2.5">
                      <h4 className="font-bold text-[11px] sm:text-xs truncate text-white group-hover:text-cyan-400 transition-colors">{series.name}</h4>
                      <div className="flex justify-between items-center mt-1 text-[9px] sm:text-[10px]">
                        <span className="text-gray-500 font-mono">{series.duration || trans.epCount}</span>
                        <span className="text-gray-500 truncate max-w-[65px] sm:max-w-[80px]">{series.group}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAILED TV SERIES SEASONS & EPISODES PANEL */}
          {activeTab === 'series' && selectedSeries && deviceStatus?.status !== 'expired' && (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedSeries(null)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all mb-4"
              >
                <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                <span>{isAr ? 'العودة لمجموعات المسلسلات' : 'Back to TV Series Library'}</span>
              </button>

              <div 
                className="relative rounded-2xl overflow-hidden border border-gray-900 bg-cover bg-center min-h-[300px] mb-8"
                style={{ 
                  backgroundImage: `linear-gradient(to right, rgba(2,6,23,0.95) 40%, rgba(2,6,23,0.6) 100%), url(${selectedSeries.backdrop || selectedSeries.logo})` 
                }}
              >
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-32 aspect-[2/3] shrink-0 rounded-xl overflow-hidden border border-gray-800 shadow-xl">
                    <img src={selectedSeries.logo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{selectedSeries.name}</h1>
                    <p className="text-xs text-gray-500 font-mono">{selectedSeries.group} • {selectedSeries.releaseDate || '2024'}</p>
                    <p className="text-sm text-gray-400 max-w-2xl">{selectedSeries.plot || "TV series bundle containing multiple high definition episodes configured directly via user's M3U file feeds."}</p>
                  </div>
                </div>
              </div>

              {/* Seasons & Episodes Segment */}
              <div className="bg-gray-950/40 border border-gray-900 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                  <h3 className="text-white font-bold text-md flex items-center gap-2">
                    <Clapperboard className="w-5 h-5 text-blue-500" />
                    <span>{trans.episodes}</span>
                  </h3>

                  {/* Season dropdown selection */}
                  <div className="flex items-center gap-2 bg-black/60 border border-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                    <span>{trans.seasons}</span>
                    <select 
                      value={selectedSeason} 
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                      className="bg-transparent font-bold text-blue-400 focus:outline-none cursor-pointer"
                    >
                      <option value={1} className="bg-slate-950 text-white">{trans.seasonLabel} 1</option>
                    </select>
                  </div>
                </div>

                {/* Episodes grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(DEMO_EPISODES[selectedSeries.id] || []).map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        setActivePlayback({ item: selectedSeries, playlistId: activePlaylistId, index: 0, streamUrl: ep.url, seasonNum: ep.seasonNum, episodeId: ep.id });
                        setShowFullscreenPlayer(true);
                      }}
                      className="group bg-black/60 border border-gray-900/60 hover:border-blue-500/30 hover:bg-white/5 p-4 rounded-xl flex gap-4 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-24 aspect-[16/9] bg-gray-950 rounded-lg overflow-hidden border border-gray-900 flex items-center justify-center shrink-0">
                        {ep.logo ? (
                          <img src={ep.logo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Play className="w-6 h-6 text-gray-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                            S{ep.seasonNum}E{ep.episodeNum} - {ep.name}
                          </h4>
                          {ep.duration && <span className="text-[10px] text-gray-600 font-mono">{ep.duration}</span>}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ep.plot || "Play episode media stream instantly."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLOUD LINK PLAYLIST PORTAL TAB */}
          {activeTab === 'portal' && (
            <PortalView
              deviceMac={macAddress}
              deviceKey={deviceKey}
              lang={lang}
              themeColor={theme}
              onPlaylistsChanged={() => fetchPlaylists(macAddress)}
            />
          )}

          {/* SETTINGS MODULE PANEL */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 font-sans">
              
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
                <Settings className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-white">{trans.settings}</h2>
              </div>

              {/* Settings block 1: Device Credentials */}
              <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2 border-b border-gray-900 pb-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span>{trans.deviceStatus}</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black p-4 rounded-xl border border-gray-900/60 text-center space-y-1">
                    <span className="text-xs text-gray-500 uppercase">{trans.macAddress}</span>
                    <b className="text-sm font-mono block text-white select-all">{macAddress}</b>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-gray-900/60 text-center space-y-1">
                    <span className="text-xs text-gray-500 uppercase">{trans.deviceKey}</span>
                    <b className="text-sm font-mono block text-white select-all">{deviceKey}</b>
                  </div>
                </div>

                {/* Sub status details badge */}
                {deviceStatus && (
                  <div className="bg-black border border-gray-900/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">{isAr ? 'حالة التفعيل والترخيص:' : 'License Activation Status:'}</span>
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wide text-[10px] ${
                        deviceStatus.status === 'active' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : deviceStatus.status === 'trial'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        {deviceStatus.status === 'active' 
                          ? (isAr ? 'نشط ومدفوع' : 'Activated') 
                          : deviceStatus.status === 'trial'
                          ? (isAr ? 'فترة تجريبية مجانية' : 'Free Trial') 
                          : (isAr ? 'منتهي الصلاحية' : 'Expired')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-gray-900 pt-2.5">
                      <span className="text-gray-400">{isAr ? 'تاريخ انتهاء الصلاحية:' : 'Expiration Date:'}</span>
                      <span className="font-mono text-white font-bold">{new Date(deviceStatus.expiryDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-gray-900 pt-2.5">
                      <span className="text-gray-400">{isAr ? 'الأيام المتبقية:' : 'Days Remaining:'}</span>
                      <span className={`font-bold ${deviceStatus.daysLeft > 15 ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {deviceStatus.daysLeft} {isAr ? 'يوم' : 'Days'}
                      </span>
                    </div>
                  </div>
                )}

                {/* In-Settings PIN Activation code submission */}
                <div className="bg-black/60 border border-gray-900 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-gray-300 block">{isAr ? 'تجديد أو تفعيل الجهاز بكود PIN' : 'Renew / Activate Device with Code PIN'}</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activatingCode}
                      onChange={(e) => setActivatingCode(e.target.value)}
                      placeholder={isAr ? 'أدخل كود تفعيل هنا' : 'Enter activation code'}
                      className="flex-1 bg-black border border-gray-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:font-sans focus:outline-none"
                    />
                    <button
                      onClick={() => handleActivateDevice(activatingCode)}
                      disabled={isActivating}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1 shrink-0"
                    >
                      {isActivating ? '...' : (isAr ? 'تفعيل' : 'Activate')}
                    </button>
                  </div>

                  {activationError && (
                    <p className="text-[10px] text-rose-500 font-semibold">⚠️ {activationError}</p>
                  )}
                  {activationSuccess && (
                    <p className="text-[10px] text-emerald-500 font-semibold">✅ {activationSuccess}</p>
                  )}

                  {/* Fast simulation for VPS testers */}
                  <div className="pt-2 border-t border-gray-900 flex justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-500">{isAr ? 'تفعيل فوري لغرض التقييم السريع:' : 'Instant test activation for evaluation:'}</span>
                    <button
                      onClick={handleSimulatePayment}
                      disabled={isActivating}
                      className="text-[10px] text-amber-500 hover:underline font-bold"
                    >
                      🚀 {isAr ? 'تجديد مجاني تجريبي لعام كامل' : 'Simulate 1 Year Free'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-400 text-center leading-relaxed">
                  💡 {trans.portalInstruction}
                </div>
              </div>

              {/* Settings block 2: Language & Theme */}
              <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2 border-b border-gray-900 pb-2">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  <span>{isAr ? 'تخصيص الواجهة واللغة' : 'Theme & Interface Language'}</span>
                </h3>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-bold block">{trans.theme}</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { id: 'elegant', label: isAr ? 'الأسود الذهبي الفخم' : 'Elegant Dark', color: 'bg-amber-500' },
                      { id: 'blue', label: trans.blue, color: 'bg-blue-600' },
                      { id: 'emerald', label: trans.emerald, color: 'bg-emerald-600' },
                      { id: 'crimson', label: trans.crimson, color: 'bg-rose-600' },
                      { id: 'onyx', label: trans.onyx, color: 'bg-neutral-800' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setTheme(t.id as any); localStorage.setItem('flixnet_theme', t.id); }}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                          theme === t.id 
                            ? 'bg-white/10 border-white text-white shadow-md' 
                            : 'bg-black/40 border-gray-900 hover:border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${t.color} shrink-0`} />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selector */}
                <div className="space-y-2 pt-4 border-t border-gray-900/60">
                  <label className="text-xs text-gray-400 font-bold block">
                    {isAr ? 'لغة الواجهة والترجمة' : 'Interface Language & Translation'}
                  </label>
                  <div className="flex gap-3">
                    {[
                      { id: 'en', label: 'English (EN)' },
                      { id: 'ar', label: 'العربية (AR)' }
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => changeLanguage(l.id as 'ar' | 'en')}
                        className={`flex-1 p-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          lang === l.id 
                            ? getThemeSpecificClasses('badge') 
                            : 'bg-black/40 border-gray-900 hover:border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 italic mt-1 leading-normal">
                    {isAr 
                      ? '💡 يتم استكشاف وتعيين اللغة الافتراضية للجهاز تلقائياً على المتصفح وأجهزة الـ TV عند أول تشغيل.' 
                      : '💡 The app language is automatically configured to match your device/browser default settings on first load.'}
                  </p>
                </div>

                {/* App View Mode Selector */}
                <div className="space-y-2 pt-4 border-t border-gray-900/60">
                  <label className="text-xs text-gray-400 font-bold block">
                    {isAr ? 'وضع عرض التطبيق والتشغيل' : 'Application View & Presentation Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => toggleDeviceMode(true)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        isDeviceMode 
                          ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-md'
                          : 'bg-black/40 border-gray-900 hover:border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">📺</span>
                      <span>{isAr ? 'مشغل ويب متكامل (تطبيق المتصفح)' : 'Web Media Player (Full App)'}</span>
                    </button>
                    <button
                      onClick={() => toggleDeviceMode(false)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        !isDeviceMode 
                          ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-md'
                          : 'bg-black/40 border-gray-900 hover:border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">🌐</span>
                      <span>{isAr ? 'موقع بوابة الرفع (التحكم عن بعد)' : 'Standalone Portal Website'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 italic mt-1 leading-normal">
                    {isAr 
                      ? '💡 اختر "مشغل ويب متكامل" لتشغيل ومشاهدة قنواتك مباشرة من المتصفح، أو اختر "موقع البوابة" لإدارة قنوات أجهزة تلفاز ذكية أخرى.' 
                      : '💡 Choose "Web Media Player" to play channels directly in your browser, or "Standalone Portal" to load channels for other external smart TVs.'}
                  </p>
                </div>

                {/* Connection Stream Proxy Selector */}
                <div className="space-y-2 pt-4 border-t border-gray-900/60">
                  <label className="text-xs text-gray-400 font-bold block flex items-center gap-1.5">
                    <span>📡</span>
                    <span>{isAr ? 'خادم البث الوسيط (البروكسي)' : 'Stream Connection Proxy'}</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      { 
                        id: 'auto', 
                        title: isAr ? 'تلقائي (موصى به)' : 'Auto Proxy', 
                        desc: isAr ? 'تشغيل قنوات HTTPS مباشرة، وبروكسي لروابط HTTP لتجاوز حظر المتصفح' : 'HTTPS streams directly, proxies HTTP to bypass Mixed Content restrictions'
                      },
                      { 
                        id: 'always', 
                        title: isAr ? 'تشغيل عبر السيرفر دائماً' : 'Always Proxy', 
                        desc: isAr ? 'تمرير كل البث عبر السيرفر لحل مشاكل جدار الحماية (CORS)' : 'Proxies all streams through app server to bypass strict connection blocks'
                      },
                      { 
                        id: 'direct', 
                        title: isAr ? 'بث مباشر بالكامل' : 'Always Direct', 
                        desc: isAr ? 'تشغيل جميع القنوات مباشرة دون وساطة السيرفر للسرعة القصوى وثبات IP' : 'Streams all links directly. Maximum speed and respects geo-locked playlists'
                      }
                    ].map((modeOption) => (
                      <button
                        key={modeOption.id}
                        onClick={() => { setProxyMode(modeOption.id as any); localStorage.setItem('flixnet_proxy_mode', modeOption.id); }}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          proxyMode === modeOption.id 
                            ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-md'
                            : 'bg-black/40 border-gray-900 hover:border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className={`w-2 h-2 rounded-full ${proxyMode === modeOption.id ? 'bg-blue-400' : 'bg-gray-600'}`} />
                          <span>{modeOption.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 leading-snug">{modeOption.desc}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-yellow-500/90 italic mt-1 leading-normal">
                    {isAr 
                      ? '⚠️ تنبيه: العديد من مزودي القنوات يمنعون تشغيل القنوات عبر سيرفرات مراكز البيانات (تظهر كشاشة سوداء أو خطأ 403). إذا كانت قنواتك لا تعمل، يرجى تفعيل وضع "تلقائي (موصى به)" أو "بث مباشر بالكامل".' 
                      : '⚠️ Notice: Many IPTV providers block requests from datacenter servers (resulting in a black screen or 403 error). If your channels are not playing, try switching to "Auto Proxy" or "Always Direct" mode.'}
                  </p>
                </div>
              </div>

              {/* Settings block 3: Parental Controls */}
              <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl space-y-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2 border-b border-gray-900 pb-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span>{trans.parentalPin}</span>
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium">{trans.enableParental}</span>
                  <button
                    onClick={() => {
                      const updated = !parentalEnabled;
                      setParentalEnabled(updated);
                      localStorage.setItem('flixnet_pin_enabled', updated.toString());
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${parentalEnabled ? 'bg-blue-600' : 'bg-gray-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${parentalEnabled ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''}`} />
                  </button>
                </div>

                {parentalEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 block">{isAr ? 'تحديث الرقم السري (PIN)' : 'Modify Parental PIN'}</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="0000"
                        value={parentalPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setParentalPin(val);
                          localStorage.setItem('flixnet_pin', val);
                        }}
                        className="bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white font-mono text-center tracking-widest max-w-[120px] outline-none"
                      />
                    </div>

                    {/* Lock custom categories list toggle */}
                    {categories.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 block">{trans.lockedGroups}</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-black/60 border border-gray-900 p-3 rounded-xl">
                          {categories.map(cat => {
                            const isLocked = lockedCategories.includes(cat.name);
                            return (
                              <button
                                key={cat.name}
                                onClick={() => {
                                  let updated = [...lockedCategories];
                                  if (isLocked) {
                                    updated = updated.filter(n => n !== cat.name);
                                  } else {
                                    updated.push(cat.name);
                                  }
                                  setLockedCategories(updated);
                                  localStorage.setItem('flixnet_locked_cats', JSON.stringify(updated));
                                }}
                                className="text-left flex items-center justify-between p-2 rounded hover:bg-white/5 transition-all text-xs font-semibold"
                              >
                                <span className="truncate">{cat.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isLocked ? 'bg-rose-600/20 text-rose-500' : 'bg-gray-900 text-gray-500'
                                }`}>
                                  {isLocked ? trans.locked : trans.unlocked}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      {/* FULLSCREEN OVERLAY PLAYER */}
      {showFullscreenPlayer && activePlayback && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">
          {/* Real video element */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            autoPlay
            controls={false}
          />
          
          <PlayerControls
            videoRef={videoRef}
            item={activePlayback.item}
            onClose={() => {
              setShowFullscreenPlayer(false);
              // For movies/series, clear activePlayback so that the stream is fully closed
              if (activePlayback.item.type !== 'live') {
                setActivePlayback(null);
              }
            }}
            lang={lang}
            themeColor={theme}
            allChannelsInGroup={
              activePlayback.item.type === 'live'
                ? allItems.filter(item => item.type === 'live' && item.group === activePlayback.item.group)
                : []
            }
            onChannelSelect={(channel) => {
              setActivePlayback({
                item: channel,
                playlistId: activePlaylistId,
                index: 0,
                streamUrl: channel.url
              });
            }}
          />
        </div>
      )}

              {/* PARENTAL CONTROL SECURITY PIN DIALOG POPUP */}
      {pinPromptOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-slate-950 border border-gray-900 p-6 md:p-8 rounded-2xl max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="p-3 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-2xl inline-flex">
              <Lock className="w-8 h-8" />
            </div>
            
            <div className="space-y-2 text-center">
              <h3 className="text-white font-extrabold text-lg">
                {trans.pinPrompt}
              </h3>
              {pinError && (
                <p className="text-xs text-red-500 font-bold">{trans.pinError}</p>
              )}
            </div>

            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPinInput(val);
              }}
              placeholder="••••"
              className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-white outline-none focus:border-blue-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setPinPromptOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-xl text-xs transition-all"
              >
                {trans.cancel}
              </button>
              <button
                onClick={handleVerifyPin}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
              >
                {trans.submit}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-gray-900/60 px-2 py-2.5 flex justify-around items-center z-45 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => { setActiveTab('live'); setSelectedMovie(null); setSelectedSeries(null); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'live' 
              ? 'text-cyan-400 bg-cyan-950/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">{isAr ? 'مباشر' : 'Live'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('movies'); setSelectedMovie(null); setSelectedSeries(null); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'movies' 
              ? 'text-cyan-400 bg-cyan-950/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">{isAr ? 'أفلام' : 'Movies'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('series'); setSelectedMovie(null); setSelectedSeries(null); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'series' 
              ? 'text-cyan-400 bg-cyan-950/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clapperboard className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">{isAr ? 'مسلسلات' : 'Series'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('portal'); setSelectedMovie(null); setSelectedSeries(null); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'portal' 
              ? 'text-cyan-400 bg-cyan-950/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">{isAr ? 'الرفع' : 'Portal'}</span>
        </button>

        <button
          onClick={() => { setActiveTab('settings'); setSelectedMovie(null); setSelectedSeries(null); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-xl transition-all ${
            activeTab === 'settings' 
              ? 'text-cyan-400 bg-cyan-950/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">{isAr ? 'الإعدادات' : 'Settings'}</span>
        </button>
      </div>
      </div>
    </div>
  );
}
