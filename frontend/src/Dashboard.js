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
import { faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCommentDots, faStar, faUsers, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faComments, faCompass } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faComments, faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCompass, faCommentDots, faStar, faUsers, faEyeSlash)

toast.configure()

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visibleModule: 'map',
            user: this.props.user,
            altarUser: this.props.user
        }
        this.logOut = this.logOut.bind(this);
        this.changeAltarUser = this.changeAltarUser.bind(this);
        this.handleStatusBarUpdate = this.handleStatusBarUpdate.bind(this);
        this.handleSettingsInputChange = this.handleSettingsInputChange.bind(this);

    }

    componentDidMount() {

        const NotificationToast = ({ notificationText, buttonText, notificationID, notificationSender, username, closeToast }) => {
            function handleClick(){
                fetch('/api/user/delete-notification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        response: "yes",
                        username: username,
                        notificationSender: notificationSender,
                        notificationID: notificationID
                    })
                })
                closeToast();
            }

            return (
                <div>
                    {notificationText}
                    <button
                        onClick={handleClick}
                    >
                        {buttonText}
                    </button>
                </div>
            )
        };

        const CloseButton = ({ notificationID, username, closeToast }) => {
            function handleClick(){
                fetch('/api/user/delete-notification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        response: "no",
                        username: username,
                        notificationID: notificationID
                    })
                })
                closeToast();
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
                toast(<NotificationToast notificationText={notification.text} notificationID={notification._id} notificationSender={notification.sender} buttonText={notification.buttonText} username={res.username}/>, {
                    autoClose: false,
                    className: 'green-toast',
                    closeButton: <CloseButton notificationID={notification._id} username={res.username} />
                });
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
                    toast(<NotificationToast notificationText={data.notification.text} notificationID={data.notification._id} buttonText={data.notification.buttonText} username={this.props.user.username} notificationSender={data.notification.sender}/>, {
                        autoClose: false,
                        className: 'green-toast',
                        closeButton: <CloseButton notificationID={data.notification._id} username={this.props.user.username} />
                    });
                }
            })
        });

    }

    toggleView(module) {
        this.setState({
            visibleModule: module
        })
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
                <nav className="sideNav"><i class="fas fa-compass"></i>
                    <img src="magic-ball-alt.svg" className="navLogo" />
                    <div className={["navIcon", (this.state.visibleModule == "map" ? "active" : "")].join(" ")} onClick={() => this.toggleView('map')}>
                        <FontAwesomeIcon icon={['far', 'compass']} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule == "chat" ? "active" : "")].join(" ")} onClick={() => this.toggleView('chat')}>
                        <FontAwesomeIcon icon={['far', 'comments']} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule == "altar" ? "active" : "")].join(" ")} onClick={() => this.toggleView('altar')}>
                        <span className="hermetica-F032-pentacle" style={{ fontSize: "40px" }} />
                    </div>
                    <div className={["navIcon", (this.state.visibleModule == "settings" ? "active" : "")].join(" ")} onClick={() => this.toggleView('settings')}>
                        <FontAwesomeIcon icon="cog" />
                    </div>
                </nav>
                <main className="content">
                    <Map
                        user={this.state.user}
                        isVisible={this.state.visibleModule === "map" ? true : false}
                        locationPermission={this.state.user.settings.shareLocation}
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
