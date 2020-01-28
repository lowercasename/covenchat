import React, { Component } from 'react';
import { BrowserView, MobileView, isBrowser, isMobile } from "react-device-detect";
import WindowFocusHandler from './components/WindowFocusHandler';
import StatusBar from './StatusBar';
import Map from './Map';
import ChatDrawer from './ChatDrawer';
import Altar from './Altar';
import Settings from './Settings';
import { toast } from 'react-toastify';
import openSocket from 'socket.io-client';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCommentDots, faStar, faUsers, faEyeSlash, faEdit, faArrowsAltH, faSmile} from '@fortawesome/free-solid-svg-icons';
import { faComments, faCompass } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faComments, faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCompass, faCommentDots, faStar, faUsers, faEyeSlash, faEdit, faArrowsAltH, faSmile)

toast.configure();

// toast('🦄 A freshly toasted test toast.', {
//     className: 'green-toast',
//     autoClose: false,
//     closeButton: true
// });

const socket = openSocket(process.env.REACT_APP_HOST);

const Modal = ({ handleClose, show, children }) => {
    var showHideClassName = show ? "modal display-block" : "modal display-none";

    return (
      <div className={showHideClassName}>
        <section className="modal-main">
            <button className="modalClose" onClick={handleClose}><FontAwesomeIcon icon="times" /></button>
            {children}
        </section>
      </div>
    );
};

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connected: true,
            visibleModule: 'loader',
            user: this.props.user,
            altarUser: this.props.user,
            totalUnreadMessages: 0,
            permissionsModalVisible: false,
            askForWebPushNotifications: false,
            askForGeolocationNotifications: false
        }
        this.logOut = this.logOut.bind(this);
        this.changeAltarUser = this.changeAltarUser.bind(this);
        this.handleStatusBarUpdate = this.handleStatusBarUpdate.bind(this);
        this.handleSettingsInputChange = this.handleSettingsInputChange.bind(this);
    }

    componentDidMount() {
        // Check connection to server every 3 seconds
        setInterval(() => {
            if (socket.connected) {
                this.setState({connected: true});
            } else {
                this.setState({connected: false});
            }
        }, 3000);

        // Get number of unread messages every 3 seconds
        this.getUnreadMessages = () => {
            fetch('/api/chat/room/fetch-joined/')
            .then(res => res.json())
            .then(payload => {
                let totalUnreadMessages = payload.reduce((total, room) => total + room.unreadMessages, 0);
                if (totalUnreadMessages > 9) {
                    totalUnreadMessages = '!'
                }
                this.setState({
                    totalUnreadMessages: totalUnreadMessages
                });
            });
        }
        this.getUnreadMessages();
        setInterval(() => {
            this.getUnreadMessages();
        }, 3000);

        socket.emit('user-online', this.state.user);

        // Module to show a particular user's altar if an /altar/:username URL is supplied
        if (this.props.match.params[0]) {
            console.log("ALTAR FUNCTION: attempting to send to an altar")
            if (this.props.match.params[0] === this.props.user.username) {
                console.log("ALTAR FUNCTION: altar is user's!");
                this.setState({
                    visibleModule: 'altar',
                    user: this.props.user,
                    altarUser: this.props.user
                })
            } else {
                console.log("ALTAR FUNCTION: altar is someone else's!");
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
                if (this.refs.map) {
                this.refs.map.resize();
                }
            });
        }

        if (this.props.user.webpushPermissionRequested === false && Notification.permission !== "granted" && Notification.permission !== "denied") {
            this.setState({permissionsModalVisible: true, askForWebPushNotifications: true})
            Notification.requestPermission();
            fetch('/api/permission/update/webpush', { method: 'POST' });
        };
        const checkGeolocationPermission = async () => {
            let geolocationPermission = await navigator.permissions.query({name:'geolocation'}).then(result => {return result.state});
            if (this.props.user.geolocationPermissionRequested === false && geolocationPermission !== "granted" && geolocationPermission !== "denied") {
                this.setState({permissionsModalVisible: true, askForGeolocationNotifications: true})
                fetch('/api/permission/update/geolocation', { method: 'POST' });
            };
        }
        if (navigator.permissions) {
        checkGeolocationPermission();
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

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('webpush-service-worker.js');

            navigator.serviceWorker.ready
            .then((registration) => {
    
              return registration.pushManager.getSubscription()
              .then(async (subscription) => {
    
                if (subscription) {
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
        }
    
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
                // console.log("Notification", notification._id)
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

        socket.on('notification-sent', payload => {
            if (payload.username === this.props.user.username) {
                if (payload.notification.buttonText) {
                    // User has to interact with this notification
                    toast(<NotificationToast notification={payload.notification} username={this.props.user.username}/>, {
                        autoClose: false,
                        className: 'green-toast',
                        closeButton: <CloseButton notification={payload.notification} username={this.props.user.username} />
                    });
                } else {
                    // Just an update
                    toast(<NotificationToast notification={payload.notification} username={this.props.user.username}/>, {
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
                            notificationID: payload.notification._id
                        })
                    })
                }
            }
        })
    }

    toggleView(module) {
        if (module === "altar") {
            this.setState({
                altarUser: this.props.user
            })
        }
        this.setState({
            visibleModule: module
        }, () => {
            if (module === "map") {
                if (this.refs.map) {
                this.refs.map.resize();
            }
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

    hideModal = () => {
        this.setState({permissionsModalVisible: false})
    }

    renderContent = () => {
        if (isMobile) {
            return <div id="mobileError">
                <p>
                    CovenChat is not yet available on mobile.
                </p>
                <p>
                    Visit us on a desktop browser and let us know if you'd be interested in a mobile app for iOS and Android.
                </p>
                <button
                    onClick={this.logOut}
                    style={{marginBottom:"1rem"}}
                >
                    Sign out
                </button>
            </div>;
        }
        return (
            <div className="App">
                {!this.state.connected &&
                    <>
                        <aside className="disconnectedWarning">You are offline. Attempting to reconnect...</aside>
                        <div className="errorCover">
                            <div className="moon-loader">
                                <div className="disc"></div>
                            </div>
                        </div>
                    </>
                }
                <WindowFocusHandler/>
                <nav className="sideNav">
                    <img alt="CovenChat logo" src="/magic-ball-alt.svg" className="navLogo" />
                    <div className={["navIcon", (this.state.visibleModule === "map" ? "active" : "")].join(" ")} onClick={() => this.toggleView('map')}>
                        <FontAwesomeIcon icon={['far', 'compass']} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule === "chat" ? "active" : "")].join(" ")} onClick={() => this.toggleView('chat')}>
                        <FontAwesomeIcon icon={['far', 'comments']} />
                        {this.state.totalUnreadMessages > 0 && (<span className="badge">{this.state.totalUnreadMessages}</span>)}
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
                        <div className="moon-loader">
                            <div className="disc"></div>
                        </div>
                    </div>
                    <Map
                        ref="map"
                        user={this.state.user}
                        isVisible={this.state.visibleModule === "map" ? true : false}
                        locationPermission={this.state.user.settings.shareLocation}
                        changeAltarUser={this.changeAltarUser}
                        socket={socket}
                    />
                    <ChatDrawer
                        isVisible={this.state.visibleModule === "chat" ? true : false}
                        user={this.state.user}
                        changeAltarUser={this.changeAltarUser}
                        socket={socket}
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
                <Modal show={this.state.permissionsModalVisible} handleClose={this.hideModal}>
                    {this.state.askForGeolocationNotifications &&
                        <>
                            <h2 style={{marginBottom:"1rem"}}>Location</h2>
                            <p style={{marginBottom:"1rem"}}>Allow CovenChat to access your current location in the popup above to show your marker on the map.</p>
                        </>
                    }
                    {this.state.askForWebPushNotifications &&
                        <>
                            <h2 style={{marginBottom:"1rem"}}>Notifications</h2>
                            <p style={{marginBottom:"1rem"}}>Allow CovenChat to send you notifications in the popup above to receive notifications when the app isn't open.</p>
                        </>
                    }
                    <p>You can change these permissions on your Settings page.</p>
                </Modal>
            </div>
        );
    }


    render() {
        return this.renderContent();
    }
}

export default Dashboard;
