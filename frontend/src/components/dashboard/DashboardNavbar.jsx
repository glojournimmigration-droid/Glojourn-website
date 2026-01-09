import { Globe, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardNavbar = ({ user, onLogout }) => {
    return (
        <nav className="bg-primary-navy border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-3">
                <div className="bg-accent-gold/10 p-2 rounded-full">
                    <Globe className="w-6 h-6 text-accent-gold" />
                </div>
                <span className="font-heading text-xl font-bold text-white tracking-wide">
                    Glojourn <span className="text-accent-gold font-light">Client Portal</span>
                </span>
            </div>
            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white leading-tight">{user?.name}</span>
                        <span className="text-[10px] text-white/60 uppercase tracking-wider">Client Account</span>
                    </div>
                </div>
                <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="text-white hover:text-accent-gold hover:bg-white/5 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </nav>
    );
};

export default DashboardNavbar;
