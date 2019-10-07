import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Pusher from 'pusher-js';
import './Map.css';

export default class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            socketId: '',
            usersOnMap: [],
            userMarkers: [],
            userPosition: ''
        }

        this.createLink = this.createLink.bind(this);
    }

    componentDidMount() {

        const userMarkers = {};

        mapboxgl.accessToken = 'pk.eyJ1IjoicmFwaGFlbGthYm8iLCJhIjoiY2swcGhlbjVuMDBseDNibDQ5b25zbHNpcyJ9.ezfbQZXwGDYA6kAGez3v3A';

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/raphaelkabo/ck1dskh912mlx1cpmjmxp48zr',
            center: [0, 50],
            zoom: 2
        });

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
                    {otherUser ?
                        <button
                            className="small"
                            onClick={() => this.sendLinkNotification(user.username)}
                        >Create link</button>
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
            .addTo(map);

            return marker;
        }

        fetch('/api/geolocation/fetch-all')
        .then(res => res.json())
        .then(res => {
            res.users.forEach(user => {
                let userMarkers = [...this.state.userMarkers, addMarker(user.geolocation.longitude, user.geolocation.latitude, user)];
                userMarkers[userMarkers.length - 1].username = user.username;
                this.setState({
                    usersOnMap: [...this.state.usersOnMap, user.username],
                    userMarkers: userMarkers
                })
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
                    map.addControl(geolocate)
                    map.on('load', function (error) {
                        console.log(error);
                    });
                    map.on('error', function () {
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
                    });

                    geolocationsChannel.bind('geolocation-updated', (data) => {
                        // Make sure user is sharing their location publicly
                        if (data.user.settings.shareLocation) {
                            // Check if this user is already displayed on the map
                            if (this.state.usersOnMap.includes(data.user.username)) {
                                console.log("Marker already exists :)")
                                let userMarkers = this.state.userMarkers;
                                userMarkers.forEach(marker => {
                                    if (marker.username === data.user.username) {
                                        marker.setLngLat([data.geolocation.longitude, data.geolocation.latitude]);
                                    }
                                })
                                this.setState({userMarkers:userMarkers});
                            } else {
                                let userMarkers = [...this.state.userMarkers, addMarker(data.geolocation.longitude, data.geolocation.latitude, data.user)];
                                userMarkers[userMarkers.length - 1].username = data.user.username;
                                this.setState({
                                    usersOnMap: [...this.state.usersOnMap, data.user.username],
                                    userMarkers: userMarkers
                                })
                            }
                        }
                    });
                    geolocationsChannel.bind('link-created', (data) => {
                        if (data.linkFrom === this.props.user.username) {
                            this.createLink(data.linkTo, map);
                        }
                        if (data.linkTo === this.props.user.username) {
                            this.createLink(data.linkFrom, map);
                        }
                    })
                    geolocationsChannel.bind('link-expired', (data) => {
                        if (data.linkFrom === this.props.user.username) {
                            this.removeLink(data.linkTo, map);
                        }
                        if (data.linkTo === this.props.user.username) {
                            this.removeLink(data.linkFrom, map);
                        }
                    })
                });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.locationPermission) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (status) {
                // console.log(status);
            });
        }
    }

    createLink = (username, map) => {
        console.log("Creating layer",username)
        let otherMarker = this.state.userMarkers.find(m => m.username === username);
        if (map.getLayer(username)) {
            map.removeLayer(username);
        }
        map.addLayer({
            "id": username,
            "type": "line",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            this.state.userPosition,
                            [otherMarker._lngLat.lng, otherMarker._lngLat.lat]
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
                "line-width": 2
            }
        });
    }
    removeLink = (username, map) => {
        console.log("Removing layer",username)
        map.removeLayer(username);
        if (map.getSource(sourceName)){
            map.removeSource(sourceName);
        }
        map.addSource(sourceName, {
            type: 'geojson',
            data: data
        });
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
                    text: this.props.user.username + ' wants to link with you on the map. Click below to accept or deny this request.',
                    buttonText: 'Create link'
                }
            })
        })
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
