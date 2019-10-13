import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './Settings.css';

class FlairSelector extends Component {

    constructor(props) {
        super(props);
        this.state = {
            currentFlair: this.props.user.settings.flair
        }
    }

    icons = [
        "/flair/bat-1.svg",
        "/flair/bat-2.svg",
        "/flair/broom.svg",
        "/flair/candle-1.svg",
        "/flair/candle-2.svg",
        "/flair/candle-3.svg",
        "/flair/candle-4.svg",
        "/flair/cat-1.svg",
        "/flair/cat-2.svg",
        "/flair/cauldron.svg",
        "/flair/crow.svg",
        "/flair/crystal-ball-1.svg",
        "/flair/crystal-ball-2.svg",
        "/flair/crystal-ball-3.svg",
        "/flair/crystals.svg",
        "/flair/dagger.svg",
        "/flair/eye.svg",
        "/flair/gems.svg",
        "/flair/gender.svg",
        "/flair/grimoire-1.svg",
        "/flair/grimoire-2.svg",
        "/flair/hat-1.svg",
        "/flair/hat-2.svg",
        "/flair/hat-3.svg",
        "/flair/moon-1.svg",
        "/flair/moon-2.svg",
        "/flair/mortar.svg",
        "/flair/owl.svg",
        "/flair/pentacle-1.svg",
        "/flair/pentacle-2.svg",
        "/flair/potion.svg",
        "/flair/raven.svg",
        "/flair/rune.svg",
        "/flair/skull.svg",
        "/flair/spellbook.svg",
        "/flair/tarot-1.svg",
        "/flair/tarot-2.svg",
        "/flair/tarot-3.svg",
        "/flair/toad.svg",
        "/flair/vegvisir.svg"
    ];

    render() {
        return (
            <div id="flairSelector">
                {this.icons.map(icon => {
                    return (
                        <label key={icon} htmlFor={icon}>
                            <input
                                onChange={this.props.handleSettingsInputChange}
                                type="radio"
                                name="flair"
                                id={icon}
                                value={icon}
                                checked={this.props.user.settings.flair === icon}/>
                            <img
                                alt={"Flair icon: " + icon}
                                className="icon"
                                src={icon}/>
                        </label>

                    )
                })}
            </div>
        )
    }
}

export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    render() {
        let style = {
            display: this.props.isVisible ? 'block' : 'none'
        };
        let modules = this.props.user.settings.statusBarModules;
        return (
            <div id="settings" style={style}>
                <h1>User settings</h1>
                <h2>Location</h2>
                <label htmlFor="shareLocation">
                    <input
                        id="shareLocation"
                        type="checkbox"
                        name="shareLocation"
                        checked={this.props.user.settings.shareLocation}
                        onChange={this.props.handleSettingsInputChange}
                    /> Share my current location on the map
                </label>
                <small>Your location is shown on the map for one hour after you close the app, and is then hidden until you next use it.</small>
                <h2>Chat</h2>
                <p><strong>Status</strong></p>
                <div id="statusSelector">
                    <label htmlFor="available">
                        <input
                            onChange={this.props.handleSettingsInputChange}
                            type="radio"
                            name="status"
                            id="available"
                            value="available"
                            checked={this.props.user.settings.status === "available"}/>
                        <span><FontAwesomeIcon icon="circle" className="userAvailable"/> Available</span>
                    </label>
                    <label htmlFor="away">
                        <input
                            onChange={this.props.handleSettingsInputChange}
                            type="radio"
                            name="status"
                            id="away"
                            value="away"
                            checked={this.props.user.settings.status === "away"}/>
                        <span><FontAwesomeIcon icon="circle" className="userAway"/> Away</span>
                    </label>
                    <label htmlFor="dnd">
                        <input
                            onChange={this.props.handleSettingsInputChange}
                            type="radio"
                            name="status"
                            id="dnd"
                            value="dnd"
                            checked={this.props.user.settings.status === "dnd"}/>
                        <span><FontAwesomeIcon icon="circle" className="userDnD"/> Do not disturb</span>
                    </label>
                    <label htmlFor="invisible">
                        <input
                            onChange={this.props.handleSettingsInputChange}
                            type="radio"
                            name="status"
                            id="invisible"
                            value="invisible"
                            checked={this.props.user.settings.status === "invisible"}/>
                        <span><FontAwesomeIcon icon="circle" className="userInvisible"/> Invisible</span>
                    </label>
                </div>
                <p><strong>Username flair</strong></p>
                <FlairSelector user={this.props.user} handleSettingsInputChange={this.props.handleSettingsInputChange}/>
                <h2>Status bar modules</h2>
                {Object.keys(modules).map(key => {
                    return (
                        <label key={modules[key].slug} htmlFor={modules[key].slug}>
                            <input
                                id={modules[key].slug}
                                type="checkbox"
                                name={modules[key].slug}
                                checked={modules[key].set}
                                onChange={this.props.handleStatusBarUpdate}
                            /> {modules[key].prettyName}
                        </label>
                    );
                })}
                <button
                    onClick={this.props.logOut}
                    style={{marginBottom:"1rem"}}
                >
                    Sign out
                </button>
            </div>
        )
    }

}
