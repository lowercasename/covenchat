import React, { Component, Fragment } from 'react';
import 'simplebar';
import 'simplebar/dist/simplebar.css';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css'
import TextareaAutosize from 'react-autosize-textarea';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'
import './ChatDrawer.css';
import Modal from './components/Modal.js';
import { CreateRoomControls, EditRoomControls, JoinLeaveRoomControls, InviteToRoomControls, HideRoomControls } from './components/RoomControls';

function scrollToBottom() {
    var messages = document.querySelector('#chatWindow .simplebar-content-wrapper');
    messages.scrollTo({ top: messages.scrollHeight, behavior: "auto" });
}

class UserFlair extends Component {
    render() {
        if (this.props.user.settings.flair) {
            return (
                <span className="userFlair"><img src={this.props.user.settings.flair} alt={"Flair icon for " + this.props.user.username} />&nbsp;</span>
            )
        } else {
            return false;
        }
    }
}

class MessageList extends Component {
    constructor() {
        super();
        this.messageList = React.createRef();
    }

    onScroll = () => {
        let messages = document.querySelector('#chatWindow .simplebar-content-wrapper');
        let scrollTop = messages.scrollTop;
        if (scrollTop <= 0) {
            if (document.querySelector('#chatWindow .messageContainer')) {
                let lastMessage = document.querySelector('#chatWindow .messageContainer').id;
                this.props.infiniteScroll(lastMessage);
            }
        }
    };

    render() {
        function displayTimestamp(timestamp) {
            function addZero(i) {
                if (i < 10) {
                    i = "0" + i;
                }
                return i;
            }

            var dateObject = new Date(timestamp);
            return addZero(dateObject.getHours()) + ":" + addZero(dateObject.getMinutes());
        }
        function sameDay(d1, d2) {
            var dateObject1 = new Date(d1);
            var dateObject2 = new Date(d2);
            return dateObject1.getFullYear() === dateObject2.getFullYear() &&
                dateObject1.getMonth() === dateObject2.getMonth() &&
                dateObject1.getDate() === dateObject2.getDate();
        }
        function isToday(timestamp) {
            var dateObject = new Date(timestamp);
            var today = new Date();
            return dateObject.getFullYear() === today.getFullYear() &&
                dateObject.getMonth() === today.getMonth() &&
                dateObject.getDate() === today.getDate();
        }
        function dayMessage(d1, d2) {
            if (!sameDay(d1, d2)) {
                var dateObject = new Date(d1);
                if (isToday(dateObject)) {
                    return (
                        <li className="dateMessage" key={d1}><span>Today</span></li>
                    )
                } else {
                    return (
                        <li className="dateMessage" key={d1}>
                            <span>
                                {dateObject.getDate() + " " + dateObject.toLocaleString('default', { month: 'long' }) + " " + dateObject.getFullYear()}
                            </span>

                        </li>
                    )
                }

            }
        }
        return (
            <div className="chatWindow" id="chatWindow" data-simplebar ref={this.messageList} onScroll={this.onScroll}>
                <ul className="messageList">
                    {this.props.messages.map((message, i, arr) => {
                        let lastTimestamp = arr[i-1] ? arr[i-1].timestamp : false;
                        let lastAuthor = arr[i-1] ? arr[i-1].user.username : false;
                        let lastType = arr[i-1] ? arr[i-1].type : false;
                        let messageMentionsYou = message.mentions.includes(this.props.user.username);
                        return (
                            <Fragment key={message._id}>
                                {dayMessage(message.timestamp, lastTimestamp)}
                                <li key={message._id} className={["messageContainer", (messageMentionsYou ? "mentionMessage" : "")].join(" ")} id={message._id}>
                                    <div key={message._id} className={message.type}>
                                        <span className={["messageMetadata", (message.user.username === lastAuthor) && (lastType === "message") ? "hidden" : ""].join(' ')}>
                                            <span className="messageTimestamp">
                                                {displayTimestamp(message.timestamp)}
                                            </span>
                                            <span className="messageAuthor">
                                            <UserFlair user={(message.user.username === this.props.user.username ? this.props.user : message.user)} />{message.user.username}
                                            </span>
                                        </span>

                                        <span className="messageContent" dangerouslySetInnerHTML={{__html: message.content}}></span>
                                        { message.type === "tarot" && (
                                            <div className="spread">
                                                {message.tarot.map((card, index) => {
                                                    return (
                                                        <Tooltip
                                                            key={message._id + "_image_" + index}
                                                            title={"<strong>" + card.name + "</strong><br><hr>" + (card.keywords ? card.keywords : "")}
                                                            position="bottom"
                                                            trigger="mouseenter"
                                                            theme="left"
                                                            delay={300}
                                                            className="tarotContainer"
                                                        >
                                                            <img
                                                                key={message._id + "_image_" + index}
                                                                className="tarotCard"
                                                                src={card.image}
                                                                alt={card.name}
                                                            />
                                                        </Tooltip>

                                                    )
                                                })}
                                            </div>
                                        )}
                                        { message.type === "runes" && (
                                            <div className="spread">
                                                {message.runes.map((rune, index) => {
                                                    return (
                                                        <Tooltip
                                                            key={message._id + "_image_" + index}
                                                            title={"<strong>" + rune.name + "</strong><br><hr>" + (rune.meaning ? rune.meaning : "")}
                                                            position="bottom"
                                                            trigger="mouseenter"
                                                            theme="left"
                                                            delay={300}
                                                            className="runeContainer"
                                                        >
                                                            <img
                                                                className="runestone"
                                                                src={rune.image}
                                                                alt={rune.name}
                                                            />
                                                        </Tooltip>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            </Fragment>
                        )
                    })}
                </ul>
            </div>
        )
    }
}

class RoomList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            joinedRooms: this.props.joinedRooms,
            publicRooms: this.props.publicRooms,
            directMessages: this.props.directMessages
        }
    }

    render() {
        function unreadIndicator(number) {
            if (number === 0) {
                return false;
            } else if (number > 50) {
                return (
                    <span className="badge">50+</span>
                )
            } else {
                return (
                    <span className="badge">{number}</span>
                )
            }
        }
        return (
            <nav className="roomList">
                <div className="roomListInner">
                    <header>
                        <h2><FontAwesomeIcon icon="moon"/> Your Covens </h2>
                        <CreateRoomControls />
                    </header>
                    <ul>
                        {this.props.joinedRooms.map(room => {
                            return (
                                <Tooltip
                                    key={room._id}
                                    title={"<strong>" + room.name + "</strong><br>" + room.description + "<br><hr>" + (room.public ? "Public" : "Private") + " Coven, " + room.members.length + " " + (room.members.length > 1 ? "members" : "member")}
                                    position="right"
                                    trigger="mouseenter"
                                    theme="left"
                                    delay={300}
                                    popperOptions={{modifiers: {
                                        preventOverflow: {
                                          escapeWithReference: true
                                        }
                                    }}}
                                >
                                    <li
                                        className={(room.slug === this.props.currentRoom.slug ? "active" : "")}
                                        onClick={() => {this.props.switchRoom(room.slug)}}
                                    >
                                        {room.name}
                                        {room.slug !== this.props.currentRoom.slug && unreadIndicator(room.unreadMessages)}
                                    </li>
                                </Tooltip>
                            )
                        })}
                    </ul>
                    {this.props.publicRooms.length > 0 ? (
                        <header><h2 style={{marginTop: "0.5rem"}}><FontAwesomeIcon icon="users"/> Public Covens</h2></header>
                    ) : ''}
                    <ul>
                        {this.props.publicRooms.map(room => {
                            return (
                                <Tooltip
                                    key={room._id}
                                    title={"<strong>" + room.name + "</strong><br>" + room.description + "<br><hr>" + room.members.length + " " + (room.members.length > 1 ? "members" : "member")}
                                    position="right"
                                    trigger="mouseenter"
                                    theme="left"
                                    delay={300}
                                    popperOptions={{modifiers: {
                                        preventOverflow: {
                                          escapeWithReference: true
                                        }
                                    }}}
                                >
                                    <li
                                        key={room._id}
                                        className={(room.slug === this.props.currentRoom.slug ? "active" : "")}
                                        onClick={() => {this.props.switchRoom(room.slug)}}
                                    >
                                        {room.name}
                                    </li>
                                </Tooltip>
                            )
                        })}
                    </ul>
                    {this.props.directMessages.length > 0 ? (
                        <header><h2 style={{marginTop: "0.5rem"}}><FontAwesomeIcon icon="star"/> Private messages</h2></header>
                    ) : ''}
                    <ul>
                        {this.props.directMessages.map(room => {
                            let otherUser = room.members.find(m => m.user.username !== this.props.user.username);
                            return (
                                <li
                                    key={room._id}
                                    className={(room.slug === this.props.currentRoom.slug ? "active" : "")}
                                    onClick={() => {this.props.switchRoom(room.slug)}}
                                >
                                    <span><UserFlair user={otherUser.user} />{otherUser.user.username}</span>
                                    {room.slug !== this.props.currentRoom.slug && unreadIndicator(room.unreadMessages)}
                                </li>
                            )
                        })}
                    </ul>
                </div>
                <nav className="roomControls">
                    {this.props.children}
                </nav>
            </nav>
        )
    }
}

class UserBadge extends Component {
    render() {
        let user;
        if (this.props.member.user) {
            if (this.props.user && (this.props.member.user.username === this.props.user.username)) {
                user = this.props.user;
            } else {
                user = this.props.member.user;
            }
        } else {
            user = this.props.member;
        }
        let userStatus, userStatusText;
        switch (user.settings.status) {
            case "available":
                userStatus = "userAvailable";
                userStatusText = "Available";
                break;
            case "away":
                userStatus = "userAway";
                userStatusText = "Away";
                break;
            case "dnd":
                userStatus = "userDnD";
                userStatusText = "Do not disturb";
                break
            case "invisible":
                userStatus = "userAway";
                userStatusText = "Away";
                break
            default:
                userStatus = "userAvailable"
                userStatusText = "Available";
                break;
        }
        let userBadge;
        switch (this.props.role) {
            case "administrator":
                userBadge = <span className="badge userBadge">Admin</span>;
                break;
            case "moderator":
                userBadge = <span className="badge userBadge">Mod</span>;
                break;
            case "member":
                userBadge = "";
                break
            default:
                userBadge = "";
        }
        let userTooltip = (
            <div className="userTooltip">
                <strong><UserFlair user={user} />{user.username} {userBadge}</strong>
                {this.props.online && <span style={{marginTop:"0.25rem",fontSize:"0.8rem"}}><FontAwesomeIcon className={userStatus} icon="circle"/> {userStatusText}</span>}
                {!this.props.isYou ?
                    <>
                        <button type="button" className="small" onClick={() => this.props.changeAltarUser(user)}><span className="hermetica-F032-pentacle" style={{fontSize:"14px",position:"relative",top:"2px"}}/> Open Altar</button>
                        <button type="button" className="small" onClick={() => this.props.directMessage(user)}><FontAwesomeIcon icon="comment-dots"/> Private message</button>
                        {this.props.isAdministrator &&
                            <button type="button" className="small" onClick={() => this.props.ban(user)}><FontAwesomeIcon icon="ban"/> Ban from Coven</button>
                        }
                    </>
                    :
                    <>
                        <p style={{marginTop:"0.5rem"}}>It's you!</p>
                    </>
                }
            </div>
        )
        return (
            <Tooltip
                html={userTooltip}
                position="left"
                trigger="mouseenter"
                interactive="true"
                theme="left"
                delay={300}
            >
                <li key={user._id}>
                    <span><UserFlair user={user} />{user.username}{userBadge}</span>{this.props.online && <span>&nbsp;<FontAwesomeIcon className={userStatus} icon="circle"/></span>}
                </li>
            </Tooltip>
        )
    }
}

class UserList extends Component {
    render() {
        const lessThanOneHourAgo = (date) => {
            const oneHour = 1000 * 60 * 60;
            const anHourAgo = Date.now() - oneHour;
            return date > anHourAgo;
        }
        let onlineMembers = this.props.members.filter(member => lessThanOneHourAgo(new Date(member.user.lastOnline).getTime()) && member.user.settings.status !== "invisible");
        let offlineMembers = this.props.members.filter(member => !lessThanOneHourAgo(new Date(member.user.lastOnline).getTime()) || member.user.settings.status === "invisible");
        let visibleVisitors = this.props.visitors.filter(visitor => visitor.settings.status !== "invisible");
        return (
            <section className="userList">
                {onlineMembers.length > 0 &&
                    <>
                        <header>
                            <h2>Online</h2>
                        </header>
                        <ul>
                            {onlineMembers.map(member => {
                                return (
                                    <UserBadge
                                        user={this.props.user}
                                        online={true}
                                        isYou={member.user._id === this.props.user._id ? true : false}
                                        isAdministrator={this.props.isAdministrator}
                                        directMessage={this.props.directMessage}
                                        changeAltarUser={this.props.changeAltarUser}
                                        ban={this.props.ban}
                                        member={member}
                                        role={member.role}
                                        key={member.user._id}/>
                                )
                            })}
                        </ul>
                    </>
                }
                {offlineMembers.length > 0 &&
                    <>
                        <header style={{marginTop:"0.5rem"}}>
                            <h2>Offline</h2>
                        </header>
                        <ul>
                            {offlineMembers.map(member => {
                                return (
                                    <UserBadge
                                        online={false}
                                        isYou={member.user._id === this.props.user._id ? true : false}
                                        isAdministrator={this.props.isAdministrator}
                                        directMessage={this.props.directMessage}
                                        changeAltarUser={this.props.changeAltarUser}
                                        ban={this.props.ban}
                                        member={member}
                                        role={member.role}
                                        key={member.user._id}/>
                                )
                            })}
                        </ul>
                    </>
                }
                {visibleVisitors.length > 0 &&
                    <>
                        <header style={{marginTop:"0.5rem"}}>
                            <h2>Visitors</h2>
                        </header>
                        <ul>
                            {this.props.visitors.map(visitor => {
                                return (
                                    <UserBadge
                                        isYou={visitor._id === this.props.user._id ? true : false}
                                        isAdministrator={this.props.isAdministrator}
                                        directMessage={this.props.directMessage}
                                        changeAltarUser={this.props.changeAltarUser}
                                        ban={this.props.ban}
                                        member={visitor}
                                        key={visitor._id}/>
                                )
                            })}
                        </ul>
                    </>
                }
            </section>
        )
    }
}

class ChatDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connected: true,
            messages: [],
            message: '',
            modalVisible: false,
            currentRoom: '',
            currentRoomMembers: [],
            currentRoomVisitors: [],
            currentRoomBannedUsers: [],
            showWelcomeMessage: true,
            joinedRooms: [],
            directMessages: [],
            publicRooms: [],
            joinDisabled: false,
            leaveDisabled: false,
            banWarningVisible: false,
            userToBan: '',
            userToUnban: ''
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.messageInput = React.createRef();
    }

    reloadRoom = (slug) => {
        fetch('/api/chat/room/fetch/' + slug)
            .then(res => res.json())
            .then(payload => {
                var currentRoomMembers = payload.room.members.sort((a, b) => a.user.username.localeCompare( b.user.username ));
                var currentRoomVisitors = payload.room.visitors.sort((a, b) => a.username.localeCompare( b.username ));
                var currentRoomBannedUsers = payload.room.bannedUsers.sort((a, b) => a.username.localeCompare( b.username ));
                this.setState({
                    messages: payload.messages,
                    currentRoom: payload.room,
                    currentRoomMembers: currentRoomMembers,
                    currentRoomVisitors: currentRoomVisitors,
                    currentRoomBannedUsers: currentRoomBannedUsers,
                    showWelcomeMessage: payload.showWelcomeMessage
                });
                scrollToBottom();
                if (this.messageInput.current) {
                    this.messageInput.current.focus();
                }
        });
    }

    reloadRoomList = () => {
        fetch('/api/chat/room/fetch-joined/')
            .then(res => res.json())
            .then(payload => {
                let joinedRooms = payload.filter(room => room.type === "room");
                let directMessages = payload.filter(room => room.type === "direct-message");
                this.setState({ joinedRooms: joinedRooms, directMessages: directMessages });
        });
        fetch('/api/chat/room/fetch-public/')
            .then(res => res.json())
            .then(payload => {
                this.setState({ publicRooms: payload });
        });
    }

    componentDidMount() {
        this.reloadRoom((this.props.user.memory ? this.props.user.memory.lastRoom : 'global-coven'))

        fetch('/api/chat/room/fetch-joined/')
            .then(res => res.json())
            .then(payload => {
                let joinedRooms = payload.filter(room => room.type === "room");
                let directMessages = payload.filter(room => room.type === "direct-message");
                this.setState({ joinedRooms: joinedRooms, directMessages: directMessages });
        });

        fetch('/api/chat/room/fetch-public/')
            .then(res => res.json())
            .then(payload => {
                this.setState({ publicRooms: payload });
        });

        this.props.socket.on('message-sent', payload => {
            if (this.state.currentRoom.slug === payload.room.slug) {
                if (payload.type === "tarot") {
                    let audio = new Audio('/card.mp3');
                    audio.play();
                }
                if (payload.type === "runes") {
                    let audio = new Audio('/runes.mp3');
                    audio.play();
                }
                this.setState({
                    messages: [...this.state.messages, payload]
                });
                scrollToBottom();
            } else {
                if (this.state.joinedRooms.some(r => r.slug === payload.room.slug)) {
                    var joinedRooms = [...this.state.joinedRooms];
                    joinedRooms.forEach(r => {
                        if (r.slug === payload.room.slug) {
                            r.unreadMessages++;
                        }
                    })
                    this.setState({
                        joinedRooms: joinedRooms
                    })
                    // Check for mentions
                    if (payload.mentions.includes(this.props.user.username)) {
                        toast(payload.user.username + " has mentioned you in " + payload.room.name + ".", {
                            className: 'green-toast',
                        });
                    }
                } else if (this.state.directMessages.some(r => r.slug === payload.room.slug)) {
                    var directMessages = [...this.state.directMessages];
                    directMessages.forEach(r => {
                        if (r.slug === payload.room.slug) {
                            r.unreadMessages++;
                        }
                    })
                    this.setState({
                        directMessages: directMessages
                    })
                    // Check for mentions
                    if (payload.mentions.includes(this.props.user.username)) {
                        toast(payload.user.username + " has mentioned you in a private message.", {
                            className: 'green-toast',
                        });
                    }
                }
            }
        })

        this.props.socket.on('direct-message-room-created', payload => {
            if (payload.sender.username === this.props.user.username || payload.recipient.username === this.props.user.username) {
                fetch('/api/chat/room/fetch/' + payload.room.slug)
                .then(res => res.json())
                .then(payload => {
                    this.props.socket.emit('join-socketio-room', payload.room.slug);
                    var directMessages = [...this.state.directMessages, payload.room]
                    directMessages.map(r => {
                        let otherUser = r.members.find(m => m.user.username !== this.props.user.username);
                        r.otherUser = otherUser.user.username;
                        return r;
                    })
                    directMessages.sort((a, b) => a.otherUser.localeCompare( b.otherUser ))
                    this.setState({
                        directMessages: directMessages,
                        messages: payload.messages,
                        currentRoom: payload.room,
                        currentRoomMembers: payload.room.members,
                        currentRoomVisitors: payload.room.visitors,
                    });
                    scrollToBottom();
                });
            }
        })

        this.props.socket.on('room-created', payload => {
            if (payload.user.username === this.props.user.username) {
                fetch('/api/chat/room/fetch/' + payload.room.slug)
                .then(res => res.json())
                .then(payload => {
                    this.props.socket.emit('join-socketio-room', payload.room.slug);
                    var joinedRooms = [...this.state.joinedRooms, payload.room]
                    joinedRooms.sort((a, b) => a.name.localeCompare( b.name ))
                    this.setState({
                        joinedRooms: joinedRooms,
                        messages: payload.messages,
                        currentRoom: payload.room,
                        currentRoomMembers: payload.room.members,
                        currentRoomVisitors: payload.room.visitors,
                    });
                    scrollToBottom();
                });
            } else if (payload.room.public) {
                var publicRooms = [...this.state.publicRooms, payload.room]
                publicRooms.sort((a, b) => a.name.localeCompare( b.name ))
                this.setState({
                    publicRooms: publicRooms
                });
            }
        })

        this.props.socket.on('room-edited', payload => {
            this.reloadRoomList();
            if (payload._id === this.state.currentRoom._id) {
                this.reloadRoom(payload.slug)
            }
        });

        this.props.socket.on('visitor-entered-room', payload => {
            if (this.state.currentRoom.slug === payload.room.slug) {
                if (!this.state.currentRoomVisitors.some(v => v._id.toString() === payload.user._id.toString())) {
                    var currentRoomVisitors = [...this.state.currentRoomVisitors, payload.user];
                    currentRoomVisitors.sort((a, b) => a.username.localeCompare( b.username ));
                    this.setState({currentRoomVisitors: currentRoomVisitors})
                }
            }
        });

        this.props.socket.on('visitor-exited-room', payload => {
            if (this.state.currentRoom.slug === payload.room.slug) {
                this.setState({currentRoomVisitors: this.state.currentRoomVisitors.filter(m => m._id.toString() !== payload.user._id.toString())})
            }
        });

        this.props.socket.on('user-joined-room', payload => {
            if (this.state.currentRoom.slug === payload.room.slug) {
                // Add user to members array
                if (!this.state.currentRoomMembers.some(v => v.user.username === payload.user.username)) {
                    var currentRoomMembers = [...this.state.currentRoomMembers, {role: "member", user: payload.user}];
                    currentRoomMembers.sort((a, b) => a.user.username.localeCompare( b.user.username ));
                    this.setState({
                        currentRoomMembers: currentRoomMembers
                    })
                }
                // Remove member from visitors array
                var currentRoomVisitors = this.state.currentRoomVisitors.filter(m => m.username !== payload.user.username);
                this.setState({
                    currentRoomVisitors: currentRoomVisitors
                })
            }
        });
        this.props.socket.on('user-left-room', payload => {
            if (this.state.currentRoom.slug === payload.room.slug && this.state.currentRoom.public === true) {
                // Add user to visitors array
                if (!this.state.currentRoomVisitors.some(v => v.username === payload.user.username)) {
                    var currentRoomVisitors = [...this.state.currentRoomVisitors, payload.user];
                    currentRoomVisitors.sort((a, b) => a.username.localeCompare( b.username ));
                    this.setState({
                        currentRoomVisitors: currentRoomVisitors
                    })
                }
            }
            if (this.state.currentRoom.slug === payload.room.slug) {
                // Remove user from members array
                var currentRoomMembers = this.state.currentRoomMembers.filter(m => m.user._id.toString() !== payload.user._id.toString());
                this.setState({
                    currentRoomMembers: currentRoomMembers
                })
            }
        });

        this.props.socket.on('user-invited-to-room', payload => {
            if (this.props.user._id === payload.user._id) {
                // Add room to user's rooms
                var joinedRooms = [...this.state.joinedRooms, payload.room]
                joinedRooms.sort((a, b) => a.name.localeCompare( b.name ))
                this.setState({
                    joinedRooms: joinedRooms
                });
            }
            if (this.state.currentRoom.slug === payload.room.slug) {
                // Add user to members array
                if (!this.state.currentRoomMembers.some(m => m.user.username === payload.user.username)) {
                    var currentRoomMembers = [...this.state.currentRoomMembers, {role: "member", user: payload.user}];
                    currentRoomMembers.sort((a, b) => a.user.username.localeCompare( b.user.username ));
                    this.setState({
                        currentRoomMembers: currentRoomMembers
                    })
                }
            }
        });

        this.props.socket.on('user-banned-from-room', payload => {
            // If you're the one who's just been banned
            if (this.props.user._id === payload.user._id) {
                // Reload the room list and, if they're in the room currently, send the user to Global Coven (easy)
                this.reloadRoomList();
                if (this.state.currentRoom.slug === payload.room.slug) {
                    this.switchRoom('global-coven');
                }
                fetch('/api/user/send-notification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user: payload.user.username,
                        notification: {
                            sender: payload.user.username,
                            type: 'user-banned',
                            text: 'You have been banned from ' + payload.room.name + '.',
                        }
                    })
                })
            } else if (this.state.currentRoom.slug === payload.room.slug) { // If someone was just banned from the room you're in
                // Remove user from members/visitors arrays
                var currentRoomMembers = this.state.currentRoomMembers.filter(m => m.user._id.toString() !== payload.user._id.toString());
                var currentRoomVisitors = this.state.currentRoomVisitors.filter(v => v._id !== payload.user._id);
                this.setState({
                    currentRoomMembers: currentRoomMembers,
                    currentRoomVisitors: currentRoomVisitors
                })
                // Add user to banned members array
                if (!this.state.currentRoomBannedUsers.some(v => v._id.toString() === payload.user._id.toString())) {
                    var currentRoomBannedUsers = [...this.state.currentRoomBannedUsers, payload.user];
                    currentRoomBannedUsers.sort((a, b) => a.username.localeCompare( b.username ));
                    this.setState({currentRoomBannedUsers: currentRoomBannedUsers})
                }
            }
        });

        this.props.socket.on('user-unbanned-from-room', payload => {
            // If you're the one who's just been unbanned
            if (this.props.user._id === payload.user._id) {
                // Reload the room list
                this.reloadRoomList();
                fetch('/api/user/send-notification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user: payload.user.username,
                        notification: {
                            sender: payload.user.username,
                            type: 'user-unbanned',
                            text: 'You have been unbanned from ' + payload.room.name + '.',
                        }
                    })
                })
            }
        });

        this.props.socket.on('user-setting-updated', payload => {
            // Update member list
            let currentRoomMembers = this.state.currentRoomMembers;
            currentRoomMembers.forEach(m => {
                if (m.user.username === payload.user) {
                    Object.keys(m.user.settings).forEach(key => {
                        if (key === payload.keyToChange) {
                            m.user.settings[key] = payload.newValue;
                        }
                    });
                }
            })
            this.setState({currentRoomMembers: currentRoomMembers});
            // Update visitor list
            let currentRoomVisitors = this.state.currentRoomVisitors;
            currentRoomVisitors.forEach(v => {
                if (v.username === payload.user) {
                    Object.keys(v.settings).forEach(key => {
                        if (key === payload.keyToChange) {
                            v.settings[key] = payload.newValue;
                        }
                    });
                }
            })
            this.setState({currentRoomVisitors: currentRoomVisitors});
            // Update message list
            if (payload.keyToChange === "username" || payload.keyToChange === "flair") {
                let currentMessages = this.state.messages;
                currentMessages.forEach(m => {
                    if (m.user.username === payload.user) {
                        if (payload.keyToChange === "username") {
                            m.user.username = payload.newValue;
                        } else if (payload.keyToChange === "flair") {
                            m.user.settings.flair = payload.newValue;
                        }
                    }
                })
                this.setState({messages: currentMessages});
            }
            // Update direct message rooms
            if (payload.keyToChange === "username" || payload.keyToChange === "flair") {
                let directMessages = this.state.directMessages;
                directMessages.forEach(room => {
                    let otherUser = room.members.find(m => m.user.username !== this.props.user.username);
                    if (otherUser.user.username === payload.user) {
                        if (payload.keyToChange === "username") {
                            otherUser.user.username = payload.newValue;
                        } else if (payload.keyToChange === "flair") {
                            otherUser.user.settings.flair = payload.newValue;
                        }
                    }
                })
                this.setState({directMessages: directMessages});
            }
        });
        this.props.socket.on('user-connection-updated', payload => {
            let currentRoomMembers = this.state.currentRoomMembers;
            currentRoomMembers.forEach(m => {
                if (m.user._id.toString() === payload.user) {
                    m.user.lastOnline = payload.lastOnline;
                }
            })
            this.setState({currentRoomMembers: currentRoomMembers})
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.isVisible !== this.props.isVisible) {
            scrollToBottom();
        }
    }

    handleSubmit(e) {
        e.preventDefault()
        var messageContent = this.state.message.trim();
        if (messageContent !== '' && messageContent !== '/me') {
            this.sendMessage(messageContent);
        }
    }

    onEnterPress = (e) => {
        if(e.keyCode === 13 && e.shiftKey === false) {
            e.preventDefault();
            var messageContent = this.state.message.trim();
            if (messageContent !== '' && messageContent !== '/me') {
                this.sendMessage(messageContent)
            }
        }
    }

    handleChange(e) {
        this.setState({
            message: e.target.value
        })
    }

    sendMessage(text) {
        this.props.socket.emit('send-message', {
            content: text,
            room: this.state.currentRoom._id,
            user: this.props.user._id
        }, response => {
            if (response) {
                this.setState({
                    message: ''
                })
            }
        });
    }

    switchRoom(roomSlug) {
        fetch('/api/chat/room/exit/' + this.state.currentRoom.slug, {method: "POST"})
        .then(res => {
            if (res.status === 200) {
                fetch('/api/chat/room/enter/' + roomSlug, {method: "POST"})
                .then(res => {
                    if (res.status === 200) {
                        this.reloadRoom(roomSlug)
                        this.props.socket.emit('join-socketio-room', roomSlug);
                        // Clear unread messages from frontend (handled async on backend)
                        let directMessages = [...this.state.directMessages];
                        directMessages.forEach(r => {
                            if (r.slug === roomSlug) {
                                r.unreadMessages = 0;
                                this.setState({
                                    directMessages: directMessages
                                })
                            }
                        })
                        let joinedRooms = [...this.state.joinedRooms];
                        joinedRooms.forEach(r => {
                            if (r.slug === roomSlug) {
                                r.unreadMessages = 0;
                                this.setState({
                                    joinedRooms: joinedRooms
                                })
                            }
                        })
                    } else {
                        console.log("Failed to enter room")
                    }
                });
            } else {
                console.log("Failed to exit room")
            }
        });
    }

    joinRoom = (room, e) => {
        if (this.state.joinDisabled) {
            return;
        }
        this.setState({joinDisabled: true});
        fetch('/api/chat/room/join/' + room, {
            method: 'POST',
        })
        .then(res => {
            if (res.status === 200) {
                this.reloadRoom(room);
                this.reloadRoomList();
                this.setState({leaveDisabled: false, joinDisabled: false});
            }
        })
        .catch(err => {
            console.error(err);
            this.setState({ alertBox: 'Error joining room! Please try again.' });
        });
    }

    leaveRoom = (room, e) => {
        if (this.state.leaveDisabled) {
            return;
        }
        this.setState({leaveDisabled: true});
        fetch('/api/chat/room/leave/' + room, {
            method: 'POST',
        })
        .then(res => {
            if (res.status === 200) {
                if (this.state.currentRoom.public === false) {
                    this.reloadRoom('global-coven');
                } else {
                    this.reloadRoom(room);
                }
                this.reloadRoomList();
                this.setState({leaveDisabled: false, joinDisabled: false});
            }
        })
        .catch(err => {
            console.error(err);
            this.setState({ alertBox: 'Error leaving room! Please try again.' });
        });
    }

    hideWelcomeMessage = () => {
        fetch('/api/chat/room/hidewelcomemessage/' + this.state.currentRoom.slug, {
            method: 'POST',
        })
        .then(res => {
            if (res.status === 200) {
                this.setState({showWelcomeMessage: false});
            }
        })
    }

    hideRoom = (room) => {
        this.reloadRoom('global-coven');
        this.reloadRoomList();
    }

    directMessage = (user) => {
        let directMessageExists = false;
        let currentDirectMessages = this.state.directMessages;
        currentDirectMessages.forEach(room => {
            if (room.members.some(m => m.user._id === user._id)){
                directMessageExists = room.slug;
            }
        })
        if (!directMessageExists) {
            let directMessageRoom = {
                roomType: 'direct-message',
                roomPrivacy: 'private',
                roomMembers: [{user:this.props.user._id,role:'member'},{user:user._id, role:'member'}],
                recipient: user
            }
            fetch('/api/chat/room/create', {
                method: 'POST',
                body: JSON.stringify(directMessageRoom),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                if (res.status === 200) {

                }
            })
        } else {
            this.switchRoom(directMessageExists);
        }
    }

    hideBanWarning = () => {
        this.setState({banWarningVisible: false})
    }

    showBanWarning = (user) => {
        this.setState({banWarningVisible: true, userToBan: user});
    }

    hideUnbanWarning = () => {
        this.setState({unbanWarningVisible: false})
    }

    showUnbanWarning = (user) => {
        this.setState({unbanWarningVisible: true, userToUnban: user});
    }

    handleBan = (room, user) => {
        this.setState({banWarningVisible: false});
        fetch('/api/chat/room/ban/' + room + '/' + user, {
            method: 'POST'
        })
        .then(res => {
            this.setState({userToBan: ''});
            if (res.status === 200) {
                // console.log("Bin bnd")
            }
        })
    }

    handleUnban = (room, user) => {
        this.setState({unbanWarningVisible: false});
        fetch('/api/chat/room/unban/' + room + '/' + user, {
            method: 'POST'
        })
        .then(res => {
            this.setState({userToUnban: ''});
            if (res.status === 200) {
                // console.log("Bin unbnd")
            }
        })
    }

    infiniteScroll = (lastMessage) => {
        fetch('/api/chat/room/fetch-messages', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room: this.state.currentRoom._id,
                earlierThan: lastMessage
            })
        })
        .then(res => res.json())
        .then(payload => {
            let messages = this.state.messages;
            messages.unshift(...payload.messages);
            this.setState({
                messages: messages
            });
            if (payload.messages.length !== 0) {
                document.getElementById(lastMessage).scrollIntoView();

            }
        })
    }

    addEmoji = (e) => {
        let emoji = e.native;
        let currentMessage = this.state.message;
        let withEmoji = currentMessage.substring(0, this.messageInput.current.selectionStart) + emoji + currentMessage.substring(this.messageInput.current.selectionStart);
        this.setState({
            message: withEmoji
        })
        this.messageInput.current.focus();
    }

    render() {
        var style = this.props.isVisible ? {display: 'flex'} : {display: 'none'};
        var isMember = (this.state.joinedRooms.some(r => r.slug === this.state.currentRoom.slug) || this.state.directMessages.some(r => r.slug === this.state.currentRoom.slug));
        var isAdministrator = (this.state.currentRoomMembers.some(m => m.user.username === this.props.user.username && m.role === "administrator"));
        var isPrivateRoom = (this.state.currentRoom.public === false ? true : false);
        var textareaPlaceholder = (this.state.currentRoom.type === "direct-message" ? this.state.currentRoom.members.find(m => m.user.username !== this.props.user.username).user.username : this.state.currentRoom.name);
        var isDirectMessage = this.state.currentRoom.type === "direct-message";
        return (
            <main className="chatDrawer" style={style}>
                <RoomList
                    user={this.props.user}
                    currentRoom={this.state.currentRoom}
                    switchRoom={this.switchRoom.bind(this)}
                    joinedRooms={this.state.joinedRooms}
                    directMessages={this.state.directMessages}
                    publicRooms={this.state.publicRooms}
                >
                    {isAdministrator && !isDirectMessage &&
                        <EditRoomControls
                            currentRoom={this.state.currentRoom}
                            currentRoomMembers={this.state.currentRoomMembers}
                            currentRoomBannedUsers={this.state.currentRoomBannedUsers}
                            user={this.props.user}
                            reloadRoom={this.reloadRoom.bind(this)}
                            reloadRoomList={this.reloadRoomList.bind(this)}
                            handleBan={this.showBanWarning.bind(this)}
                            handleUnban={this.showUnbanWarning.bind(this)}
                            socket={this.props.socket}
                        />
                    }
                    {isPrivateRoom && !isDirectMessage && isAdministrator &&
                        <InviteToRoomControls
                            currentRoom={this.state.currentRoom}
                        />
                    }
                    {!isDirectMessage &&
                        <JoinLeaveRoomControls
                            joinRoom={this.joinRoom.bind(this)}
                            leaveRoom={this.leaveRoom.bind(this)}
                            currentRoom={this.state.currentRoom}
                            currentRoomMembers={this.state.currentRoomMembers}
                            user={this.props.user}
                        />
                    }
                    {isDirectMessage &&
                        <HideRoomControls
                            currentRoom={this.state.currentRoom}
                            hideRoom={this.hideRoom.bind(this)}
                        />
                    }
                </RoomList>
                <section className="chatInterface">
                    {this.state.currentRoom.welcomeMessage && this.state.showWelcomeMessage &&
                        <aside className="welcomeMessage">
                            <span style={{flex:1}}>{this.state.currentRoom.welcomeMessage}</span>
                            <button className="welcomeMessageClose" onClick={this.hideWelcomeMessage}>
                                <FontAwesomeIcon icon="times" />
                            </button>
                        </aside>
                    }
                    <MessageList
                        user={this.props.user}
                        messages={this.state.messages}
                        currentRoom={this.state.currentRoom}
                        infiniteScroll={this.infiniteScroll}/>
                    {isMember &&
                        <form
                            className="chatForm"
                            onSubmit={this.handleSubmit}
                        >
                            <TextareaAutosize
                                ref={this.messageInput}
                                id="message"
                                autoComplete="off"
                                placeholder={"Message " + textareaPlaceholder}
                                onChange={this.handleChange}
                                onKeyDown={this.onEnterPress}
                                value={this.state.message}
                                maxRows={10}
                            />
                            <Tooltip
                                trigger="click"
                                interactive
                                theme="light"
                                arrow="true"
                                html={(
                                    <Picker onSelect={this.addEmoji} />
                                )}
                            >
                                <button type="button"><FontAwesomeIcon icon="smile" /></button>
                            </Tooltip>
                            <button type="submit"><FontAwesomeIcon icon="chevron-right"/></button>
                        </form>
                    }
                </section>
                <UserList
                    user={this.props.user}
                    members={this.state.currentRoomMembers}
                    visitors={this.state.currentRoomVisitors}
                    changeAltarUser={this.props.changeAltarUser}
                    directMessage={this.directMessage}
                    ban={this.showBanWarning}
                    isAdministrator={isAdministrator}
                />
                <Modal show={this.state.banWarningVisible} handleClose={this.hideBanWarning}>
                    <h1>Ban from Coven</h1>
                    <p style={{marginBottom:"1rem"}}>Are you sure you want to ban <strong>{this.state.userToBan.username}</strong> from <strong>{this.state.currentRoom.name}</strong>? They will no longer be able to see the Coven or any messages in it. You can unban them in the Coven manager.</p>
                    <button className="full-width" onClick={() => this.handleBan(this.state.currentRoom.slug, this.state.userToBan._id)}>Ban {this.state.userToBan.username} from {this.state.currentRoom.name}</button>
                </Modal>
                <Modal show={this.state.unbanWarningVisible} handleClose={this.hideUnbanWarning}>
                    <h1>Unban in Coven</h1>
                    <p style={{marginBottom:"1rem"}}>Are you sure you want to unban <strong>{this.state.userToUnban.username}</strong> in <strong>{this.state.currentRoom.name}</strong>?</p>
                    <button className="full-width" onClick={() => this.handleUnban(this.state.currentRoom.slug, this.state.userToUnban._id)}>Unban {this.state.userToUnban.username} in {this.state.currentRoom.name}</button>
                </Modal>
            </main>
        );
    }
}

export default ChatDrawer;
