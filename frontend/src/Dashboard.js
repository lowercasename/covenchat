import React, { Component } from 'react';

import StatusBar from './StatusBar';
import Map from './Map';
import ChatDrawer from './ChatDrawer';
import Altar from './Altar';
import Settings from './Settings';

import { toast } from 'react-toastify';
import Pusher from 'pusher-js';

import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCommentDots, faStar, faUsers, faEyeSlash, faEdit, faArrowsAltH, faSmile} from '@fortawesome/free-solid-svg-icons';
import { faComments, faCompass } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faComments, faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCompass, faCommentDots, faStar, faUsers, faEyeSlash, faEdit, faArrowsAltH, faSmile)

toast.configure()

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visibleModule: 'loader',
            user: this.props.user,
            altarUser: this.props.user
        }
        this.logOut = this.logOut.bind(this);
        this.changeAltarUser = this.changeAltarUser.bind(this);
        this.handleStatusBarUpdate = this.handleStatusBarUpdate.bind(this);
        this.handleSettingsInputChange = this.handleSettingsInputChange.bind(this);

    }

    componentDidMount() {
        // Module to show a particular user's altar if an /altar/:username URL is supplied
        if (this.props.match.params[0]) {
            if (this.props.match.params[0] === this.props.user.username) {
                this.setState({
                    visibleModule: 'altar',
                    user: this.props.user,
                    altarUser: this.props.user
                })
            } else {
                fetch('/api/user/fetch-by-username/'+this.props.match.params[0])
                .then(res => {
                    if (res.status === 200) {
                        return res.json();
                    } else {
                        this.props.history.push('/');
                    }
                })
                .then(res => {
                    this.setState({
                        visibleModule: 'altar',
                        user: this.props.user,
                        altarUser: res.user[0]
                    })
                })
            }
        } else {
            this.setState({visibleModule: 'map'}, () => {
                this.refs.map.resize();
            });
        }

        function urlBase64ToUint8Array(base64String) {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);

          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        }

        navigator.serviceWorker.register('webpush-service-worker.js');

        navigator.serviceWorker.ready
        .then((registration) => {

          return registration.pushManager.getSubscription()
          .then(async (subscription) => {

            if (subscription) {
                console.log("Haz subscription")
              return subscription;
            }

            const response = await fetch('/api/webpush/get-key');
            const vapidPublicKey = await response.text();

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            return registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            });
          });
      }).then((subscription) => {
          fetch('/api/webpush/register', {
            method: 'post',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify({
                userID: this.state.user._id,
                subscription: subscription
            }),
          });
        });

        const NotificationToast = ({ notification, username, closeToast }) => {
            function handleClick(){
                fetch('/api/link/upsert', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fromUsername: notification.sender,
                        toUsername: username,
                    })
                });
                fetch('/api/user/delete-notification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        notificationID: notification._id
                    })
                })
                .then(res => {
                    if (res.status === 200) {
                        closeToast();
                    }
                })
            }

            return (
                <div>
                    {notification.text}
                    {notification.buttonText &&
                        <button
                            onClick={handleClick}
                        >
                            {notification.buttonText}
                        </button>
                    }
                </div>
            )
        };

        const CloseButton = ({ notification, username, closeToast }) => {
            function handleClick(){
                fetch('/api/user/delete-notification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        notificationID: notification._id
                    })
                })
                .then(res => {
                    if (res.status === 200) {
                        closeToast();
                    }
                })
            }

            return (
                <button
                    style={{position: "absolute", right: "8px", bottom: "8px"}}
                    onClick={handleClick}
                >
                    Reject request
                </button>
            )
        };

        fetch('/api/user/fetch-notifications')
        .then(res => res.json())
        .then(res => {
            res.notifications.forEach(notification => {
                if (notification.buttonText) {
                    // User has to interact with this notification
                    toast(<NotificationToast notification={notification} username={res.username}/>, {
                        autoClose: false,
                        className: 'green-toast',
                        closeButton: <CloseButton notification={notification} username={res.username} />
                    });
                } else {
                    // Just an update
                    toast(<NotificationToast notification={notification} username={res.username}/>, {
                        className: 'green-toast',
                    });
                    fetch('/api/user/delete-notification', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: res.username,
                            notificationID: notification._id
                        })
                    })
                }
            })
        })
        fetch('api/pusher/getkey')
        .then(res => res.json())
        .then(payload => {
            var pusher = new Pusher(payload.key, {
                cluster: 'eu',
                forceTLS: true
            });
            pusher.connection.bind('connected', () => {
                this.setState({socketId: pusher.connection.socket_id});
            });
            var notificationsChannel = pusher.subscribe('notifications');
            notificationsChannel.bind('notification-sent', data => {
                if (data.username === this.props.user.username) {
                    if (data.notification.buttonText) {
                        // User has to interact with this notification
                        toast(<NotificationToast notification={data.notification} username={this.props.user.username}/>, {
                            autoClose: false,
                            className: 'green-toast',
                            closeButton: <CloseButton notification={data.notification} username={this.props.user.username} />
                        });
                    } else {
                        // Just an update
                        toast(<NotificationToast notification={data.notification} username={this.props.user.username}/>, {
                            className: 'green-toast'
                        });
                        fetch('/api/user/delete-notification', {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                username: this.props.user.username,
                                notificationID: data.notification._id
                            })
                        })
                    }

                }
            })
        });

    }

    toggleView(module) {
        this.setState({
            visibleModule: module
        }, () => {
            if (module === "map") {
                this.refs.map.resize();
            }
        })
        window.history.replaceState({}, null, '/');
    }

    changeAltarUser(user) {
        this.setState({
            visibleModule: 'altar',
            altarUser: user
        })
    }

    logOut() {
        fetch('/api/user/logout', {
            method: 'POST'
        })
            .then(res => {
                if (res.status === 200) {
                    this.props.history.push('/welcome');
                } else {
                    const error = new Error(res.error);
                    throw error;
                }
            })
            .catch(err => {
                console.error(err);
                alert('Error logging out! Please try again.');
            });
    }

    handleStatusBarUpdate(event) {
        const target = event.target;
        fetch('/api/user/settings/update',
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'statusBar',
                    setting: "statusBarModules." + target.name,
                    value: target.checked
                })
            })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then(res => {
                this.setState({
                    user: res.user,
                    altarUser: res.user
                })
            })
    }

    handleSettingsInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        fetch('/api/user/settings/update',
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'setting',
                    setting: name,
                    value: value
                })
            })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                }
            })
            .then(res => {
                this.setState({
                    user: res.user,
                    altarUser: res.user
                })
            })
    }

    render() {
        return (
            <div className="App">
                <nav className="sideNav">
                    <img alt="CovenChat logo" src="/magic-ball-alt.svg" className="navLogo" />
                    <div className={["navIcon", (this.state.visibleModule === "map" ? "active" : "")].join(" ")} onClick={() => this.toggleView('map')}>
                        <FontAwesomeIcon icon={['far', 'compass']} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule === "chat" ? "active" : "")].join(" ")} onClick={() => this.toggleView('chat')}>
                        <FontAwesomeIcon icon={['far', 'comments']} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule === "altar" ? "active" : "")].join(" ")} onClick={() => this.toggleView('altar')}>
                        <span className="hermetica-F032-pentacle" style={{ fontSize: "40px" }} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule === "settings" ? "active" : "")].join(" ")} onClick={() => this.toggleView('settings')}>
                        <FontAwesomeIcon icon="cog" />
                    </div>
                </nav>
                <main className="content">
                    <div id="loader" style={{display: (this.state.visibleModule === "loader" ? "flex" : "none")}}>
                        <div className="lds-dual-ring"></div>
                    </div>
                    <Map
                        ref="map"
                        user={this.state.user}
                        isVisible={this.state.visibleModule === "map" ? true : false}
                        locationPermission={this.state.user.settings.shareLocation}
                        changeAltarUser={this.changeAltarUser}
                    />
                    <ChatDrawer
                        isVisible={this.state.visibleModule === "chat" ? true : false}
                        user={this.state.user}
                        changeAltarUser={this.changeAltarUser}
                    />
                    <Altar
                        isVisible={this.state.visibleModule === "altar" ? true : false}
                        user={this.state.altarUser}
                        changeAltarUser={this.changeAltarUser}
                    />
                    <Settings
                        isVisible={this.state.visibleModule === "settings" ? true : false}
                        user={this.state.user}
                        handleSettingsInputChange={this.handleSettingsInputChange}
                        handleStatusBarUpdate={this.handleStatusBarUpdate}
                        logOut={this.logOut}
                    />
                    <StatusBar
                        modules={this.state.user.settings.statusBarModules}
                    />
                </main>
            </div>
        );
    }
}

export default Dashboard;
