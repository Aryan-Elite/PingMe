import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API = 'http://localhost:3000';

export default function Chat({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);        // { _id, participantId, participantEmail }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [notifications, setNotifications] = useState([]);    // array of notif objects

  const chatSocket = useRef(null);
  const notifSocket = useRef(null);
  const typingTimer = useRef(null);
  const bottomRef = useRef(null);

  // ── 1. Connect both sockets once on mount ──────────────────────────────────
  useEffect(() => {
    // /chat namespace — for sending/receiving messages
    chatSocket.current = io(`${API}/chat`, {
      auth: { token }
    });

    // /notifications namespace — server pushes alerts here
    notifSocket.current = io(`${API}/notifications`, {
      auth: { token }
    });

    // listen for incoming messages from other users in the active room
    chatSocket.current.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // show "X is typing..." for 2 seconds
    chatSocket.current.on('typing', ({ userId }) => {
      setTypingUser(userId);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
    });

    // receive real-time notifications
    notifSocket.current.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    return () => {
      chatSocket.current.disconnect();
      notifSocket.current.disconnect();
    };
  }, [token]);

  // ── 2. Fetch user list so we can start a chat with someone ─────────────────
  useEffect(() => {
    axios
      .get(`${API}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data.filter(u => u._id !== currentUser.userId)))
      .catch(console.error);
  }, [token]);

  // ── 3. Auto-scroll to latest message ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 4. Open a chat room with another user ─────────────────────────────────
  const openRoom = async (participant) => {
    const res = await axios.post(
      `${API}/chat/room`,
      { participantId: participant._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const room = res.data;

    // fetch past messages for this room
    const msgRes = await axios.get(
      `${API}/chat/room/${room._id}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setActiveRoom({ ...room, participantEmail: participant.email });
    setMessages(msgRes.data);

    // tell socket to join this room
    chatSocket.current.emit('join', room._id);
  };

  // ── 5. Send a message ─────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !activeRoom) return;

    const msg = {
      roomId: activeRoom._id,
      content: input.trim(),
    };

    chatSocket.current.emit('message', msg);

    // optimistic update — add your own message to UI immediately
    setMessages(prev => [
      ...prev,
      { senderId: currentUser.userId, content: input.trim(), createdAt: new Date() }
    ]);
    setInput('');
  };

  // ── 6. Emit typing event (throttled — only once every 2s) ─────────────────
  const handleTyping = (e) => {
    setInput(e.target.value);
    chatSocket.current.emit('typing', activeRoom._id);
  };

  return (
    <div style={styles.layout}>

      {/* ── Sidebar: user list ── */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Users</h3>
        {users.map(u => (
          <div
            key={u._id}
            style={{
              ...styles.userItem,
              background: activeRoom?.participantEmail === u.email ? '#ede9fe' : 'transparent',
            }}
            onClick={() => openRoom(u)}
          >
            <div style={styles.avatar}>{u.email[0].toUpperCase()}</div>
            <span style={styles.userEmail}>{u.email}</span>
          </div>
        ))}
      </div>

      {/* ── Main: chat window ── */}
      <div style={styles.main}>
        {activeRoom ? (
          <>
            <div style={styles.chatHeader}>
              Chat with <strong>{activeRoom.participantEmail}</strong>
            </div>

            <div style={styles.messages}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === currentUser.userId;
                return (
                  <div key={i} style={{ ...styles.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ ...styles.bubble, background: isMe ? '#4f46e5' : '#e5e7eb', color: isMe ? '#fff' : '#111' }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {typingUser && <p style={styles.typing}>typing...</p>}
              <div ref={bottomRef} />
            </div>

            <div style={styles.inputRow}>
              <input
                style={styles.textInput}
                value={input}
                onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button style={styles.sendBtn} onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div style={styles.empty}>Select a user to start chatting</div>
        )}
      </div>

      {/* ── Right panel: notifications ── */}
      <div style={styles.notifPanel}>
        <h3 style={styles.sidebarTitle}>Notifications {notifications.length > 0 && <span style={styles.badge}>{notifications.length}</span>}</h3>
        {notifications.length === 0 && <p style={styles.noNotif}>No notifications yet</p>}
        {notifications.map((n, i) => (
          <div key={i} style={styles.notifItem}>
            <strong>New message</strong>
            <p style={styles.notifContent}>{n.content}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  layout: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  sidebar: { width: '220px', background: '#1a1a2e', color: '#fff', padding: '1rem', overflowY: 'auto' },
  sidebarTitle: { fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#aaa', marginBottom: '1rem' },
  userItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' },
  userEmail: { fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' },
  chatHeader: { padding: '1rem 1.5rem', borderBottom: '1px solid #eee', fontSize: '0.95rem', color: '#444' },
  messages: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' },
  msgRow: { display: 'flex' },
  bubble: { padding: '8px 14px', borderRadius: '18px', maxWidth: '60%', fontSize: '0.95rem', lineHeight: 1.4 },
  typing: { fontSize: '0.8rem', color: '#999', marginTop: '4px' },
  inputRow: { display: 'flex', padding: '1rem', borderTop: '1px solid #eee', gap: '8px' },
  textInput: { flex: 1, padding: '10px 14px', borderRadius: '24px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' },
  sendBtn: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 600 },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.95rem' },
  notifPanel: { width: '240px', background: '#fafafa', borderLeft: '1px solid #eee', padding: '1rem', overflowY: 'auto' },
  badge: { background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', marginLeft: '6px' },
  noNotif: { color: '#bbb', fontSize: '0.85rem' },
  notifItem: { background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '0.85rem' },
  notifContent: { color: '#555', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
