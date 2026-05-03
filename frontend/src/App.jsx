import { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';

function App() {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (accessToken, user) => {
    setToken(accessToken);
    setCurrentUser(user);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return <Chat token={token} currentUser={currentUser} />;
}

export default App;
