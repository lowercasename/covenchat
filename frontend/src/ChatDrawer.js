import React, { Component } from 'react';
import 'simplebar';
import 'simplebar/dist/simplebar.css';
import Pusher from 'pusher-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ChatDrawer.css';

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
                                        {message.tarot.map(card => {
                                            return (
                                                <img
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
            modalVisible: false
        }
        this.createRoom = this.createRoom.bind(this)
    }

    createRoom() {

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
                        <form>
                            <input className="full-width" name="roomName" placeholder="Coven name"></input>
                            <textarea className="full-width" name="roomDescription" placeholder="Coven description and rules"></textarea>
                            <div className="radioBoxContainer">
                                <label>
                                    <input type="radio" name="privacyRadio" defaultChecked />
                                    <div className="radioBox">
                                        <span>
                                            <strong>Public</strong><br/>
                                            <small>Anyone can join a public Coven.</small>
                                        </span>
                                    </div>
                                </label>
                                <label>
                                    <input type="radio" name="privacyRadio" />
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
                            <li key={room._id}>
                                {room.name}
                            </li>
                        )
                    })}
                </ul>
                <h2><FontAwesomeIcon icon="moon"/> Public Covens</h2>
                <ul>
                    {this.props.publicRooms.map(room => {
                        return (
                            <li key={room._id}>
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
        const lessThanOneHourAgo = (date) => {
            const oneHour = 1000 * 60 * 60;
            const anHourAgo = Date.now() - oneHour;
            return date > anHourAgo;
        }
        let gatsbysGreenLight = lessThanOneHourAgo(new Date(this.props.member.user.lastOnline).getTime()) ? <FontAwesomeIcon className="userActive" icon="circle"/> : <FontAwesomeIcon className="userInactive" icon="circle"/>;
        return (
            <li key={this.props.member.user._id}>
                {gatsbysGreenLight} {this.props.member.user.username}
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
                            <UserBadge member={member}/>
                        )
                    })}
                </ul>
            </section>
        )
    }
}

class ChatDrawer extends Component {
    constructor() {
        super()
        this.state = {
            messages: [],
            message: '',
            modalVisible: false,
            currentRoom: {
                name: '',
                description: '',
                welcomeMessage: '',
                members: [],
                public: ''
            },
            joinedRooms: [],
            publicRooms: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
        fetch('/api/chat/room/fetch/5d88ebddbbecc739b51c1bca')
        .then(res => res.json())
        .then(payload => {
            console.log(payload)
            this.setState({ messages: payload.messages, currentRoom: payload.room });
            this.scrollToBottom();
        });

        fetch('/api/chat/room/fetch-all/')
        .then(res => res.json())
        .then(payload => {
            this.setState({ joinedRooms: payload });
        });

        var pusher = new Pusher('7155c345db324b8f1ba5', {
            cluster: 'eu',
            forceTLS: true
        });
        var socketId = null;
        pusher.connection.bind('connected', function () {
            socketId = pusher.connection.socket_id;
        });
        var channel = pusher.subscribe('messages');
        channel.bind('message-sent', data => {
            this.setState({
                messages: [...this.state.messages, data]
            });
            this.scrollToBottom();
        });
    }

    scrollToBottom() {
        var messages = document.querySelector('#chatWindow .simplebar-content-wrapper'); messages.scrollTo({ top: messages.scrollHeight, behavior: "auto" });
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
                room: this.state.currentRoom._id
            })
        })
        .catch(err => console.error(err))
    }

    render() {
        var style = this.props.isVisible ? {display: 'flex'} : {display: 'none'};
        return (
            <main className="chatDrawer" style={style}>
                <RoomList
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
                            placeholder={"Message " + this.state.currentRoom.name}
                            onChange={this.handleChange}
                            value={this.state.message}
                        />
                        <button><FontAwesomeIcon icon="chevron-right"/></button>
                    </form>
                    
                </section>
                <UserList
                    members={this.state.currentRoom.members}
                />
            </main>
        );
    }
}

export default ChatDrawer;
