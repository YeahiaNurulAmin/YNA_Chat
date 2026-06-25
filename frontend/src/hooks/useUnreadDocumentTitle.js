import { useEffect } from "react";

import { APP_NAME } from "../components/AppLogo";
import { useChatStore } from "../store/useChatStore";

export function useUnreadDocumentTitle() {
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    document.title = total > 0 ? `(${total}) ${APP_NAME}` : APP_NAME;

    return () => {
      document.title = APP_NAME;
    };
  }, [unreadCounts]);
}
