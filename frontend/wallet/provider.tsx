"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { IncoProvider } from "@/contexts/IncoContext";

const ALCHEMY_RPC = "https://base-sepolia.g.alchemy.com/v2/XSbbfgyxRi2r_JqJo1ZzlbUGcJxPECxl";

const config = getDefaultConfig({
  appName: "Inco NextJS Template",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "inco-nextjs-template",
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(ALCHEMY_RPC),
  },
  ssr: true,
});

const queryClient = new QueryClient();

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <IncoProvider>{children}</IncoProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletProvider;
