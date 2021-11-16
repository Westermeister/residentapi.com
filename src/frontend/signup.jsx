/**
 * Frontend script for handling user registration.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const React = window.React;
const ReactDOM = window.ReactDOM;
const PropTypes = window.PropTypes;

/**
 * Render the sign up form.
 * @param {Object} props - JSX properties.
 * @param {string} props.username - The username of the user.
 * @param {string} props.onUsernameChange - Used to set the username of the user.
 * @param {string} props.onPhaseChange - Used to change phase from input (i.e. form) to output (i.e. display result).
 * @returns {JSX.Element} The form component to be rendered.
 */
function SignUpForm(props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(false);

  /**
   * Submit the form.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event.
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = {
      username: props.username,
      email: email,
      password: password,
    };
    fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    }).then((response) => {
      // This only happens if we have a duplicate username.
      if (response.status === 409) {
        setError(true);
      } else if (response.status === 201) {
        props.onPhaseChange("output");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <span className="text-danger">*</span> = required
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="name" className="form-label">
            Username <span className="text-danger">*</span>
          </label>
          <input
            required
            value={props.username}
            onChange={(e) => props.onUsernameChange(e.target.value)}
            id="username"
            className="form-control bg-dark border-secondary text-white"
            type="text"
            placeholder="Enter a username"
            pattern="^[a-zA-Z0-9_]{1,20}$"
            minLength="1"
            maxLength="20"
            aria-describedby="usernameHelp"
          />
          <div
            id="usernameHelp"
            className="form-text"
            style={{ color: "rgb(150,150,160)" }}
          >
            Can contain letters, numbers, and underscores. Max 20 characters.
          </div>
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="email" className="form-label">
            Email <span className="text-danger">*</span>
          </label>
          <input
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            className="form-control bg-dark border-secondary text-white"
            type="email"
            placeholder="Enter your email"
            aria-describedby="emailHelp"
          />
          <div
            id="emailHelp"
            className="form-text"
            style={{ color: "rgb(150,150,160)" }}
          >
            So that we can contact you in case something goes wrong.
          </div>
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="password" className="form-label">
            Password <span className="text-danger">*</span>
          </label>
          <input
            required
            type="password"
            pattern="^[a-zA-Z0-9]{8,128}$"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            className="form-control bg-dark border-secondary text-white"
            placeholder="Enter a password"
            minLength="8"
            maxLength="128"
            aria-describedby="passwordHelp"
          />
          <div
            id="passwordHelp"
            className="form-text"
            style={{ color: "rgb(150,150,160)" }}
          >
            Must be between 8 and 128 characters long. Letters and numbers only.
          </div>
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <button type="submit" className="btn btn-primary">
            Sign up
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <p className="text-danger">Username already exists.</p>
          </div>
        </div>
      )}
    </form>
  );
}

SignUpForm.propTypes = {
  username: PropTypes.string.isRequired,
  onUsernameChange: PropTypes.func.isRequired,
  onPhaseChange: PropTypes.func.isRequired,
};

/**
 * Render result of user registration, including API keys.
 * @param {Object} props - JSX properties.
 * @param {string} props.username - The user's username.
 * @returns {JSX.Element} The HTML to be rendered.
 */
function SignUpResult(props) {
  return (
    <div className="mb-4">
      <p>Thanks for signing up, {props.username}!</p>
      <p>
        To get started, check out the <a href="/#docs">documentation</a>. Have
        fun!
      </p>
    </div>
  );
}

SignUpResult.propTypes = {
  username: PropTypes.string.isRequired,
};

/**
 * Single page app entry point.
 * @returns {JSX.Element} The rendered app.
 */
function App() {
  const [username, setUsername] = React.useState("");
  const [phase, setPhase] = React.useState("input");
  if (phase === "input") {
    return (
      <SignUpForm
        username={username}
        onUsernameChange={(username) => setUsername(username)}
        onPhaseChange={(phase) => setPhase(phase)}
      />
    );
  } else {
    return <SignUpResult username={username} />;
  }
}

ReactDOM.render(<App />, document.querySelector("#app"));
