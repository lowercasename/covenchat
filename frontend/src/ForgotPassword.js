import React, { Component } from 'react';

export default class ForgotPassword extends Component {
    constructor(props) {
        super(props)
        this.state = {
            email : '',
            redirectToLogin: false,
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
        fetch('/api/user/sendresetpasswordlink', {
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
                console.log("Reset password email sent!")
                this.setState({ redirectToLogin: true });
            }
        })
        .catch(err => {
          console.error(err);
          this.setState({ message: 'Error sending email! Please try again.' });
        });
    }
    render() {
        if (this.state.redirectToLogin) {
            this.props.history.push({
                pathname: '/login',
                state: "A password reset link has been sent to "+ this.state.email +". If the email hasn't arrived after an hour, check that you supplied the correct email used to register this account."
            });
        }
        return (
            <form onSubmit={this.onSubmit} className="publicForm">
                <h1>Forgot Password</h1>
                {this.state.message && <div className="formMessage">{this.state.message}</div>}
                <p style={{marginBottom:'1rem'}}>Enter the email you used to register and a link to reset your password will be sent to you.</p>
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
                <input
                    type="submit"
                    value="Send password reset link"
                    className="full-width"
                />
            </form>
        );
    }
}
