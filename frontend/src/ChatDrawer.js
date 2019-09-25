import React, { Component } from 'react';
import 'simplebar';
import 'simplebar/dist/simplebar.css';
import Textarea from 'react-textarea-autosize';
import NotificationAlert from 'react-notification-alert';
import "react-notification-alert/dist/animate.css";
import Pusher from 'pusher-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ChatDrawer.css';

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
        return (
            <div className="chatWindow" id="chatWindow" data-simplebar>
                <ul className="messageList">
                    {this.props.messages.map(message => {
                        return (
                            <li key={message._id} className={message.type}>
                                <span className="messageTimestamp">
                                    {displayTimestamp(message.timestamp)}
                                </span>
                                <span className="messageAuthor">
                                    {message.user.username}
                                </span>
                                <span className="messageContent">
                                    {message.content}
                                </span>
                                { message.type === "tarot" && (
                                    <div className="spread">
                                        {message.tarot.map((card, index) => {
                                            return (
                                                <img
                                                    key={message._id + "_image_" + index}
                                                    className="tarotCard"
                                                    src={card.image}
                                                    alt={card.name}
                                                    title={card.name}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                                { message.type === "runes" && (
                                    <div className="spread">
                                        {message.runes.map(rune => {
                                            return (
                                                <img
                                                    className="runestone"
                                                    src={rune.image}
                                                    alt={rune.name}
                                                    title={rune.name}
                                                />
                                            )
                                        })}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }
}

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

class RoomList extends Component {
    constructor() {
        super()
        this.state = {
            modalVisible: false,
            roomName: '',
            roomSlug: '',
            roomDescription: '',
            roomPrivacy: 'public',
            formMessage: ''
        }
        this.handleSubmit = this.handleSubmit.bind(this);

    }

    slugify(string) {
        const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
        const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnooooooooprrsssssttuuuuuuuuuwxyyzzz------'
        const p = new RegExp(a.split('').join('|'), 'g')

        return string.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word characters
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
        if (name === "roomName") {
            this.setState({
                roomSlug: this.slugify(value)
            })
        }
    }

    handleOptionChange = (event) => {
        this.setState({
            roomPrivacy: event.target.value
        });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if (this.state.roomName.length < 3 || this.state.roomName.length > 33) {
            this.setState({message: 'Coven name must be between 3 and 33 characters long.'});
        } else if (this.state.roomDescription.length > 8000) {
            this.setState({message: 'Coven description must be under 8000 characters long.'});
        } else {
            fetch('/api/chat/room/create', {
                method: 'POST',
                body: JSON.stringify(this.state),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                if (res.status === 200) {
                    this.setState({
                        modalVisible: false,
                        roomName: '',
                        roomSlug: '',
                        roomDescription: '',
                        roomPrivacy: 'public',
                        formMessage: ''
                    });
                    this.refs.creatingRoomAlert.notificationAlert({
                        place: 'tr',
                        message: 'Creating your new Coven, sit tight...',
                        type: 'dark',
                        autoDismiss: 8
                    });
                }
            })
            .catch(err => {
                console.error(err);
                this.setState({ alertBox: 'Error creating room! Please try again.' });
            });
        }
    }

    showModal = () => {
        this.setState({ modalVisible: true });
    };

    hideModal = () => {
        this.setState({ modalVisible: false });
    };

    render() {
        return (
            <nav className="roomList">
                <NotificationAlert ref="creatingRoomAlert" />
                <header>
                    <h2><FontAwesomeIcon icon="moon"/> Your Covens </h2>
                    <button
                        onClick={this.showModal}
                        className="small"
                    >
                        <FontAwesomeIcon icon="plus"/>
                    </button>
                    <Modal show={this.state.modalVisible} handleClose={this.hideModal}>
                        <h1>New Coven</h1>
                        {this.state.message && <div className="formMessage">{this.state.message}</div>}
                        <form
                            onSubmit={this.handleSubmit}
                        >
                            <label htmlFor="roomName">Coven name</label>
                            <input
                                type="text"
                                className="full-width"
                                name="roomName"
                                value={this.state.roomName}
                                onChange={this.handleInputChange}
                            />
                            {this.state.roomSlug && (
                                <div className="roomSlug formMessage" style={{textAlign:"left"}}>
                                    @{this.state.roomSlug}
                                </div>
                            )}
                            <label htmlFor="roomDescription">Coven description and rules</label>
                            <Textarea
                                className="full-width"
                                name="roomDescription"
                                value={this.state.roomDescription}
                                onChange={this.handleInputChange}
                                minRows={2}
                                maxRows={10}
                            />
                            <div className="radioBoxContainer">
                                <label>
                                    <input type="radio" value="public" name="privacyRadio" onChange={this.handleOptionChange} checked={this.state.roomPrivacy === 'public'} />
                                    <div className="radioBox">
                                        <span>
                                            <strong>Public</strong><br/>
                                            <small>Anyone can join a public Coven.</small>
                                        </span>
                                    </div>
                                </label>
                                <label>
                                    <input type="radio" value="private" name="privacyRadio" onChange={this.handleOptionChange} checked={this.state.roomPrivacy === 'private'}/>
                                    <div className="radioBox">
                                        <span>
                                            <strong>Private</strong><br/>
                                            <small>An invite code is needed to join a private Coven.</small>
                                        </span>
                                    </div>
                                </label>
                            </div>
                            <button type="submit" className="full-width">Create Coven</button>
                        </form>
                    </Modal>
                </header>
                <ul>
                    {this.props.joinedRooms.map(room => {
                        return (
                            <li
                                key={room._id}
                                onClick={() => {this.props.switchRoom(room.slug)}}
                                className={(room._id === this.props.currentRoom ? "active" : "")}
                            >
                                {room.name}
                            </li>
                        )
                    })}
                </ul>
                {this.props.publicRooms.length > 0 ? (
                    <header><h2 style={{marginTop: "0.5rem"}}><FontAwesomeIcon icon="moon"/> Public Covens</h2></header>
                ) : ''}
                <ul>
                    {this.props.publicRooms.map(room => {
                        return (
                            <li
                                key={room._id}
                                onClick={() => {this.props.switchRoom(room.slug)}}
                                className={(room._id === this.props.currentRoom ? "active" : "")}
                            >
                                {room.name}
                            </li>
                        )
                    })}
                </ul>
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
                <FontAwesomeIcon className={lessThanOneDayAgo(new Date(user.lastOnline).getTime()) ? userStatus : "userInactive" } icon="circle"/> {user.username}
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
                <header>
                    <h2>Visitors</h2>
                </header>
                <ul>
                    {this.props.visitors.map(visitor => {
                        return (
                            <UserBadge member={visitor} key={visitor._id}/>
                        )
                    })}
                </ul>
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
            currentRoomID: '',
            currentRoomSlug: '',
            currentRoomName: '',
            currentRoomDescription: '',
            currentRoomMessage: '',
            currentRoomMembers: [],
            currentRoomVisitors: [],
            currentRoomPrivacy: '',
            joinedRooms: [],
            publicRooms: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
        console.log(this.props.user)
        fetch('/api/chat/room/fetch/' + (this.state.user.memory ? this.state.user.memory.lastRoom : 'global-coven'))
        .then(res => res.json())
        .then(payload => {
            console.log("Starting up, showing room")
            var currentRoomMembers = payload.room.members.sort();
            var currentRoomVisitors = payload.room.visitors.sort();
            this.setState({
                messages: payload.messages,
                currentRoomID: payload.room._id,
                currentRoomSlug: payload.room.slug,
                currentRoomName: payload.room.name,
                currentRoomDescription: payload.room.description,
                currentRoomMessage: payload.room.welcomeMessage,
                currentRoomMembers: currentRoomMembers,
                currentRoomVisitors: currentRoomVisitors,
                currentRoomPrivacy: payload.room.public
            });
            scrollToBottom();
        });

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

        var pusher = new Pusher('7155c345db324b8f1ba5', {
            cluster: 'eu',
            forceTLS: true
        });
        pusher.connection.bind('connected', () => {
            this.setState({socketId: pusher.connection.socket_id});
        });
        var channel = pusher.subscribe('messages');
        var generalChannel = pusher.subscribe('general');
        channel.bind('message-sent', data => {
            this.setState({
                messages: [...this.state.messages, data]
            });
            scrollToBottom();
        });
        generalChannel.bind('room-created', data => {
            fetch('/api/chat/room/fetch/' + data.slug)
            .then(res => res.json())
            .then(payload => {
                this.setState({
                    messages: payload.messages,
                    currentRoomID: payload.room._id,
                    currentRoomSlug: payload.room.slug,
                    currentRoomName: payload.room.name,
                    currentRoomDescription: payload.room.description,
                    currentRoomMessage: payload.room.welcomeMessage,
                    currentRoomMembers: payload.room.members,
                    currentRoomVisitors: payload.room.visitors,
                    currentRoomPrivacy: payload.room.public
                });
                scrollToBottom();
            });
        });
        generalChannel.bind('visitor-entered-room', data => {
            if (this.state.currentRoomSlug === data.room.slug) {
                if (!this.state.currentRoomVisitors.some(v => v._id.toString() === data.user._id.toString())) {
                    var currentRoomVisitors = [...this.state.currentRoomVisitors, data.user];
                    currentRoomVisitors.sort();
                    this.setState({currentRoomVisitors: currentRoomVisitors})
                }
            }
        });
        generalChannel.bind('visitor-left-room', data => {
            if (this.state.currentRoomSlug === data.room.slug) {
                this.setState({currentRoomVisitors: this.state.currentRoomVisitors.filter(m => m._id.toString() != data.user._id.toString())})
            }
        });
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
                userID: this.props.user._id,
                room: this.state.currentRoomID
            })
        })
        .catch(err => console.error(err))
    }

    switchRoom(roomSlug) {
        console.log("Switching room")
        fetch('/api/chat/room/leave/' + this.state.currentRoomSlug, {method: "POST", body: {socketId: this.state.socketId}})
        .then(res => {
            if (res.status === 200) {
                console.log("Left room: " + this.state.currentRoomSlug)
                fetch('/api/chat/room/enter/' + roomSlug, {method: "POST", body: {socketId: this.state.socketId}})
                .then(res => {
                    if (res.status === 200) {
                        console.log("Entered room!")
                        fetch('/api/chat/room/fetch/' + roomSlug)
                            .then(res => res.json())
                            .then(payload => {
                                var currentRoomMembers = payload.room.members.sort();
                                var currentRoomVisitors = payload.room.visitors.sort();
                                this.setState({
                                    messages: payload.messages,
                                    currentRoomID: payload.room._id,
                                    currentRoomSlug: payload.room.slug,
                                    currentRoomName: payload.room.name,
                                    currentRoomDescription: payload.room.description,
                                    currentRoomMessage: payload.room.welcomeMessage,
                                    currentRoomMembers: currentRoomMembers,
                                    currentRoomVisitors: currentRoomVisitors,
                                    currentRoomPrivacy: payload.room.public
                                });
                                scrollToBottom();
                        });
                    } else {
                        console.log("Failed to enter room")
                    }
                });
            } else {
                console.log("Failed to leave room")
            }
        });
    }

    render() {
        var style = this.props.isVisible ? {display: 'flex'} : {display: 'none'};
        return (
            <main className="chatDrawer" style={style}>
                <RoomList
                    currentRoom={this.state.currentRoomID}
                    switchRoom={this.switchRoom.bind(this)}
                    joinedRooms={this.state.joinedRooms}
                    publicRooms={this.state.publicRooms}
                />
                <section className="chatInterface">
                    <MessageList messages={this.state.messages} />
                    <form
                        className="chatForm"
                        onSubmit={this.handleSubmit}
                    >
                        <input
                            id="message"
                            autoComplete="off"
                            placeholder={"Message " + this.state.currentRoomName}
                            onChange={this.handleChange}
                            value={this.state.message}
                        />
                        <button><FontAwesomeIcon icon="chevron-right"/></button>
                    </form>

                </section>
                <UserList
                    members={this.state.currentRoomMembers}
                    visitors={this.state.currentRoomVisitors}
                />
            </main>
        );
    }
}

export default ChatDrawer;
