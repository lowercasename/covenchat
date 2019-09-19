import React, { Component } from 'react';
import Pusher from 'pusher-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ChatDrawer.css';

class MessageList extends Component {
    render() {
        return (
            <div className="chatWindow" id="chatWindow">
                <ul className="messageList">
                    {this.props.messages.map(message => {
                        return (
                            <li key={message._id} className={message.type}>
                                <span className="messageAuthor">
                                    {message.userID}
                                </span>
                                <span className="messageContent">
                                    {message.content}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }
}

class ChatDrawer extends Component {
    constructor() {
        super()
        this.state = {
            messages: [],
            message: '',
            room: 'global'
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.createRoom = this.createRoom.bind(this)
    }

    componentDidMount() {
        fetch('/api/chat/room/fetch/' + this.state.room)
            .then(res => res.json())
            .then(payload => {
                this.setState({ messages: payload });
                this.scrollToBottom();
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
        var messages = document.getElementById('chatWindow');
        messages.scrollTop = messages.scrollHeight;
    }

    handleSubmit(e) {
        e.preventDefault()
        var messageContent = this.state.message.trim();
        if (messageContent != '' && messageContent != '/me'){
            this.props.sendMessage(messageContent)
            this.setState({
                message: ''
            })
        }
    }

    createRoom() {
        
    }
  

    handleChange(e) {
        this.setState({
          message: e.target.value
        })
      }

    render() {
        var style = this.props.isVisible ? {right: '0px'} : {right: '-400px'};
        return (
            <aside className="chatDrawer" style={style}>
                <div class="roomTitle">
                    Chatting in @global
                    <button
                        onClick={this.createRoom}
                    >
                        New
                    </button>
                </div>
                <MessageList messages={this.state.messages} />
                <form
                    className="chatForm"
                    onSubmit={this.handleSubmit}
                >
                    <input
                        id="message"
                        autocomplete="off"
                        placeholder="Message @global"
                        onChange={this.handleChange}
                        value={this.state.message}
                    />
                    <button><FontAwesomeIcon icon="chevron-right" /></button>
                </form>
            </aside>
        );
    }
}

export default ChatDrawer;