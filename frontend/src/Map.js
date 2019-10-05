import React, { Component } from 'react';
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
            usersOnMap: []
        }
    }

    componentDidMount() {

        mapboxgl.accessToken = 'pk.eyJ1IjoicmFwaGFlbGthYm8iLCJhIjoiY2swcGhlbjVuMDBseDNibDQ5b25zbHNpcyJ9.ezfbQZXwGDYA6kAGez3v3A';

        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/raphaelkabo/ck1dskh912mlx1cpmjmxp48zr',
            center: [0, 50],
            zoom: 2
        });

        fetch('/api/geolocation/fetch-all')
        .then(res => res.json())
        .then(res => {
            res.users.forEach(user => {
                console.log(user);
                var el = document.createElement('div');
                el.className = 'other-user-marker';
                userMarkers[user.username] = new mapboxgl.Marker(el, {anchor: 'right'})
                    .setLngLat([user.geolocation.longitude, user.geolocation.latitude])
                    .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML('<h2><img src="'+user.settings.flair+'" class="userFlair" /> '+user.username+'</h2>'))
                    .addTo(map);
                this.setState({usersOnMap: [...this.state.usersOnMap, user.username]})
            })
        })

        if (this.props.locationPermission) {
            Pusher.logToConsole = true;

            var pusher = new Pusher('7155c345db324b8f1ba5', {
                cluster: 'eu',
                forceTLS: true
            });

            pusher.connection.bind('connected', () => {
                this.setState({socketId: pusher.connection.socket_id});
            });
            var channel = pusher.subscribe('geolocations');

            var positionMarkerRendered = false;
            var positionReady = false;
            var pusherSubscribed = true;

            var userMarkers = {};

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
            map.on('load', function () {
                geolocate.trigger();
                // map.resize();

            });
            geolocate.on('geolocate', (e) => {
                var lon = e.coords.longitude;
                var lat = e.coords.latitude
                var position = [lon, lat];

                if (positionMarkerRendered === false) {
                    var el = document.createElement('div');
                    el.className = 'user-marker';
                    userMarkers['userMarker'] = new mapboxgl.Marker(el, {anchor: 'right'})
                        .setLngLat(position)
                        .setPopup(new mapboxgl.Popup({ offset: 25 })
                        .setHTML('<h2><img src="'+this.props.user.settings.flair+'" class="userFlair" /> '+this.props.user.username+'</h2><p>It\'s you!</p>'))
                        .addTo(map);
                    positionMarkerRendered = true;
                    // map.loadImage("/witch-hat-purple.png", function (error, image) {
                    //     if (error) throw error;
                    //     map.addImage("user-marker", image);
                    //     map.addLayer({
                    //         id: "markers",
                    //         type: "symbol",
                    //         source: {
                    //             type: "geojson",
                    //             data: {
                    //                 type: 'FeatureCollection',
                    //                 features: [
                    //                     {
                    //                         type: 'Feature',
                    //                         properties: {},
                    //                         geometry: {
                    //                             type: "Point",
                    //                             coordinates: position
                    //                         }
                    //                     }
                    //                 ]
                    //             }
                    //         },
                    //         layout: {
                    //             "icon-image": "custom-marker",
                    //         }
                    //     });
                    // });
                }
                fetch('/api/geolocation/update', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        position: { longitude: lon, latitude: lat },
                        socketId: this.state.socketId
                    })
                });
            });
            // window.addEventListener("beforeunload", function (event) {
            //     fetch('/api/geolocation/update', {
            //         method: 'POST',
            //         headers: {
            //             'Accept': 'application/json',
            //             'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify({
            //             state: 'offline'
            //         })
            //     });
            // });
            channel.bind('geolocation-updated', (data) => {
                // Make sure user is sharing their location publicly
                if (data.user.settings.shareLocation) {
                    // Check if this user is already displayed on the map
                    if (this.state.usersOnMap.includes(data.user.username)) {
                        console.log("Marker already exists :)")
                        userMarkers[data.user.username].setLngLat([data.geolocation.longitude, data.geolocation.latitude]);
                    } else {
                        var el = document.createElement('div');
                        el.className = 'other-user-marker';
                        userMarkers[data.user.username] = new mapboxgl.Marker(el, {anchor: 'right'})
                            .setLngLat([data.geolocation.longitude, data.geolocation.latitude])
                            .setPopup(new mapboxgl.Popup({ offset: 25 })
                            .setHTML('<h2><img src="'+data.user.settings.flair+'" class="userFlair" /> '+data.user.username+'</h2>'))
                            .addTo(map);
                        this.setState({usersOnMap: [...this.state.usersOnMap, data.user.username]})
                    }
                }
                // map.loadImage("/witch-hat-black.png", function (error, image) {
                //     if (error) throw error;
                //     map.addImage("other-user-marker", image);
                //     map.addLayer({
                //         id: "markers",
                //         type: "symbol",
                //         source: {
                //             type: "geojson",
                //             data: {
                //                 type: 'FeatureCollection',
                //                 features: [
                //                     {
                //                         type: 'Feature',
                //                         properties: {},
                //                         geometry: {
                //                             type: "Point",
                //                             coordinates: position
                //                         }
                //                     }
                //                 ]
                //             }
                //         },
                //         layout: {
                //             "icon-image": "custom-marker",
                //         }
                //     });
                // });
                // positionMarkerRendered = true;
            });
            //     map.addImage('otherUserDot', otherUserDot, { pixelRatio: 2 });
            //     map.addLayer({
            //         "id": data.userID,
            //         "type": "symbol",
            //         "source": {
            //             "type": "geojson",
            //             "data": {
            //                 "type": "FeatureCollection",
            //                 "features": [{
            //                     "type": "Feature",
            //                     "geometry": {
            //                         "type": "Point",
            //                         "coordinates": [data.longitude, data.latitude]
            //                     }
            //                 }]
            //             }
            //         },
            //         "layout": {
            //             "icon-image": "otherUserDot"
            //         }
            //     });
            // });
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.locationPermission) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (status) {
                // console.log(status);
            });
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
