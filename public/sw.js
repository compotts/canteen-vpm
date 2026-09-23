self.addEventListener("push", (event ) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "Напоминание о заказе";
  const options = {
    body: data.body || "Не забудьте заказать обед.",
    tag: data.tag || "order-reminder",
    renotify: true,
    data: { url: data.url || "/order" },
    icon: "/icons/icon-192.webp",
    badge: "/icons/icon-192.webp",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url || "/order",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});