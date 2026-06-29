/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, Laptop, ShieldAlert, Plus, Trash2, CheckCircle2, 
  Tv, Server, ArrowRight, ShieldCheck, RefreshCw, KeyRound, ListMusic, LogOut, Loader2
} from 'lucide-react';
import { Playlist, PlaylistType } from '../types';

interface PortalViewProps {
  deviceMac: string;
  deviceKey: string;
  lang: 'ar' | 'en';
  themeColor: string;
  onPlaylistsChanged?: () => void; // Tell App to reload playlists
}

export default function PortalView({
  deviceMac,
  deviceKey,
  lang,
  themeColor,
  onPlaylistsChanged
}: PortalViewProps) {
  const colorName = themeColor === 'elegant' ? 'amber' : themeColor === 'crimson' ? 'rose' : themeColor;
  const [macInput, setMacInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Device Portal Activation States
  const [deviceSub, setDeviceSub] = useState<{
    status: 'trial' | 'active' | 'expired';
    expiryDate: string;
    daysLeft: number;
  } | null>(null);
  const [portalCodeInput, setPortalCodeInput] = useState('');
  const [activatingSub, setActivatingSub] = useState(false);
  const [portalSubError, setPortalSubError] = useState('');
  const [portalSubSuccess, setPortalSubSuccess] = useState('');

  // Add Playlist Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<PlaylistType>('m3u');
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formHost, setFormHost] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const isAr = lang === 'ar';

  const dict = {
    en: {
      portalTitle: "FLIX GHOST IPTV Playlist Portal",
      portalSub: "Manage M3U lines and Xtream API details directly from any phone, laptop, or browser",
      step1: "1. Find MAC & Key on TV Screen",
      step2: "2. Input credentials below to Link",
      step3: "3. Upload playlist, reload TV App",
      macLabel: "TV MAC Address",
      keyLabel: "Device Key (PIN)",
      loginBtn: "Link & Manage Playlists",
      logoutBtn: "Disconnect Device",
      addBtn: "Add Playlist",
      m3uTab: "M3U Playlist URL",
      xtreamTab: "Xtream Codes API",
      playlistName: "Playlist Friendly Name",
      playlistUrl: "M3U Link (.m3u / .m3u8)",
      hostLabel: "Xtream Server URL (e.g. http://host:8080)",
      userLabel: "Username",
      passLabel: "Password",
      saveBtn: "Save & Deploy to TV",
      cancelBtn: "Cancel",
      noPlaylists: "No playlists deployed yet. Click 'Add Playlist' below to load streams.",
      activePlaylists: "Playlists Configured for",
      deleteConfirm: "Playlist deleted successfully!",
      saveConfirm: "Playlist saved! Go ahead and reload your Smart TV App.",
      macRequired: "Please enter your device MAC address.",
      keyRequired: "Please enter your device Key.",
      generalError: "Something went wrong. Please try again.",
      playerDisclaimer: "FLIXNET is exclusively a software media player. We do not provide, host, or broadcast any IPTV links or content. Reviewers and users must supply their own playlist sources.",
      statusConnected: "Device connected successfully"
    },
    ar: {
      portalTitle: "بوابة رفع ملفات القنوات وإدارة الاشتراكات",
      portalSub: "قم بإضافة وإدارة روابط M3U وبيانات Xtream Codes الخاصة بك من أي هاتف أو كمبيوتر لتظهر فوراً على شاشتك",
      step1: "1. احصل على الماك والرمز من شاشة التلفاز",
      step2: "2. أدخل البيانات في الحقول أدناه لربط الجهاز",
      step3: "3. أضف روابط قنواتك وأعد تشغيل التلفاز",
      macLabel: "عنوان MAC للتلفاز",
      keyLabel: "مفتاح الجهاز (Device Key)",
      loginBtn: "ربط وإدارة قائمة القنوات",
      logoutBtn: "فصل التلفاز الحالي",
      addBtn: "إضافة اشتراك / قائمة قنوات",
      m3uTab: "رابط ملف M3U",
      xtreamTab: "خادم Xtream Codes API",
      playlistName: "اسم الاشتراك (مثال: قنواتي الرياضية)",
      playlistUrl: "رابط ملف M3U (.m3u / .m3u8)",
      hostLabel: "عنوان سيرفر Xtream (مثال: http://host:port)",
      userLabel: "اسم المستخدم",
      passLabel: "كلمة المرور",
      saveBtn: "حفظ ونشر على التلفاز",
      cancelBtn: "إلغاء",
      noPlaylists: "لا توجد أي ملفات قنوات مضافة لهذا الجهاز حالياً. اضغط على 'إضافة اشتراك' للبدء.",
      activePlaylists: "الاشتراكات المفعلة للجهاز ذو الماك:",
      deleteConfirm: "تم حذف قائمة القنوات بنجاح!",
      saveConfirm: "تم حفظ القنوات بنجاح! يرجى إعادة تحديث التطبيق على التلفزيون الخاص بك.",
      macRequired: "يرجى إدخال عنوان الماك الخاص بالتلفاز.",
      keyRequired: "يرجى إدخال رمز التحقق الخاص بالجهاز.",
      generalError: "حدث خطأ ما، يرجى المحاولة مرة أخرى.",
      playerDisclaimer: "تطبيق FLIXNET هو مشغل وسائط برمجي فقط. نحن لا نقدم ولا نستضيف أي بث قنوات أو روابط. يجب على المراجع والعميل تزويد التطبيق بملفاتهم الخاصة.",
      statusConnected: "تم ربط جهاز التلفاز بنجاح"
    }
  }[lang];

  // Auto-fill input if device details are passed
  useEffect(() => {
    if (deviceMac) {
      setMacInput(deviceMac);
    }
    if (deviceKey) {
      setKeyInput(deviceKey);
    }
  }, [deviceMac, deviceKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!macInput) {
      setError(dict.macRequired);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/playlist/get?mac=${encodeURIComponent(macInput)}`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
        setIsLoggedIn(true);
        setSuccess(dict.statusConnected);
        fetchPortalDeviceStatus();
      } else {
        setError(dict.generalError);
      }
    } catch (err) {
      console.error(err);
      setError(dict.generalError);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await fetch(`/api/playlist/get?mac=${encodeURIComponent(macInput)}`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      setError(isAr ? 'يرجى إدخال اسم الاشتراك' : 'Please enter a name for the playlist');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload: Partial<Playlist> & { mac: string; key: string } = {
      mac: macInput,
      key: keyInput,
      name: formName,
      type: formType,
    };

    if (formType === 'm3u') {
      if (!formUrl) {
        setError(isAr ? 'يرجى إدخال رابط M3U' : 'Please enter M3U URL');
        setLoading(false);
        return;
      }
      (payload as any).url = formUrl;
    } else {
      if (!formHost || !formUsername || !formPassword) {
        setError(isAr ? 'يرجى ملء جميع بيانات سيرفر Xtream' : 'Please fill all Xtream server fields');
        setLoading(false);
        return;
      }
      (payload as any).host = formHost;
      (payload as any).username = formUsername;
      (payload as any).password = formPassword;
    }

    try {
      const response = await fetch('/api/playlist/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(dict.saveConfirm);
        setShowAddForm(false);
        // Clear form
        setFormName('');
        setFormUrl('');
        setFormHost('');
        setFormUsername('');
        setFormPassword('');
        // Reload list
        await loadPlaylists();
        if (onPlaylistsChanged) onPlaylistsChanged();
      } else {
        const errorData = await response.json();
        setError(errorData.message || dict.generalError);
      }
    } catch (err) {
      console.error(err);
      setError(dict.generalError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه القائمة؟' : 'Are you sure you want to delete this playlist?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/playlist/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: macInput, playlistId: id })
      });

      if (response.ok) {
        setSuccess(dict.deleteConfirm);
        await loadPlaylists();
        if (onPlaylistsChanged) onPlaylistsChanged();
      } else {
        setError(dict.generalError);
      }
    } catch (err) {
      console.error(err);
      setError(dict.generalError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPlaylists([]);
    setDeviceSub(null);
    setPortalCodeInput('');
    setPortalSubError('');
    setPortalSubSuccess('');
    setError('');
    setSuccess('');
  };

  // Fetch device activation status in portal context
  const fetchPortalDeviceStatus = async () => {
    try {
      const res = await fetch(`/api/device/status?mac=${encodeURIComponent(macInput)}&key=${encodeURIComponent(keyInput)}`);
      if (res.ok) {
        const data = await res.json();
        setDeviceSub({
          status: data.status,
          expiryDate: data.expiryDate,
          daysLeft: data.daysLeft
        });
      }
    } catch (err) {
      console.error("Failed to load portal device sub status:", err);
    }
  };

  // Activate device inside the portal
  const handlePortalActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalCodeInput) {
      setPortalSubError(isAr ? 'يرجى إدخال رمز تفعيل صحيح' : 'Please enter a valid activation code');
      return;
    }
    setActivatingSub(true);
    setPortalSubError('');
    setPortalSubSuccess('');
    try {
      const res = await fetch('/api/device/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: macInput, key: keyInput, code: portalCodeInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPortalSubSuccess(isAr ? 'تهانينا! تم تفعيل وتجديد جهازك بنجاح!' : 'Congratulations! Your device was successfully activated!');
        setPortalCodeInput('');
        fetchPortalDeviceStatus();
        if (onPlaylistsChanged) onPlaylistsChanged();
      } else {
        setPortalSubError(data.error || (isAr ? 'كود تفعيل غير صحيح أو مستخدم مسبقاً' : 'Invalid or used activation code.'));
      }
    } catch (err) {
      setPortalSubError(isAr ? 'حدث خطأ في الاتصال بالخادم الرئيسي' : 'Failed to reach activation server.');
    } finally {
      setActivatingSub(false);
    }
  };

  // Simulate payment inside the portal
  const handlePortalSimulate = async () => {
    setActivatingSub(true);
    setPortalSubError('');
    setPortalSubSuccess('');
    try {
      const res = await fetch('/api/device/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: macInput, key: keyInput, action: 'simulate_payment' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPortalSubSuccess(isAr ? 'تم محاكاة دفع وتجديد اشتراك جهازك لعام كامل بنجاح!' : 'Simulated billing complete. Your device has been renewed for 1 Year!');
        fetchPortalDeviceStatus();
        if (onPlaylistsChanged) onPlaylistsChanged();
      } else {
        setPortalSubError('Simulation failed');
      }
    } catch (err) {
      setPortalSubError('Connection error');
    } finally {
      setActivatingSub(false);
    }
  };

  const triggerAppLoadDemo = async () => {
    // If the user wants to test adding a demo playlist immediately
    setFormType('m3u');
    setFormName('FLIX GHOST Demo List');
    setFormUrl('https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u'); // Standard public legal stream M3U
    setShowAddForm(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Upper Logo & Title Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold font-mono tracking-wider uppercase">
          <Globe className="w-4.5 h-4.5 animate-spin-slow" />
          <span>FLIXNET CLOUD SYNC PORTAL</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {dict.portalTitle}
        </h1>
        <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
          {dict.portalSub}
        </p>
      </div>

      {/* 3 Step Visual Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-gray-950/60 border border-gray-900 p-4 rounded-xl flex flex-col items-center gap-2">
          <Tv className="w-6 h-6 text-blue-500" />
          <h4 className="text-white text-sm font-semibold">{dict.step1}</h4>
        </div>
        <div className="bg-gray-950/60 border border-gray-900 p-4 rounded-xl flex flex-col items-center gap-2">
          <KeyRound className="w-6 h-6 text-purple-500" />
          <h4 className="text-white text-sm font-semibold">{dict.step2}</h4>
        </div>
        <div className="bg-gray-950/60 border border-gray-900 p-4 rounded-xl flex flex-col items-center gap-2">
          <Server className="w-6 h-6 text-emerald-500" />
          <h4 className="text-white text-sm font-semibold">{dict.step3}</h4>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-600/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Login / Link Panel */}
      {!isLoggedIn ? (
        <div className="bg-gray-950/80 border border-gray-900 p-6 md:p-8 rounded-2xl shadow-xl max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
            <Laptop className="w-6 h-6 text-blue-500" />
            <h3 className="text-white font-bold text-lg">
              {isAr ? 'ربط جهازك الإلكتروني بالتلفزيون' : 'Connect Your TV Device'}
            </h3>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 block">{dict.macLabel}</label>
              <input 
                type="text" 
                placeholder="e.g. AA:BB:CC:11:22:33" 
                value={macInput}
                onChange={(e) => setMacInput(e.target.value.toUpperCase())}
                className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 block">{dict.keyLabel}</label>
                <span className="text-[10px] text-gray-600">({isAr ? 'اختياري للتلفزيون الجديد' : 'Optional for first-time TV'})</span>
              </div>
              <input 
                type="text" 
                placeholder="e.g. 123456" 
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 bg-${colorName}-600 hover:bg-${colorName}-500 text-${colorName === 'amber' ? 'black' : 'white'} rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{dict.loginBtn}</span>
                  <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>

          {/* Prompt to use active local MAC for fast testing */}
          {deviceMac && (
            <div className="pt-2 text-center">
              <button 
                type="button"
                onClick={() => {
                  setMacInput(deviceMac);
                  setKeyInput(deviceKey);
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                {isAr ? 'استخدم رمز الماك الافتراضي للجلسة الحالية لتسجيل سريع ⚡' : 'Auto-fill with current active session MAC address ⚡'}
              </button>
            </div>
          )}
        </div>
      ) : (
        // Connected Portal - Manage Playlists
        <div className="space-y-6">
          <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">{dict.activePlaylists}</p>
              <h3 className="text-white font-bold text-lg font-mono mt-1">{macInput}</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'متصل وجاهز' : 'Sync Active'}</span>
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className={`py-2.5 px-4 bg-${colorName}-600 hover:bg-${colorName}-500 text-${colorName === 'amber' ? 'black' : 'white'} rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2`}
              >
                <Plus className="w-4 h-4" />
                <span>{dict.addBtn}</span>
              </button>

              <button
                onClick={handleLogout}
                className="py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{dict.logoutBtn}</span>
              </button>
            </div>
          </div>

          {/* SUBSCRIPTION STATUS & PORTAL ACTIVATION SECTION */}
          {deviceSub && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Status Badge card */}
              <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl space-y-4">
                <h4 className="text-white font-bold text-sm flex items-center gap-2 border-b border-gray-900 pb-2">
                  <Server className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'حالة اشتراك التطبيق الفعال' : 'Active App Subscription Details'}</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">{isAr ? 'نوع الترخيص والحالة:' : 'License Type & Status:'}</span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                      deviceSub.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : deviceSub.status === 'trial'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {deviceSub.status === 'active' 
                        ? (isAr ? 'نشط ومدفوع' : 'Fully Active') 
                        : deviceSub.status === 'trial'
                        ? (isAr ? 'فترة تجريبية' : 'Trial Active') 
                        : (isAr ? 'منتهي الصلاحية' : 'Expired')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-gray-900/60 pt-2.5">
                    <span className="text-gray-400">{isAr ? 'تاريخ انتهاء الصلاحية:' : 'Expiration Date:'}</span>
                    <span className="text-white font-bold font-mono">{new Date(deviceSub.expiryDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-gray-900/60 pt-2.5">
                    <span className="text-gray-400">{isAr ? 'الأيام المتبقية للمشاهدة:' : 'Days Left for Streaming:'}</span>
                    <span className={`font-black ${deviceSub.daysLeft > 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {deviceSub.daysLeft} {isAr ? 'يوم متبقي' : 'Days left'}
                    </span>
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded-xl text-[11px] text-gray-500 leading-normal border border-gray-900/60">
                  {isAr 
                    ? '⚠️ يرجى الانتباه أن اشتراك التطبيق لتشغيل القنوات لا يشمل تزويد القنوات من طرفنا. التطبيق عبارة عن مشغل وسائط فقط وعليك إدخال اشتراكك الخاص بالأسفل.'
                    : '⚠️ Please note this is an app license activation and does NOT include any channels or playlists. FLIX GHOST is solely a media player software.'}
                </div>
              </div>

              {/* Activation Key Form */}
              <div className="bg-gray-950/80 border border-gray-900 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-white font-bold text-sm flex items-center gap-2 border-b border-gray-900 pb-2">
                    <KeyRound className="w-4 h-4 text-purple-500" />
                    <span>{isAr ? 'تفعيل فوري لترخيص التطبيق' : 'Activate App License (PIN Code)'}</span>
                  </h4>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                    {isAr 
                      ? 'إذا قمت بشراء كود تفعيل من الموزعين أو الوكلاء، الرجاء إدخاله هنا للربط المباشر والتفعيل السريع:'
                      : 'If you purchased a reseller PIN or license code, enter it below to instantly upgrade your TV subscription:'}
                  </p>
                </div>

                <form onSubmit={handlePortalActivate} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={isAr ? 'مثال: IBO-PRO-1YEAR-7788' : 'e.g. IBO-PRO-1YEAR-7788'}
                      value={portalCodeInput}
                      onChange={(e) => setPortalCodeInput(e.target.value)}
                      className="flex-1 bg-black border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase tracking-wider focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={activatingSub}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {activatingSub ? '...' : (isAr ? 'تفعيل' : 'Activate')}
                    </button>
                  </div>

                  {portalSubError && (
                    <p className="text-[11px] text-rose-500 font-bold">⚠️ {portalSubError}</p>
                  )}
                  {portalSubSuccess && (
                    <p className="text-[11px] text-emerald-500 font-bold">✅ {portalSubSuccess}</p>
                  )}
                </form>

                {/* Instant Simulation renewal block for client testing on VPS */}
                <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between gap-4">
                  <span className="text-[10px] text-gray-500 leading-normal">
                    {isAr ? 'محاكاة دفع الماستركارد/الفيزا (سنة واحدة):' : 'Simulate Card/PayPal Payment (1 Year):'}
                  </span>
                  <button
                    type="button"
                    onClick={handlePortalSimulate}
                    disabled={activatingSub}
                    className="text-xs text-amber-500 hover:underline font-bold"
                  >
                    🚀 {isAr ? 'تفعيل تجريبي فوري' : 'Activate Free 1 Year'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Playlist Form Expansion Card */}
          {showAddForm && (
            <div className="bg-gray-950/90 border border-gray-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-900 pb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  <span>{dict.addBtn}</span>
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Form type tabs */}
              <div className="flex border-b border-gray-900">
                <button
                  type="button"
                  onClick={() => setFormType('m3u')}
                  className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                    formType === 'm3u' 
                      ? 'border-blue-500 text-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {dict.m3uTab}
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('xtream')}
                  className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                    formType === 'xtream' 
                      ? 'border-blue-500 text-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {dict.xtreamTab}
                </button>
              </div>

              <form onSubmit={handleAddPlaylist} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 block">{dict.playlistName}</label>
                  <input 
                    type="text" 
                    placeholder={isAr ? 'مثال: اشتراك القنوات العام' : 'e.g. Platinum Premium IPTV'} 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  />
                </div>

                {formType === 'm3u' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 block">{dict.playlistUrl}</label>
                    <input 
                      type="url" 
                      placeholder="http://example.com/get.php?auth=user&pass=key" 
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-xs font-semibold text-gray-400 block">{dict.hostLabel}</label>
                      <input 
                        type="url" 
                        placeholder="http://xtreampower.com:8080" 
                        value={formHost}
                        onChange={(e) => setFormHost(e.target.value)}
                        className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 block">{dict.userLabel}</label>
                      <input 
                        type="text" 
                        placeholder="Username" 
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-400 block">{dict.passLabel}</label>
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-black/60 border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2.5 px-5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-sm font-medium transition-all"
                  >
                    {dict.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2.5 px-6 bg-${colorName}-600 hover:bg-${colorName}-500 text-${colorName === 'amber' ? 'black' : 'white'} rounded-xl text-sm font-bold transition-all flex items-center gap-2`}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{dict.saveBtn}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Connected Playlists List */}
          <div className="bg-gray-950/60 border border-gray-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-bold text-md flex items-center gap-2 border-b border-gray-900 pb-3">
              <ListMusic className="w-5 h-5 text-blue-500" />
              <span>{isAr ? 'الاشتراكات والملفات النشطة' : 'Active Lines & Subscriptions'} ({playlists.length})</span>
            </h3>

            {playlists.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-500 text-sm">{dict.noPlaylists}</p>
                <button 
                  onClick={triggerAppLoadDemo}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {isAr ? '💡 أتريد تجربة قائمة ديمو مجانية للفحص الفوري للتطبيق؟' : '💡 Load a public IPTV demo list to verify player functions?'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id} 
                    className="bg-black/60 border border-gray-900 hover:border-gray-800 p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{playlist.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-900 rounded text-gray-500 font-mono uppercase">
                            {playlist.type}
                          </span>
                          <span className="text-xs text-gray-600 truncate max-w-xs md:max-w-md">
                            {playlist.type === 'm3u' ? playlist.url : (playlist as any).host}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      disabled={loading}
                      className="p-2 bg-red-600/10 hover:bg-red-600/20 hover:scale-105 text-red-500 rounded-lg transition-all"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prominent Footer Legal Disclaimer */}
      <div className="bg-gray-950/60 border border-gray-900 p-5 rounded-2xl space-y-2 text-center select-none text-xs text-gray-500 font-sans mt-8 leading-relaxed">
        <div className="flex items-center justify-center gap-2 text-yellow-500/80 font-bold mb-1">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'تنويه قانوني ومسؤولية' : 'LEGAL COMPLIANCE STATEMENT'}</span>
        </div>
        <p>{dict.playerDisclaimer}</p>
      </div>

      {/* Official FLIX GHOST IPTV Portal & Support Section */}
      <div className="bg-gradient-to-br from-[#121216]/80 via-[#0a0a0c]/90 to-[#08080a] border border-cyan-500/10 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-gray-900 pb-3">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold text-sm tracking-wide uppercase">
            {isAr ? 'روابط التفعيل والدعم الرسمية لـ FLIX GHOST' : 'Official FLIX GHOST Links & Support'}
          </h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          {isAr 
            ? 'إذا كنت تستخدم مشغل FLIX GHOST على شاشتك وترغب في تفعيل تطبيقك أو مراجعة اشتراكاتك مباشرة من السيرفر الرسمي، يمكنك الانتقال عبر الروابط المباشرة التالية:'
            : 'If you are configuring your device on the official FLIX GHOST network or seeking troubleshooting resources, access the designated portals below:'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a 
            href="https://flixghost.com/device/login" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="flex items-center justify-between p-3 bg-black/60 border border-gray-800 hover:border-cyan-500/30 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔐</span>
              <div className="text-left">
                <span className="text-xs text-gray-400 block uppercase font-mono">{isAr ? 'تسجيل دخول الجهاز' : 'Device Portal'}</span>
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">flixghost.com/device/login</span>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors ${isAr ? 'rotate-180' : ''}`} />
          </a>

          <a 
            href="https://flixghost.com/support" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="flex items-center justify-between p-3 bg-black/60 border border-gray-800 hover:border-cyan-500/30 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💬</span>
              <div className="text-left">
                <span className="text-xs text-gray-400 block uppercase font-mono">{isAr ? 'الدعم الفني والمساعدة' : 'Technical Support'}</span>
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">flixghost.com/support</span>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors ${isAr ? 'rotate-180' : ''}`} />
          </a>
        </div>
      </div>
    </div>
  );
}
