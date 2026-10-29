import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StoreProvider } from "@/components/store-context";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { getProductIndex } from "@/lib/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Cached catalog summary; prerendered with the page shell.
  const products = await getProductIndex();
  return (
    <StoreProvider products={products}>
      <CartProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppFloat />
      </CartProvider>
    </StoreProvider>
  );
}
