"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getConfig } from "@/utils/inco";

interface IncoContextType {
    isInitialized: boolean;
    error: Error | null;
}

const IncoContext = createContext<IncoContextType>({
    isInitialized: false,
    error: null,
});

export const IncoProvider = ({ children }: { children: React.ReactNode }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const initInco = async () => {
            try {
                console.log("Initializing Inco SDK in background...");
                await getConfig();
                setIsInitialized(true);
                console.log("Inco SDK initialized successfully.");
            } catch (err: any) {
                console.error("Inco SDK initialization failed:", err);
                setError(err);
            }
        };

        initInco();
    }, []);

    return (
        <IncoContext.Provider value={{ isInitialized, error }}>
            {children}
        </IncoContext.Provider>
    );
};

export const useInco = () => useContext(IncoContext);
