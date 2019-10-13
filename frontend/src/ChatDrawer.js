import React, { Component, Fragment } from 'react';
import 'simplebar';
import 'simplebar/dist/simplebar.css';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css'
import Textarea from 'react-textarea-autosize';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ChatDrawer.css';

import { CreateRoomControls, EditRoomControls, JoinLeaveRoomControls, InviteToRoomControls, HideRoomControls } from './components/RoomControls';

function scrollToBottom() {
    var messages = document.querySelector('#chatWindow .simplebar-content-wrapper'); messages.scrollTo({ top: messages.scrollHeight, behavior: "auto" });
}

class UserFlair extends Component {
    componentDidUpdate(prevProps) {
        if(this.props.user.settings.flair !== prevProps.user.settings.flair) {
            console.log("User flair has changed!")
        }
    }
    render() {
        return (
            <span className="userFlair"><img src={this.props.user.settings.flair} />&nbsp;</span>
        )
    }
}

class MessageList extends Component {
    constructor() {
        super();
        this.messageList = React.createRef();
    }

    onScroll = () => {
        let timesFetched = 0;
        let messages = document.querySelector('#chatWindow .simplebar-content-wrapper');
        let scrollTop = messages.scrollTop;
        console.log(scrollTop)
        if (scrollTop === 0) {
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
                        return (
                            <Fragment key={message._id}>
                                {dayMessage(message.timestamp, lastTimestamp)}
                                <li key={message._id} className="messageContainer" id={message._id}>
                                    <div key={message._id} className={message.type}>
                                        <span className={["messageMetadata", (message.user.username === lastAuthor) && (lastType === "message") ? "hidden" : ""].join(' ')}>
                                            <span className="messageTimestamp">
                                                {displayTimestamp(message.timestamp)}
                                            </span>
                                            <span className="messageAuthor">
                                            <UserFlair user={message.user} />{message.user.username}
                                            </span>
                                        </span>

                                        <span className="messageContent">
                                            {message.content}
                                        </span>
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
    constructor() {
        super();
    }
    render() {
        let user = (this.props.member.user ? this.props.member.user : this.props.member);
        const lessThanOneDayAgo = (date) => {
            const oneDay = 1000 * 60 * 60 * 24;
            const aDayAgo = Date.now() - oneDay;
            return date > aDayAgo;
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
        let userColor;
        switch (this.props.role) {
            case "administrator":
                userColor = "orange";
                break;
            case "moderator":
                userColor = "lightblue";
                break;
            case "member":
                userColor = "var(--white)";
                break
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
        }
        let userTooltip = (
            <div className="userTooltip">
                <strong><UserFlair user={user} />{user.username} {userBadge}</strong>
                <br/>
                {this.props.online && <span style={{marginTop:"0.25rem",fontSize:"0.8rem"}}><FontAwesomeIcon className={userStatus} icon="circle"/> {userStatusText}</span>}
                <br/>
                {!this.props.isYou ?
                    <>
                        <button type="button" className="small" onClick={() => this.props.changeAltarUser(user)}><span className="hermetica-F032-pentacle" style={{fontSize:"14px",position:"relative",top:"2px"}}/> Open Altar</button>
                        <button type="button" className="small" onClick={() => this.props.directMessage(user)}><FontAwesomeIcon icon="comment-dots"/> Private message</button>
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
    constructor() {
        super();
    }

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
                                        online={true}
                                        isYou={member.user._id === this.props.user._id ? true : false}
                                        directMessage={this.props.directMessage}
                                        changeAltarUser={this.props.changeAltarUser}
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
                                        directMessage={this.props.directMessage}
                                        changeAltarUser={this.props.changeAltarUser}
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
                                        directMessage={this.props.directMessage}
                                        changeAltarUser={this.props.changeAltarUser}
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
            socketId: '',
            messages: [],
            message: '',
            modalVisible: false,
            currentRoom: '',
            currentRoomMembers: [],
            currentRoomVisitors: [],
            showWelcomeMessage: true,
            joinedRooms: [],
            directMessages: [],
            publicRooms: [],
            joinDisabled: false,
            leaveDisabled: false
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    reloadRoom = (slug) => {
        console.log("Fetchin'", slug)
        fetch('/api/chat/room/fetch/' + slug)
            .then(res => res.json())
            .then(payload => {
                console.log("Done fetched", payload)
                var currentRoomMembers = payload.room.members.sort((a, b) => a.user.username.localeCompare( b.user.username ));
                var currentRoomVisitors = payload.room.visitors.sort((a, b) => a.username.localeCompare( b.username ));
                this.setState({
                    messages: payload.messages,
                    currentRoom: payload.room,
                    currentRoomMembers: currentRoomMembers,
                    currentRoomVisitors: currentRoomVisitors,
                    showWelcomeMessage: payload.showWelcomeMessage
                });
                scrollToBottom();
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
        console.log("lastroom:",this.props.user.memory.lastRoom)
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
            var messagesChannel = pusher.subscribe('messages');
            var generalChannel = pusher.subscribe('general');
            messagesChannel.bind('message-sent', data => {
                if (this.state.currentRoom.slug === data.room.slug) {
                    if (data.type === "tarot") {
                        var audio = new Audio('/card.mp3');
                        audio.play();
                    }
                    if (data.type === "runes") {
                        var audio = new Audio('/runes.mp3');
                        audio.play();
                    }
                    this.setState({
                        messages: [...this.state.messages, data]
                    });
                    scrollToBottom();
                } else {
                    if (this.state.joinedRooms.some(r => r.slug === data.room.slug)) {
                        var joinedRooms = [...this.state.joinedRooms];
                        joinedRooms.forEach(r => {
                            if (r.slug === data.room.slug) {
                                r.unreadMessages++;
                            }
                        })
                        this.setState({
                            joinedRooms: joinedRooms
                        })
                    } else if (this.state.directMessages.some(r => r.slug === data.room.slug)) {
                        var directMessages = [...this.state.directMessages];
                        directMessages.forEach(r => {
                            if (r.slug === data.room.slug) {
                                r.unreadMessages++;
                            }
                        })
                        this.setState({
                            directMessages: directMessages
                        })
                    }
                }
            });
            generalChannel.bind('room-created', data => {
                if (data.user.username === this.props.user.username) {
                    fetch('/api/chat/room/fetch/' + data.room.slug)
                    .then(res => res.json())
                    .then(payload => {
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
                }
            });
            generalChannel.bind('room-edited', data => {
                this.reloadRoomList();
                if (data._id === this.state.currentRoom._id) {
                    this.reloadRoom(data.slug)
                }
            });
            generalChannel.bind('visitor-entered-room', data => {
                if (this.state.currentRoom.slug === data.room.slug) {
                    if (!this.state.currentRoomVisitors.some(v => v._id.toString() === data.user._id.toString())) {
                        var currentRoomVisitors = [...this.state.currentRoomVisitors, data.user];
                        currentRoomVisitors.sort((a, b) => a.username.localeCompare( b.username ));
                        this.setState({currentRoomVisitors: currentRoomVisitors})
                    }
                }
            });
            generalChannel.bind('visitor-left-room', data => {
                if (this.state.currentRoom.slug === data.room.slug) {
                    this.setState({currentRoomVisitors: this.state.currentRoomVisitors.filter(m => m._id.toString() !== data.user._id.toString())})
                }
            });
            generalChannel.bind('user-joined-room', data => {
                if (this.state.currentRoom.slug === data.room.slug) {
                    // Add user to members array
                    if (!this.state.currentRoomMembers.some(v => v.user.username === data.user.username)) {
                        var currentRoomMembers = [...this.state.currentRoomMembers, {role: "member", user: data.user}];
                        currentRoomMembers.sort((a, b) => a.user.username.localeCompare( b.user.username ));
                        this.setState({
                            currentRoomMembers: currentRoomMembers
                        })
                    }
                    // Remove member from visitors array
                    var currentRoomVisitors = this.state.currentRoomVisitors.filter(m => m.username !== data.user.username);
                    this.setState({
                        currentRoomVisitors: currentRoomVisitors
                    })
                }
            });
            generalChannel.bind('user-left-room', data => {
                if (this.state.currentRoom.slug === data.room.slug && this.state.currentRoom.public === true) {
                    // Add user to visitors array
                    if (!this.state.currentRoomVisitors.some(v => v.username === data.user.username)) {
                        var currentRoomVisitors = [...this.state.currentRoomVisitors, data.user];
                        currentRoomVisitors.sort((a, b) => a.username.localeCompare( b.username ));
                        this.setState({
                            currentRoomVisitors: currentRoomVisitors
                        })
                    }
                }
                if (this.state.currentRoom.slug === data.room.slug) {
                    // Remove user from members array
                    var currentRoomMembers = this.state.currentRoomMembers.filter(m => m.user._id.toString() !== data.user._id.toString());
                    this.setState({
                        currentRoomMembers: currentRoomMembers
                    })
                }
            });
            generalChannel.bind('user-invited-to-room', data => {
                if (this.props.user._id === data.user._id) {
                    // Add room to user's rooms
                    var joinedRooms = [...this.state.joinedRooms, data.room]
                    joinedRooms.sort((a, b) => a.name.localeCompare( b.name ))
                    this.setState({
                        joinedRooms: joinedRooms
                    });
                    toast("You have been invited to a private Coven: " + data.room.name + ".", {
                        className: 'green-toast',
                    });
                }
                if (this.state.currentRoom.slug === data.room.slug) {
                    // Add user to members array
                    if (!this.state.currentRoomMembers.some(m => m.user.username === data.user.username)) {
                        var currentRoomMembers = [...this.state.currentRoomMembers, {role: "member", user: data.user}];
                        currentRoomMembers.sort((a, b) => a.user.username.localeCompare( b.user.username ));
                        this.setState({
                            currentRoomMembers: currentRoomMembers
                        })
                    }
                    toast('A new member has joined this Coven.', {
                        className: 'green-toast',
                    });
                }
            });
            generalChannel.bind('direct-message-room-created', data => {
                if (data.sender.username === this.props.user.username || data.recipient.username === this.props.user.username) {
                    fetch('/api/chat/room/fetch/' + data.room.slug)
                    .then(res => res.json())
                    .then(payload => {
                        var directMessages = [...this.state.directMessages, payload.room]
                        directMessages.map(r => {
                            let otherUser = r.members.find(m => m.user.username !== this.props.user.username);
                            r.otherUser = otherUser.user.username;
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
            });

            generalChannel.bind('messages-read', data => {
                if (this.state.currentRoom.slug === data.room) {
                    if (data.roomType === "direct-message") {
                        var directMessages = [...this.state.directMessages];
                        directMessages.forEach(r => {
                            if (r.slug === data.room) {
                                r.unreadMessages = 0;
                            }
                        })
                        this.setState({
                            directMessages: directMessages
                        })
                    } else {
                        var joinedRooms = [...this.state.joinedRooms];
                        joinedRooms.forEach(r => {
                            if (r.slug === data.room) {
                                r.unreadMessages = 0;
                            }
                        })
                        this.setState({
                            joinedRooms: joinedRooms
                        })
                    }
                }
            });
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
            this.sendMessage(messageContent)
            this.setState({
                message: ''
            })
        }
    }

    onEnterPress = (e) => {
        if(e.keyCode === 13 && e.shiftKey === false) {
            e.preventDefault();
            var messageContent = this.state.message.trim();
            if (messageContent !== '' && messageContent !== '/me') {
                this.sendMessage(messageContent)
                this.setState({
                    message: ''
                })
            }
        }
    }

    handleChange(e) {
        this.setState({
            message: e.target.value
        })
    }

    sendMessage(text) {
        fetch('/api/chat/message/new', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: text,
                room: this.state.currentRoom._id
            })
        })
        .catch(err => console.error(err))
    }

    switchRoom(roomSlug) {
        fetch('/api/chat/room/exit/' + this.state.currentRoom.slug, {method: "POST", body: {socketId: this.state.socketId}})
        .then(res => {
            if (res.status === 200) {
                fetch('/api/chat/room/enter/' + roomSlug, {method: "POST", body: {socketId: this.state.socketId}})
                .then(res => {
                    console.log(res)
                    if (res.status === 200) {
                        this.reloadRoom(roomSlug)
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
            console.log(messages)
            this.setState({
                messages: messages
            });
        })
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
                            user={this.props.user}
                            reloadRoom={this.reloadRoom.bind(this)}
                            reloadRoomList={this.reloadRoomList.bind(this)}
                            socketId={this.state.socketId}
                        />
                    }
                    {isPrivateRoom && !isDirectMessage &&
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
                    <MessageList messages={this.state.messages} currentRoom={this.state.currentRoom} infiniteScroll={this.infiniteScroll}/>
                    {isMember &&
                        <form
                            className="chatForm"
                            onSubmit={this.handleSubmit}
                        >
                            <Textarea
                                id="message"
                                autoComplete="off"
                                placeholder={"Message " + textareaPlaceholder}
                                onChange={this.handleChange}
                                onKeyDown={this.onEnterPress}
                                value={this.state.message}
                                minRows={1}
                                maxRows={10}
                            />
                            <button><FontAwesomeIcon icon="chevron-right"/></button>
                        </form>
                    }
                </section>
                <UserList
                    user={this.props.user}
                    members={this.state.currentRoomMembers}
                    visitors={this.state.currentRoomVisitors}
                    changeAltarUser={this.props.changeAltarUser}
                    directMessage={this.directMessage}
                />
            </main>
        );
    }
}

export default ChatDrawer;
