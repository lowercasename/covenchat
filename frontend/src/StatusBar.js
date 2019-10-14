import React, { Component } from 'react';
const lune = require('lune')

class StatusBar extends Component {
    constructor() {
        super();
        this.state = {
            mercuryRetrograde: false
        }
    }

    componentDidMount() {
        fetch('https://mercuryretrogradeapi.com/')
            .then(res => res.json())
            .then(result => {
                console.log(result);
                this.setState({
                    mercuryRetrograde: result.is_retrograde
                })
            });
    }

    getMoonPhase(today) {
        // Original Snippet: https://gist.github.com/endel/dfe6bb2fbe679781948c

        var Moon = {
            phase: function(year, month, day) {
                let c, e, jd, b = 0;

                if (month < 3) {
                    year--;
                    month += 12;
                }

                ++month;
                c = 365.25 * year;
                e = 30.6 * month;
                jd = c + e + day - 694039.09; // jd is total days elapsed
                jd /= 29.5305882; // divide by the moon cycle
                b = parseInt(jd); // int(jd) -> b, take integer part of jd
                jd -= b; // subtract integer part to leave fractional part of original jd
                b = Math.round(jd * 8); // scale fraction from 0-8 and round

                if (b >= 8) b = 0; // 0 and 8 are the same so turn 8 into 0

                switch (b) {
                    case 0:
                        return <span > < span className = "hermetica-B027-moon_phase_new" / > New Moon < /span>;
                    case 1:
                        return <span > < span className = "hermetica-B020-moon_phase_waxing_crescent" / > Waxing Crescent Moon < /span>;
                    case 2:
                        return <span > < span className = "hermetica-B021-moon_phase_waxing_half" / > First Quarter Moon < /span>;
                    case 3:
                        return <span > < span className = "hermetica-B022-moon_phase_waxing_gibbous" / > Waxing Gibbous Moon < /span>;
                    case 4:
                        return <span > < span className = "hermetica-B023-moon_phase_full" / > Full Moon < /span>;
                    case 5:
                        return <span > < span className = "hermetica-B024-moon_phase_waning_gibbous" / > Waning Gibbous Moon < /span>;
                    case 6:
                        return <span > < span className = "hermetica-B025-moon_phase_waning_half" / > Last Quarter Moon < /span>;
                    case 7:
                        return <span > < span className = "hermetica-B026-moon_phase_waning_crescent" / > Waning Crescent Moon < /span>;
                    default:
                        return false;
                }
            }
        };
        var phase = Moon.phase(today.getFullYear(), today.getMonth() + 1, today.getDate());
        return phase;
    }

    // getMoonPhase(today) {
    //     let date = new Date('2019-10-14T00:00')
    //     var currentPhase = lune.phase(date);
    //     let majorPhases = ["waxing crescent","waxing gibbous","waning gibbous","waning crescent"];
    //     let minorPhases = ["new","first quarter","full","last quarter"]
    //     let majorIndex = Math.floor(currentPhase.phase * 10)/2 - 1;
    //     console.log(majorIndex);
    //     return currentPhase.phase;
    // }

    getZodiacSign(today) {

        var zodiacSigns = {
            'capricorn': < span > < span className = "hermetica-A009-capricorn" / > Capricorn < /span>,
            'aquarius': < span > < span className = "hermetica-A010-aquarius" / > Aquarius < /span>,
            'pisces': < span > < span className = "hermetica-A011-pisces" / > Pisces < /span>,
            'aries': < span > < span className = "hermetica-A000-aries" / > Aries < /span>,
            'taurus': < span > < span className = "hermetica-A001-taurus" / > Taurus < /span>,
            'gemini': < span > < span className = "hermetica-A002-gemini" / > Gemini < /span>,
            'cancer': < span > < span className = "hermetica-A003-cancer" / > Cancer < /span>,
            'leo': < span > < span className = "hermetica-A004-leo" / > Leo < /span>,
            'virgo': < span > < span className = "hermetica-A005-virgo" / > Virgo < /span>,
            'libra': < span > < span className = "hermetica-A006-libra" / > Libra < /span>,
            'scorpio': < span > < span className = "hermetica-A007-scorpio" / > Scorpio < /span>,
            'sagittarius': < span > < span className = "hermetica-A008-sagittarius" / > Saggitarius < /span>,
        }

        var month = today.getMonth() + 1;
        var day = today.getDate();

        if ((month === 1 && day <= 19) || (month === 12 && day >= 22)) {
            return zodiacSigns.capricorn;
        } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
            return zodiacSigns.aquarius;
        } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
            return zodiacSigns.pisces;
        } else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
            return zodiacSigns.aries;
        } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
            return zodiacSigns.taurus;
        } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
            return zodiacSigns.gemini;
        } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
            return zodiacSigns.cancer;
        } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
            return zodiacSigns.leo;
        } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
            return zodiacSigns.virgo;
        } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
            return zodiacSigns.libra;
        } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
            return zodiacSigns.scorpio;
        } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
            return zodiacSigns.sagittarius;
        }
    }

    getFestival(today) {
        var festivals = [{
                name: 'Imbolc',
                date: new Date(today.getFullYear(), 1, 2)
            },
            {
                name: 'Ostara',
                date: new Date(today.getFullYear(), 2, 21)
            },
            {
                name: 'Beltane',
                date: new Date(today.getFullYear(), 4, 1)
            },
            {
                name: 'Litha',
                date: new Date(today.getFullYear(), 5, 21)
            },
            {
                name: 'Lughnasadh',
                date: new Date(today.getFullYear(), 7, 1)
            },
            {
                name: 'Mabon',
                date: new Date(today.getFullYear(), 8, 21)
            },
            {
                name: 'Samhain',
                date: new Date(today.getFullYear(), 9, 31)
            },
            {
                name: 'Yule',
                date: new Date(today.getFullYear(), 11, 21)
            }
        ];

        var festivalIsToday = festivals.find(e => e.date.getMonth() === today.getMonth() && e.date.getDate() === today.getDate());
        let message;
        if (festivalIsToday) {
            message = "Happy " + festivalIsToday.name + "! (" + festivalIsToday.date.getDate() + " " + festivalIsToday.date.toLocaleString('default', {
                month: 'long'
            }) + ")";
        } else {
            var nextFestival = festivals.filter(function(f) {
                return f.date - today > 0;
            }).slice(0, 1);
            var one_day = 1000 * 60 * 60 * 24;
            var daysUntil = Math.ceil((nextFestival[0].date.getTime() - today.getTime()) / (one_day));
            message = daysUntil + (daysUntil > 1 ? " days" : " day") + " to " + nextFestival[0].name + " (" + nextFestival[0].date.getDate() + " " + nextFestival[0].date.toLocaleString('default', {
                month: 'long'
            }) + ")";
        }
        return message;
    }

    render() {
        var today = new Date();
        let mercuryMessage;
        if (this.state.mercuryRetrograde === false) {
            mercuryMessage = < span > < span className = 'hermetica-B002-mercury' / > Mercury not retrograde < /span>;
        } else {
            mercuryMessage = < span > < span className = 'hermetica-B002-mercury' / > Mercury is retrograde < /span>;
        }
        return ( <
            aside className = "statusBar" > {
                this.props.modules.moonPhase.set &&
                <
                span className = "statusItem" > {
                    this.getMoonPhase(today)
                } <
                /span>
            } {
                this.props.modules.wheelOfTheYear.set &&
                    <
                    span className = "statusItem" >
                    <
                    span className = "hermetica-F006-wheel_of_the_year" / >&nbsp;{
                    this.getFestival(today)
                } <
                /span>
            } {
                this.props.modules.astrologicalSeason.set &&
                    <span className = "statusItem" > {
                        this.getZodiacSign(today)
                    }&nbsp;season
                    </span>
            } {
                this.props.modules.mercuryRetrograde.set &&
                    <
                    span className = "statusItem" > {
                        mercuryMessage
                    } <
                    /span>
            } <
            /aside>
        );
    }
}

export default StatusBar;
