import { Search, ChevronDown, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function SupportHeader() {
    const { user, profile, role, signOut } = useAuth();

    return (
        <header className="h-16 border-b border-border/50 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
            <div className="flex items-center gap-6 w-1/2">
                <div className="hidden lg:flex flex-col">
                    <h2 className="text-sm font-bold tracking-tight">Support Console</h2>
                    <p className="text-[10px] text-muted-foreground uppercase opacity-50 font-black">Internal Access Only</p>
                </div>
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#7c3aed] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search across all systems..."
                        className="w-full bg-muted/20 border-border/50 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#7c3aed] focus:bg-muted/40 transition-all border border-transparent"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c3aed]/5 border border-[#7c3aed]/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">System Live</span>
                </div>

                <button className="relative text-muted-foreground hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#7c3aed] rounded-full ring-2 ring-[#09090b]" />
                </button>

                <div className="h-6 w-px bg-border/50" />

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none group">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-xs font-bold leading-tight group-hover:text-[#7c3aed] transition-colors">{profile?.username || user?.email?.split('@')[0]}</span>
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 pointer-events-none border-[#7c3aed]/30 text-[#7c3aed] uppercase font-black tracking-[0.1em]">
                                {role || 'Agent'}
                            </Badge>
                        </div>
                        <Avatar className="h-9 w-9 ring-2 ring-border/20 group-hover:ring-[#7c3aed]/30 transition-all">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-muted font-bold">{(profile?.username?.[0] || user?.email?.[0] || 'S').toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0e] border-border/50 text-white rounded-xl shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground p-3">Account Session</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem className="focus:bg-[#7c3aed]/10 focus:text-white cursor-pointer py-2.5 rounded-lg m-1">Profile Overview</DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-[#7c3aed]/10 focus:text-white cursor-pointer py-2.5 rounded-lg m-1">Security Settings</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                            onClick={() => signOut()}
                            className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer py-2.5 rounded-lg m-1 font-bold"
                        >
                            Logout Console
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
