import { ConnectButton } from "@rainbow-me/rainbowkit";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Assets", href: "/" },
    { name: "Employer", href: "/employer" },
    { name: "Employee", href: "/employee" },
  ];

  return (
    <div className="w-full flex justify-center">
      <div className="w-full bg-doma-card border border-doma-border rounded-[20px] px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl font-[var(--font-logo)] font-extrabold tracking-wide text-white group-hover:opacity-80 transition-opacity">
                SilentPay
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2.5 rounded-[14px] text-sm font-bold transition-all ${isActive
                      ? "bg-doma-blue-muted text-doma-blue"
                      : "text-doma-text-muted hover:text-white hover:bg-doma-blue/10"
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/faucet"
              className={`px-4 py-2.5 rounded-[14px] text-sm font-bold transition-all ${pathname === "/faucet" ? "bg-doma-blue-muted text-doma-blue" : "text-doma-text-muted hover:text-white hover:bg-doma-blue/10"}`}
            >
              Faucet
            </Link>
            <ConnectButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
