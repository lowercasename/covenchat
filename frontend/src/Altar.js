import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { RIETextArea } from 'riek';

import ContentEditable from 'react-contenteditable';

import './Altar.css';

import { SketchPicker } from 'react-color';

import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css'

import FontIconPicker from '@fonticonpicker/react-fonticonpicker';
import '@fonticonpicker/react-fonticonpicker/dist/fonticonpicker.base-theme.react.css';
import '@fonticonpicker/react-fonticonpicker/dist/fonticonpicker.material-theme.react.css';

import ReactHtmlParser from 'react-html-parser';

import Editor from './Editor.js';

const icons = {
    "Occult": [
        "hermetica-F032-pentacle",
        "hermetica-F004-triple_goddess",
        "hermetica-F005-horned_god",
        "hermetica-F006-wheel_of_the_year",
        "hermetica-F007-pentagram",
        "hermetica-F008-pentagram_interlaced",
        "hermetica-F009-pentagram_circumscribed",
        "hermetica-F030-monad_john_dee"
    ],
    "Astrology": [
        "hermetica-F033-seal_saturn",
        "hermetica-F034-seal_jupiter",
        "hermetica-F035-seal_mars",
        "hermetica-F036-seal_sun",
        "hermetica-F037-seal_venus",
        "hermetica-F038-seal_mercury",
        "hermetica-F039-seal_moon",
        "hermetica-F040-sigil_lucifer",
        "hermetica-F042-sigil_chaos",
        "hermetica-A000-aries",
        "hermetica-A001-taurus",
        "hermetica-A002-gemini",
        "hermetica-A003-cancer",
        "hermetica-A004-leo",
        "hermetica-A005-virgo",
        "hermetica-A006-libra",
        "hermetica-A007-scorpio",
        "hermetica-A008-sagittarius",
        "hermetica-A009-capricorn",
        "hermetica-A010-aquarius",
        "hermetica-A011-pisces",
        "hermetica-B000-sun",
        "hermetica-B001-moon",
        "hermetica-B002-mercury",
        "hermetica-B003-venus",
        "hermetica-B004-earth",
        "hermetica-B005-mars",
        "hermetica-B006-jupiter",
        "hermetica-B007-saturn",
        "hermetica-B008-uranus",
        "hermetica-B010-neptune",
        "hermetica-B011-pluto",
        "hermetica-B020-moon_phase_waxing_crescent",
        "hermetica-B021-moon_phase_waxing_half",
        "hermetica-B022-moon_phase_waxing_gibbous",
        "hermetica-B023-moon_phase_full",
        "hermetica-B024-moon_phase_waning_gibbous",
        "hermetica-B025-moon_phase_waning_half",
        "hermetica-B026-moon_phase_waning_crescent",
        "hermetica-B027-moon_phase_new",
    ],
    "Alchemy": [
        "hermetica-D000-fire",
        "hermetica-D001-water",
        "hermetica-D002-air",
        "hermetica-D003-earth",
    ],
    "Norse": [
        "hermetica-G000-fehu",
        "hermetica-G001-uruz",
        "hermetica-G002-thurisaz",
        "hermetica-G003-ansuz",
        "hermetica-G004-raitho",
        "hermetica-G005-kaunaz",
        "hermetica-G006-gebo",
        "hermetica-G007-wunjo",
        "hermetica-G009-hagalaz_alt",
        "hermetica-G010-nauthiz",
        "hermetica-G011-isa",
        "hermetica-G012-jera",
        "hermetica-G013-eihwaz",
        "hermetica-G014-perthro",
        "hermetica-G015-algiz",
        "hermetica-G016-sowilo",
        "hermetica-G017-tiwaz",
        "hermetica-G018-berkano",
        "hermetica-G019-ehwaz",
        "hermetica-G020-mannaz",
        "hermetica-G021-laguz",
        "hermetica-G022-inguz",
        "hermetica-G023-dagaz",
        "hermetica-G024-othala",
        "hermetica-G030-odins_horn",
        "hermetica-G031-mjolnir",
        "hermetica-G032-gungnir",
        "hermetica-G038-shield_knot_interlaced",
        "hermetica-G040-valknut",
        "hermetica-G044-triskele",
        "hermetica-G045-sonnenrad",
        "hermetica-G052-web_of_wyrd"
    ],
    "Baltic": [
        "hermetica-H000-fern_flower",
        "hermetica-H001-perkonkrusts",
    ],
    "Celtic": [
        "hermetica-I000-druid_sigil",
        "hermetica-I003-triquetra",
        "hermetica-I005-interlaced_triquetra",
        "hermetica-I007-triskelion_alt",
        "hermetica-I008-triple_spiral",
        "hermetica-I009-double_spiral",
        "hermetica-I013-samhain",
        "hermetica-I014-yule",
        "hermetica-I015-imbolc",
        "hermetica-I016-ostara",
        "hermetica-I017-beltane",
        "hermetica-I018-lithe",
        "hermetica-I019-lammas",
        "hermetica-I020-mabon",
    ],
    "Miscellaneous": [
        "hermetica-J009-labyrinth",
        "hermetica-J012-oroboros",
        "hermetica-N022-veganarchy",
        "hermetica-N023-anarchy",
        "hermetica-N024-anarchism",
        "hermetica-P000-lemniscate",
        "hermetica-P001-lemniscate_interlaced",
        "hermetica-P010-hammer_and_sickle",
        "hermetica-P012-gordian_knot"
    ]
}

class EmptyIcon extends Component {
    render() {
        var style = { ...this.props.style, border: "2px dashed", borderRadius: "2px", width: "1rem", height: "1rem", display: "inline-block", position: "relative", top: "2.5px" }
        return (
            <span style={style}></span>
        )
    }
}

class ColorPickerButton extends Component {
    state = {
        displayColorPicker: false
    };

    render() {
        return (
            <Tooltip
                trigger="click"
                interactive
                theme="light"
                arrow="true"
                html={(
                    <SketchPicker
                        color={this.props.color}
                        onChangeComplete={(color, event) => this.props.handleChangeComplete(color, event, this.props.cellIndex)} />
                )}
            >
                <button
                    type="button"
                    className={this.props.className}
                    style={{ marginTop: (this.props.backgroundPicker ? "0.5rem" : "0") }}
                >
                    <FontAwesomeIcon icon="paint-brush"/> {this.props.backgroundPicker && " Background color"}
                </button>
            </Tooltip>
        )
    }
}

class CellEditingTools extends Component {
    render() {
        let typeIcon = () => {
            switch (this.props.cell.type) {
                case "empty":
                    return <EmptyIcon style={{ marginRight: '25px' }} />;
                case "image":
                    return <FontAwesomeIcon icon="shapes" style={{ marginRight: '25px' }} />;
                case "text":
                    return <FontAwesomeIcon icon="paragraph" style={{ marginRight: '25px' }} />;
                default:
                    return <EmptyIcon style={{ marginRight: '25px' }} />;
            }
        }
        return (
            <div className="cellEditingTools">
                <label className="dropdown" style={{ display: "inline-block" }}>
                    <div className="dropdown-button">
                        {typeIcon()}
                    </div>
                    <input type="checkbox" className="dropdown-input" />
                    <ul className="dropdown-menu">
                        <li onClick={() => this.props.editAltarCellType({ [`cell-${this.props.index + 1}`]: "empty" })} className={(this.props.cell.type === "empty" ? "selected" : undefined)}><EmptyIcon /> Empty</li>
                        <li onClick={() => this.props.editAltarCellType({ [`cell-${this.props.index + 1}`]: "image" })} className={(this.props.cell.type === "image" ? "selected" : undefined)}><FontAwesomeIcon icon="shapes" /> Image</li>
                        <li onClick={() => this.props.editAltarCellType({ [`cell-${this.props.index + 1}`]: "text" })} className={(this.props.cell.type === "text" ? "selected" : undefined)}><FontAwesomeIcon icon="paragraph" /> Text</li>
                    </ul>
                </label>
                <ColorPickerButton
                    handleChangeComplete={this.props.handleChangeComplete}
                    cellIndex={this.props.index + 1}
                    color={this.props.cell.color} />
                <div className="color-preview" style={{backgroundColor: "rgba(" + this.props.cell.color.r + "," + this.props.cell.color.g + "," + this.props.cell.color.b + "," + this.props.cell.color.a + ")"}}></div>
            </div>
        )
    }
}

class Candle extends Component {
    constructor(props) {
        super(props);
        this.state = {
            color: this.props.color,
            height: this.props.height ? this.props.height : 250,
            duration: this.props.duration,
            expiryTime: this.props.expiryTime,
            runtime: 0,
            step: 0
        }
    }

    componentDidMount() {
        let now = new Date().getTime();
        let expiryTime = this.state.expiryTime;
        if (expiryTime > now) {
            // console.log("Candle has not yet expired!");
            let startTime = expiryTime - this.state.duration;
            let timeElapsed = now - startTime;
            let currentHeight = this.state.height - ((timeElapsed / this.state.duration) * this.state.height);
            let step = this.state.duration / this.state.height;
            this.setState({
                step: step,
                height: currentHeight,
                runtime: timeElapsed
            });
            this.burn = setInterval(() => this.burnCandle(), step);
        } else {
            // console.log("Candle has expired, destroying candle", this.props.index);
            clearInterval(this.burn);
            this.props.extinguishCandle(this.props.id, this.props.index);
        }
    }

    burnCandle() {
        this.setState(prevState => ({
            height: prevState.height - 1,
            runtime: prevState.runtime + this.state.step
        }));
        if (this.state.runtime >= this.state.duration) {
            // console.log("Runtime has exceeded duration, destroying candle", this.props.index);
            clearInterval(this.burn);
            this.props.extinguishCandle(this.props.id, this.props.index);
        }
    }
    componentWillUnmount() {
        clearInterval(this.burn);
    }
    render() {
        return (
            <div key={"candle_" + this.props.index} className="candle">
                <div className="candle-flame">
                </div>
                <div className="candle-wick">
                </div>
                <div className="candle-body" style={{ background: this.state.color, height: this.state.height + 'px' }}></div>
            </div>
        )
    }
}

export default class Altar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            originalUser: this.props.user,
            user: this.props.user,
            cells: [],
            candles: [],
            candleDuration: '10',
            editingMode: false,
            backgroundColor: '',
            selectedTab: 'altar',
            editorCategory: 'journal',
            modalVisible: false,
            loaderVisible: false,
            postMode: 'create',
            editTarget: '',
            journalPosts: [],
            spellbookPosts: [],
            lorePosts: []
        }
        this.fetchAltarUser = this.fetchAltarUser.bind(this);
    }

    fetchAltarUser(user) {
        fetch('/api/altar/fetch/' + user._id)
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    console.error("Failed to fetch altar!");
                    return false;
                }
            })
            .then(res => {
                let journalPosts, spellbookPosts, lorePosts;
                if (res.posts) {
                    journalPosts = res.posts.filter(p => p.category === "journal");
                    spellbookPosts = res.posts.filter(p => p.category === "spellbook");
                    lorePosts = res.posts.filter(p => p.category === "lore");
                }
                this.setState({
                    cells: (res.altar ? res.altar.cells : ''),
                    candles: (res.altar ? res.altar.candles : ''),
                    backgroundColor: (res.altar ? res.altar.backgroundColor : ''),
                    journalPosts: journalPosts,
                    spellbookPosts: spellbookPosts,
                    lorePosts: lorePosts,
                    loaderVisible: false
                });
            })
    }

    componentDidMount() {
        this.fetchAltarUser(this.props.user);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.visible === true && prevProps.visible === false) {
            this.setState({loaderVisible: true})
            this.fetchAltarUser(this.props.user);
        }
    //     if (prevProps.user !== this.props.user) {
    //         fetch('/api/altar/fetch/' + this.props.user._id)
    //             .then(res => {
    //                 if (res.status === 200) return res.json();
    //             })
    //             .then(res => {
    //                 let journalPosts = res.posts.filter(p => p.category === "journal");
    //                 let spellbookPosts = res.posts.filter(p => p.category === "spellbook");
    //                 let lorePosts = res.posts.filter(p => p.category === "lore");
    //                 this.setState({
    //                     cells: res.altar.cells,
    //                     candles: res.altar.candles,
    //                     backgroundColor: res.altar.backgroundColor,
    //                     journalPosts: journalPosts,
    //                     spellbookPosts: spellbookPosts,
    //                     lorePosts: lorePosts
    //                 });
    //             })
    //             window.history.replaceState({}, null, '/altar/'+this.props.user.username);
    //     }
    }

    toggleTab(tab) {
        this.setState({
            selectedTab: tab
        })
    }


    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }

    lightCandle = (color = "white", duration = 600000) => {
        // console.log(this.state.candleDuration)
        let candleDuration = this.state.candleDuration * 60 * 1000; // Milliseconds
        let now = new Date().getTime();
        let candle = {
            color: color,
            duration: candleDuration,
            expiryTime: now + candleDuration
        }
        var audio = new Audio('/match.mp3');
        audio.play();
        fetch('/api/altar/candle/new', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ candle })
        })
            .then(res => res.json())
            .then(res => {
                // console.log(res)
                this.setState({ candles: [...this.state.candles, res.candle] });
            })
    }

    extinguishCandle = (candleID, index) => {
        // console.log("Destroying candle", index)
        fetch('/api/altar/candle/delete/' + candleID, {
            method: 'POST'
        })
            .then(res => res.json())
            .then(res => {
                let remainingCandles = this.state.candles.filter(candle => candle._id !== candleID);
                this.setState({ candles: remainingCandles });
                // this.setState({candles: res.candles});
                // console.log("Candle with index", index, "has been destroyed")
            })
            .catch(err => {
                console.error("Error!", err);
                let remainingCandles = this.state.candles.filter(candle => candle._id !== candleID);
                this.setState({ candles: remainingCandles });
            })
    }

    toggleEditingMode = () => {
        this.setState({ editingMode: !this.state.editingMode })
    }

    parseCellContents = (cell, cellNumber) => {
        if (this.state.editingMode) {
            if (cell.type === "text") {
                return (
                    <ContentEditable
                        html={cell.contents}
                        onChange={(event) => this.editAltarCellText(event, "cell-" + cellNumber)}
                        className="cell-contenteditable"
                        placeholder={"Click to edit"}
                    />
                )
            } else if (cell.type === "image") {
                let pickerProps = {
                    icons: icons,
                    theme: 'default',
                    renderUsing: 'class',
                    value: cell.contents,
                    onChange: (value) => this.editAltarCellImage({ [`cell-${cellNumber}`]: value }),
                    isMulti: false,
                    iconsPerPage: 10
                };
                return (
                    <FontIconPicker {...pickerProps} />
                )
            }
        } else {
            if (cell.type === "text") {
                return <span className="altarText" dangerouslySetInnerHTML={{__html: cell.contents}}></span>;
            }
            if (cell.type === "image") {
                return <span className={["altarIcon", cell.contents].join(" ")} />
            }
        }
    }

    // handleCellHoverIn = (cellIndex) => {
    //     let cells = this.state.cells;
    //     cells.map((cell, index) => {
    //         if (index === cellIndex) {
    //             cell.hovering = true;
    //         }
    //     })
    //     this.setState({cells: cells})
    // }
    //
    // handleCellHoverOut = (cellIndex) => {
    //     let cells = this.state.cells;
    //     cells.map((cell, index) => {
    //         if (index === cellIndex) {
    //             cell.hovering = false;
    //         }
    //     })
    //     this.setState({cells: cells})
    // }

    editAltarCellText = (event, target) => {
        fetch('/api/altar/edit-cell/text', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                target: target,
                value: event.target.value
             })
        })
            .then(res => res.json())
            .then(res => {
                let cells = this.state.cells;
                cells.forEach((cell, index) => {
                    if (index === res.index) {
                        cell.contents = res.value;
                    }
                })
                this.setState({ cells: cells })
            })
    }

    editAltarCellImage = (payload) => {
        fetch('/api/altar/edit-cell/image', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payload })
        })
            .then(res => res.json())
            .then(res => {
                let cells = this.state.cells;
                cells.forEach((cell, index) => {
                    if (index === res.index) {
                        cell.contents = res.value;
                    }
                })
                this.setState({ cells: cells })
            })
    }

    editAltarCellType = (payload) => {
        fetch('/api/altar/edit-cell/type', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payload })
        })
            .then(res => res.json())
            .then(res => {
                let cells = this.state.cells;
                cells.forEach((cell, index) => {
                    if (index === res.index) {
                        cell.type = res.type;
                        cell.contents = '';
                    }
                })
                this.setState({ cells: cells })
            })
    }

    handleChangeComplete = (color, event, cellIndex) => {
        let payload = {
            [`cell-${cellIndex}`]: color.rgb
        }
        fetch('/api/altar/edit-cell/color', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payload })
        })
            .then(res => res.json())
            .then(res => {
                let cells = this.state.cells;
                cells.forEach((cell, index) => {
                    if (index === res.index) {
                        cell.color = res.color;
                    }
                })
                this.setState({ cells: cells })
            })
    }

    changeBackgroundColor = (color) => {
        fetch('/api/altar/edit-background', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ color: color.rgb })
        })
            .then(res => res.json())
            .then(res => {
                this.setState({ backgroundColor: res.color })
            })
    }

    showModal = () => {
        this.setState({
            postMode: 'create',
            editTarget: '',
            modalVisible: true
        })
    }

    hideModal = () => {
        this.setState({
            modalVisible: false
        })
    }

    updatePosts = (post) => {
        if (this.state.postMode === 'create') {
            switch(post.category) {
                case 'journal':
                    this.setState({journalPosts: [...this.state.journalPosts, post]});
                    break;
                case 'spellbook':
                    this.setState({spellbookPosts: [...this.state.spellbookPosts, post]});
                    break;
                case 'lore':
                    this.setState({lorePosts: [...this.state.lorePosts, post]});
                    break;
                default:
                    return false;
            }
        } else if (this.state.postMode === 'edit') {
            switch(post.category) {
                case 'journal':
                    let journalPosts = this.state.journalPosts;
                    journalPosts.forEach(oldPost => {
                        if (oldPost._id === post._id) {
                            oldPost.title = post.title;
                            oldPost.public = post.public;
                            oldPost.content = post.content;
                            this.setState({journalPosts: journalPosts});
                        }
                    })
                    break;
                case 'spellbook':
                    let spellbookPosts = this.state.spellbookPosts;
                    spellbookPosts.forEach(oldPost => {
                        if (oldPost._id === post._id) {
                            oldPost.title = post.title;
                            oldPost.public = post.public;
                            oldPost.content = post.content;
                            this.setState({spellbookPosts: spellbookPosts});
                        }
                    })
                    break;
                case 'lore':
                    let lorePosts = this.state.lorePosts;
                    lorePosts.forEach(oldPost => {
                        if (oldPost._id === post._id) {
                            oldPost.title = post.title;
                            oldPost.public = post.public;
                            oldPost.content = post.content;
                            this.setState({lorePosts: lorePosts});
                        }
                    })
                    break;
                default:
                    return false;
            }
        }
        this.setState({
            postMode: 'create',
            editTarget: ''
        })
    }

    deletePost = (post) => {
        if (window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            fetch('/api/post/delete', {
                method: 'POST',
                body: JSON.stringify(post),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    alert('Error deleting post, please try again.')
                    return false;
                }
            })
            .then(res => {
                switch(post.category) {
                    case 'journal':
                        this.setState({journalPosts: this.state.journalPosts.filter(p => p._id !== post._id)});
                        break;
                    case 'spellbook':
                        this.setState({spellbookPosts: this.state.spellbookPosts.filter(p => p._id !== post._id)});
                        break;
                    case 'lore':
                        this.setState({lorePosts: this.state.lorePosts.filter(p => p._id !== post._id)});
                        break;
                    default:
                        return false;
                }
            })
        }
    }

    editPost = (post) => {
        this.setState({
            modalVisible: true,
            postMode: 'edit',
            editTarget: post
        })
    }


    render() {
        let style = {
            // If the altar is shown as a modal, display it if loader is not showing (the modal will take care of wider display),
            // otherwise only show when selected via nav
            display: this.props.displayAsModal ? (this.state.loaderVisible ? 'none' : 'flex') : (this.props.isVisible ? 'flex' : 'none'),
            backgroundColor: this.state.backgroundColor ? 'rgba(' + this.state.backgroundColor.r + ',' + this.state.backgroundColor.g + ',' + this.state.backgroundColor.b + ',' + this.state.backgroundColor.a + ')' : 'rgba(62,41,72,1)'
        };
        let journalPosts = this.state.journalPosts ? this.state.journalPosts.filter(post => this.props.user === this.state.originalUser ? true : post.public) : '';
        let spellbookPosts = this.state.spellbookPosts ? this.state.spellbookPosts.filter(post => this.props.user === this.state.originalUser ? true : post.public) : '';
        let lorePosts = this.state.lorePosts ? this.state.lorePosts.filter(post => this.props.user === this.state.originalUser ? true : post.public) : '';
        let noPosts = <article className="post"><main style={{textAlign:"center"}}>No posts.</main></article>
        return (
            <>
                {this.state.loaderVisible &&
                    <div id="loader">
                        <div className="moon-loader">
                            <div className="disc"></div>
                        </div>
                    </div>
                }
                <div id="altar" style={style}>
                    <nav id="altarNav">
                        <span className="altarUsername">
                            <span>
                                {this.props.user.settings.flair && this.props.user.settings.flair !== 'none' && <img src={this.props.user.settings.flair} className="altarFlair" alt={"Flair icon for " + this.props.user.username} />} {this.props.user.username}
                            </span>
                        </span>
                        <ul className="altarNavLinks">
                            <li
                                className={["listHeader",(this.state.selectedTab === "altar" ? "selected" : "")].join(" ")}
                                onClick={() => this.toggleTab("altar")}>
                                Altar
                            </li>
                            <li className="listHeader">
                                Grimoire
                            </li>
                            <li
                                className={["listSubItem",(this.state.selectedTab === "journal" ? "selected" : "")].join(" ")}
                                onClick={() => this.toggleTab("journal")}>
                                <span>Journal</span><span className="badge">{journalPosts.length > 0 && journalPosts.length}</span>
                            </li>
                            <li
                                className={["listSubItem",(this.state.selectedTab === "spellbook" ? "selected" : "")].join(" ")}
                                onClick={() => this.toggleTab("spellbook")}>
                                <span>Spells</span><span className="badge">{spellbookPosts.length > 0 && spellbookPosts.length}</span>
                            </li>
                            <li
                                className={["listSubItem",(this.state.selectedTab === "lore" ? "selected" : "")].join(" ")}
                                onClick={() => this.toggleTab("lore")}>
                                <span>Notes</span><span className="badge">{lorePosts.length > 0 && lorePosts.length}</span>
                            </li>
                        </ul>
                        {this.props.user === this.state.originalUser && this.state.selectedTab === "altar" &&
                            <div id="altarControls">
                                <Tooltip
                                    trigger="click"
                                    interactive
                                    theme="light"
                                    arrow="true"
                                    html={(
                                        <ul className="candle-dropdown">
                                            <li>
                                                <input
                                                    name="candleDuration"
                                                    className="candleDuration"
                                                    type="number"
                                                    value={this.state.candleDuration}
                                                    onChange={this.handleInputChange}
                                                /> minutes</li>
                                            <li className="divider"></li>
                                            <li onClick={() => this.lightCandle("white")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "white" }} icon="circle" /> White</li>
                                            <li onClick={() => this.lightCandle("#111111")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#111111" }} icon="circle" />Black</li>
                                            <li onClick={() => this.lightCandle("#503327")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#503327" }} icon="circle" />Brown</li>
                                            <li onClick={() => this.lightCandle("#d40a0a")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#d40a0a" }} icon="circle" />Red</li>
                                            <li onClick={() => this.lightCandle("#FF851B")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#FF851B" }} icon="circle" />Orange</li>
                                            <li onClick={() => this.lightCandle("#FFDC00")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#FFDC00" }} icon="circle" />Yellow</li>
                                            <li onClick={() => this.lightCandle("#2ECC40")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#2ECC40" }} icon="circle" />Green</li>
                                            <li onClick={() => this.lightCandle("#0074D9")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#0074D9" }} icon="circle" />Blue</li>
                                            <li onClick={() => this.lightCandle("#8d0dc9")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#8d0dc9" }} icon="circle" />Purple</li>
                                            <li onClick={() => this.lightCandle("#fa69d9")}><FontAwesomeIcon className="candleColorCircle" style={{ color: "#fa69d9" }} icon="circle" />Pink</li>
                                        </ul>
                                    )}
                                >
                                    <button
                                        type="button"
                                        className="full-width"
                                    >
                                        <FontAwesomeIcon icon="burn" /> Light candle
                                    </button>
                                </Tooltip>
                                <button
                                    className={["full-width", this.state.editingMode ? "active" : ""].join(" ")}
                                    type="button"
                                    onClick={this.toggleEditingMode}
                                >
                                    <FontAwesomeIcon icon="th" /> Edit Altar
                                    </button>
                                <ColorPickerButton
                                    className="full-width"
                                    handleChangeComplete={this.changeBackgroundColor}
                                    color={this.state.backgroundColor}
                                    backgroundPicker={true} />
                            </div>
                        }
                        {this.props.user === this.state.originalUser && this.state.selectedTab !== "altar" &&
                            <div id="altarControls">
                                <button
                                    className="full-width"
                                    onClick={this.showModal}
                                >
                                    <FontAwesomeIcon icon="edit"/> New post
                                </button>
                                <Editor
                                    mode={this.state.postMode}
                                    editTarget={this.state.editTarget}
                                    updatePosts={this.updatePosts}
                                    modalVisible={this.state.modalVisible}
                                    category={this.state.editorCategory}
                                    hideModal={this.hideModal}/>
                            </div>
                        }
                    </nav>
                    <div
                        style={{display:(this.state.selectedTab === "altar" ? "flex" : "none")}}
                        id="altarGrid"
                        className={this.state.editingMode ? "editingMode" : ""}>
                        {this.state.cells.map((cell, index) => {
                            let cellNumber = index + 1;
                            return (
                                <div key={"cell-" + cellNumber} className={["cell", "cell-" + cellNumber, "cell-" + cell.type].join(" ")}>
                                    {this.state.editingMode && this.props.user === this.state.originalUser && (
                                        <CellEditingTools
                                            cell={cell}
                                            index={index}
                                            editAltarCellType={this.editAltarCellType}
                                            handleChangeComplete={this.handleChangeComplete}
                                        />
                                    )}
                                    <span style={{ color: (cell.color ? 'rgba(' + cell.color.r + ',' + cell.color.g + ',' + cell.color.b + ',' + cell.color.a + ')' : 'rgba(255,255,255,0.5)') }}>
                                        {this.parseCellContents(cell, cellNumber)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div
                        style={{display:(this.state.selectedTab === "journal" ? "flex" : "none")}}
                        id="journal"
                        className="postViewer"
                    >
                        {journalPosts.length === 0 ?
                        noPosts
                        :
                            journalPosts.map(post => {
                                return (
                                    <article className="post" key={post._id}>
                                        {post.title &&
                                            <header>
                                                <h2>{post.title}</h2>
                                            </header>
                                        }
                                        <aside><span>{new Date(post.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})} &middot; {(post.public ? "Public" : "Private")}</span>{this.props.user === this.state.originalUser && <span><button className="muted" onClick={() => {this.editPost(post)}}>Edit</button><button className="muted" onClick={() => {this.deletePost(post)}}>Delete</button></span>}</aside>
                                        <main>
                                            { ReactHtmlParser(post.content) }
                                        </main>
                                    </article>
                                )
                            })
                        }
                    </div>
                    <div
                        style={{display:(this.state.selectedTab === "spellbook" ? "flex" : "none")}}
                        id="spellbook"
                        className="postViewer"
                    >
                        {spellbookPosts.length === 0 ?
                        noPosts
                        :
                            spellbookPosts.map(post => {
                                return (
                                    <article className="post" key={post._id}>
                                        {post.title &&
                                            <header>
                                                <h2>{post.title}</h2>
                                            </header>
                                        }
                                        <aside><span>{new Date(post.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})} &middot; {(post.public ? "Public" : "Private")}</span>{this.props.user === this.state.originalUser && <span><button className="muted" onClick={() => {this.editPost(post)}}>Edit</button><button className="muted" onClick={() => {this.deletePost(post)}}>Delete</button></span>}</aside>
                                        <main>
                                            { ReactHtmlParser(post.content) }
                                        </main>
                                    </article>
                                )
                            })
                        }
                    </div>
                    <div
                        style={{display:(this.state.selectedTab === "lore" ? "flex" : "none")}}
                        id="journal"
                        className="postViewer"
                    >
                        {lorePosts.length === 0 ?
                        noPosts
                        :
                            lorePosts.map(post => {
                                return (
                                    <article className="post" key={post._id}>
                                        {post.title &&
                                            <header>
                                                <h2>{post.title}</h2>
                                            </header>
                                        }
                                        <aside><span>{new Date(post.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})} &middot; {(post.public ? "Public" : "Private")}</span>{this.props.user === this.state.originalUser && <span><button className="muted" onClick={() => {this.editPost(post)}}>Edit</button><button className="muted" onClick={() => {this.deletePost(post)}}>Delete</button></span>}</aside>
                                        <main>
                                            { ReactHtmlParser(post.content) }
                                        </main>
                                    </article>
                                )
                            })
                        }
                    </div>
                    {!this.state.editingMode && this.state.selectedTab === "altar" &&
                        <div id="candleHolder" style={this.props.displayAsModal && {bottom: "0"}}>
                            {this.state.candles.map((candle, index) => {
                                return (
                                    <Candle
                                        id={candle._id}
                                        index={index}
                                        color={candle.color}
                                        duration={candle.duration}
                                        expiryTime={candle.expiryTime}
                                        height={candle.height}
                                        extinguishCandle={this.extinguishCandle.bind(this)}
                                    />
                                )
                            })}
                        </div>
                    }
                </div>
            </>
        )
    }
}
