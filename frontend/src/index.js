import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Redirect, Switch, NavLink } from 'react-router-dom';
import './index.css';
import withAuth from './withAuth';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import * as serviceWorker from './serviceWorker';

const PublicRoute = ({ component: Component, layout: Layout, ...rest }) => (
    <Route {...rest} render={props => (
        <Layout>
            <Component {...props} />
        </Layout>
    )} />
)

// const PrivateRoute = ({ component: Component, layout: Layout, ...rest }) => (
//     <Route {...rest} render={props => (
//         console.log(verifyUser()),
//         verifyUser.isAuthenticated === true
//         ?
//         <Layout>
//             <Component {...props} user={verifyUser.user} />
//         </Layout>
//         :
//         <Redirect to={{
//                 pathname: '/foo',
//                 state: { from: props.location }
//             }}
//         />
//     )} />
// )

// function withAuth(ComponentToProtect) {
//     return class extends Component {
//     constructor() {
//       super();
//       this.state = {
//         loading: true,
//         redirect: false,
//       };
//     }
//     componentDidMount() {
//       fetch('/api/user/verify')
//         .then(res => {
//           if (res.status === 200) {
//             this.setState({ loading: false });
//           } else {
//             const error = new Error(res.error);
//             throw error;
//           }
//         })
//         .catch(err => {
//           console.error(err);
//           this.setState({ loading: false, redirect: true });
//         });
//     }    render() {
//       const { loading, redirect } = this.state;
//       if (loading) {
//         return null;
//       }
//       if (redirect) {
//         return <Redirect to="/login" />;
//       }
//       return (
//         <React.Fragment>
//           <ComponentToProtect {...this.props} />
//         </React.Fragment>
//       );
//     }
//   }}

// function verifyUser() {
//     let payload = {
//         user: '',
//         isAuthenticated: false,
//         error: ''
//     };
//     fetch('/api/user/verify')
//     .then(res => {
//         if (res.status === 200) {
//             payload.isAuthenticated = true;
//             payload.user = res.user;
//             console.log(payload)
//             return payload;
//         } else {
//             payload.isAuthenticated = false
//             console.log("VERIFICATION ERROR 1")
//             const error = new Error(res.error);
//             console.error(error);
//             payload.error = error;
//             return payload;
//         }
//     })
//     .catch(err => {
//         console.log("VERIFICATION ERROR 2")
//         // this.isAuthenticated = false
//         console.error(err);
//         payload.error = err;
//         return payload;
//         // this.setState({ loading: false, redirect: true });
//     })
// }

// const verifyUser = {
//     isAuthenticated: false,
//     verify: fetch('/api/user/verify')
//       .then(res => {
//         if (res.status === 200) {
//           this.isAuthenticated = true
//           this.user = res.user
//           console.log(res.user)
//         } else {
//           this.isAuthenticated = false
//           console.log("VERIFICATION ERROR 1")
//           const error = new Error(res.error);
//           console.error(error);
//         }
//       })
//       .catch(err => {
//         console.log("VERIFICATION ERROR 2")
//         // this.isAuthenticated = false
//         console.error(err);
//         // this.setState({ loading: false, redirect: true });
//     })
// }

const PublicLayout = ({ children }) => (
    <div>
        <h1>This is the Outside Pages Layout</h1>
        <nav>
            <NavLink to="/login" exact activeClassName="active">Login</NavLink>
            <NavLink to="/register" exact activeClassName="active">Register</NavLink>
            <NavLink to="/dashboard" exact activeClassName="active">Dashboard</NavLink>
        </nav>
        {children}
    </div>
);

const PrivateLayout = ({ children, ...rest }) => (
    <div>
        {children}
    </div>
)

class LandingPage extends Component {
    render() {
        return (
            <div>
                Welcome to Covenchat 🔮
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
                    <PublicRoute exact path="/" layout={PublicLayout} component={LandingPage} />
                    <PublicRoute path="/login" layout={PublicLayout} component={Login} />
                    <PublicRoute path="/register" layout={PublicLayout} component={Register} />
                    <Route path="/dashboard" component={withAuth(Dashboard)}/>
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
serviceWorker.unregister();
