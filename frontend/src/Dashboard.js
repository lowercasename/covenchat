import React, { Component } from 'react';

import './App.css';

import StatusBar from './StatusBar';
import ChatDrawer from './ChatDrawer';

import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faComments, faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed)

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chatVisible: true,
            mapVisible: false,
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
            this.setState({chatVisible: false, mapVisible: true})
        } else {
            this.setState({chatVisible: true, mapVisible: false})
        }
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

    render() {
        let mapStyle = this.state.mapVisible ? {display:'flex'} : {display: 'none'};
        return (
            <div className="App">
                <nav className="sideNav">
                    <img src="magic-ball-alt.svg" className="navLogo" />
                    <div className="navIcon" onClick={this.toggleChat}>
                        <FontAwesomeIcon icon={['far', 'comments']} />
                    </div>
                    <div className="navIcon" >
                        <img src="candle.svg" style={{width:"30px"}}></img>
                    </div>
                    <div className="navIcon" onClick={this.logOut} >
                        <FontAwesomeIcon icon="sign-out-alt" />
                    </div>
                </nav>
                <main className="content">
                    <div id="map" style={mapStyle}><h1>Map</h1></div>
                    <ChatDrawer
                        isVisible={this.state.chatVisible}
                        user={this.state.user}
                    />
                    <StatusBar />
                </main>
            </div>
        );
    }
}

export default Dashboard;
