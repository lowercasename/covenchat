import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Pusher from 'pusher-js';
import './Map.css';

const ID = function () {
  return '_' + Math.random().toString(36).substr(2, 9);
};

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

        const userMarkers = {};

        const haveNotified = [];

        mapboxgl.accessToken = 'pk.eyJ1IjoicmFwaGFlbGthYm8iLCJhIjoiY2swcGhlbjVuMDBseDNibDQ5b25zbHNpcyJ9.ezfbQZXwGDYA6kAGez3v3A';

        this.setState({map: new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/raphaelkabo/ck1dskh912mlx1cpmjmxp48zr',
            center: [0, 50],
            zoom: 2
        })});

        const addMarker = (lng, lat, user) => {
            let otherUser = false;
            if (user.username !== this.props.user.username) {
                otherUser = true;
            }
            var el = document.createElement('div');
            el.className = otherUser ? 'other-user-marker' : 'user-marker';

            let html = (
                <>
                    <h2>
                        <img src={user.settings.flair} className="userFlair" /> {user.username}
                    </h2>
                    {otherUser ? !this.state.currentLinks.some(l => l.fromUsername === user.username || l.toUsername === user.username) ?
                        <div>
                            <button style={{display: "block",margin: '5px',width:'100%'}} type="button" className="small" onClick={() => this.sendLinkNotification(user.username)}><FontAwesomeIcon icon="arrows-alt-h"/> Create link</button>
                            <button style={{display: "block",margin: '5px',width:'100%'}} type="button" className="small" onClick={() => this.props.changeAltarUser(user)}><span className="hermetica-F032-pentacle" style={{fontSize:"14px",position:"relative",top:"2px"}}/> Open Altar</button>
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
            console.log("Creating markers!")
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
                    console.log("Creating links!")
                    res.links.forEach(link => {
                        console.log("Creating link", link)
                        this.createLink(link, this.state.map);
                    })
                }
            })
        });

        if (this.props.locationPermission) {
            fetch('api/pusher/getkey')
                .then(res => res.json())
                .then(payload => {
                    var pusher = new Pusher(payload.key, {
                        cluster: 'eu',
                        forceTLS: true
                    });
                    pusher.connection.bind('connected', () => {
                        this.setState({ socketId: pusher.connection.socket_id });
                    });
                    var geolocationsChannel = pusher.subscribe('geolocations');

                    var positionMarkerRendered = false;
                    var positionReady = false;
                    var pusherSubscribed = true;

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
                        this.state.userPosition = [lng, lat];

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
                            console.log("Creating saved link",link)
                            this.createLink(link, this.state.map);
                            // Remove the link from state so it don't bug us again
                            this.setState({linksForUser: this.state.linksForUser.filter(l => l._id !== link._id)});
                        })
                    });

                    geolocationsChannel.bind('geolocation-updated', (data) => {
                        // Rate limiter - check to see if last geolocation update was more than 30 seconds ago
                        let timeSinceLastUpdate;
                        if (this.state.userMarkers !== undefined) {
                            let lastUpdateTimestamp = this.state.userMarkers.find(m => m.username === data.user.username).updated;
                            timeSinceLastUpdate = data.geolocation.updated - lastUpdateTimestamp;
                            console.log(data.geolocation.updated)
                            console.log(lastUpdateTimestamp);
                        } else {
                            timeSinceLastUpdate = 30001;
                        }
                        console.log("timeSinceLastUpdate",timeSinceLastUpdate);
                        if (timeSinceLastUpdate > 30000) {
                            // Make sure user is sharing their location publicly
                            if (data.user.settings.shareLocation) {
                                // Check if this user is already displayed on the map
                                if (this.state.usersOnMap.includes(data.user.username)) {
                                    console.log("Marker already exists :)")
                                    let userMarkers = this.state.userMarkers;
                                    userMarkers.forEach(marker => {
                                        if (marker.username === data.user.username) {
                                            marker.setLngLat([data.geolocation.longitude, data.geolocation.latitude]);
                                            marker.updated = data.geolocation.updated;
                                            // Check links to see if any are coming from or going to this marker, and update them
                                            this.state.currentLinks.forEach(link => {
                                                if (link.fromUsername === data.user.username || link.toUsername === data.user.username) {
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
                                    })
                                    this.setState({userMarkers:userMarkers});
                                } else {
                                    let userMarkers = [...this.state.userMarkers, addMarker(data.geolocation.longitude, data.geolocation.latitude, data.user)];
                                    userMarkers[userMarkers.length - 1].username = data.user.username;
                                    userMarkers[userMarkers.length - 1].updated = data.geolocation.updated;
                                    this.setState({
                                        usersOnMap: [...this.state.usersOnMap, data.user.username],
                                        userMarkers: userMarkers
                                    })
                                }
                            }
                        } else {
                            // Updating too quickly
                            console.log("Rate limit: waiting 30 seconds between geolocation updates");
                        }

                    });
                    geolocationsChannel.bind('link-created', (data) => {
                        this.createLink(data.link, this.state.map);
                    })
                    geolocationsChannel.bind('link-expired', (data) => {
                        this.removeLink(data.id, this.state.map);
                    })
                });
        }
    }

    resize() {
        this.state.map.resize();
    }

    createLink = (link, map) => {
        console.log("Make it link gurl",link)
        // Check if both markers exist on the map.
        // If this function is being called at map boot, the user's own marker won't yet exist,
        // so markers for that user need to be stored and called again when they are geolocated
        if (link.fromUsername === this.props.user.username || link.toUsername === this.props.user.username && !this.state.userPosition) {
            console.log("Saving link for later")
            this.setState({linksForUser: [...this.state.linksForUser, link]});
        }
        let allMarkersOnMap = this.state.userMarkers.map(m => m.username);
        if (allMarkersOnMap.includes(link.fromUsername) && allMarkersOnMap.includes(link.toUsername)) {
            // Check if the geolocations saved in the database need updating (only run this once - checked with
            // revision flag supplied by backend when the upsert is only a revision)
            let fromMarker = this.state.userMarkers.find(m => m.username === link.fromUsername);
            let toMarker = this.state.userMarkers.find(m => m.username === link.toUsername);
            console.log("Is this a revision?", link.revision)
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
                                0, "rgba(255,255,255,0.3)",
                                1, "rgba(189,23,203,0.3)"
                            ]
                        }
                    });
                    let currentLinks = this.state.currentLinks;
                    currentLinks.forEach(existingLink => {
                        if (existingLink._id === link._id) {
                            existingLink = {...existingLink, ...link}
                        }
                    })
                    this.setState({currentLinks: currentLinks});
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
                console.log("Error: coordinates differ.");
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
