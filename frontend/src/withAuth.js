import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
// import Cookie from 'js-cookie';
//
// const getSession = () => {
//     console.log(Cookie.get())
//     const jwt = Cookie.get('token')
//     let session
//     try {
//         if (jwt) {
//             console.log("JWT!")
//             const base64Url = jwt.split('.')[1]
//             const base64 = base64Url.replace('-', '+').replace('_', '/')
//             session = JSON.parse(window.atob(base64))
//             console.log(session);
//         } else {
//             console.log("No JWT")
//         }
//     }
//     catch (error) {
//         console.log(error)
//     }
//     return session
// }
//
// const logOut = () => {
//     Cookie.remove('__session')
// }

export default function withAuth(ComponentToProtect, module) {
    return class extends Component {
        constructor() {
            super();
            this.state = {
                loading: true,
                redirect: false,
                user: false
            };
        }
        componentDidMount() {
            fetch('/api/user/verify')
              .then(res => {
                  if (res.status === 200) {
                      return res.json();
                  } else {
                    const error = new Error(res.error);
                    throw error;
                  }
              })
              .then(res => {
                  this.setState({ loading: false, user: res.user });
              })
              .catch(err => {
                console.error(err);
                this.setState({ loading: false, redirect: true });
              });
        }
        render() {
            const { loading, redirect } = this.state;
            if (loading) {
                return null;
            }
            if (redirect) {
                return <Redirect to="/welcome" />;
            }
            return (
                <React.Fragment>
                    <ComponentToProtect user={this.state.user} {...this.props} />
                </React.Fragment>
            );
        }
    }}
