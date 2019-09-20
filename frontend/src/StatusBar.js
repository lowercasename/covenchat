import React, { Component } from 'react';

class StatusBar extends Component {
    constructor() {
      super();
      this.state = { mercuryRetrograde: false }
    }

    componentDidMount() {
        fetch('https://mercuryretrogradeapi.com/')
          .then(res => res.json())
          .then(result => {
            console.log(result);
            this.setState({ mercuryRetrograde: result.is_retrograde })
          });
    }

    getMoonPhase(today) {
        // Original Snippet: https://gist.github.com/endel/dfe6bb2fbe679781948c

        var Moon = {
            phase: function (year, month, day) {
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
                        return '🌑 New Moon';
                        break;
                    case 1:
                        return '🌒 Waxing Crescent Moon';
                        break;
                    case 2:
                        return '🌓 First Quarter Moon';
                        break;
                    case 3:
                        return '🌔 Waxing Gibbous Moon';
                        break;
                    case 4:
                        return '🌕 Full Moon';
                        break;
                    case 5:
                        return '🌖 Waning Gibbous Moon';
                        break;
                    case 6:
                        return '🌗 Last Quarter Moon';
                        break;
                    case 7:
                        return '🌘 Waning Crescent Moon';
                        break;
                }
            }
        };
        var phase = Moon.phase(today.getFullYear(), today.getMonth() + 1, today.getDate());
        return phase;
    }

    getZodiacSign(today) {

        var zodiacSigns = {
          'capricorn':'♑ Capricorn',
          'aquarius':'♒ Aquarius',
          'pisces':'♓ Pisces',
          'aries':'♈ Aries',
          'taurus':'♉ Taurus',
          'gemini':'♊ Gemini',
          'cancer':'♋ Cancer',
          'leo':'♌ Leo',
          'virgo':'♍ Virgo',
          'libra':'♎ Libra',
          'scorpio':'♏ Scorpio',
          'sagittarius':'♐ Saggitarius'
        }

        var month = today.getMonth()+1;
        var day = today.getDate();
      
        if((month == 1 && day <= 19) || (month == 12 && day >=22)) {
          return zodiacSigns.capricorn;
        } else if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) {
          return zodiacSigns.aquarius;
        } else if((month == 2 && day >= 19) || (month == 3 && day <= 20)) {
          return zodiacSigns.pisces;
        } else if((month == 3 && day >= 21) || (month == 4 && day <= 19)) {
          return zodiacSigns.aries;
        } else if((month == 4 && day >= 20) || (month == 5 && day <= 20)) {
          return zodiacSigns.taurus;
        } else if((month == 5 && day >= 21) || (month == 6 && day <= 20)) {
          return zodiacSigns.gemini;
        } else if((month == 6 && day >= 21) || (month == 7 && day <= 22)) {
          return zodiacSigns.cancer;
        } else if((month == 7 && day >= 23) || (month == 8 && day <= 22)) {
          return zodiacSigns.leo;
        } else if((month == 8 && day >= 23) || (month == 9 && day <= 22)) {
          return zodiacSigns.virgo;
        } else if((month == 9 && day >= 23) || (month == 10 && day <= 22)) {
          return zodiacSigns.libra;
        } else if((month == 10 && day >= 23) || (month == 11 && day <= 21)) {
          return zodiacSigns.scorpio;
        } else if((month == 11 && day >= 22) || (month == 12 && day <= 21)) {
          return zodiacSigns.sagittarius;
        }
    }

    getFestival(today) {
        var festivals = [
            { name: 'Imbolc', date: new Date(today.getFullYear(), 1, 2) },
            { name: 'Ostara', date: new Date(today.getFullYear(), 2, 21) },
            { name: 'Beltane', date: new Date(today.getFullYear(), 4, 1) },
            { name: 'Litha', date: new Date(today.getFullYear(), 5, 21) },
            { name: 'Lughnasadh', date: new Date(today.getFullYear(), 7, 1) },
            { name: 'Mabon', date: new Date(today.getFullYear(), 8, 21) },
            { name: 'Samhain', date: new Date(today.getFullYear(), 9, 31) },
            { name: 'Yule', date: new Date(today.getFullYear(), 11, 21) }
        ];

        var nextFestival = festivals.filter(function(f) {
            return f.date - today > 0;
        }).slice(0,1);
        var one_day=1000*60*60*24;
        var daysUntil = Math.ceil((nextFestival[0].date.getTime()-today.getTime())/(one_day));
        var message = daysUntil + (daysUntil > 1 ? " days" : " day") + " to " + nextFestival[0].name + " (" + nextFestival[0].date.getDate() + " " + nextFestival[0].date.toLocaleString('default', { month: 'long' }) + ")";
        return message;
    }

    render() {
        var today = new Date();
        let mercuryMessage;
        if (this.state.mercuryRetrograde == false) {
            mercuryMessage = "☿ Mercury not retrograde";
        } else {
            mercuryMessage = "☿ Mercury is retrograde";
        }
        return (
            <aside className="statusBar">
                <span className="statusItem">
                    {this.getMoonPhase(today)}
                </span>
                <span className="statusItem">
                    {this.getZodiacSign(today)} season
                </span>
                <span className="statusItem">
                    <img src="/wheel.svg" style={{height: '1rem', paddingRight: '5px'}} /> {this.getFestival(today)}
                </span>
                <span className="statusItem">
                    {mercuryMessage}
                </span>
            </aside>
        );
    }
}

export default StatusBar;