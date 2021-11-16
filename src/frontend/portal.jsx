/**
 * Frontend script for allowing access and control over a personal user account portal.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const React = window.React;
const ReactDOM = window.ReactDOM;
const PropTypes = window.PropTypes;

/**
 * Render the sign in form.
 * @param {Object} props - JSX properties.
 * @param {string} props.username - The username of the user.
 * @param {string} props.password - The user's password.
 * @param {string} props.phase - The current phase of the SPA.
 * @param {function} props.setUsername - Used to set the username of the user.
 * @param {function} props.setPassword - Used to set the password of the user.
 * @param {function} props.setPhase - Used to change the display from the form to the portal.
 * @returns {JSX.Element} The sign in form.
 */
function SignInForm(props) {
  // Used to signal incorrect credentials.
  const [error, setError] = React.useState(false);

  /**
   * "Sign in" the user by authenticating their credentials.
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const credentials = `${props.username}:${props.password}`;
    const base64Credentials = window.btoa(credentials);
    const authHeaderValue = `Basic ${base64Credentials}`;
    fetch("/portal/sign-in", {
      method: "POST",
      headers: { Authorization: authHeaderValue },
    }).then((response) => {
      if (response.status !== 200) {
        setError(true);
      } else {
        props.setPhase("portal");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="name" className="form-label">
            Username
          </label>
          <input
            required
            value={props.username}
            onChange={(e) => props.setUsername(e.target.value)}
            id="username"
            className="form-control bg-dark border-secondary text-white"
            type="text"
            placeholder="Enter your username"
          />
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            required
            type="password"
            value={props.password}
            onChange={(e) => props.setPassword(e.target.value)}
            id="password"
            className="form-control bg-dark border-secondary text-white"
            placeholder="Enter your password"
          />
        </div>
      </div>
      <div className="mb-3 row d-flex justify-content-center">
        <div className="col col-md-9">
          <button type="submit" className="btn btn-primary">
            Sign in
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <p className="text-danger">Incorrect username and/or password.</p>
          </div>
        </div>
      )}
    </form>
  );
}

SignInForm.propTypes = {
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  phase: PropTypes.string.isRequired,
  setUsername: PropTypes.func.isRequired,
  setPassword: PropTypes.func.isRequired,
  setPhase: PropTypes.func.isRequired,
};

/**
 * Render result of user registration, including API keys.
 * @param {Object} props - JSX properties.
 * @param {string} props.username - The user's username.
 * @param {string} props.password - The user's password.
 * @param {function} props.setPassword - Used to set the new password in case of a successful change.
 * @returns {JSX.Element} Forms for managing the user's account.
 */
function Portal(props) {
  // Even though the auth header contains the username (which we need for every action), we don't rely on it.
  // Instead, we send the username again in the body. This is redundant, but it enables the separation of concerns.
  // The username in the auth header is only for authorization, whilst the username in the body param...
  // ...is for the actual logic of the action being performed.
  const credentials = `${props.username}:${props.password}`;
  const base64Credentials = window.btoa(credentials);
  const authHeaderValue = `Basic ${base64Credentials}`;

  // State for each form input.
  const [newEmail, setNewEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newPasswordAgain, setNewPasswordAgain] = React.useState("");

  // Used to display messages (both error and success) to the user.
  const [emailStatus, setEmailStatus] = React.useState("");
  const [passwordStatus, setPasswordStatus] = React.useState("");
  const [deleteStatus, setDeleteStatus] = React.useState("");

  // This is used to both show the user his or her current email, but also assure them that it's been changed.
  const [currentEmail, setCurrentEmail] = React.useState("");

  // This effect initializes the current email, and does nothing else.
  React.useEffect(() => {
    fetch("/portal/get-current-email", {
      method: "POST",
      headers: {
        Authorization: authHeaderValue,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: props.username }),
    })
      .then((resp) => resp.json())
      .then((resp) => setCurrentEmail(resp.message));
  }, []);

  /**
   * Change the user's email address.
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   */
  const changeEmail = (e) => {
    e.preventDefault();
    fetch("/portal/change-email", {
      method: "POST",
      headers: {
        Authorization: authHeaderValue,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newEmail: newEmail,
        username: props.username,
      }),
    })
      .then((resp) => {
        if (resp.status === 200) {
          setCurrentEmail(newEmail);
        }
        return resp.json();
      })
      .then((resp) => setEmailStatus(resp.message));
  };

  /**
   * Change the user's password.
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   */
  const changePassword = (e) => {
    e.preventDefault();
    if (newPassword !== newPasswordAgain) {
      setPasswordStatus("Passwords do not match.");
      return;
    }
    fetch("/portal/change-password", {
      method: "POST",
      headers: {
        Authorization: authHeaderValue,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newPassword: newPassword,
        username: props.username,
      }),
    })
      .then((resp) => {
        if (resp.status === 200) {
          props.setPassword(newPassword);
        }
        return resp.json();
      })
      .then((resp) => setPasswordStatus(resp.message));
  };

  /**
   * Delete the user's account.
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event.
   */
  const deleteAccount = (e) => {
    e.preventDefault();
    fetch("/portal/delete-account", {
      method: "POST",
      headers: {
        Authorization: authHeaderValue,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: props.username }),
    }).then((resp) => {
      if (resp.status === 200) {
        props.setPhase("deleted");
      } else {
        setDeleteStatus(
          "An unknown error occurred. If this keeps happening, shoot us an email and we'll delete your account manually: support@residentapi.com"
        );
      }
    });
  };

  return (
    <div>
      <div className="mb-3">
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <p>Welcome to the portal, {props.username}!</p>
            <p>
              Here, you can manage your account. Change your {"account's"}{" "}
              email, password, or delete everything.
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={changeEmail} className="mb-4">
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <p className="mb-2">Current email: {currentEmail}</p>
            <input
              required
              type="email"
              id="email"
              className="form-control bg-dark border-secondary text-white mb-2"
              placeholder="Enter new email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary mb-2">
              Change email
            </button>
            {emailStatus.length > 0 && (
              <p className="text-warning mb-1">{emailStatus}</p>
            )}
          </div>
        </div>
      </form>
      <form onSubmit={changePassword} className="mb-4">
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <input
              required
              type="password"
              id="password"
              className="form-control bg-dark border-secondary text-white mb-2"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              pattern="^[a-zA-Z0-9]{8,128}$"
              minLength="8"
              maxLength="128"
            />
            <input
              required
              type="password"
              id="password-again"
              className="form-control bg-dark border-secondary text-white mb-2"
              placeholder="Enter new password again"
              value={newPasswordAgain}
              onChange={(e) => setNewPasswordAgain(e.target.value)}
              pattern="^[a-zA-Z0-9]{8,128}$"
              minLength="8"
              maxLength="128"
            />
            <button type="submit" className="btn btn-primary mb-2">
              Change password
            </button>
            {passwordStatus.length > 0 && (
              <p className="text-warning mb-1">{passwordStatus}</p>
            )}
          </div>
        </div>
      </form>
      <form onSubmit={deleteAccount} className="mb-4">
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <button type="submit" className="btn btn-secondary text-light mb-2">
              Delete account
            </button>
            {deleteStatus.length > 0 && (
              <p className="text-warning mb-1">{deleteStatus}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

Portal.propTypes = {
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  setPhase: PropTypes.func.isRequired,
};

/**
 * Entry point for the portal.
 * @returns {JSX.Element} Markup for the sign in form and the corresponding portal.
 */
function App() {
  // The portal is actually stateless, with each operation requiring credentials to be sent.
  // We give the illusion of state by only requiring credentials for a single "sign in" form.
  // Then, we save those credentials and use them for all subsequent operations.
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phase, setPhase] = React.useState("signin");

  if (phase === "signin") {
    return (
      <SignInForm
        username={username}
        password={password}
        phase={phase}
        setUsername={(username) => setUsername(username)}
        setPassword={(password) => setPassword(password)}
        setPhase={(phase) => setPhase(phase)}
      />
    );
  } else if (phase === "portal") {
    return (
      <Portal
        username={username}
        password={password}
        setPassword={(password) => setPassword(password)}
        setPhase={(phase) => setPhase(phase)}
      />
    );
  } else if (phase === "deleted") {
    return (
      <div className="mb-3">
        <div className="mb-3 row d-flex justify-content-center">
          <div className="col col-md-9">
            <p>
              Your account was successfully deleted. If you ever change your
              mind, we&apos;re always here!
            </p>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector("#app"));
