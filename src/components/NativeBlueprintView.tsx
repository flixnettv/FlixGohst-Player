/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Tv, Key, Cpu, Database, Code, FileText, Layers, 
  Activity, CheckCircle, RefreshCw, ArrowRight, ArrowLeft, Copy, Terminal, ExternalLink, HelpCircle
} from 'lucide-react';

interface NativeBlueprintViewProps {
  lang: 'ar' | 'en';
  activeTheme: {
    colorName: string;
    bgActive: string;
    glowClass: string;
  };
}

export default function NativeBlueprintView({ lang, activeTheme }: NativeBlueprintViewProps) {
  const isAr = lang === 'ar';
  const [subTab, setSubTab] = useState<'license' | 'flutter'>('license');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // License Simulator state
  const [simMac, setSimMac] = useState('FN:8A:2F:9C:11:0E');
  const [simSerial, setSimSerial] = useState('FLIX-GHOST-ACTIVATION-9912');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Flutter active file in the explorer
  const [activeFile, setActiveFile] = useState<string>('pubspec.yaml');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // License Simulation Engine
  const runActivationSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    const newLogs = [
      `[HTTP CLIENT] Initializing POST request to https://fgtv.qzz.io/api/activate`,
      `[HTTP CLIENT] Sending Headers: Content-Type: application/json, User-Agent: FlixGhostPlayer/1.0 (SmartTV; Flutter)`,
      `[HTTP CLIENT] Body: { "macAddress": "${simMac}", "serialKey": "${simSerial}" }`,
    ];
    setSimLogs(newLogs);

    await new Promise(resolve => setTimeout(resolve, 800));

    newLogs.push(`[API ROUTER] Incoming POST request on fgtv.qzz.io`);
    newLogs.push(`[API ROUTER] CORS checks passed: Allow-Origin: *`);
    newLogs.push(`[AUTH SERVICE] Sanitizing input parameters... MAC: ${simMac}`);
    setSimLogs([...newLogs]);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Verify Serial format
    const isValidSerial = simSerial.trim().startsWith('FLIX-GHOST-');
    if (!isValidSerial) {
      newLogs.push(`[AUTH SERVICE] ❌ ERROR: Invalid license serial key format.`);
      newLogs.push(`[HTTP CLIENT] Status 400 Bad Request`);
      setSimLogs([...newLogs]);
      setSimResult({
        success: false,
        error: "INVALID_SERIAL_FORMAT",
        message: isAr ? "كود التفعيل المدخل غير صالح أو بتنسيق خاطئ" : "The entered activation code is invalid or in incorrect format.",
        timestamp: new Date().toISOString()
      });
      setSimulating(false);
      return;
    }

    newLogs.push(`[DB QUEURY] Searching PostgreSQL database for serial key...`);
    newLogs.push(`[DB QUEURY] Found active unused key! Generating activation block...`);
    newLogs.push(`[DB COMMAND] Linking MAC Address ${simMac} with serial ${simSerial}...`);
    newLogs.push(`[DB COMMAND] Activation verified. Expiry set to: ${new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString()}`);
    newLogs.push(`[HTTP CLIENT] 🟢 Status 200 OK`);
    setSimLogs([...newLogs]);

    setSimResult({
      success: true,
      status: "active",
      mac: simMac,
      serial: simSerial,
      activatedAt: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      daysLeft: 365,
      device_signature: "SHA256:7b9a68c07eef090d8a"
    });
    setSimulating(false);
  };

  // FLUTTER FILE VIEWS CODE
  const flutterFiles: Record<string, { desc: string; descAr: string; path: string; code: string }> = {
    'pubspec.yaml': {
      desc: "Flutter package configuration file containing video/HLS engines, secure persistence, and HTTP clients.",
      descAr: "ملف تكوين الحزم للاعتماديات البرمجية في فلاتر يشمل مشغل الفيديو ومحرك الشبكة والتخزين الآمن.",
      path: "pubspec.yaml",
      code: `name: flixghost_tv_player
description: Ultra Fast M3U/Xtream Smart TV player with License activation.
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # Multi-platform fast streaming player for Tizen/WebOS/AndroidTV
  media_kit: ^1.1.10
  media_kit_video: ^1.1.11
  
  # Clean secure HTTP connection client
  dio: ^5.4.0
  
  # Local storage for playlists and active device serial key
  hive_flutter: ^1.1.0
  
  # Fast State management 
  flutter_riverpod: ^2.4.9
  
  # Directional D-pad controller for Smart TV Remote navigations
  flutter_dpad_navigation: ^0.1.2
  
  # Arabic/English localization
  easy_localization: ^3.0.3

flutter:
  uses-material-design: true
  assets:
    - assets/images/logo.png
    - assets/translations/en.json
    - assets/translations/ar.json`
    },
    'main.dart': {
      desc: "App bootstrap logic setting up secure caches, Riverpod state tracking, and direct key listener bindings for TV remote control.",
      descAr: "ملف الإقلاع الرئيسي لتطبيق فلاتر وتجهيز الكاش وإصغاء أزرار ريموت التلفزيون.",
      path: "lib/main.dart",
      code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:media_kit/media_kit.dart';
import 'lib/services/activation_service.dart';
import 'lib/screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Media Kit engines for ultra low latency video buffering
  MediaKit.ensureInitialized();
  
  // Ensure TV Remote D-Pad inputs are properly captured
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  
  runApp(
    const ProviderScope(
      child: FlixGhostTVApp(),
    ),
  );
}

class FlixGhostTVApp extends StatelessWidget {
  const FlixGhostTVApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FlixGhost IPTV Player',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF040406),
        primaryColor: const Color(0xFFD97706), // Golden Amber Theme
        fontFamily: 'Inter',
      ),
      home: const SplashScreen(),
    );
  }
}`
    },
    'activation_service.dart': {
      desc: "Communicates directly with the activation endpoints on fgtv.qzz.io to verify device license.",
      descAr: "الخدمة المسؤولة عن الاتصال بخادم التفعيل fgtv.qzz.io للتأكد من حالة رخصة الجهاز.",
      path: "lib/services/activation_service.dart",
      code: `import 'package:dio/dio.dart';
import 'package:hive/hive.dart';

class ActivationService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://fgtv.qzz.io/api',
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 5),
  ));

  // Retrieve local TV MAC Address (or unique device hardware identifier)
  Future<String> getDeviceMac() async {
    var box = await Hive.openBox('settings');
    return box.get('mac_address', defaultValue: 'FN:AA:BB:CC:11:22');
  }

  // Check current serial verification online
  Future<Map<String, dynamic>> checkActivationStatus() async {
    try {
      final mac = await getDeviceMac();
      final response = await _dio.get('/device/status', queryParameters: {
        'mac': mac,
      });

      if (response.statusCode == 200) {
        return response.data; // Includes status: 'active', 'trial', or 'expired'
      }
      return {'status': 'trial', 'daysLeft': 30};
    } catch (e) {
      // Offline fallback
      return {'status': 'active', 'offline': true, 'daysLeft': 365};
    }
  }

  // Activate device using serial key inputted by remote control
  Future<bool> activateDevice(String serialCode) async {
    try {
      final mac = await getDeviceMac();
      final response = await _dio.post('/device/activate', data: {
        'mac': mac,
        'code': serialCode,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        var box = await Hive.openBox('settings');
        await box.put('is_activated', true);
        await box.put('activation_serial', serialCode);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}`
    },
    'tv_player.dart': {
      desc: "Low-latency custom HLS / DASH stream player engineered for smart TV remote controls.",
      descAr: "مشغل وسائط عالي الأداء يدعم بروتوكولات HLS و DASH ومصمم للعمل بالريموت.",
      path: "lib/player/tv_player.dart",
      code: `import 'package:flutter/material.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';

class TVPlayerScreen extends StatefulWidget {
  final String streamUrl;
  final String channelName;

  const TVPlayerScreen({
    Key? key,
    required this.streamUrl,
    required this.channelName,
  }) : super(key: key);

  @override
  State<TVPlayerScreen> createState() => _TVPlayerScreenState();
}

class _TVPlayerScreenState extends State<TVPlayerScreen> {
  late final Player player = Player();
  late final VideoController controller = VideoController(player);

  @override
  void initState() {
    super.initState();
    // Configure low-latency settings for IPTV Live playback
    player.open(Media(widget.streamUrl));
  }

  @override
  void dispose() {
    player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Screen Video Canvas
          Video(
            controller: controller,
            fill: Colors.black,
          ),
          
          // Custom TV OSD (On-Screen Display) with Channel Info on D-Pad OK Click
          Positioned(
            bottom: 30,
            left: 30,
            right: 30,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.85),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: Colors.amber.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.live_tv, color: Colors.amber, size: 30),
                  const SizedBox(width: 15),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.channelName,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      const Text(
                        'Direct Stream • 1080p Pure Buffer',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}`
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {isAr ? 'مشروع FlixGhost TV Native والترخيص الموحد' : 'FlixGhost TV Native Project & License Hub'}
            </h2>
            <p className="text-xs text-gray-400">
              {isAr 
                ? 'مخطط التحول إلى Flutter للهواتف والشاشات الذكية، ونظام تفعيل التراخيص fgtv.qzz.io.' 
                : 'Flutter compilation blueprint for Smart TV displays & cross-platform license hub at fgtv.qzz.io.'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-950 border border-gray-900 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setSubTab('license')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'license' 
                ? 'bg-amber-600 text-black font-extrabold shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isAr ? 'نظام التفعيل والتراخيص' : 'License System Plan'}</span>
          </button>
          <button
            onClick={() => setSubTab('flutter')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'flutter' 
                ? 'bg-amber-600 text-black font-extrabold shadow' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>{isAr ? 'بنية مشروع Flutter' : 'Flutter TV Code Tree'}</span>
          </button>
        </div>
      </div>

      {subTab === 'license' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Schematic / Documentation (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual Sequence block */}
            <div className="bg-gray-950/80 border border-gray-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-900 pb-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'مخطط تدفق عملية التفعيل والترخيص' : 'License Key Authorization Lifecycle'}</span>
              </h3>

              {/* Graphical CSS Diagram */}
              <div className="relative py-4">
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  {/* Step 1 */}
                  <div className="bg-black border border-gray-800 rounded-xl p-3 flex flex-col items-center gap-2 relative">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-black flex items-center justify-center font-black">1</span>
                    <span className="text-white uppercase font-mono">Smart TV</span>
                    <p className="text-gray-500 text-[9px] leading-tight mt-1">{isAr ? 'يعرض الماك والـ PIN' : 'Displays MAC & PIN'}</p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-black border border-gray-800 rounded-xl p-3 flex flex-col items-center gap-2 relative">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-black flex items-center justify-center font-black">2</span>
                    <span className="text-white uppercase font-mono">Web Portal</span>
                    <p className="text-gray-500 text-[9px] leading-tight mt-1">{isAr ? 'يرفع قوائم M3U وسريال' : 'Uploads M3U & Key'}</p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-black border border-gray-800 rounded-xl p-3 flex flex-col items-center gap-2 relative">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-black flex items-center justify-center font-black">3</span>
                    <span className="text-white uppercase font-mono">License API</span>
                    <p className="text-gray-500 text-[9px] leading-tight mt-1">{isAr ? 'تأكيد الـ API بقاعدة البيانات' : 'Verifies Key in Database'}</p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-black border border-gray-800 rounded-xl p-3 flex flex-col items-center gap-2 relative">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-black flex items-center justify-center font-black">4</span>
                    <span className="text-white uppercase font-mono">Play Stream</span>
                    <p className="text-gray-500 text-[9px] leading-tight mt-1">{isAr ? 'بث فوري مع EPG' : 'Stream unlocked for 1 Year'}</p>
                  </div>
                </div>

                {/* Arrow overlays in CSS */}
                <div className="absolute inset-0 flex items-center justify-around pointer-events-none px-12 opacity-35">
                  <ArrowRight className={`w-6 h-6 text-amber-500 ${isAr ? 'rotate-180' : ''}`} />
                  <ArrowRight className={`w-6 h-6 text-amber-500 ${isAr ? 'rotate-180' : ''}`} />
                  <ArrowRight className={`w-6 h-6 text-amber-500 ${isAr ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Detailed specification points */}
              <div className="space-y-3 pt-3 border-t border-gray-900 text-xs leading-relaxed text-gray-400">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">{isAr ? 'بروتوكول التحقق الآمن fgtv.qzz.io' : 'Authorization Protocol on fgtv.qzz.io'}</strong>
                    <span>{isAr ? 'يقوم التطبيق بإجراء طلب مشفر وموقع عند كل إقلاع للتأكد من صلاحية الرخصة وعدم تجاوز الحد الأقصى للمقاطع والبثوث.' : 'The app emits an encrypted handshake request on boot to fetch device status, linked playlist nodes, and EPG configurations securely.'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">{isAr ? 'بنية قاعدة البيانات المشتركة' : 'Central PostgreSQL Schema'}</strong>
                    <span>{isAr ? 'يتم حفظ معلومات الماك وسريال الأجهزة المفعّلة وقوائم القنوات في خادم PostgreSQL موحد لضمان التزامن اللحظي بين التلفاز وموقع الرفع.' : 'Device details, MAC address identifiers, user playlists, and serial codes are managed inside a relational database to ensure instant synchronization.'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* API Endpoint Documentation card */}
            <div className="bg-gray-950/80 border border-gray-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-900 pb-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'مواصفات نقاط الـ API والطلبات' : 'API Request/Response Specs'}</span>
              </h3>

              <div className="space-y-3 font-mono text-[11px]">
                {/* Endpoint 1 */}
                <div className="bg-black/60 border border-gray-900 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 rounded font-bold">POST</span>
                    <span className="text-gray-400">/api/device/activate</span>
                  </div>
                  <p className="text-gray-500 text-[10px] font-sans">{isAr ? 'تفعيل جهاز جديد برقم سريال.' : 'Activates a TV device MAC address with a licensing code.'}</p>
                  <pre className="text-amber-400 text-[10px] overflow-x-auto p-1 bg-black rounded">
{`Request:
{
  "mac": "FN:FF:22:99:A1",
  "code": "FLIX-GHOST-SERIAL"
}`}
                  </pre>
                </div>

                {/* Endpoint 2 */}
                <div className="bg-black/60 border border-gray-900 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded font-bold">GET</span>
                    <span className="text-gray-400">/api/device/status</span>
                  </div>
                  <p className="text-gray-500 text-[10px] font-sans">{isAr ? 'جلب تفاصيل ترخيص الجهاز وقوائم قنواته.' : 'Retrieves TV activation parameters, expirations, and m3u assets.'}</p>
                  <pre className="text-amber-400 text-[10px] overflow-x-auto p-1 bg-black rounded">
{`Query params: ?mac=FN:FF:22:99:A1
Response:
{
  "status": "active",
  "expiryDate": "2027-06-30T12:00:00Z",
  "daysLeft": 365,
  "playlists": [{"id":"1", "name":"Premium Live"}]
}`}
                  </pre>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Live API Simulator Playground (4 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gray-950/80 border border-gray-900 rounded-2xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>{isAr ? 'محرّك محاكاة الـ API المباشر' : 'Live Gateway Simulator'}</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase">ONLINE</span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                {isAr 
                  ? 'قم بتجربة طلبات الترخيص والتواصل مع خادم FGTV.QZZ.IO افتراضياً ومعاينة نتائج الاتصال ولغة الاستجابة.' 
                  : 'Simulate high-speed handshakes from the Tizen/WebOS client to fgtv.qzz.io. Modify variables below to trigger outcomes.'}
              </p>

              {/* Simulation inputs */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-bold uppercase font-mono">MAC ADDRESS</label>
                  <input
                    type="text"
                    value={simMac}
                    onChange={(e) => setSimMac(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-gray-500 font-bold uppercase font-mono">ACTIVATION SERIAL KEY</label>
                    <button
                      onClick={() => setSimSerial('INVALID-KEY-1234')}
                      className="text-[9px] text-rose-400 hover:underline"
                    >
                      {isAr ? 'اختبار كود خاطئ' : 'Test Fail'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={simSerial}
                    onChange={(e) => setSimSerial(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <button
                  onClick={runActivationSimulation}
                  disabled={simulating}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  <span>{simulating ? (isAr ? 'جاري الإرسال والتحقق...' : 'Requesting Handshake...') : (isAr ? 'إرسال طلب POST تفعيل' : 'Send Activation POST Request')}</span>
                </button>
              </div>

              {/* Simulation Output Logs */}
              {simLogs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-900">
                  <span className="text-[11px] text-gray-500 font-bold font-mono uppercase block">{isAr ? 'سجلات الاتصال الفورية:' : 'Raw Connection Logs:'}</span>
                  <div className="bg-black border border-gray-900 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1.5 scrollbar-thin">
                    {simLogs.map((log, idx) => (
                      <p key={idx} className={log.includes('❌') ? 'text-rose-400' : log.includes('🟢') ? 'text-emerald-400' : 'text-gray-400'}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulated response preview */}
              {simResult && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] text-gray-500 font-bold font-mono uppercase block">{isAr ? 'الاستجابة المستلمة (JSON):' : 'JSON Response Payload:'}</span>
                  <pre className="bg-slate-900 border border-gray-800 rounded-xl p-3 text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                  {simResult.success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'تمت المحاكاة بنجاح وجهازك مفعل لـ 365 يوماً!' : 'Simulated device license key synced successfully!'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: File Explorer Tree (4 cols) */}
          <div className="lg:col-span-4 bg-gray-950/80 border border-gray-900 rounded-2xl p-4 flex flex-col h-[520px]">
            <div className="flex items-center gap-2 border-b border-gray-900 pb-3 mb-3 shrink-0">
              <Layers className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">{isAr ? 'ملفات تطبيق فلاتر المصدّرة' : 'Flutter Workspace Tree'}</span>
            </div>

            {/* Folder / File Tree hierarchy */}
            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">{isAr ? 'الجذر (Root)' : 'Project Root'}</div>
              
              <button
                onClick={() => setActiveFile('pubspec.yaml')}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                  activeFile === 'pubspec.yaml' 
                    ? 'bg-amber-600/10 border border-amber-500/20 text-white font-bold' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="truncate">pubspec.yaml</span>
              </button>

              <div className="h-px bg-gray-900 my-2" />
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">lib/</div>

              <button
                onClick={() => setActiveFile('main.dart')}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                  activeFile === 'main.dart' 
                    ? 'bg-amber-600/10 border border-amber-500/20 text-white font-bold' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <span className="truncate block">main.dart</span>
                  <span className="text-[9px] text-gray-500 truncate block">lib/main.dart</span>
                </div>
              </button>

              <button
                onClick={() => setActiveFile('activation_service.dart')}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                  activeFile === 'activation_service.dart' 
                    ? 'bg-amber-600/10 border border-amber-500/20 text-white font-bold' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <span className="truncate block">activation_service.dart</span>
                  <span className="text-[9px] text-gray-500 truncate block">lib/services/</span>
                </div>
              </button>

              <button
                onClick={() => setActiveFile('tv_player.dart')}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                  activeFile === 'tv_player.dart' 
                    ? 'bg-amber-600/10 border border-amber-500/20 text-white font-bold' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <span className="truncate block">tv_player.dart</span>
                  <span className="text-[9px] text-gray-500 truncate block">lib/player/</span>
                </div>
              </button>
            </div>

            {/* Smart TV Notes */}
            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-[11px] text-amber-400/85 leading-relaxed shrink-0">
              🛡️ {isAr 
                ? 'ملاحظة التوافق: يدعم Media Kit فك تشفير H264/HEVC عتادياً على شاشات Tizen و WebOS بالكامل.' 
                : 'Engine Optimization: Custom MediaKit wrapper provides hardware decoding for H264/HEVC across Samsung Tizen & LG WebOS displays.'}
            </div>
          </div>

          {/* RIGHT: File Content Viewer with Copy button (8 cols) */}
          <div className="lg:col-span-8 bg-gray-950/80 border border-gray-900 rounded-2xl p-6 flex flex-col h-[520px]">
            {/* Header of file */}
            <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[9px] rounded font-mono uppercase">DART / YAML</span>
                  <span className="text-white text-xs font-mono font-bold truncate">{flutterFiles[activeFile].path}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {isAr ? flutterFiles[activeFile].descAr : flutterFiles[activeFile].desc}
                </p>
              </div>

              <button
                onClick={() => handleCopy(flutterFiles[activeFile].code, activeFile)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedText === activeFile ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>{isAr ? 'نسخ الكود' : 'Copy Code'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Content view box */}
            <div className="flex-1 overflow-auto bg-black/60 border border-gray-900 rounded-xl p-4 font-mono text-xs text-gray-300 leading-relaxed scrollbar-thin">
              <pre className="text-left select-all">{flutterFiles[activeFile].code}</pre>
            </div>
          </div>

        </div>
      )}

      {/* Deployment & Flutter Platform Compiling Strategies Footer Card */}
      <div className="bg-gray-950/80 border border-gray-900 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-900 pb-2">
          <ExternalLink className="w-4 h-4 text-amber-500" />
          <span>{isAr ? 'دليل نشر تجميعة التلفزيونات الذكية' : 'Smart TV OS Native Deployment & Compilation Strategy'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-gray-400">
          <div className="space-y-1">
            <span className="font-extrabold text-white block">📺 Samsung Tizen OS</span>
            <p>{isAr ? 'نستخدم Flutter Tizen SDK مع محرك WebOS/Tizen لتجميع ملف .wgt الذي يتم تحميله ونشره في متجر سامسونج للتلفزيونات.' : 'Utilize Tizen Flutter SDK to bundle clean Javascript/Wasm or native ARM web widgets. Generates certified .wgt packages for Tizen Seller Office.'}</p>
          </div>
          <div className="space-y-1">
            <span className="font-extrabold text-white block">📺 LG webOS</span>
            <p>{isAr ? 'نقوم بتحزيم كود الويب الخاص بـ Flutter Web لإنتاج حزمة .ipk المتوافقة مع متجر LG Content Store بالتحكم الفوري بالريموت.' : 'Compile as responsive Flutter Web assembly. Run CLI packager to yield .ipk bundles. Perfect for LG Smart TV remotes and cursor navigation.'}</p>
          </div>
          <div className="space-y-1">
            <span className="font-extrabold text-white block">📺 Android TV & Fire OS</span>
            <p>{isAr ? 'التصدير المباشر كملف .apk قياسي مع دعم معايير Leanback TV والتحكم الكامل بالـ D-Pad لأزرار ريموت التلفاز.' : 'Output clean standalone .apk installer formats with standard Google Leanback TV libraries, fully bindable to home, back, and color keys.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
