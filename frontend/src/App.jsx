import { RgbProvider } from "./context/RgbContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "@clerk/react";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useCallStore } from "./store/useCallStore";
import { useEffect } from "react";

import { Toaster } from "react-hot-toast";
import { setAuthTokenGetter } from "./lib/axios";
import { AudioCallModal } from "./components/chat/AudioCallModal";

function App() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  // option 1
  // const { checkAuth, isCheckingAuth, clearAuth } = useAuthStore();

  // option 2 - better for performance
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const authUser = useAuthStore((state) => state.authUser);
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    setAuthTokenGetter(getToken);
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) checkAuth();
    else clearAuth();
  }, [checkAuth, clearAuth, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (message) => {
      useChatStore.getState().handleIncomingMessage(message);
    };

    socket.on("newMessage", handleIncomingMessage);

    const handleMessageDeleted = (payload) => {
      useChatStore.getState().handleMessageDeleted(payload);
    };

    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleIncomingMessage);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (payload) => {
      useCallStore.getState().handleIncomingCall(payload);
    };

    const handleCallAccepted = () => {
      void useCallStore.getState().handleCallAccepted();
    };

    const handleCallRejected = () => {
      useCallStore.getState().handleCallRejected();
    };

    const handleCallEnded = (payload) => {
      void useCallStore.getState().handleCallEnded(payload);
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("call:rejected", handleCallRejected);
    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
    };
  }, [socket]);

  if (!isLoaded || (isSignedIn && isCheckingAuth)) return <PageLoader />;

  // Clerk says signed-in, but backend sync failed (often clock skew).
  if (isSignedIn && !authUser) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#030306] px-6 text-center text-[#e4e1e9]">
        <p className="max-w-md text-sm leading-relaxed text-[#b9cacb]">
          Could not sync your session with the server. This is usually caused by an inaccurate
          Windows system clock (Clerk JWT not active yet). Sync your time, then retry.
        </p>
        <button
          type="button"
          className="rounded-full bg-[#00f2ff] px-5 py-2.5 text-sm font-semibold text-[#00363a]"
          onClick={() => void checkAuth()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <RgbProvider>
        <Routes>
          <Route path="/" element={isSignedIn ? <ChatPage /> : <Navigate to={"/auth"} replace />} />
          <Route
            path="/auth"
            element={!isSignedIn ? <AuthPage /> : <Navigate to={"/"} replace />}
          />
        </Routes>
        <AudioCallModal />
        <Toaster />
      </RgbProvider>
    </ThemeProvider>
  );
}

export default App;