"use client";

import dynamic from "next/dynamic";

const ChatShoppingPage = dynamic(
  () =>
    import("./chat-shopping").then((m) => ({ default: m.ChatShoppingPage })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading Kapruka Shopping…
          </p>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  return <ChatShoppingPage />;
}
