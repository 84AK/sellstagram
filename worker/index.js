// Custom Service Worker - Push Notification Handler
// next-pwa v5가 이 파일을 자동으로 sw.js에 병합합니다

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: "Sellstagram", body: event.data.text() };
    }

    const title   = data.title  || "Sellstagram";
    const options = {
        body:    data.body    || "",
        icon:    data.icon    || "/icons/icon-192x192.png",
        badge:   data.badge   || "/icons/icon-192x192.png",
        image:   data.image   || undefined,
        tag:     data.tag     || "sellstagram",
        data:    { url: data.url || "/" },
        vibrate: [100, 50, 100],
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            // 이미 열린 탭이 있으면 포커스
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // 없으면 새 탭
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
