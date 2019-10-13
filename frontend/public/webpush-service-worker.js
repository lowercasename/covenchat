self.addEventListener('push', event => {
    console.log('New notification', event)
    const payload = event.data ? event.data.text() : 'no payload';

    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const windowClient = clientList[i];
                console.log(windowClient.url)
                if ('focus' in windowClient) {
                    // Only send notification if window isn't in focus
                    if (!windowClient.focused) {
                        console.log("He is not focused")
                        self.registration.showNotification("CovenChat", {
                            icon: 'https://coven.chat/magic-ball.png',
                            body: payload,
                        });
                    }
                }
            }
    }));
});

self.addEventListener('notificationclick', function(event) {

    // close the notification
    event.notification.close();

    // see if the current is open and if it is focus it
    // otherwise open new tab
    event.waitUntil(

        self.clients.matchAll().then(function(clientList) {

            if (clientList.length > 0) {
                return clientList[0].focus();
            }

            return self.clients.openWindow('/');
        })
    );
});
