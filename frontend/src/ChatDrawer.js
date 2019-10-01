import React, { Component } from 'react';
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

import { CreateRoomControls, EditRoomControls, JoinLeaveRoomControls, InviteToRoomControls } from './components/RoomControls';

function scrollToBottom() {
    var messages = document.querySelector('#chatWindow .simplebar-content-wrapper'); messages.scrollTo({ top: messages.scrollHeight, behavior: "auto" });
}

class MessageList extends Component {
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
                        <li className="dateMessage"><span>Today</span></li>
                    )
                } else {
                    return (
                        <li className="dateMessage">
                            <span>
                                {dateObject.getDate() + " " + dateObject.toLocaleString('default', { month: 'long' }) + " " + dateObject.getFullYear()}
                            </span>

                        </li>
                    )
                }

            }
        }
        return (
            <div className="chatWindow" id="chatWindow" data-simplebar>
                <ul className="messageList">
                    {this.props.messages.map((message, i, arr) => {
                        let lastTimestamp = arr[i-1] ? arr[i-1].timestamp : false;
                        let lastAuthor = arr[i-1] ? arr[i-1].user.username : false;
                        let lastType = arr[i-1] ? arr[i-1].type : false;
                        return (
                            <>
                                {dayMessage(message.timestamp, lastTimestamp)}
                                <li key={message._id} className="messageContainer">
                                    <div key={message._id} className={message.type}>
                                        <span className={["messageMetadata", (message.user.username === lastAuthor) && (lastType === "message") ? "hidden" : ""].join(' ')}>
                                            <span className="messageTimestamp">
                                                {displayTimestamp(message.timestamp)}
                                            </span>
                                            <span className="messageAuthor">
                                                {message.user.username}
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
                                                {message.runes.map(rune => {
                                                    return (
                                                        <Tooltip
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
                            </>
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
                <header>
                    <h2><FontAwesomeIcon icon="moon"/> Your Covens </h2>
                    <CreateRoomControls />
                </header>
                <ul>
                    {this.props.joinedRooms.map(room => {
                        return (
                            <Tooltip
                                title={"<strong>" + room.name + "</strong><br>" + room.description + "<br><hr>" + room.members.length + " " + (room.members.length > 1 ? "members" : "member")}
                                position="right"
                                trigger="mouseenter"
                                theme="left"
                                delay={300}
                            >
                                <li
                                    key={room._id}
                                    className={(room.slug === this.props.currentRoom.slug ? "active" : "")}
                                    onClick={() => {this.props.switchRoom(room.slug)}}
                                >
                                    {room.name}
                                    {room.slug != this.props.currentRoom.slug && unreadIndicator(room.unreadMessages)}
                                    {room._id === this.props.currentRoom &&
                                    <button
                                        onClick={(e) => {this.props.leaveRoom(room, e)}}
                                        className="small"
                                        disabled={this.props.leaveDisabled}
                                    >
                                        <FontAwesomeIcon icon="minus"/>
                                    </button>
                                }
                                </li>
                            </Tooltip>
                        )
                    })}
                </ul>
                {this.props.publicRooms.length > 0 ? (
                    <header><h2 style={{marginTop: "0.5rem"}}><FontAwesomeIcon icon="moon"/> Public Covens</h2></header>
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
                            >
                                <li
                                    key={room._id}
                                    className={(room.slug === this.props.currentRoom.slug ? "active" : "")}
                                >
                                    <div
                                        onClick={() => {this.props.switchRoom(room.slug)}}
                                    >
                                        {room.name}
                                    </div>
                                    {room._id === this.props.currentRoom &&
                                        <button
                                            onClick={(e) => {this.props.joinRoom(room, e)}}
                                            className="small"
                                            disabled={this.props.joinDisabled}
                                        >
                                            <FontAwesomeIcon icon="plus"/>
                                        </button>
                                    }
                                </li>
                            </Tooltip>
                        )
                    })}
                </ul>
                <nav class="roomControls">
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
        let userStatus;
        switch (user.status) {
            case "active":
                userStatus = "userActive";
                break;
            case "away":
                userStatus = "userInactive";
                break;
            case "busy":
                userStatus = "userBusy";
                break
            case "invisible":
                userStatus = "userInactive";
                break
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
        return (
            <li key={user._id} style={{color: userColor}}>
                <span><FontAwesomeIcon className={lessThanOneDayAgo(new Date(user.lastOnline).getTime()) ? userStatus : "userInactive" } icon="circle"/> {user.username}</span>
            </li>
        )
    }
}

class UserList extends Component {
    constructor() {
        super();
    }

    render() {
        return (
            <section className="userList">
                <div className="userListInner">
                    <header>
                        <h2>Members</h2>
                    </header>
                    <ul>
                        {this.props.members.map(member => {
                            return (
                                <UserBadge member={member} role={member.role} key={member.user._id}/>
                            )
                        })}
                    </ul>
                    {this.props.visitors.length > 0 &&
                        <>
                            <header style={{marginTop:"1rem"}}>
                                <h2>Visitors</h2>
                            </header>
                            <ul>
                                {this.props.visitors.map(visitor => {
                                    return (
                                        <UserBadge member={visitor} key={visitor._id}/>
                                    )
                                })}
                            </ul>
                        </>
                    }
                </div>
            </section>
        )
    }
}

class ChatDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            socketId: '',
            user: this.props.user,
            messages: [],
            message: '',
            modalVisible: false,
            currentRoom: '',
            currentRoomMembers: [],
            currentRoomVisitors: [],
            showWelcomeMessage: true,
            joinedRooms: [],
            publicRooms: [],
            joinDisabled: false,
            leaveDisabled: false
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)

        this.welcomeMessage = React.createRef();
        this.chatInterface = React.createRef();
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
                let chatWidth = this.chatInterface.current.offsetWidth;
                if (this.state.showWelcomeMessage && this.welcomeMessage.current) {
                    console.log("Width",this.chatInterface.current.offsetWidth)
                    this.welcomeMessage.current.style.width = chatWidth + "px";
                }
        });
    }

    reloadRoomList = () => {
        fetch('/api/chat/room/fetch-joined/')
            .then(res => res.json())
            .then(payload => {
                this.setState({ joinedRooms: payload });
        });
        fetch('/api/chat/room/fetch-public/')
            .then(res => res.json())
            .then(payload => {
                this.setState({ publicRooms: payload });
        });
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateDimensions);
        console.log("lastroom:",this.state.user.memory.lastRoom)
        this.reloadRoom((this.state.user.memory ? this.state.user.memory.lastRoom : 'global-coven'))

        fetch('/api/chat/room/fetch-joined/')
            .then(res => res.json())
            .then(payload => {
                this.setState({ joinedRooms: payload });
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
                console.log("Received message push",data)
                if (this.state.currentRoom.slug === data.room.slug) {
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
                    }
                }
            });
            generalChannel.bind('room-created', data => {
                if (data.user.username === this.state.user.username) {
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
                    this.setState({currentRoomVisitors: this.state.currentRoomVisitors.filter(m => m._id.toString() != data.user._id.toString())})
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
                    var currentRoomVisitors = this.state.currentRoomVisitors.filter(m => m.username != data.user.username);
                    this.setState({
                        currentRoomVisitors: currentRoomVisitors
                    })
                }
            });
            generalChannel.bind('user-left-room', data => {
                if (this.state.currentRoom.slug === data.room.slug && this.state.currentRoom.public == true) {
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
                    var currentRoomMembers = this.state.currentRoomMembers.filter(m => m.user._id.toString() != data.user._id.toString());
                    this.setState({
                        currentRoomMembers: currentRoomMembers
                    })
                }
            });
            generalChannel.bind('user-invited-to-room', data => {
                if (this.state.user._id === data.user._id) {
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

            generalChannel.bind('messages-read', data => {
                if (this.state.currentRoom.slug === data.room) {
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
            });
        });
    }

    updateDimensions = () => {
        let chatWidth = this.chatInterface.current.offsetWidth;
        if (this.state.showWelcomeMessage && this.welcomeMessage.current) {
            console.log("Width",this.chatInterface.current.offsetWidth)
            this.welcomeMessage.current.style.width = chatWidth + "px";
        }
    };

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    handleSubmit(e) {
        e.preventDefault()
        var messageContent = this.state.message.trim();
        if (messageContent != '' && messageContent != '/me') {
            this.sendMessage(messageContent)
            this.setState({
                message: ''
            })
        }
    }

    onEnterPress = (e) => {
        if(e.keyCode == 13 && e.shiftKey == false) {
            e.preventDefault();
            var messageContent = this.state.message.trim();
            if (messageContent != '' && messageContent != '/me') {
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
                if (this.state.currentRoom.public == false) {
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

    render() {
        var style = this.props.isVisible ? {display: 'flex'} : {display: 'none'};
        var isMember = (this.state.joinedRooms.some(r => r.slug === this.state.currentRoom.slug));
        var isAdministrator = (this.state.currentRoomMembers.some(m => m.user.username === this.state.user.username && m.role === "administrator"));
        var isPrivateRoom = (this.state.currentRoom.public === false ? true : false);
        return (
            <main className="chatDrawer" style={style}>
                <RoomList
                    currentRoom={this.state.currentRoom}
                    switchRoom={this.switchRoom.bind(this)}
                    joinedRooms={this.state.joinedRooms}
                    publicRooms={this.state.publicRooms}
                >
                    {isAdministrator &&
                        <EditRoomControls
                            currentRoom={this.state.currentRoom}
                            currentRoomMembers={this.state.currentRoomMembers}
                            user={this.state.user}
                            reloadRoom={this.reloadRoom.bind(this)}
                            reloadRoomList={this.reloadRoomList.bind(this)}
                            socketId={this.state.socketId}
                        />
                    }
                    {isPrivateRoom &&
                        <InviteToRoomControls
                            currentRoom={this.state.currentRoom}
                        />
                    }
                    <JoinLeaveRoomControls
                        joinRoom={this.joinRoom.bind(this)}
                        leaveRoom={this.leaveRoom.bind(this)}
                        currentRoom={this.state.currentRoom}
                        currentRoomMembers={this.state.currentRoomMembers}
                        user={this.state.user}
                    />
                </RoomList>
                <section className="chatInterface" ref={this.chatInterface}>
                    {this.state.currentRoom.welcomeMessage && this.state.showWelcomeMessage &&
                        <aside ref={this.welcomeMessage} class="welcomeMessage">
                            <span style={{flex:1}}>{this.state.currentRoom.welcomeMessage}</span>
                            <button className="welcomeMessageClose" onClick={this.hideWelcomeMessage}>
                                <FontAwesomeIcon icon="times" />
                            </button>
                        </aside>
                    }
                    <MessageList messages={this.state.messages} currentRoom={this.state.currentRoom} />
                    {isMember &&
                        <form
                            className="chatForm"
                            onSubmit={this.handleSubmit}
                        >
                            <Textarea
                                id="message"
                                autoComplete="off"
                                placeholder={"Message " + this.state.currentRoom.name}
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
                    user={this.state.user}
                    members={this.state.currentRoomMembers}
                    visitors={this.state.currentRoomVisitors}
                />
            </main>
        );
    }
}

export default ChatDrawer;
