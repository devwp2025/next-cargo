import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import ProductDetail from "@/pages/product-detail";
import CategoryPage from "@/pages/category";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import DashboardProducts from "@/pages/dashboard-products";
import DashboardProductNew from "@/pages/dashboard-product-new";
import DashboardOrders from "@/pages/dashboard-orders";
import BuyerOrders from "@/pages/buyer-orders";
import ChatList from "@/pages/chat";
import ChatConversation from "@/pages/chat-conversation";
import MockPay from "@/pages/mock-pay";
import AdminDashboard from "@/pages/admin";
import DashboardVerify from "@/pages/dashboard-verify";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/products" component={DashboardProducts} />
      <Route path="/dashboard/products/new" component={DashboardProductNew} />
      <Route path="/dashboard/products/:id/edit" component={DashboardProductNew} />
      <Route path="/dashboard/orders" component={DashboardOrders} />
      <Route path="/dashboard/verify" component={DashboardVerify} />
      <Route path="/me/orders" component={BuyerOrders} />
      <Route path="/chat" component={ChatList} />
      <Route path="/chat/:conversationId" component={ChatConversation} />
      <Route path="/pay/mock/:sessionId" component={MockPay} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
