# AI Studio — قواعد مهمة لتعديل هذا المشروع

## هيكل المشروع والـ API

```
المستخدم (المتصفح) → fgtv.qzz.io (Cloudflare Pages) → functions/api/*.js (Pages Functions) → https://api.fgtv.qzz.io (nginx + SSL) → ghost-api:3002 (Express)
```

## قواعد لا تتغير أبداً

### 1. ملفات functions/api/*.js — لا تحذفها أبداً ولا تغير هيكلها

هذه 10 ملفات يجب أن تبقى موجودة دائماً في `functions/api/`:

```
functions/api/
├── admin/
│   ├── generate-key.js
│   └── keys.js
├── device/
│   ├── activate.js
│   └── status.js
├── playlist/
│   ├── delete.js
│   ├── get.js
│   └── save.js
└── proxy/
    ├── m3u.js
    ├── stream.js
    └── xtream.js
```

**كل ملف يجب أن يحتوي على هذا الكود بالضبط (مع حفظ الـ headers):**

```javascript
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = 'https://api.fgtv.qzz.io' + url.pathname + url.search;
  try {
    const response = await fetch(targetUrl, { method: request.method, headers: request.headers, body: request.method === 'GET' ? undefined : request.body });
    const respHeaders = new Headers(response.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(response.body, { status: response.status, headers: respHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

**⚠️ أهم شيء: `headers: request.headers` في fetch — لازم يكون موجود في كل POST requests.** بدونها، الـ Content-Type ما يوصلش للـ backend و Express ما يقدرش يقرا req.body ويرجع error.

### 2. السيرفر الرئيسي (ghost-api) يشغله Docker على المنفذ 3002

السيرفر الرئيسي يشغل الكود من `/root/flix-central-v1/ghost-api-backend/server.ts`. أي تغيير في API endpoints لازم ينعكس في:
- ملف الـ Express server (server.ts)
- ملف Pages Function المناسب في `functions/api/`
- كود الـ frontend

### 3. لا تستخدم _worker.js أو _middleware.js أو [[catchall]].js

- `_worker.js` في جذر المشروع لا يعمل (يتطلب build step معقد)
- `_middleware.js` لا يعمل كـ catch-all لـ `/api/*`
- `[[catchall]].js` يسبب فشل في الـ build
- **الحل الوحيد اللي يشتغل:** ملفات فردية في `functions/api/**/*.js`

### 4. لا تستخدم http:// لطلب الـ backend من Pages Functions

Cloudflare Workers/Pages Functions **تمنع** طلبات `http://` لعناوين IP. استخدم `https://api.fgtv.qzz.io` دائماً. هذا يعمل لأن `api.fgtv.qzz.io` عنده شهادة SSL من Let's Encrypt و nginx يمرر الطلبات للـ backend.

### 5. معالجة الأخطاء في PortalView.tsx

عند قراءة رسالة الخطأ من الـ API، استخدم:
```typescript
setError(errorData.error || errorData.message || dict.generalError);
```
لأن السيرفر يرجع `{ error: "..." }` وليس `{ message: "..." }`.

### 6. Build command

`npm run build` يشغل `vite build` فقط. لا تضيف esbuild أو cp أو أي خطوات إضافية.

### 7. إعدادات Cloudflare Pages

- Build command: `npm run build`
- Publish directory: `dist`
- Root directory: `/`
- Functions directory: `functions/` (افتراضي)
- Compatibility date: `2026-07-06`
