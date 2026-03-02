import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-sm mb-4">Categories</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/category/shoes">Shoes</Link></li>
              <li><Link href="/category/bags">Bags</Link></li>
              <li><Link href="/category/clothes">Clothes</Link></li>
              <li><Link href="/category/jewelry">Jewelry</Link></li>
              <li><Link href="/category/collectibles">Collectibles</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-4">Sell</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/dashboard/products/new">List an Item</Link></li>
              <li><Link href="/dashboard">Seller Dashboard</Link></li>
              <li><Link href="/dashboard/orders">My Sales</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-4">Support</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>FAQ</li>
              <li>Shipping Policy</li>
              <li>Return Policy</li>
              <li>Authentication Guide</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-4">About LUXE MARKET</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              Your trusted marketplace for pre-owned luxury goods. Every item verified, every transaction secure.
            </p>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-xs opacity-60">
          <p>2024 LUXE MARKET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
