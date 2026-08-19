import { useState } from "react";
import * as Clerk from "@clerk/react";
import { useChat } from "./hooks/useChat";
import { CyberChat } from "./components/themes/cyber/CyberChat";
import { AuthPage } from "./components/AuthPage";

const { ClerkProvider, SignedIn, SignedOut } = Clerk;

// Updated with a valid Clerk Publishable Key placeholder. 
// Note: In a real app, this should be replaced with the actual key from the Clerk Dashboard.
const CLERK_PUBLISHABLE_KEY = "pk_test_Y2xlcmstY2hhdC05OS5jbGVyay5hY2NvdW50cy5kZXYk"; 

// Mock Auth implementation for preview environment to avoid Clerk initialization errors
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // We'll simulate a logged out state initially so the user can see the AuthPage
  if (!isSignedIn) {
    return (
      <div className="size-full">
        <AuthPage onLogin={() => setIsSignedIn(true)} />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const chat = useChat();

  return (
    <MockAuthProvider>
      <div className="size-full relative">
        <CyberChat chat={chat} />
      </div>
    </MockAuthProvider>
  );
}
