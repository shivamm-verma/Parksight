import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar } from "lucide-react";

const LINKS = ["Hotspots", "Congestion Impact", "Enforcement", "Developers"];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-white/0"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
        <Link to="/" className="flex items-center gap-2 select-none">
          <Radar className="w-5 h-5 text-[var(--red)]" strokeWidth={2.2} />
          <span className="text-[17px] font-semibold tracking-tight">
            ParkSight
          </span>

          {/* <img src="/ParkSight-logo.png" alt="ParkSight" className="w-8 h-8" />
          <span className="text-[17px] font-semibold tracking-tight">
            ParkSight
          </span> */}
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[var(--ink-soft)]">
          {LINKS.map((l) =>
            l === "Developers" ? (
              <li key={l}>
                <Link
                  to="/developers"
                  className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  {l}
                </Link>
              </li>
            ) : (
              <li
                key={l}
                className="hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                {l}
              </li>
            ),
          )}
        </ul>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-[13px] font-semibold bg-[var(--ink)] text-white px-4 py-2 rounded-full hover:bg-black transition-colors"
        >
          See working
        </button>
      </nav>
    </header>
  );
}
