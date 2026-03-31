import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");
const userDisplay = document.getElementById("userDisplay");
const authLink = document.getElementById("authLink");
const productContainer = document.getElementById("productContainer");
const cartContainer = document.getElementById("cartContainer");
const cartTotal = document.getElementById("cartTotal");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const checkoutBtn = document.getElementById("checkoutBtn");
const themeToggle = document.getElementById("themeToggle");
const adminProductForm = document.getElementById("adminProductForm");
const adminMessage = document.getElementById("adminMessage");

let allProducts = [];
const ADMIN_EMAIL = "mckaylabekker@gmail.com";

// ---------- THEME ----------
const savedTheme = localStorage.getItem("urbanThreadsTheme");
if (savedTheme === "light") {
  document.body.classList.add("light-mode");
}

if (themeToggle) {
  themeToggle.textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("urbanThreadsTheme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
  });
}

// ---------- AUTH ----------
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      authMessage.textContent = "Account created successfully. You can now shop and use your cart.";
      signupForm.reset();
    } catch (error) {
      authMessage.textContent = friendlyAuthError(error.code);
      console.error("Signup error:", error);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      authMessage.textContent = "Logged in successfully.";
      loginForm.reset();
      setTimeout(() => {
        window.location.href = "shop.html";
      }, 800);
    } catch (error) {
      authMessage.textContent = friendlyAuthError(error.code);
      console.error("Login error:", error);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (userDisplay) userDisplay.textContent = user.email;
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (authLink) authLink.classList.add("hidden");

    if (window.location.pathname.includes("cart.html")) {
      loadCart(user.uid);
    }

    if (window.location.pathname.includes("admin.html")) {
      if (user.email !== ADMIN_EMAIL) {
        if (adminMessage) {
          adminMessage.textContent = `Logged in as ${user.email}. Change ADMIN_EMAIL in app.js to your email to use the admin panel.`;
        }
      }
    }
  } else {
    if (userDisplay) userDisplay.textContent = "";
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (authLink) authLink.classList.remove("hidden");

    if (window.location.pathname.includes("cart.html")) {
      alert("Please log in to view your cart.");
      window.location.href = "login.html";
    }

    if (window.location.pathname.includes("admin.html")) {
      if (adminMessage) adminMessage.textContent = "Please log in with your admin email to add products.";
    }
  }
});

function friendlyAuthError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already in use. Please log in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ---------- PRODUCTS ----------
async function loadProducts() {
  if (!productContainer) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = [];

    querySnapshot.forEach((docSnap) => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    displayProducts(allProducts);
  } catch (error) {
    console.error("Product loading error:", error);
    productContainer.innerHTML = `<p>Error loading products: ${error.message}</p>`;
  }
}

function displayProducts(products) {
  if (!productContainer) return;

  productContainer.innerHTML = "";

  if (products.length === 0) {
    productContainer.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((product, index) => {
    const card = document.createElement("div");
    card.classList.add("product-card", "fade-in-up");
    card.style.animationDelay = `${index * 0.08}s`;

    const price = Number(product.price) || 0;

    card.innerHTML = `
      <img src="${product.imageURL}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      <p>${product.description}</p>
      <p class="product-price">R${price.toFixed(2)}</p>
      <button class="btn add-cart-btn" data-id="${product.id}">Add to Cart</button>
    `;

    productContainer.appendChild(card);
  });

  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

if (searchInput || categoryFilter) {
  const filterProducts = () => {
    const searchValue = searchInput ? searchInput.value.toLowerCase() : "";
    const categoryValue = categoryFilter ? categoryFilter.value : "All";

    const filtered = allProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchValue) ||
        product.description.toLowerCase().includes(searchValue);
      const matchesCategory = categoryValue === "All" || product.category === categoryValue;
      return matchesSearch && matchesCategory;
    });

    displayProducts(filtered);
  };

  if (searchInput) searchInput.addEventListener("input", filterProducts);
  if (categoryFilter) categoryFilter.addEventListener("change", filterProducts);
}

// ---------- CART ----------
async function addToCart(productId) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please log in first to add items to cart.");
    window.location.href = "login.html";
    return;
  }

  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  let cartItems = [];

  if (cartSnap.exists()) {
    cartItems = cartSnap.data().items || [];
  }

  const existingItem = cartItems.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({ productId, quantity: 1 });
  }

  await setDoc(cartRef, { items: cartItems });
  alert("Item added to cart.");
}

async function loadCart(userId) {
  if (!cartContainer || !cartTotal) return;

  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);

  cartContainer.innerHTML = "";
  let total = 0;

  if (!cartSnap.exists() || !cartSnap.data().items.length) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "Total: R0.00";
    return;
  }

  const items = cartSnap.data().items;

  for (const item of items) {
    const productRef = doc(db, "products", item.productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const product = productSnap.data();
      const price = Number(product.price) || 0;
      const itemTotal = price * item.quantity;
      total += itemTotal;

      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item", "fade-in-up");

      cartItem.innerHTML = `
        <div>
          <h4>${product.name}</h4>
          <p>Price: R${price.toFixed(2)}</p>
          <p>Subtotal: R${itemTotal.toFixed(2)}</p>
        </div>
        <div class="cart-controls">
          <button class="qty-btn decrease-btn" data-id="${item.productId}">-</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn increase-btn" data-id="${item.productId}">+</button>
          <button class="remove-btn" data-id="${item.productId}">Remove</button>
        </div>
      `;

      cartContainer.appendChild(cartItem);
    }
  }

  cartTotal.textContent = `Total: R${total.toFixed(2)}`;

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id, userId));
  });

  document.querySelectorAll(".increase-btn").forEach((btn) => {
    btn.addEventListener("click", () => updateQuantity(btn.dataset.id, userId, 1));
  });

  document.querySelectorAll(".decrease-btn").forEach((btn) => {
    btn.addEventListener("click", () => updateQuantity(btn.dataset.id, userId, -1));
  });
}

async function updateQuantity(productId, userId, change) {
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  if (!cartSnap.exists()) return;

  let items = cartSnap.data().items || [];
  const target = items.find((item) => item.productId === productId);

  if (target) {
    target.quantity += change;
    if (target.quantity <= 0) {
      items = items.filter((item) => item.productId !== productId);
    }
  }

  await setDoc(cartRef, { items });
  loadCart(userId);
}

async function removeFromCart(productId, userId) {
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);

  if (!cartSnap.exists()) return;

  let items = cartSnap.data().items || [];
  items = items.filter((item) => item.productId !== productId);

  await setDoc(cartRef, { items });
  loadCart(userId);
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    alert("Thank you for your purchase! 🎉");
  });
}

// ---------- ADMIN PANEL ----------
if (adminProductForm) {
  adminProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      adminMessage.textContent = "Please log in first.";
      return;
    }

    if (user.email !== ADMIN_EMAIL) {
      adminMessage.textContent = `Access denied. Change ADMIN_EMAIL in app.js to ${user.email} if this is your admin account.`;
      return;
    }

    const name = document.getElementById("adminName").value.trim();
    const price = Number(document.getElementById("adminPrice").value);
    const category = document.getElementById("adminCategory").value.trim();
    const description = document.getElementById("adminDescription").value.trim();
    const imageURL = document.getElementById("adminImageURL").value.trim();

    try {
      await addDoc(collection(db, "products"), {
        name,
        price,
        category,
        description,
        imageURL
      });

      adminMessage.textContent = "Product added successfully.";
      adminProductForm.reset();
    } catch (error) {
      console.error("Admin add product error:", error);
      adminMessage.textContent = "Could not add product. Please try again.";
    }
  });
}

loadProducts();
