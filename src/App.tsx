import { FormEvent, useEffect, useState } from "react";
import { getProducts, login, Product, signup, startScrape } from "./api";

type AuthMode = "login" | "signup";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => localStorage.getItem("username") ?? "");

  function handleAuth(username: string, nextToken: string) {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("username", username);
    setUser(username);
    setToken(nextToken);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUser("");
  }

  return token ? <Dashboard username={user} onLogout={logout} /> : <Auth onAuth={handleAuth} />;
}

function Auth({ onAuth }: { onAuth: (username: string, token: string) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await login(email, password)
          : await signup(username, email, password);
      onAuth(result.username, result.token);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to authenticate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-hero">
        <span className="eyebrow">PRICEOYE INTELLIGENCE</span>
        <h1>Track the market without the busywork.</h1>
        <p>Scrape current mobile listings and keep your product catalog ready for decisions.</p>
        <div className="hero-stat"><strong>428+</strong><span>mobile listings available</span></div>
      </section>
      <section className="auth-card">
        <div className="brand-mark">PO</div>
        <p className="eyebrow">WELCOME BACK</p>
        <h2>{mode === "login" ? "Sign in to your workspace" : "Create your workspace"}</h2>
        <p className="muted">{mode === "login" ? "Access your scraper dashboard." : "Start collecting product data in minutes."}</p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <div className="error">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="switch-auth">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button className="link-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}

function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [view, setView] = useState<"dashboard" | "products">("dashboard");
  if (view === "products") {
    return <ProductsPage username={username} onLogout={onLogout} onBack={() => setView("dashboard")} />;
  }
  return <DashboardHome username={username} onLogout={onLogout} onProducts={() => setView("products")} />;
}

function DashboardHome({ username, onLogout, onProducts }: { username: string; onLogout: () => void; onProducts: () => void }) {
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(2);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts(nextPage = page) {
    setLoading(true);
    try {
      const result = await getProducts(nextPage, limit);
      setProducts(result.data);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProducts(); }, [page, limit]);

  async function scrape(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setScraping(true);
    try {
      const result = await startScrape(startPage, endPage);
      setMessage(`${result.message}. Refresh the catalog in a moment.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start scraper");
    } finally {
      setScraping(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="logo"><span>PO</span> Priceoye <small>SCRAPER</small></div>
        <div className="user-menu"><button className="outline-button" onClick={onProducts}>All products</button><span>Hi, <strong>{username}</strong></span><button className="outline-button" onClick={onLogout}>Log out</button></div>
      </header>
      <main className="dashboard">
        <div className="page-heading"><div><p className="eyebrow">CONTROL CENTER</p><h1>Product intelligence</h1><p className="muted">Collect and explore the latest mobile prices from Priceoye.</p></div><div className="total-pill"><strong>{total}</strong><span>products in catalog</span></div></div>
        <section className="scrape-panel">
          <div><p className="eyebrow">DATA COLLECTION</p><h2>Run a new scrape</h2><p className="muted">Choose the page range you want to collect. Scraping runs in the background.</p></div>
          <form className="scrape-form" onSubmit={scrape}>
            <label>From page<input type="number" min="1" value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} /></label>
            <label>To page<input type="number" min="1" value={endPage} onChange={(e) => setEndPage(Number(e.target.value))} /></label>
            <button className="primary-button" disabled={scraping || endPage < startPage}>{scraping ? "Starting..." : "Start scraping"}</button>
          </form>
          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}
        </section>
        <section className="catalog-section">
          <div className="section-heading"><div><p className="eyebrow">CATALOG</p><h2>All products</h2></div><button className="outline-button" onClick={() => void loadProducts()} disabled={loading}>↻ Refresh</button></div>
          {loading ? <div className="empty-state">Loading catalog...</div> : products.length === 0 ? <div className="empty-state">No products yet. Run a scrape to populate your catalog.</div> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          <div className="pagination"><button className="outline-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="outline-button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div>
        </section>
      </main>
    </div>
  );
}

function ProductsPage({ username, onLogout, onBack }: { username: string; onLogout: () => void; onBack: () => void }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const result = await getProducts(page, limit);
      setProducts(result.data);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProducts(); }, [page, limit]);

  function changeLimit(value: number) {
    setLimit(value);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="logo"><span>PO</span> Priceoye <small>SCRAPER</small></div>
        <div className="user-menu"><button className="outline-button" onClick={onBack}>Dashboard</button><span>Hi, <strong>{username}</strong></span><button className="outline-button" onClick={onLogout}>Log out</button></div>
      </header>
      <main className="dashboard">
        <div className="page-heading">
          <div><p className="eyebrow">CATALOG EXPLORER</p><h1>All products</h1><p className="muted">Browse every product collected by the scraper.</p></div>
          <div className="total-pill"><strong>{total}</strong><span>products in catalog</span></div>
        </div>
        <section className="list-panel">
          <div className="list-toolbar">
            <div><p className="eyebrow">PRODUCT LIST</p><h2>Collected listings</h2></div>
            <div className="list-actions"><label>Show<select value={limit} onChange={(event) => changeLimit(Number(event.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></label><button className="outline-button" onClick={() => void loadProducts()} disabled={loading}>↻ Refresh</button></div>
          </div>
          {error && <div className="error">{error}</div>}
          {loading ? <div className="empty-state">Loading products...</div> : products.length === 0 ? <div className="empty-state">No products in the catalog yet.</div> : <div className="product-list"><div className="product-list-header"><span>PRODUCT</span><span>PRICE</span><span>RATING</span><span>LINK</span></div>{products.map((product) => <div className="product-row" key={product.id}><div className="list-product"><div className="list-image">{product.image_url ? <img src={product.image_url} alt="" /> : <span>—</span>}</div><strong>{product.title}</strong></div><strong className="list-price">{product.price}</strong><span className="list-rating">{product.rating ? `★ ${product.rating}` : "—"}{product.reviews && <small>{product.reviews} reviews</small>}</span><a href={product.link} target="_blank" rel="noreferrer" className="view-link">View ↗</a></div>)}</div>}
          <div className="pagination"><button className="outline-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="outline-button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button></div>
        </section>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return <article className="product-card"><a href={product.link} target="_blank" rel="noreferrer"><div className="product-image">{product.image_url ? <img src={product.image_url} alt={product.title} /> : <span>NO IMAGE</span>}</div><div className="product-info"><div className="rating">{product.rating ? `★ ${product.rating}` : "No rating"}{product.reviews && <span> · {product.reviews} reviews</span>}</div><h3>{product.title}</h3><strong className="price">{product.price}</strong><span className="view-link">View listing ↗</span></div></a></article>;
}

export default App;
