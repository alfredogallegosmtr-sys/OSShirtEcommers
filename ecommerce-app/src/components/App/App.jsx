import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "../../context/CartContext";
import Layout from "../../layout/Layout";
import Cart from "../../pages/Cart";
import Home from "../../pages/Home";
import Login from "../../pages/Login";
import ProtectedRoute from "../../pages/ProtectedRoute";
import Register from "../../pages/Register";
import { AuthProvider } from "../../context/AuthContext";
import Loading from "../common/Loading/Loading";
import ErrorBoundary from "../common/ErrorBoundary/ErrorBoundary";

const Checkout = lazy(() => import("../../pages/Checkout"));
const OrderConfirmation = lazy(() => import("../../pages/OrderConfirmation"));
const Product = lazy(() => import("../../pages/Product"));
const Profile = lazy(() => import("../../pages/Profile"));
const CategoryPage = lazy(() => import("../../pages/CategoryPage"));
const Orders = lazy(() => import("../../pages/Orders"));
const SearchResults = lazy(() => import("../../pages/SearchResults"));
const Settings = lazy(() => import("../../pages/Setttings"));
const WishList = lazy(() => import("../../pages/WishList"));

function App() {
  return (

    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <ErrorBoundary>
              <Suspense fallback={<Loading>Cargando página...</Loading>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/product/:productId" element={<Product />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute
                        redirectTo="/login"
                        allowedRoles={["admin", "customer"]}
                      >
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <ProtectedRoute>
                        <WishList></WishList>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-confirmation"
                    element={<OrderConfirmation />}
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings></Settings>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<div>Ruta no encontrada</div>} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
