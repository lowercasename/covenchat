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
        "/flair/bat.svg",
        "/flair/broom.svg",
        "/flair/candle.svg",
        "/flair/cat.svg",
        "/flair/cauldron.svg",
        "/flair/crow.svg",
        "/flair/crystal-ball.svg",
        "/flair/crystals.svg",
        "/flair/eye.svg",
        "/flair/grimoire-1.svg",
        "/flair/grimoire-2.svg",
        "/flair/hat-1.svg",
        "/flair/hat-2.svg",
        "/flair/hat-3.svg",
        "/flair/moon.svg",
        "/flair/mortar.svg",
        "/flair/pentacle-1.svg",
        "/flair/pentacle-2.svg",
        "/flair/potion.svg",
        "/flair/raven.svg",
        "/flair/rune.svg",
        "/flair/skull.svg",
        "/flair/spellbook.svg",
        "/flair/tarot.svg",
        "/flair/vegvisir.svg"
    ];

    render() {
        return (
            <div id="flairSelector">
                {this.icons.map(icon => {
                    return (
                        <label htmlFor={icon}>
                            <input
                                onChange={this.props.handleSettingsInputChange}
                                type="radio"
                                name="flair"
                                id={icon}
                                value={icon}
                                checked={this.props.user.settings.flair === icon}/>
                            <img
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
                <p><strong>Username flair</strong></p>
                <FlairSelector user={this.props.user} handleSettingsInputChange={this.props.handleSettingsInputChange}/>
                <h2>Status bar modules</h2>
                {Object.keys(modules).map(key => {
                    return (
                        <label htmlFor={modules[key].slug}>
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
                >
                    Sign out
                </button>
            </div>
        )
    }

}
