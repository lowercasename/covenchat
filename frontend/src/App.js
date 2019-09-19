import React, { Component } from 'react';
import './App.css';

import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import StatusBar from './StatusBar';
import ChatDrawer from './ChatDrawer';

library.add(faComments, faChevronRight)

class App extends Component {
    constructor() {
        super();
        this.state = {
            chatVisible: true
        }
        this.toggleChat = this.toggleChat.bind(this);
    }

    componentDidMount() {
        // fetch('/api/users')
        //   .then(res => res.json())
        //   .then(users => this.setState({ users }));
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
                userID: 'foo',
                room: 'global'
            })
        })
    }

    toggleChat() {
        if (this.state.chatVisible) {
            this.setState({chatVisible: false})
        } else {
            this.setState({chatVisible: true})
        }
    }

    render() {
        return (
            <div className="App">
                <nav className="sideNav">
                    <img src="magic-ball.svg" className="navLogo" />
                    <div
                        className="navIcon"
                        onClick={this.toggleChat}
                    >
                        <FontAwesomeIcon icon={['far', 'comments']} />
                    </div>
                </nav>
                <main className="content">
                    <div id="map"></div>
                    {/* {this.state.users.map(user =>
            <div key={user.id}>{user.username}</div>
          )} */}
                    <StatusBar />
                </main>
                <ChatDrawer
                    sendMessage={this.sendMessage}
                    isVisible={this.state.chatVisible}
                />
            </div>
        );
    }
}

export default App;