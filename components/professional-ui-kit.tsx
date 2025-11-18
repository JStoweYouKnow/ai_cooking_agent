/*
  Project Comfort — Professional UI Kit

  File: professional-ui-kit.tsx

  - Designed as a single-file drop-in demo for Next.js (App Router) using Tailwind + Framer Motion

  - Includes: design tokens, spacing system, theme provider (light/dark/comfort),
    navbar, polished sidebar, command palette (⌘K), button + card system with micro-interactions,
    tab system with sliding underline, modal provider, skeleton loader, empty states,
    page transitions, and utilities for consistent spacing and typography.

  Prereqs:
  - Tailwind configured with Project Comfort tokens (see comments below) or use the included CSS variables
  - Install framer-motion: npm i framer-motion

  Usage:
  - Drop this into your project (e.g., components/professional-ui-kit.tsx)
  - Import and mount <ProfessionalUI /> in a page to preview the demo layout

  Notes:
  - This file purposefully contains polished components with clear tokens and examples.
  - If you want, I can split into discrete files (components/, hooks/, lib/) and provide a ready repo scaffold.
*/

"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Home, ShoppingCart, BookOpen, Apple, User, LogOut, Bell } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* --------------------------- DESIGN TOKENS (CSS) -------------------------- */
/* -------------------------------------------------------------------------- */

// These CSS variables are intentionally included here; you may also place them in globals.css
const TOKENS_STYLE = `
:root{
  --pc-bg: #FAF8F4;
  --pc-bg-alt: #F4EFE8;
  --pc-card: #FFFFFF;
  --pc-border: rgba(17,24,39,0.06);

  --pc-navy: #1E2A38;
  --pc-olive: #77856A;
  --pc-tan: #D4C3A9;
  --pc-muted: #6B6B6B;

  --pc-radius: 1rem; /* 16px */
  --pc-radius-lg: 1.5rem;

  --pc-shadow: 0 6px 18px rgba(11,22,30,0.06);
  --pc-shadow-hover: 0 10px 28px rgba(11,22,30,0.09);

  --pc-ease: cubic-bezier(.2,.9,.2,1);

  /* spacing scale */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;
}

/* ergonomic typography utilities */
.pc-h1{ font-size: 1.75rem; line-height: 1.05; font-weight: 600; }
.pc-h2{ font-size: 1.25rem; font-weight: 600; }
.pc-body{ font-size: 1rem; color: var(--pc-muted); }
`;

/* -------------------------------------------------------------------------- */
/* ----------------------------- Utilities --------------------------------- */
/* -------------------------------------------------------------------------- */
function cx(...args: Array<string | false | null | undefined>) { return args.filter(Boolean).join(' '); }

/* keyboard helper */
function useKeyPress(key: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key.toLowerCase() === key.toLowerCase()) handler(e); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [key, handler]);
}

/* -------------------------------------------------------------------------- */
/* --------------------------- Theme (light/dark/comfort) ------------------- */
/* -------------------------------------------------------------------------- */
const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }){
  const [mode, setMode] = useState<'light'|'dark'|'comfort'>('light');
  useEffect(()=>{
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pc:mode') : null;
    if(saved === 'dark' || saved === 'comfort') setMode(saved as any);
  },[]);
  useEffect(()=>{ if(typeof window!=='undefined') localStorage.setItem('pc:mode', mode); },[mode]);

  // apply theme classes to body for global CSS hooks
  useEffect(()=>{
    const b = document.documentElement;
    b.style.background = mode === 'dark' ? '#0f1720' : 'var(--pc-bg)';
    b.style.color = mode === 'dark' ? '#e6eef6' : 'var(--pc-navy)';
    if(mode === 'comfort') b.style.setProperty('--pc-card', '#fffefb');
    else b.style.setProperty('--pc-card','#FFFFFF');
  },[mode]);

  return <ThemeContext.Provider value={{mode,setMode}}>{children}</ThemeContext.Provider>
}

export function useTheme(){ return useContext(ThemeContext); }

/* -------------------------------------------------------------------------- */
/* ----------------------------- Command Palette ---------------------------- */
/* -------------------------------------------------------------------------- */
function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const items = [
    {id:'dash',label:'Go to Dashboard', href: '/'},
    {id:'new',label:'Create New Recipe', href: '/recipes'},
    {id:'recipe',label:'Add Recipe', href: '/recipes'},
    {id:'ingredients',label:'My Ingredients', href: '/ingredients'},
    {id:'shopping',label:'Shopping Lists', href: '/shopping-lists'},
  ];
  const matches = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  useKeyPress('k', (e)=>{ if(e.metaKey || e.ctrlKey){ e.preventDefault(); setOpen(o=>!o); } });

  useEffect(()=>{ const onEsc = (e:KeyboardEvent)=>{ if(e.key==='Escape') setOpen(false) }; window.addEventListener('keydown',onEsc); return ()=>window.removeEventListener('keydown',onEsc); },[]);
  
  // Expose open function globally for search input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__openCommandPalette = () => setOpen(true);
    }
  }, []);

  return (
    <div aria-hidden>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0, scale:0.99}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setOpen(false)} />
            <motion.div initial={{y:-8}} animate={{y:0}} exit={{y:-8}} className="relative z-10 w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-lg border" style={{borderColor:'var(--pc-border)'}}>
                <div className="p-4">
                  <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search commands or press Esc" className="w-full px-4 py-3 rounded-lg border" />
                </div>
                <div className="max-h-60 overflow-auto">
                  {matches.length ? matches.map(m=> (
                    <Link key={m.id} href={m.href || '#'} onClick={()=>setOpen(false)}>
                      <div className="px-4 py-3 hover:bg-pc-tan/20 cursor-pointer">{m.label}</div>
                    </Link>
                  )) : <div className="p-4 text-sm text-gray-500">No matches</div>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ------------------------------- Navbar ---------------------------------- */
/* -------------------------------------------------------------------------- */
function Navbar({ onToggleSidebar }:{onToggleSidebar?:()=>void}){
  const {mode,setMode} = useTheme();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <div className="w-full border-b" style={{borderColor:'var(--pc-border)', background: 'transparent'}}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-pc-tan/30 transition" aria-label="toggle sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-pc-navy p-2 rounded-lg">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-base" style={{color:'var(--pc-navy)'}}>Sous</div>
              <div className="text-xs mt-0.5" style={{color:'var(--pc-muted)'}}>Your Kitchen Companion</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <input 
              placeholder="Search (⌘K)" 
              className="px-3 py-2 rounded-lg border cursor-pointer" 
              readOnly 
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).__openCommandPalette) {
                  (window as any).__openCommandPalette();
                }
              }}
            />
          </div>

          <button onClick={()=> setMode(mode==='light'?'comfort': mode==='comfort'?'dark':'light')} className="p-2 rounded-lg hover:bg-pc-tan/30 transition" aria-label="theme">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.66-11.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m15.66 4.66l-.71-.71M4.05 4.05l-.71-.71"/></svg>
          </button>

          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-pc-tan/30 transition">
              <Bell className="h-5 w-5" />
            </button>
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">2</span>
          </div>

          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-pc-tan/20 rounded-md">
                <User className="h-4 w-4" style={{color:'var(--pc-muted)'}} />
                <span className="text-sm" style={{color:'var(--pc-navy)'}}>{user.name || user.email || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-pc-tan/30 transition"
                aria-label="logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ------------------------------- Sidebar --------------------------------- */
/* -------------------------------------------------------------------------- */
function Sidebar({collapsed}:{collapsed:boolean}){
  const pathname = usePathname();
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Ingredients', href: '/ingredients', icon: Apple },
    { name: 'Find Recipes', href: '/recipes', icon: BookOpen },
    { name: 'Shopping Lists', href: '/shopping-lists', icon: ShoppingCart },
  ];

  return (
    <aside className={cx(
      'bg-white border-r transition-all duration-300',
      collapsed ? 'w-20' : 'w-72',
      'hidden md:block'
    )} style={{borderColor:'var(--pc-border)'}}>
      <div className="px-4 py-6">
        {!collapsed && (
          <div className="mb-4">
            <div className="h-12 w-12 rounded-lg bg-pc-olive/10 flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-pc-olive" />
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mb-4 flex justify-center">
            <div className="h-10 w-10 rounded-lg bg-pc-olive/10 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-pc-olive" />
            </div>
          </div>
        )}
        <nav className="flex flex-col gap-2">
          {navigation.map((item)=> {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                  "hover:bg-pc-tan/20",
                  isActive && "bg-pc-olive/10 text-pc-olive"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-pc-olive rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-pc-olive text-white shadow-lg shadow-pc-olive/20" 
                    : "bg-pc-tan/30 text-pc-navy group-hover:bg-pc-tan/40"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                {!collapsed && (
                  <div className="text-sm font-medium">{item.name}</div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/* ------------------------------- PCButton -------------------------------- */
/* -------------------------------------------------------------------------- */
export function PCButton({children,className,...props}: any){
  return (
    <motion.button whileHover={{y:-2}} whileTap={{scale:0.98}} className={cx('rounded-lg px-4 py-2 font-medium shadow-sm transition', 'bg-[var(--pc-navy)] text-white', className)} {...props}>{children}</motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* -------------------------------- PCCard --------------------------------- */
/* -------------------------------------------------------------------------- */
export function PCCard({children,className}: any){
  return (
    <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} whileHover={{boxShadow:'var(--pc-shadow-hover)'}} transition={{ease:'var(--pc-ease)'}} className={cx('bg-[var(--pc-card)] rounded-[var(--pc-radius-lg)] p-6 border', className)} style={{borderColor:'var(--pc-border)'}}> {children} </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------------ Skeleton --------------------------------- */
/* -------------------------------------------------------------------------- */
export function PCSkeleton({width='100%',height=16,rounded=true}:{width?:string|number;height?:number|string;rounded?:boolean}){
  return (<div className={cx('animate-pulse bg-gray-200', rounded? 'rounded-md':'')} style={{width,height,background:'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(240,240,240,0.6))'}} />)
}

/* -------------------------------------------------------------------------- */
/* ------------------------------ Empty State ------------------------------- */
/* -------------------------------------------------------------------------- */
export function PCEmpty({title,subtitle,cta}:{title:string,subtitle?:string,cta?:React.ReactNode}){
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-40 h-40 rounded-2xl bg-pc-tan/20 flex items-center justify-center text-3xl font-semibold">☀️</div>
      <h3 className="mt-6 text-lg font-semibold" style={{color:'var(--pc-navy)'}}>{title}</h3>
      {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* --------------------------------- Modal ---------------------------------- */
/* -------------------------------------------------------------------------- */
const ModalCtx = createContext<any>(null);
export function ModalProvider({children}:{children:React.ReactNode}){
  const [open,setOpen] = useState(false);
  const [content,setContent] = useState<React.ReactNode>(null);
  function show(c:React.ReactNode){ setContent(c); setOpen(true); }
  function hide(){ setOpen(false); setContent(null); }
  return (
    <ModalCtx.Provider value={{show,hide}}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="absolute inset-0 bg-black/30" onClick={hide} />
            <motion.div initial={{scale:0.98,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.98,opacity:0}} className="relative z-10 max-w-3xl w-full">
              <PCCard>
                <div className="flex justify-between items-start">
                  <div className="flex-1">{content}</div>
                  <button onClick={hide} className="ml-4 p-2 rounded-lg hover:bg-pc-tan/30">Close</button>
                </div>
              </PCCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalCtx.Provider>
  )
}
export function usePCModal(){ return useContext(ModalCtx); }

/* -------------------------------------------------------------------------- */
/* --------------------------------- Tabs ---------------------------------- */
/* -------------------------------------------------------------------------- */
export function PCTabs({tabs,active=0,onChange}:{tabs:{label:string,content:React.ReactNode}[],active?:number,onChange?:(i:number)=>void}){
  return (
    <div>
      <div className="flex gap-2 bg-pc-tan/10 p-1 rounded-lg">
        {tabs.map((t,i)=> (
          <button key={t.label} onClick={()=>onChange?.(i)} className={cx('px-4 py-2 rounded-md relative transition','text-sm font-medium', i===active? 'text-white bg-[var(--pc-navy)]':'text-[var(--pc-navy)]')}>{t.label}
            {i===active && <motion.span layoutId="tab-underline" className="absolute left-0 right-0 bottom-0 h-1 rounded-b-md" style={{background:'linear-gradient(90deg,var(--pc-olive), var(--pc-navy))'}} />}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.22}}>
            {tabs[active].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* --------------------------- Professional Layout ------------------------- */
/* -------------------------------------------------------------------------- */
export function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <style>{TOKENS_STYLE}</style>
      <div className="min-h-screen bg-[var(--pc-bg)]">
        <CommandPalette />
        <Navbar onToggleSidebar={()=>setCollapsed(c=>!c)} />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex gap-4 md:gap-6">
          <Sidebar collapsed={collapsed} />
          <main className={cn("flex-1 transition-all duration-300", collapsed ? "md:ml-0" : "")}>
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

