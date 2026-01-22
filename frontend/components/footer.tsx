import React from "react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-doma-border flex justify-center mt-auto bg-doma-dark/30 backdrop-blur-sm">
            <div className="w-full max-w-7xl px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex flex-col items-center md:items-start flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-[var(--font-logo)] font-extrabold tracking-tight text-white">
                                SilentPay
                            </span>
                            <span className="text-sm text-white/80 font-medium">
                                - Powered by <span className="text-[#3673F5] font-bold">Inco Network</span>
                            </span>
                        </div>
                        <span className="text-[10px] text-doma-text-muted font-medium mt-1">
                            © 2026 SilentPay. All rights reserved.
                        </span>
                    </div>

                    {/* Right: Social Icons */}
                    <div className="flex items-center justify-end gap-3 flex-1">
                        <a
                            href="https://x.com/buiminhtoan1985"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 transition-all group"
                            title="Follow us on X"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className="w-4 h-4 fill-current group-hover:scale-110 transition-transform"
                            >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                            </svg>
                        </a>
                        <a
                            href="https://github.com/ToanBm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-doma-blue-muted text-doma-blue border border-doma-blue/20 rounded-[14px] hover:bg-doma-blue/20 transition-all group"
                            title="Star on GitHub"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                className="w-4 h-4 fill-current group-hover:scale-110 transition-transform"
                            >
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
