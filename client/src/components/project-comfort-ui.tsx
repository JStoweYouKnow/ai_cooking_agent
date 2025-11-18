"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/* ----------------------------- Motion Variants ---------------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

/* ------------------------------- Theme Hook -------------------------------- */
export function useTheme() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pc:theme") : null;
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("pc:theme", theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

/* --------------------------------- PCButton -------------------------------- */
export function PCButton({ children, className, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02, y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "px-6 py-3 rounded-xl font-semibold transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pc-olive/40",
        "shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
        "bg-pc-navy text-white",
        "hover:bg-pc-navy/90",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* ---------------------------------- PCCard --------------------------------- */
export function PCCard({ 
  children, 
  className, 
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 
  'onDrag' | 'onDragEnd' | 'onDragStart' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' |
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onTransitionEnd'
>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "bg-white rounded-2xl p-6 border border-gray-200/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0_4px_6px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.08)]",
        "transition-all duration-300 ease-out",
        "backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------- Navbar ----------------------------------- */
export function PCNavbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const [theme, setTheme] = useTheme();
  return (
    <header className="w-full border-b border-pc-tan/15 bg-pc-white/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-pc-tan/40 transition"
            aria-label="toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h1 className="text-lg font-semibold text-pc-navy">Sous</h1>
            <p className="text-xs text-pc-text-light -mt-1">Your Kitchen Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <input
              className="rounded-lg px-3 py-2 bg-pc-tan/30 placeholder:text-pc-text-light focus:ring-0 border border-pc-tan/20 text-sm"
              placeholder="Search... (⌘K)"
            />
            <button className="text-sm px-3 py-2 rounded-lg border border-pc-tan/20 hover:bg-pc-tan/20 transition">New</button>
          </div>

          <button
            onClick={() => setTheme(theme === "light" ? "comfort" : theme === "comfort" ? "dark" : "light")}
            className="p-2 rounded-lg hover:bg-pc-tan/40 transition"
            aria-label="toggle theme"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.66-11.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m15.66 4.66l-.71-.71M4.05 4.05l-.71-.71" />
            </svg>
          </button>

          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-pc-tan/40 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">3</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------- Sidebar ---------------------------------- */
export function PCSidebar({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <aside className={cn("w-72 bg-pc-white h-full border-r border-pc-tan/10 overflow-auto transition-all", collapsed && "hidden md:block")}>
      <div className="px-4 py-6">
        <nav className="flex flex-col gap-1">
          {[
            ["Dashboard", "M", "/"],
            ["Ingredients", "I", "/ingredients"],
            ["Recipes", "R", "/recipes"],
            ["Shopping Lists", "S", "/shopping-lists"],
            ["Settings", "⚙", "/settings"],
          ].map(([label, icon, href]) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label as string}
                href={href as any}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg transition",
                  isActive ? "bg-pc-navy text-pc-white" : "hover:bg-pc-tan/30 text-pc-navy"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center font-medium text-sm",
                  isActive ? "bg-pc-white/20" : "bg-pc-tan/40"
                )}>{icon}</div>
                <div className="text-sm font-medium">{label}</div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/* ------------------------------- SidebarLayout ---------------------------- */
export function PCSidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-pc-bg">
      <PCNavbar onToggleSidebar={() => setCollapsed(!collapsed)} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <PCSidebar collapsed={collapsed} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------- DashboardGrid ---------------------------- */
export function PCDashboardGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <PCCard>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-pc-navy">Overview</h2>
              <p className="text-pc-text-light mt-1">Quick snapshot of your cooking activity.</p>
            </div>
            <div className="flex items-center gap-3">
              <PCButton>New Recipe</PCButton>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Saved Recipes", "12"],
              ["My Ingredients", "24"],
              ["Shopping Lists", "3"],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-pc-tan/10 p-4 rounded-lg">
                <div className="text-xs text-pc-text-light">{label}</div>
                <div className="text-xl font-semibold text-pc-navy">{value}</div>
              </div>
            ))}
          </div>
        </PCCard>

        <PCCard>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {new Array(4).fill(0).map((_, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pc-tan/40 flex items-center justify-center">A</div>
                <div>
                  <div className="text-sm font-medium">Activity title {i + 1}</div>
                  <div className="text-xs text-pc-text-light">Short description of the activity, with small detail</div>
                </div>
              </li>
            ))}
          </ul>
        </PCCard>
      </div>

      <div className="flex flex-col gap-6">
        <PCCard>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-col gap-3">
            <button className="w-full text-left px-4 py-3 rounded-lg bg-pc-tan/20 hover:bg-pc-tan/30 transition">Add Recipe</button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-pc-tan/20 hover:bg-pc-tan/30 transition">Add Ingredient</button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-pc-tan/20 hover:bg-pc-tan/30 transition">New Shopping List</button>
          </div>
        </PCCard>
      </div>
    </div>
  );
}

/* -------------------------------- Form Kit -------------------------------- */
export function PCFormKit() {
  const [form, setForm] = useState({ name: "", email: "", price: "", agree: false });
  function update(key: string, value: any) {
    setForm((s) => ({ ...s, [key]: value }));
  }
  return (
    <PCCard>
      <h3 className="text-lg font-semibold">Form Kit</h3>
      <form className="mt-4 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Name</span>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} className="px-3 py-2 rounded-lg border border-pc-tan/10" placeholder="Full name" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input value={form.email} onChange={(e) => update("email", e.target.value)} className="px-3 py-2 rounded-lg border border-pc-tan/10" placeholder="you@domain.com" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Price</span>
          <div className="flex items-center gap-2">
            <input value={form.price} onChange={(e) => update("price", e.target.value)} type="number" className="px-3 py-2 rounded-lg border border-pc-tan/10 flex-1" placeholder="0.00" />
            <div className="text-sm text-pc-text-light">USD</div>
          </div>
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input checked={form.agree} onChange={(e) => update("agree", e.target.checked)} type="checkbox" className="w-4 h-4" />
          <span className="text-pc-text-light">I agree to terms</span>
        </label>

        <div className="flex items-center gap-3">
          <PCButton type="submit">Save</PCButton>
          <button className="px-4 py-2 rounded-lg border border-pc-tan/10 hover:bg-pc-tan/20 transition">Cancel</button>
        </div>
      </form>
    </PCCard>
  );
}

/* -------------------------------- Modal System ---------------------------- */
const ModalContext = createContext<{ open: (content: React.ReactNode, id?: string) => void; close: () => void } | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<{ id?: string; content?: React.ReactNode } | null>(null);
  function open(content: React.ReactNode, id?: string) {
    setModal({ id: id ?? "default", content });
  }
  function close() {
    setModal(null);
  }
  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/30" onClick={close} />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="relative z-10 max-w-2xl w-full"
            >
              <PCCard>
                <div className="flex items-start justify-between">
                  <div className="flex-1">{modal.content}</div>
                  <button onClick={close} className="ml-4 p-2 rounded-lg hover:bg-pc-tan/30">✕</button>
                </div>
              </PCCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}

/* -------------------------------- Tab System ------------------------------ */
export function PCTabs({ tabs = [], active = 0, onChange }: { tabs: Array<{ label: string; content: React.ReactNode }>; active?: number; onChange?: (index: number) => void }) {
  return (
    <div>
      <div className="flex gap-2 bg-pc-tan/10 p-1 rounded-lg">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => onChange?.(i)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              i === active ? "bg-pc-navy text-pc-white" : "text-pc-text hover:bg-pc-tan/20"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={active} variants={fadeUp} initial="hidden" animate="show" exit="hidden">
            {tabs[active]?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------- Page Transition Wrapper ---------------------- */
export function PCPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition}>
      {children}
    </motion.div>
  );
}

/* ------------------------------- Demo App -------------------------------- */
function ProjectComfortUIDemo() {
  const [tab, setTab] = useState(0);
  const modal = useModal();

  return (
    <PCSidebarLayout>
      <PCPageWrapper>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-pc-navy">Welcome back</h2>
              <p className="text-pc-text-light">Here's what's happening in your cooking app today.</p>
            </div>

            <div className="flex items-center gap-3">
              <PCButton onClick={() => modal.open(<div><h3 className="text-lg font-semibold">Create Something New</h3><p className="mt-2 text-sm text-pc-text-light">Use the modal system to build forms and workflows.</p></div>)}>
                Open Modal
              </PCButton>
              <PCButton onClick={() => modal.open(<PCFormKit />)}>Quick Form</PCButton>
            </div>
          </div>

          <div>
            <PCTabs
              tabs={[
                { label: "Overview", content: <PCDashboardGrid /> },
                { label: "Forms", content: <PCFormKit /> },
                { label: "Settings", content: <PCCard><div>Settings content</div></PCCard> },
              ]}
              active={tab}
              onChange={(i) => setTab(i)}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold">Full-width sample component</h3>
            <PCCard className="mt-3">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-pc-text-light">Summary</div>
                    <div className="text-xl font-bold text-pc-navy">Key metric: $12,300</div>
                  </div>
                  <PCButton onClick={() => alert("Action!")}>Action</PCButton>
                </div>
                <div className="h-36 bg-pc-tan/10 rounded-lg flex items-center justify-center text-pc-text-light">Placeholder for charts</div>
              </div>
            </PCCard>
          </div>
        </div>
      </PCPageWrapper>
    </PCSidebarLayout>
  );
}

export default function ProjectComfortUI() {
  return (
    <ModalProvider>
      <ProjectComfortUIDemo />
    </ModalProvider>
  );
}

