console.log("I am a service worker.")

self.addEventListener('push', event => {
    console.log('New notification', event)
    const payload = event.data ? event.data.text() : 'no payload';
    // const options = {
    //   body: data.body,
    //   icon: data.icon
    // }
    event.waitUntil(
        self.registration.showNotification("CovenChat", {
            icon: 'http://localhost:3000/magic-ball.png',
            body: payload,
        })
    );
})
