import React, { Component } from 'react';

import './App.css';

import StatusBar from './StatusBar';
import ChatDrawer from './ChatDrawer';

import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faComments, faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt)

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chatVisible: true,
            user: this.props.user
        }
        this.toggleChat = this.toggleChat.bind(this);
        this.logOut = this.logOut.bind(this);
    }

    componentDidMount() {
        console.log(this.props)
        // fetch('/api/ver')
        //   .then(res => res.json())
        //   .then(users => this.setState({ users }));
    }

    toggleChat() {
        if (this.state.chatVisible) {
            this.setState({chatVisible: false})
        } else {
            this.setState({chatVisible: true})
        }
    }

    logOut() {
        fetch('/api/user/logout', {
            method: 'POST'
        })
        .then(res => {
            if (res.status === 200) {
                this.props.history.push('/');
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

    render() {
        return (
            <div className="App">
                <nav className="sideNav">
                    <img src="magic-ball.svg" className="navLogo" />
                    <div className="navIcon" onClick={this.toggleChat}>
                        <FontAwesomeIcon icon={['far', 'comments']} />
                    </div>
                    <div className="navIcon" >
                        <FontAwesomeIcon icon="praying-hands" />
                    </div>
                    <div className="navIcon" onClick={this.logOut} >
                        <FontAwesomeIcon icon="sign-out-alt" />
                    </div>
                </nav>
                <main className="content">
                    <div id="map"></div>
                    <StatusBar />
                </main>
                <ChatDrawer
                    isVisible={this.state.chatVisible}
                    user={this.state.user}
                />
            </div>
        );
    }
}

export default Dashboard;
