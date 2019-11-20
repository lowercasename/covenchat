import React, { Component } from 'react';
import { BrowserRouter as Redirect } from 'react-router-dom';

export default class Register extends Component {
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            email : '',
            password: '',
            redirectToLogin: false,
            message: false
        };
    }
    handleInputChange = (event) => {
        const { value, name } = event.target;
        this.setState({
            [name]: value
        });
    }
    onSubmit = (event) => {
        event.preventDefault();
        fetch('/api/user/register', {
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
                console.log("Successfully registered!")
                this.setState({ redirectToLogin: true });
            }
        })
        .catch(err => {
          console.error(err);
          this.setState({ message: 'Error registering! Please try again.' });
        });
    }
    render() {
        if (this.state.redirectToLogin) {
            this.props.history.push({
                pathname: '/login',
                state: 'You have successfully registered - you can now log in.'
            });
        }
        return (
            <form onSubmit={this.onSubmit} className="publicForm">
                <h1>Create an account</h1>
                {this.state.message && <div className="formMessage">{this.state.message}</div>}
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    name="email"
                    placeholder="badasswitch@example.com"
                    className="full-width"
                    value={this.state.email}
                    onChange={this.handleInputChange}
                    required
                />
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    name="username"
                    placeholder="Make it spooky"
                    className="full-width"
                    value={this.state.username}
                    onChange={this.handleInputChange}
                    required
                />
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    name="password"
                    placeholder="Something memorable"
                    className="full-width"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    required
                />
                <input
                    type="submit"
                    value="Create my account"
                    className="full-width"
                />
            </form>
        );
    }
}
