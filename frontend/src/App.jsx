import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/react'
import './App.css'

export default function App() {
  return (
    <>
      <header className="auth-header">
        <h1>YNA Chat</h1>
        <div className="auth-actions">
          <Show when="signed-out">
            <SignInButton mode="modal"/>
            <SignUpButton mode="modal"/>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>

      <main className="chat-placeholder">
        <p>Sign in to start chatting.</p>
      </main>
    </>
  )
}
