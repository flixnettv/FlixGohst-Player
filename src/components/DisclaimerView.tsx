/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Check, HelpCircle, FileText } from 'lucide-react';

interface DisclaimerViewProps {
  lang: 'ar' | 'en';
}

export default function DisclaimerView({ lang }: DisclaimerViewProps) {
  const isAr = lang === 'ar';

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 text-gray-300 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title block */}
      <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
        <div className="p-3 bg-red-600/20 text-red-500 rounded-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isAr ? 'إخلاء المسؤولية القانوني للمتاجر' : 'Legal Store Disclaimer'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAr 
              ? 'يرجى قراءة شروط الخدمة وتأكيد الالتزام للامتثال لمتطلبات النشر على متاجر LG و Samsung.' 
              : 'Please read the terms of service and usage conditions to ensure store policy compliance.'}
          </p>
        </div>
      </div>

      {/* Main warning card */}
      <div className="bg-gradient-to-br from-yellow-600/10 via-yellow-600/5 to-transparent border border-yellow-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-lg shrink-0 mt-1">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-yellow-400 mb-2">
              {isAr ? 'مهم جداً للمراجعين والمستخدمين:' : 'Crucial Information for Reviewers & Users:'}
            </h2>
            <p className="text-sm leading-relaxed text-gray-300">
              {isAr 
                ? 'تطبيق FLIX GHOST Player هو مشغل وسائط متعددة فقط (Media Player Engine). لا يوفر التطبيق أي محتوى من أي نوع، ولا يحتوي على قنوات مسبقة التحميل، ولا يوفر اشتراكات أو روابط IPTV. يجب على العميل إحضار ملف قنواته الخاص (M3U أو Xtream Codes) لاستخدام التطبيق. التطبيق غير مسؤول عن صحة أو قانونية الروابط المضافة من قبل المستخدمين.'
                : 'FLIX GHOST Player is a pure media player engine. The application does not host, provide, sell, or contain any channels, playlists, streams, or media content of any kind. Users must procure and input their own content (via M3U playlist URLs, files, or Xtream Codes logins). FLIX GHOST is completely unaffiliated with any third-party content providers and assumes no liability for played content.'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed compliance points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance 1 */}
        <div className="bg-gray-950/60 border border-gray-900 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Check className="w-5 h-5 text-blue-500 shrink-0" />
            <h3>{isAr ? 'مشغل وسائط محايد' : 'Neutral Media Player'}</h3>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {isAr
              ? 'تم تصميم هذا البرنامج ليعمل كـ مشغل عام فقط لملفات m3u و m3u8 و hls وغيرها. تماماً مثل مشغلات الوسائط الشهيرة (مثل VLC أو MX Player)، لا يمتلك التطبيق خوادم للمحتوى ولا يرتبط بأي مزود خدمة.'
              : 'Designed to function exclusively as a general media viewer for m3u, m3u8, HLS, and other formats. Similar to media players like VLC or MX Player, the app does not operate stream servers or maintain provider partnerships.'}
          </p>
        </div>

        {/* Compliance 2 */}
        <div className="bg-gray-950/60 border border-gray-900 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Check className="w-5 h-5 text-blue-500 shrink-0" />
            <h3>{isAr ? 'حماية حقوق الملكية الفكرية' : 'IPR Copyright Protection'}</h3>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {isAr
              ? 'نحن ندعم بشدة حقوق الطبع والنشر. لا يروج التطبيق أو يسهل الوصول إلى المحتوى المحمي بملكية فكرية دون إذن رسمي. أي بث يتم تشغيله داخل التطبيق هو تحت المسؤولية القانونية الكاملة للمستخدم ومزود البث الخاص به.'
              : 'We strictly support intellectual property rights. The application does not facilitate, promote, or encourage unauthorized copyrighted content access. All streams configured in the app run solely under the users and providers accountability.'}
          </p>
        </div>

        {/* Compliance 3 */}
        <div className="bg-gray-950/60 border border-gray-900 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Check className="w-5 h-5 text-blue-500 shrink-0" />
            <h3>{isAr ? 'متطلبات النشر على متاجر التلفزيون' : 'Smart TV Store Compliance'}</h3>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {isAr
              ? 'تلتزم هذه الشروط وإخلاء المسؤولية التزاماً تاماً بسياسات متجر LG Content Store ومتجر Samsung Smart Hub (Tizen) لمنع رفض التطبيقات وضمان النشر الآمن والسريع للعملاء.'
              : 'These conditions comply fully with the policies of the LG Content Store and Samsung Smart Hub (Tizen) store to guarantee streamlined application publication without rejection risk.'}
          </p>
        </div>

        {/* Compliance 4 */}
        <div className="bg-gray-950/60 border border-gray-900 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Check className="w-5 h-5 text-blue-500 shrink-0" />
            <h3>{isAr ? 'أمان وسرية البيانات' : 'Data Privacy & Safety'}</h3>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {isAr
              ? 'يتم تخزين بيانات القنوات والعناوين بشكل آمن. تصفحك وتشغيلك يتم مباشرة عبر جهازك ولا يتم مشاركته أو تخزينه خارج خادمك الخاص.'
              : 'User lists are stored in highly secure formats. Channel browsing and media queries occur locally on the user device and are never harvested or distributed externally.'}
          </p>
        </div>
      </div>

      {/* Certification Footer */}
      <div className="border-t border-gray-900 pt-6 text-center text-xs text-gray-500 space-y-2">
        <p>FLIX GHOST IPTV Player Version 1.0.0 (Smart TV Build)</p>
        <p>© 2026 FLIX GHOST Media. All rights reserved. Developed to exceed standard player guidelines.</p>
      </div>
    </div>
  );
}
