import React, { Component } from 'react';

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username : '',
            password: '',
            message: this.props.location.state
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
        fetch('/api/user/authenticate', {
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
                this.props.history.push('/');
            }
        })
        .catch(err => {
            console.error(err);
            this.setState({ message: 'Error logging in! Please try again.' });
        });
    }
    render() {
        return (
            <form onSubmit={this.onSubmit} className="publicForm">
                <h1>Let's chat!</h1>
                {this.state.message && <div className="formMessage">{this.state.message}</div>}
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    name="username"
                    value={this.state.username}
                    onChange={this.handleInputChange}
                    required
                    className="full-width"
                />
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    name="password"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    required
                    className="full-width"
                />
                <input
                    type="submit"
                    value="Submit"
                    className="full-width"
                />
            </form>
        );
    }
}
