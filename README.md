# Flix Ghost Player - TV Wrapper Packages

تطبيق Hosted Web App指向 FlixNet TV.

## الهيكل

```
tv-wrapper/
├── webos-package/          # LG webOS
│   ├── index.html          # توجيه إلى https://fgtv.qzz.io
│   ├── appinfo.json        # تعريف التطبيق
│   ├── icon.png            # أيقونة 80×80
│   └── color.png           # أيقونة 130×130
├── tizen-package/          # Samsung Tizen
│   ├── index.html          # توجيه إلى https://fgtv.qzz.io
│   ├── config.xml          # تعريف التطبيق
│   └── icon.png            # أيقونة 117×117
└── README.md
```

## تجميع الحزم

### LG webOS (.ipk)
```bash
# 1. ثبت webOS TV SDK
# 2. ضع الملفات في مجلد webos-package
# 3. build
ares-package webos-package -o .
# 4. تثبيت
ares-install --device YOUR_TV com.flixnettv.ghostplayer_1.0.0_all.ipk
```

### Samsung Tizen (.wgt)
```bash
# 1. ثبت Tizen Studio + TV Extension
# 2. أنشئ شهادة من Certificate Manager
# 3. package
tizen package -t wgt -o . -- tizen-package
# 4. sign
tizen package -t wgt -o . --sign YOUR_PROFILE -- tizen-package
# 5. تثبيت
tizen install -n com.flixnettv.ghostplayer.wgt -t YOUR_TV
```

## مميزات Hosted Web App
- تحديثات فورية: أي تعديل على https://fgtv.qzz.io يظهر مباشرة
- تجاوز CORS: الإعدادات تسمح بالوصول لجميع النطاقات
- BYOC: المستخدم يجلب المحتوى الخاص به
