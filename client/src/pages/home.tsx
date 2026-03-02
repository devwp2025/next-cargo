import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProductCard, { ProductCardSkeleton } from "@/components/product-card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, RotateCcw, Sparkles, Footprints, ShoppingBag as BagIcon, Shirt, Trophy, Gem, Smartphone, Phone, Home as HomeIcon, Puzzle, Package as PackageIcon } from "lucide-react";
import type { Product, Category } from "@shared/schema";
import heroImage from "@assets/image_1772427326124.png";

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "?limit=12"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <img
          src={heroImage}
          alt="Luxury marketplace"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white" data-testid="text-hero-title">
              Pre-Loved Perfection
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Pre-loved. Pristine. Priced better. Discover authenticated luxury items ready for a new home.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/search">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white/30" data-testid="button-shop-now">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard/products/new">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white/30" data-testid="button-sell-now">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: "Verified Authentic", desc: "Every item authenticated" },
            { icon: Truck, title: "Secure Shipping", desc: "Insured delivery" },
            { icon: RotateCcw, title: "Easy Returns", desc: "Hassle-free process" },
            { icon: Sparkles, title: "Quality Checked", desc: "Condition guaranteed" },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-4" data-testid={`feature-${i}`}>
              <feature.icon className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories && categories.filter(c => c.isActive).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between gap-2 mb-6">
            <h3 className="text-lg font-bold" data-testid="text-categories-heading">Shop by Category</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {categories.filter(c => c.isActive).map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <div
                  className="flex flex-col items-center gap-2 p-3 rounded-md bg-muted hover-elevate cursor-pointer text-center"
                  data-testid={`card-category-${cat.slug}`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {getCategoryIcon(cat.slug)}
                  </div>
                  <span className="text-xs font-medium leading-tight">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h3 className="text-lg font-bold" data-testid="text-newest-heading">Newest Arrivals</h3>
          <Link href="/search">
            <Button variant="ghost" size="sm" data-testid="link-view-all">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : products?.length ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-muted-foreground">No products listed yet. Be the first to sell!</p>
              <Link href="/dashboard/products/new">
                <Button className="mt-4" data-testid="button-list-first">
                  List Your First Item
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-muted">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h3 className="text-2xl font-bold mb-3" data-testid="text-cta-heading">Ready to sell your luxury items?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            List your pre-owned luxury goods and reach thousands of buyers looking for authenticated items.
          </p>
          <Link href="/dashboard/products/new">
            <Button size="lg" data-testid="button-start-selling-cta">
              Start Selling Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function getCategoryIcon(slug: string) {
  const iconMap: Record<string, any> = {
    shoes: Footprints,
    bags: BagIcon,
    clothes: Shirt,
    collectibles: Trophy,
    jewelry: Gem,
    "phone-cases": Smartphone,
    phones: Phone,
    household: HomeIcon,
    toys: Puzzle,
  };
  const Icon = iconMap[slug] || PackageIcon;
  return <Icon className="w-5 h-5 text-muted-foreground" />;
}
