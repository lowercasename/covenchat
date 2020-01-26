import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from 'react-toastify';
import './Map.css';

export default class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            socketId: '',
            usersOnMap: [],
            userMarkers: [],
            currentLinks: [],
            userPosition: '',
            linksForUser: [],
            lastGeolocationUpdate: []
        }

        this.createLink = this.createLink.bind(this);
    }

    componentDidMount() {

        mapboxgl.accessToken = 'pk.eyJ1IjoicmFwaGFlbGthYm8iLCJhIjoiY2swcGhlbjVuMDBseDNibDQ5b25zbHNpcyJ9.ezfbQZXwGDYA6kAGez3v3A';

        this.setState({map: new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/raphaelkabo/ck1dskh912mlx1cpmjmxp48zr',
            center: [0, 50],
            zoom: 2
        })}, () => {
            const addMarker = (lng, lat, user) => {
                let localUser, otherUser = false;
                if (user.username !== this.props.user.username) {
                    otherUser = true;
                    localUser = user;
                } else {
                    localUser = this.props.user;
                }
                var el = document.createElement('div');
                el.className = otherUser ? 'other-user-marker' : 'user-marker';

                let html = (
                    <>
                        <h2>
                            {localUser.settings.flair && <img src={localUser.settings.flair} className="userFlair" alt={"Flair icon for " + localUser.username}/>}{localUser.username}
                        </h2>
                        {otherUser ? !this.state.currentLinks.some(l => l.fromUsername === localUser.username || l.toUsername === localUser.username) ?
                            <div>
                                <button style={{display: "block",margin: '5px',width:'100%'}} type="button" className="small" onClick={() => this.sendLinkNotification(localUser.username)}><FontAwesomeIcon icon="arrows-alt-h"/> Create link</button>
                                <button style={{display: "block",margin: '5px',width:'100%'}} type="button" className="small" onClick={() => this.props.changeAltarUser(localUser)}><span className="hermetica-F032-pentacle" style={{fontSize:"14px",position:"relative",top:"2px"}}/> Open Altar</button>
                            </div>
                        :
                            <p>Currently linked</p>
                        :
                            <p>It's you!</p>
                        }
                    </>
                )

                const placeholder = document.createElement('div');
                ReactDOM.render(html, placeholder);

                const marker = new mapboxgl.Marker(el, { anchor: 'right' })
                .setLngLat([lng, lat])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(placeholder))
                .addTo(this.state.map);

                return marker;
            }

            fetch('/api/geolocation/fetch-all')
            .then(res => res.json())
            .then(res => {
                let markersProcessed = 0;
                res.users.forEach(user => {
                    let userMarkers = [...this.state.userMarkers, addMarker(user.geolocation.longitude, user.geolocation.latitude, user)];
                    userMarkers[userMarkers.length - 1].username = user.username;
                    userMarkers[userMarkers.length - 1].updated = new Date().getTime();
                    this.setState({
                        usersOnMap: [...this.state.usersOnMap, user.username],
                        userMarkers: userMarkers
                    }, () => markersProcessed++);
                    // Only make links after userMarkers has been filled
                    if (markersProcessed === res.users.length){
                        res.links.forEach(link => {
                            this.createLink(link, this.state.map);
                        })
                    }
                })
            });

            if (this.props.locationPermission) {
                var positionMarkerRendered = false;

                const geolocate = new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: false
                    },
                    fitBoundsOptions: {
                        maxZoom: 5
                    },
                    trackUserLocation: true,
                    showUserLocation: false,
                })
                this.state.map.addControl(geolocate)
                this.state.map.on('error', function (error) {
                    console.log(error);
                });
                this.state.map.on('load', function () {
                    geolocate.trigger();
                    // map.resize();
                });
                geolocate.on('geolocate', (e) => {
                    var lng = e.coords.longitude;
                    var lat = e.coords.latitude
                    this.setState({userPosition: [lng, lat]});

                    if (positionMarkerRendered === false) {
                        let userMarkers = [...this.state.userMarkers, addMarker(lng, lat, this.props.user)];
                        userMarkers[userMarkers.length - 1].username = this.props.user.username;
                        userMarkers[userMarkers.length - 1].updated = new Date().getTime();
                        this.setState({userMarkers:userMarkers});
                        positionMarkerRendered = true;

                    }
                    fetch('/api/geolocation/update', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            position: { longitude: lng, latitude: lat },
                            socketId: this.state.socketId
                        })
                    });
                    // Add links for user once they're geolocated
                    this.state.linksForUser.forEach(link => {
                        this.createLink(link, this.state.map);
                        // Remove the link from state so it don't bug us again
                        this.setState({linksForUser: this.state.linksForUser.filter(l => l._id !== link._id)});
                    })
                });

                this.props.socket.on('geolocation-updated', payload => {
                    // Make sure user is sharing their location publicly
                    if (payload.user.settings.shareLocation) {
                        // Check if this user is already displayed on the map
                        // console.log(this.state.usersOnMap);
                        if (this.state.usersOnMap !== null && this.state.usersOnMap.includes(payload.user.username)) {
                            // console.log("User marker already exists")
                            // Rate limiter - check to see if last geolocation update was
                            // more than 30 seconds ago
                            // Just over 30 seconds by default (better to update the location
                            // if for some reason we can't get their timestamp)
                            let timeSinceLastUpdate = 30001;
                            let lastUpdateTimestamp = this.state.userMarkers.find(m => m.username === payload.user.username).updated;
                            timeSinceLastUpdate = payload.geolocation.updated - lastUpdateTimestamp;
                            // console.log("timeSinceLastUpdate",timeSinceLastUpdate);
                            if (timeSinceLastUpdate > 30000) {
                                let userMarkers = this.state.userMarkers;
                                userMarkers.forEach(marker => {
                                    if (marker.username === payload.user.username) {
                                        // console.log("Found marker, updating position")
                                        marker.setLngLat([payload.geolocation.longitude, payload.geolocation.latitude]);
                                        marker.updated = payload.geolocation.updated;
                                        // Check links to see if any are coming from or going to this marker, and update them
                                        this.state.currentLinks.forEach(link => {
                                            if (link.fromUsername === payload.user.username || link.toUsername === payload.user.username) {
                                                fetch('/api/link/upsert', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Accept': 'application/json',
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        fromUsername: link.fromUsername,
                                                        toUsername: link.toUsername
                                                    })
                                                });
                                            }
                                        })
                                    }
                                    this.setState({userMarkers:userMarkers});
                                })
                            } else {
                                // Updating too quickly
                                // console.log("Rate limit: waiting 30 seconds between geolocation updates");
                            }
                        } else {
                            // console.log("User not currently on map")
                            let userMarkers = [...this.state.userMarkers, addMarker(payload.geolocation.longitude, payload.geolocation.latitude, payload.user)];
                            userMarkers[userMarkers.length - 1].username = payload.user.username;
                            userMarkers[userMarkers.length - 1].updated = payload.geolocation.updated;
                            this.setState({
                                usersOnMap: [...this.state.usersOnMap, payload.user.username],
                                userMarkers: userMarkers
                            })
                        }
                    } else {
                        // console.log("User not sharing their location")
                    }
                });
                this.props.socket.on('link-created', payload => {
                    this.createLink(payload.link, this.state.map);
                })
                this.props.socket.on('link-expired', payload => {
                    this.removeLink(payload.id, this.state.map);
                })
            }
        });
    }

    resize() {
        this.state.map.resize();
    }

    createLink = (link, map) => {
        // Check if both markers exist on the map.
        // If this function is being called at map boot, the user's own marker won't yet exist,
        // so markers for that user need to be stored and called again when they are geolocated
        if ((link.fromUsername === this.props.user.username || link.toUsername === this.props.user.username) && !this.state.userPosition) {
            this.setState({linksForUser: [...this.state.linksForUser, link]});
        } else {
            let allMarkersOnMap = this.state.userMarkers.map(m => m.username);
            if (allMarkersOnMap.includes(link.fromUsername) && allMarkersOnMap.includes(link.toUsername)) {
                // Check if the geolocations saved in the database need updating (only run this once - checked with
                // revision flag supplied by backend when the upsert is only a revision)
                let fromMarker = this.state.userMarkers.find(m => m.username === link.fromUsername);
                let toMarker = this.state.userMarkers.find(m => m.username === link.toUsername);
                if ((link.revision === true) || (fromMarker._lngLat.lng === link.fromCoordinates[0] &&
                    fromMarker._lngLat.lat === link.fromCoordinates[1] &&
                    toMarker._lngLat.lng === link.toCoordinates[0] &&
                    toMarker._lngLat.lat === link.toCoordinates[1])) {
                        this.removeLink(link._id, this.state.map);
                        // Create the line!
                        this.state.map.addLayer({
                            "id": link._id,
                            "type": "line",
                            "source": {
                                "type": "geojson",
                                "lineMetrics": true,
                                "data": {
                                    "type": "Feature",
                                    "properties": {},
                                    "geometry": {
                                        "type": "LineString",
                                        "coordinates": [
                                            [link.fromCoordinates[0], link.fromCoordinates[1]],
                                            [link.toCoordinates[0], link.toCoordinates[1]]
                                        ]
                                    }
                                }
                            },
                            "layout": {
                                "line-join": "round",
                                "line-cap": "round"
                            },
                            "paint": {
                                "line-color": "rgba(189,23,203,0.3)",
                                "line-width": 2,
                                'line-gradient': [
                                    'interpolate',
                                    ['linear'],
                                    ['line-progress'],
                                    0, "rgba(0, 255, 200, 1)",
                                    1, "rgba(0, 255, 200, 1)"
                                ]
                            }
                        });
                        let currentLinks = this.state.currentLinks;
                        // console.log(currentLinks.some((l,i) => {console.log("Index",i);console.log("l_id",l._id); console.log("link_id",link._id); return l._id === link._id}));
                        if (currentLinks.some(l => l._id === link._id)) {
                            // console.log("Link already exists, updating it")
                            currentLinks.forEach(existingLink => {
                                if (existingLink._id === link._id) {
                                    existingLink = {...existingLink, ...link};
                                    this.setState({currentLinks: currentLinks}, () => {
                                        // console.log("currentLinks updated", this.state.currentLinks);
                                    });
                                }
                            })
                        } else {
                            // console.log("Link doesn't exist, creating it!")
                            currentLinks.push(link);
                            this.setState({currentLinks: currentLinks}, () => {
                                // console.log("currentLink added", this.state.currentLinks)
                            });
                        }
                        // Let the people know the good news
                        if (link.revision === false) {
                            // if (!haveNotified.includes(link.fromUsername)) {
                                fetch('/api/user/send-notification', {
                                    method: 'POST',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        user: link.fromUsername,
                                        notification: {
                                            sender: link.toUsername,
                                            type: 'link-created',
                                            text: link.toUsername + ' has linked with you on the map.',
                                        }
                                    })
                                })
                            //     haveNotified.push(link.fromUsername);
                            // }
                            fetch('/api/user/send-notification', {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    user: link.toUsername,
                                    notification: {
                                        sender: link.fromUsername,
                                        type: 'link-created',
                                        text: link.fromUsername + ' has linked with you on the map.',
                                    }
                                })
                            })
                        }
                } else {
                    // Coordinates differ
                    this.removeLink(link._id, this.state.map);
                    fetch('/api/link/upsert', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fromUsername: link.fromUsername,
                            toUsername: link.toUsername,
                            fromCoordinates: [fromMarker._lngLat.lng,fromMarker._lngLat.lat],
                            toCoordinates: [toMarker._lngLat.lng,toMarker._lngLat.lat],
                            revision: true
                        })
                    });
                }
            } else {
                console.log("Error: markers don't exist on map; aborting.")
                toast("We're having trouble getting your current location. Try refreshing the page.", {
                    className: 'green-toast',
                });
            }
        }
    }

    removeLink = (id, map) => {
        if (this.state.map.getLayer(id)) {
            this.state.map.removeLayer(id);
            let currentLinks = this.state.currentLinks.filter(l => l._id !== id);
            this.setState({currentLinks: currentLinks});
        }
        if (this.state.map.getSource(id)){
            this.state.map.removeSource(id);
        }
    }
    sendLinkNotification = (username) => {
        if (this.state.currentLinks.some(l => l.fromUsername === username || l.toUsername === username)) {
            toast("You are already linked to this person! If the link isn't on the map, try refreshing the page.", {
                className: 'green-toast',
            });
        } else {
            fetch('/api/user/send-notification', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: username,
                    notification: {
                        sender: this.props.user.username,
                        type: 'link-request',
                        text: this.props.user.username + ' wants to link with you on the map.',
                        buttonText: 'Create link'
                    }
                })
            })
            var popup = this.state.userMarkers.find(m => m.username === username)._popup;
            if (popup && popup.isOpen()) popup.remove();
        }
    }

    render() {
        let style = {
            display: this.props.isVisible ? 'flex' : 'none',
        };
        return (
            <div
                id="map"
                style={style}>
            </div>
        )
    }

}
