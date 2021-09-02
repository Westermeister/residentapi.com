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
 * @param {string} props.name - The name of the user.
 * @param {string} props.onNameChange - Used to set the name of the user.
 * @param {string} props.onIdentityKeyChange - Used to set the identity key based off of the API response.
 * @param {string} props.onSecretKeyChange - Used to set the secret key based off of the API response.
 * @param {string} props.onPhaseChange - Used to change phase from input (i.e. form) to output (i.e. display result).
 * @returns {JSX.Element} The form component to be rendered.
 */
function SignUpForm(props) {
  const [reason, setReason] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState(false);

  /**
   * Submit the form.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submission event.
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = {
      name: props.name,
      reason: reason,
      email: email,
    };
    fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (response.status === 400) {
          throw new Error();
        }
        return response.json();
      })
      .then((response) => {
        props.onIdentityKeyChange(response.identityKey);
        props.onSecretKeyChange(response.secretKey);
        props.onPhaseChange("output");
      })
      .catch(() => setError(true));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            value={props.name}
            onChange={(e) => props.onNameChange(e.target.value)}
            id="name"
            className="form-control bg-dark border-secondary text-white"
            type="text"
            placeholder="Enter your name"
          />
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center" id="reason">
        <div className="col col-md-9">
          <label htmlFor="reason" className="form-label">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            id="reason"
            className="form-control bg-dark border-secondary text-white"
            type="text"
            placeholder="Enter your reason for wanting to use this service"
            tabIndex="-2"
          />
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            className="form-control bg-dark border-secondary text-white"
            type="email"
            placeholder="Enter your email"
          />
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
            <p className="text-danger">
              Please make sure to fill out both fields.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

SignUpForm.propTypes = {
  name: PropTypes.string.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onIdentityKeyChange: PropTypes.func.isRequired,
  onSecretKeyChange: PropTypes.func.isRequired,
  onPhaseChange: PropTypes.func.isRequired,
};

/**
 * Render result of user registration, including API keys.
 * @param {Object} props - JSX properties.
 * @param {string} props.name - User's name.
 * @param {string} props.identityKey - Identity key response from API.
 * @param {string} props.secretKey - Secret key response from API.
 * @returns {JSX.Element} The HTML to be rendered.
 */
function SignUpResult(props) {
  return (
    <React.Fragment>
      <div className="mb-4">
        <p>Thanks for signing up, {props.name}!</p>
        <p>
          To get started, copy your API keys below.{" "}
          <strong>You cannot reset them</strong>, so make sure to write them
          down somewhere you {"won't"} forget!
        </p>
        <p>
          Then, check out the <a href="/#docs">documentation</a> to see what you
          can do with these bad boys!
        </p>
      </div>
      <div className="mb-2">
        <p className="fw-bold text-decoration-underline mb-1">
          Your identity key
        </p>
        <div>
          <code>{props.identityKey}</code>
        </div>
      </div>
      <div>
        <p className="fw-bold text-decoration-underline mb-1">
          Your secret key
        </p>
        <div>
          <code>{props.secretKey}</code>
        </div>
      </div>
    </React.Fragment>
  );
}

SignUpResult.propTypes = {
  name: PropTypes.string.isRequired,
  identityKey: PropTypes.string.isRequired,
  secretKey: PropTypes.string.isRequired,
};

/**
 * Single page app entry point.
 * @returns {JSX.Element} The rendered app.
 */
function App() {
  const [name, setName] = React.useState("");
  const [identityKey, setIdentityKey] = React.useState("");
  const [secretKey, setSecretKey] = React.useState("");
  const [phase, setPhase] = React.useState("input");
  if (phase === "input") {
    return (
      <SignUpForm
        name={name}
        onNameChange={(name) => setName(name)}
        onIdentityKeyChange={(key) => setIdentityKey(key)}
        onSecretKeyChange={(key) => setSecretKey(key)}
        onPhaseChange={(phase) => setPhase(phase)}
      />
    );
  } else {
    return (
      <SignUpResult
        name={name}
        identityKey={identityKey}
        secretKey={secretKey}
      />
    );
  }
}

ReactDOM.render(<App />, document.querySelector("#app"));
