import React, { Component } from 'react';

import StatusBar from './StatusBar';
import ChatDrawer from './ChatDrawer';
import Altar from './Altar';

import { toast } from 'react-toastify';

import { library } from '@fortawesome/fontawesome-svg-core'
// import { fab } from '@fortawesome/free-brands-svg-icons'
import { faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint } from '@fortawesome/free-solid-svg-icons';
import { faComments, faCompass } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faComments, faChevronRight, faTimes, faPlus, faHome, faMoon, faPrayingHands, faSignOutAlt, faCircle, faMinus, faCog, faDoorOpen, faDoorClosed, faUserPlus, faBurn, faTh, faShapes, faParagraph, faBan, faPalette, faTint, faCompass)

toast.configure()

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visibleModule: 'altar',
            user: this.props.user
        }
        this.logOut = this.logOut.bind(this);
    }

    componentDidMount() {
        console.log(this.props)
        // fetch('/api/ver')
        //   .then(res => res.json())
        //   .then(users => this.setState({ users }));
    }

    toggleView(module) {
        this.setState({
            visibleModule: module
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

    render() {
        let mapStyle = this.state.visibleModule === "map" ? {display:'flex'} : {display: 'none'};
        return (
            <div className="App">
                <nav className="sideNav"><i class="fas fa-compass"></i>
                    <img src="magic-ball-alt.svg" className="navLogo" />
                    <div className="navIcon" onClick={() => this.toggleView('map')}>
                        <FontAwesomeIcon icon={['far', 'compass']} />
                    </div>
                    <div className="navIcon" onClick={() => this.toggleView('chat')}>
                        <FontAwesomeIcon icon={['far', 'comments']} />
                    </div>
                    <div className="navIcon" onClick={() => this.toggleView('altar')}>
                        <span className="hermetica-F032-pentacle" style={{fontSize:"40px"}}/>
                    </div>
                    <div className="navIcon" onClick={this.logOut} >
                        <FontAwesomeIcon icon="sign-out-alt" />
                    </div>
                </nav>
                <main className="content">
                    <div id="map" style={mapStyle}><h1>Map</h1></div>
                    <ChatDrawer
                        isVisible={this.state.visibleModule === "chat" ? true : false}
                        user={this.state.user}
                    />
                    <Altar
                        isVisible={this.state.visibleModule === "altar" ? true : false}
                        user={this.state.user}
                    />
                    <StatusBar />
                </main>
            </div>
        );
    }
}

export default Dashboard;
