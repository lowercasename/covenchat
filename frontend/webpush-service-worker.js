console.log("Registered service worker")

self.addEventListener('push', function(event) {
    console.log(event);

    const payload = event.data ? event.data.text() : 'no payload';

  event.waitUntil(
    self.registration.showNotification('CovenChat', {
      body: payload,
    })
  );
});
