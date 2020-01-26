import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, NavLink } from 'react-router-dom';
import './index.css';
import withAuth from './withAuth';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';
import * as serviceWorker from './serviceWorker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PublicRoute = ({ component: Component, layout: Layout, ...rest }) => (
    <Route {...rest} render={props => (
        <Layout>
            <Component {...props} />
        </Layout>
    )} />
)

const PublicLayout = ({ children }) => (
    <div className="publicContainer">
        <nav className="topNav">
            <div>
                <img src="magic-ball-alt.svg" className="topNavLogo" alt="CovenChat"/>
                <NavLink to="/welcome" exact activeClassName="active"><h1 className="navHeading">CovenChat</h1></NavLink>
            </div>
            <div>
                <NavLink to="/login" exact className="topNavLink" activeClassName="active">Login</NavLink>
                <NavLink to="/register" exact className="topNavLink" activeClassName="active">Register</NavLink>
            </div>
        </nav>
        {children}
    </div>
);

class LandingPage extends Component {
    render() {
        return (
            <div id="bodyContainer">
                <h1 style={{textAlign:'center'}}>CovenChat is an online home for witches.</h1>
                <div id="featuresBox">
                    <div>
                        <img src="/homepage-map.svg" className="homepage-icon"></img>
                        <p className="lead">Map</p>
                        <p>See the location of other witches and connect to them with sigil lines.</p>
                    </div>
                    <div>
                        <img src="/homepage-chat.svg" className="homepage-icon"></img>
                        <p className="lead">Chat</p>
                        <p>Join and create public and private covens, draw Tarot cards and runes, and direct message other witches.</p>
                    </div>
                    <div>
                        <img src="/homepage-candle.svg" className="homepage-icon"></img>
                        <p className="lead">Altar</p>
                        <p>Light candles and design your own digital sacred space.</p>
                    </div>
                    <div>
                        <img src="/homepage-spellbook.svg" className="homepage-icon"></img>
                        <p className="lead">Journal</p>
                        <p>Write a private journal and grimoire, or share spells and discoveries with others.</p>
                    </div>
                </div>
            </div>
        );
    }
};

class NotFound extends Component {
    render() {
        return (
            <div>
                <h1>404</h1>
                <span>Page not found!</span>
            </div>
        );
    }
};

class App extends Component {
    render() {
        return (
            <Router>
                <Switch>
                    <PublicRoute exact path="/welcome" layout={PublicLayout} component={LandingPage} />
                    <PublicRoute path="/login" layout={PublicLayout} component={Login} />
                    <PublicRoute path="/register" layout={PublicLayout} component={Register} />
                    <PublicRoute path="/forgot-password" layout={PublicLayout} component={ForgotPassword} />
                    <PublicRoute path="/reset-password" layout={PublicLayout} component={ResetPassword} />
                    <Route exact path="/" component={withAuth(Dashboard)}/>
                    <Route exact path="/altar/*" component={withAuth(Dashboard)}/>
                    <PublicRoute layout={PublicLayout} component={NotFound}/>
                </Switch>
            </Router>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
