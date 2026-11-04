const CACHE='dicom-static-v1';
const ASSETS=['/assets/logo.png','/assets/medical-banner.png','/assets/sidebar-medical.png','/assets/icon-192.png','/assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dicom-static-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method==='GET'&&url.origin===self.location.origin&&ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});
