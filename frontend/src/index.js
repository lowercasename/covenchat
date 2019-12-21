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
            <div>
                Welcome to CovenChat!
            </div>
        );
    }
};

// class LoginPage extends Component {
//     state = {
//         redirectToReferrer: false
//     }
//     login = () => {
//         fakeAuth.authenticate(() => {
//             this.setState(() => ({
//                 redirectToReferrer: true
//             }))
//         })
//     }
//     render() {
//         const { from } = this.props.location.state || { from: { pathname: '/' } }
//         const { redirectToReferrer } = this.state
//
//         if (redirectToReferrer === true) {
//             return <Redirect to={from} />
//         }
//
//         return (
//             <div>
//             <p>You must log in to view the page</p>
//             <button onClick={this.login}>Log in</button>
//             </div>
//         )
//     }
// }

class NotFound extends Component {
    render() {
        return (
            <div>
                <h2>404</h2>
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
