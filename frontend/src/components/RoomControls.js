import React, { Component } from 'react';
import "react-notification-alert/dist/animate.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Textarea from 'react-textarea-autosize';
import './ReactTags.css';
const ReactTags = require('react-tag-autocomplete')


function slugify(string) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
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

class CreateRoomControls extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modalVisible: false,
            roomName: '',
            roomSlug: '',
            roomDescription: '',
            roomPrivacy: 'public',
            formMessage: '',
            submitDisabled: false
        }
    }
    showModal = () => {
        this.setState({modalVisible: true})
    }

    hideModal = () => {
        this.setState({modalVisible: false})
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
        if (name === "roomName") {
            this.setState({
                roomSlug: slugify(value)
            })
        }
    }

    handleOptionChange = (event) => {
        this.setState({
            roomPrivacy: event.target.value
        });
    }

    handleKeyUp = (event) => {
        fetch('/api/chat/room/fetch-all')
        .then(res => res.json())
        .then(res => {
            if (res.some(r => r.slug === this.state.roomSlug)) {
                this.setState({
                    message: 'A Coven with this name already exists.',
                    submitDisabled: true
                })
            } else {
                this.setState({
                    message: '',
                    submitDisabled: false
                })
            }
        })
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if (this.state.roomName.length < 3 || this.state.roomName.length > 33) {
            this.setState({message: 'Coven name must be between 3 and 33 characters long.'});
        } else if (this.state.roomDescription.length > 800) {
            this.setState({message: 'Coven description must be under 800 characters long.'});
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
                }
            })
            .catch(err => {
                console.error(err);
                this.setState({ alertBox: 'Error creating room! Please try again.' });
            });
        }
    }
    render() {
        return (
            <>
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
                            onKeyUp={this.handleKeyUp}
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
                                        <small>New members must be invited to a private Coven.</small>
                                    </span>
                                </div>
                            </label>
                        </div>
                        <small>You will not be able to change the Coven's privacy after it is made.</small>
                        <button style={{marginTop:"1rem"}} type="submit" className="full-width" disabled={this.state.submitDisabled}>Create Coven</button>
                    </form>
                </Modal>
            </>
        )
    }
}

class HideRoomControls extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false
        }
    }
    showModal = () => {
        this.setState({modalVisible: true})
    }

    hideModal = () => {
        this.setState({modalVisible: false})
    }
    handleSubmit = (event) => {
        event.preventDefault();
        let roomToHide = this.props.currentRoom;
        fetch('/api/chat/room/hide/' + roomToHide.slug, {
            method: 'POST',
        })
        .then(res => {
            if (res.status === 200) {
                this.setState({
                    modalVisible: false
                });
                this.props.hideRoom(roomToHide);
            }
        })
        .catch(err => {
            console.error(err);
            this.setState({ alertBox: 'Error hiding room! Please try again.' });
        });
    }
    render() {
        return (
            <>
                <button
                    onClick={this.showModal}
                    className="full-width"
                >
                    <FontAwesomeIcon icon="eye-slash"/> Hide this chat
                </button>
                <Modal show={this.state.modalVisible} handleClose={this.hideModal}>
                    <h1>Hide chat</h1>
                    <form
                        onSubmit={this.handleSubmit}
                    >
                        <p style={{marginBottom:"1rem"}}>Are you sure you want to hide this chat? You will not be notified of any new messages in it. You can unhide it in your settings.</p>
                        <button type="submit" className="full-width">Hide chat</button>
                    </form>
                </Modal>
            </>
        )
    }
}

class JoinLeaveRoomControls extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    render() {
        return (
            <>
                {!this.props.currentRoomMembers.some(m => m.user.username === this.props.user.username) &&
                    <button
                        onClick={(e) => {this.props.joinRoom(this.props.currentRoom.slug, e)}}
                        className="full-width"
                        disabled={this.props.joinDisabled}
                    >
                        <FontAwesomeIcon icon="door-closed"/> Join Coven
                    </button>
                }
                {this.props.currentRoomMembers.some(m => m.user.username === this.props.user.username) &&
                    <button
                        onClick={(e) => {this.props.leaveRoom(this.props.currentRoom.slug, e)}}
                        className="full-width"
                        disabled={this.props.leaveDisabled}
                    >
                        <FontAwesomeIcon icon="door-open"/> Leave Coven
                    </button>
                }
            </>
        )
    }
}

class EditRoomControls extends Component {
    constructor(props) {
        super(props);
        let roomMembersTags = [], roomAdminsTags = [];
        let roomMembers = this.props.currentRoomMembers.filter(m => m.role === "member");
        let roomAdmins = this.props.currentRoomMembers.filter(m => m.role === "administrator");
        roomMembers.forEach((m, index) => {
            roomMembersTags.push({id: m.user._id, name: m.user.username})
        })
        roomAdmins.forEach((m, index) => {
            roomAdminsTags.push({id: m.user._id, name: m.user.username})
        })
        this.state = {
            modalVisible: false,
            message: '',
            roomID: this.props.currentRoom._id,
            roomName: this.props.currentRoom.name,
            roomDescription: this.props.currentRoom.description,
            roomSlug: this.props.currentRoom.slug,
            roomWelcomeMessage: this.props.currentRoom.welcomeMessage,
            submitDisabled: false,
            roomMembers: roomMembersTags,
            roomAdmins: roomAdminsTags,
            socketId: this.props.socketId
        }
    }
    showModal = () => {
        this.setState({modalVisible: true})
    }

    hideModal = () => {
        this.setState({modalVisible: false})
    }

    handleAddition = (tag) =>  {
        // Can only add members already in room, and can't add members twice
        if (this.state.roomMembers.some(m => m.name === tag.name) && !this.state.roomAdmins.some(m => m.name === tag.name)){
            const roomAdmins = [...this.state.roomAdmins, tag];
            this.setState({ roomAdmins })
        }
    }

    handleDelete = (i) => {
        // Can't delete yourself
        const roomAdmins = this.state.roomAdmins.slice(0);
        if (roomAdmins[i].name !== this.props.user.username) {
            roomAdmins.splice(i, 1);
            this.setState({ roomAdmins });
        }
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
        if (name === "roomName") {
            this.setState({
                roomSlug: slugify(value)
            })
        }
    }

    handleKeyUp = (event) => {
        fetch('/api/chat/room/fetch-all')
        .then(res => res.json())
        .then(res => {
            if (res.some(r => r.slug === this.state.roomSlug)) {
                this.setState({
                    message: 'A Coven with this name already exists.',
                    submitDisabled: true
                })
            } else {
                this.setState({
                    message: '',
                    submitDisabled: false
                })
            }
        })
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if (this.state.roomName.length < 3 || this.state.roomName.length > 33) {
            this.setState({message: 'Coven name must be between 3 and 33 characters long.'});
        } else if (this.state.roomDescription.length > 800) {
            this.setState({message: 'Coven description must be under 800 characters long.'});
        } else if (this.state.roomWelcomeMessage.length > 800) {
            this.setState({message: 'Welcome message must be under 800 characters long.'});
        } else {
            console.log(this.state)
            fetch('/api/chat/room/edit', {
                method: 'POST',
                body: JSON.stringify(this.state),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                console.log(res)
                if (res.status === 200) {
                    console.log(this.state.roomSlug)
                    this.props.reloadRoom(this.state.roomSlug);
                    this.props.reloadRoomList();
                    this.setState({modalVisible: false});
                }
            })
            .catch(err => {
                console.error(err);
                this.setState({ alertBox: 'Error modifying room! Please try again.' });
            });
        }
    }
    render() {
        // var isAdministrator = (this.props.currentRoomMembers.some(m => m.user.username === this.props.user.username && m.role === "administrator"));
        return (
            <>
                <button
                    type="button"
                    className="full-width"
                    onClick={this.showModal}
                >
                    <FontAwesomeIcon icon="cog"/> Manage Coven
                </button>
                <Modal show={this.state.modalVisible} handleClose={this.hideModal}>
                    <h1>Manage {this.props.currentRoom.name}</h1>
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
                            onKeyUp={this.handleKeyUp}
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
                        <label htmlFor="roomWelcomeMessage">Welcome message</label>
                        <Textarea
                            className="full-width"
                            name="roomWelcomeMessage"
                            value={this.state.roomWelcomeMessage}
                            onChange={this.handleInputChange}
                            minRows={2}
                            maxRows={10}
                        />
                        <label htmlFor="roomWelcomeMessage">Administrators</label>
                        <p>Start typing a username to add that user to the Coven administrators group.</p>
                        <ReactTags
                            tags={this.state.roomAdmins}
                            suggestions={this.state.roomMembers}
                            placeholder="Add new admin"
                            handleDelete={this.handleDelete.bind(this)}
                            handleAddition={this.handleAddition.bind(this)} />
                        <button type="submit" className="full-width" disabled={this.state.submitDisabled}>Update Coven</button>
                    </form>
                </Modal>
            </>
        )
    }
}

class InviteToRoomControls extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modalVisible: false,
            username: '',
            message: ''
        }
    }
    showModal = () => {
        this.setState({modalVisible: true})
    }

    hideModal = () => {
        this.setState({modalVisible: false})
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        fetch('/api/user/fetch-by-username/' + this.state.username)
        .then(res => {
            if (res.status === 200) {
                console.log("Looks great")
                return res.json();
            } else {
                this.setState({message: 'Nobody found with this username.'})
                return false;
            }
        })
        .then(res => {
            if (res.user) {
                fetch('/api/chat/room/invite/' + this.props.currentRoom.slug + '/' + res.user[0]._id, {
                    method: 'POST'
                })
                .then(res => {
                    if (res.status === 200) {
                        // Send the invited person a notification
                        fetch('/api/user/send-notification', {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                user: this.state.username,
                                notification: {
                                    sender: this.state.username,
                                    type: 'added-to-private-room',
                                    text: "You have been added to the private Coven '" + this.props.currentRoom.name + "'.",
                                }
                            })
                        })
                        // Clear the form
                        this.setState({
                            modalVisible: false,
                            username: '',
                            message: ''
                        });
                    } else {
                        this.setState({message: 'This person is already a member of the Coven.'})
                    }
                })
                .catch(err => {
                    console.error(err);
                    this.setState({ alertBox: 'Error adding new member! Please try again.' });
                });
            }
        })
    }
    render() {
        return (
            <>
                <button
                    type="button"
                    className="full-width"
                    onClick={this.showModal}
                >
                    <FontAwesomeIcon icon="plus"/> Invite to Coven
                </button>
                <Modal show={this.state.modalVisible} handleClose={this.hideModal}>
                    <h1>Invite a new member to {this.props.currentRoom.name}</h1>
                    {this.state.message && <div className="formMessage">{this.state.message}</div>}
                    <form
                        onSubmit={this.handleSubmit}
                    >
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            className="full-width"
                            name="username"
                            value={this.state.username}
                            onChange={this.handleInputChange}
                        />
                        <button type="submit" className="full-width">Invite</button>
                    </form>
                </Modal>
            </>
        )
    }
}

export { CreateRoomControls, EditRoomControls, JoinLeaveRoomControls, InviteToRoomControls, HideRoomControls }
