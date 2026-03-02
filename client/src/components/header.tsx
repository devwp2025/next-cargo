import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, User, ShoppingBag, MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

export default function Header() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2 text-xs">
          <span data-testid="text-promo-banner">Pre-owned luxury starting at B5,000</span>
          <div className="hidden sm:flex items-center gap-4">
            <span>Free authentication on orders over B10,000</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" data-testid="link-home">
            <h1 className="text-xl font-bold tracking-tight">LUXE MARKET</h1>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 bg-muted border-0"
              />
            </div>
          </form>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link href="/chat">
                  <Button size="icon" variant="ghost" data-testid="button-chat">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-user-menu">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium" data-testid="text-user-name">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="link-dashboard">
                      Seller Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/me/orders")} data-testid="link-my-orders">
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/chat")} data-testid="link-chat">
                      Messages
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="link-admin">
                          Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} data-testid="button-logout">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="link-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="link-register">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <nav className="hidden md:block border-t">
          <div className="flex items-center gap-1 py-2 overflow-x-auto flex-wrap">
            {categories?.filter(c => c.isActive).map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Button variant="ghost" size="sm" data-testid={`link-category-${category.slug}`}>
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="p-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-mobile"
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted border-0"
                />
              </div>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {categories?.filter(c => c.isActive).map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-category-mobile-${category.slug}`}
                  >
                    {category.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
