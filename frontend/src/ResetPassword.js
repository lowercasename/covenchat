import React, { Component } from 'react';
import { BrowserRouter as Redirect } from 'react-router-dom';

export default class ResetPassword extends Component {
    constructor(props) {
        super(props)
        this.state = {
            password: '',
            passwordRepeat: '',
            redirectToLogin: false,
            message: false
        };
    }

    getQueryVariable = (variable) => {
        var query = this.props.location.search.slice(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        console.log('Query variable %s not found', variable);
    }

    componentDidMount() {
        let token = this.getQueryVariable('token');
        fetch('/api/user/checkresetpasswordtoken/' + token)
        .then(res => {
            console.log(res)
            if (res.status !== 200) {
                this.props.history.push({
                    pathname: '/forgot-password',
                    state: 'The reset password token you provided is invalid or has expired. Please request a new token.'
                });
            } else {
                console.log("Token is valid!")
            }
        })
        .catch(err => {
          console.error(err);
        //   this.props.history.push({
        //     pathname: '/forgot-password',
        //     state: 'The reset password token you provided is invalid or has expired. Please request a new token.'
        //     });
        });
    }

    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }
    onSubmit = (event) => {
        event.preventDefault();
        fetch('/api/user/resetpassword', {
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(res => {
            if (res.message) {
                this.setState({message: res.message})
            } else {
                console.log("Successfully reset password!")
                this.setState({ redirectToLogin: true });
            }
        })
        .catch(err => {
          console.error(err);
          this.setState({ message: 'Error resetting password! Please try again.' });
        });
    }
    render() {
        if (this.state.redirectToLogin) {
            this.props.history.push({
                pathname: '/login',
                state: 'You have successfully reset your password - you can now log in with the new passsword.'
            });
        }
        return (
            <form onSubmit={this.onSubmit} className="publicForm">
                <h1>Reset your password</h1>
                {this.state.message && <div className="formMessage">{this.state.message}</div>}
                <label htmlFor="password">New password</label>
                <input
                    type="password"
                    name="password"
                    placeholder="Something memorable"
                    className="full-width"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    required
                />
                <label htmlFor="password">Repeat password</label>
                <input
                    type="password"
                    name="passwordRepeat"
                    placeholder="Second verse, same as the first"
                    className="full-width"
                    value={this.state.passwordRepeat}
                    onChange={this.handleInputChange}
                    required
                />
                <input
                    type="submit"
                    value="Reset my password"
                    className="full-width"
                />
            </form>
        );
    }
}
