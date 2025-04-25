

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBbrt0Wb9NIDajEbm151QNAFp_eZ0LnO6Y",
  authDomain: "food-2868c.firebaseapp.com",
  projectId: "food-2868c",
  storageBucket: "food-2868c.appspot.com",
  messagingSenderId: "925211173677",
  appId: "1:925211173677:web:4038daee9180d9121b69a4",
  measurementId: "G-YY73WWGYQC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Routing
onAuthStateChanged(auth, (user) => {
  const path = location.pathname;
  if (user && (path.endsWith("index.html") || path.endsWith("login.html"))) {
    location.href = "userDashboard.html";
  } else if (!user && (path.includes("user") || path.includes("cart"))) {
    location.href = "login.html";
  }
});

// Signup
window.handleSignup = async function () {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const country = document.getElementById("country").value;
  const city = document.getElementById("city").value;
  const role = document.getElementById("role").value;

  if (!role) return Swal.fire("Please select a role");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    await addDoc(collection(db, role === "admin" ? "Admins" : "Users"), {
      uid: userId,
      name,
      email,
      country,
      city,
      role,
      createdAt: new Date(),
    });

    Swal.fire("Success", `Welcome, ${role}`, "success").then(() => {
      location.href = role === "admin" ? "admin.html" : "userhome.html";
    });
  } catch (err) {
    Swal.fire("Signup Error", err.message, "error");
  }
};

// Login
window.handleLogin = async function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userSnap = await getDocs(query(collection(db, "Users"), where("uid", "==", uid)));
    const adminSnap = await getDocs(query(collection(db, "Admins"), where("uid", "==", uid)));

    if (!userSnap.empty) {
      Swal.fire("Welcome!", "Logged in as User", "success").then(() => {
        location.href = "userhome.html";
      });
    } else if (!adminSnap.empty) {
      Swal.fire("Welcome!", "Logged in as Admin", "success").then(() => {
        location.href = "admin.html";
      });
    } else {
      Swal.fire("Access Denied", "Role not assigned", "error");
    }
  } catch (err) {
    Swal.fire("Login Failed", err.message, "error");
  }
};

// Logout
window.logoutUser = function () {
  signOut(auth)
    .then(() => Swal.fire("Logged Out", "See you again!", "success").then(() => (location.href = "login.html")))
    .catch((e) => Swal.fire("Error", e.message, "error"));
};

// Product Display (User)
let userDiv = document.getElementById("userDiv");
window.showProductsToUsers = async function () {
  if (!userDiv) return;
  userDiv.innerHTML = "";

  const snapshot = await getDocs(collection(db, "Products"));
  snapshot.forEach((doc) => {
    const d = doc.data();
    userDiv.innerHTML += `
      <div class="card m-3 shadow" style="width: 18rem;">
        <img src="${d.image}" class="card-img-top" />
        <div class="card-body">
          <h5 class="card-title">${d.name}</h5>
          <p>${d.description}</p>
          <h6 class="text-success">Rs. ${d.price}</h6>
          <!-- Only Add to Cart button here -->
          <button class="btn btn-primary w-100 my-2" onclick='addtocart("${doc.id}", "${d.name}", "${d.price}", "${d.description}", "${d.image}")'>
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
};

if (userDiv) showProductsToUsers();



// Cart Logic
let cartBadge = document.getElementById("cart-badge");
let showCart = document.getElementById("showCart");
window.readCartItems = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const showCart = document.getElementById("showCart");
  const cartBadge = document.getElementById("cartBadge");
  if (!showCart && !cartBadge) return;

  const q = query(collection(db, "Carts"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  let cartCount = 0;
  let totalPrice = 0;

  if (showCart) showCart.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const id = docSnap.id;
    const quantity = d.Quantity || 1;
    const price = parseFloat(d.price) || 0;
    const subtotal = quantity * price;

    cartCount += quantity;
    totalPrice += subtotal;

    if (showCart) {
      showCart.innerHTML += `
        <div class="card m-2 shadow" style="width: 22rem;">
          <img src="${d.image}" class="card-img-top" style="height: 180px; object-fit: cover;">
          <div class="card-body">
            <h5>${d.name}</h5>
            <p>${d.description}</p>
            <p><strong>Price:</strong> Rs. ${price}</p>
            <p>
              <strong>Quantity:</strong>
              <button class="btn btn-sm btn-warning" onclick="updateQuantity('${id}', ${quantity - 1})">−</button>
              <span class="mx-2">${quantity}</span>
              <button class="btn btn-sm btn-success" onclick="updateQuantity('${id}', ${quantity + 1})">+</button>
            </p>
            <p><strong>Subtotal:</strong> Rs. ${subtotal.toFixed(2)}</p>
            <button class="btn btn-danger w-100" onclick="confirmDelete('${id}')">Delete</button>
          </div>
        </div>
      `;
    }
  });

  if (cartBadge) {
    cartBadge.innerHTML = cartCount;
    cartBadge.classList.remove("visually-hidden");
  }

  if (showCart && totalPrice > 0) {
    showCart.innerHTML += `
      <div class="text-end px-2">
        <h5>Total Price: <span class="text-success">Rs. ${totalPrice.toFixed(2)}</span></h5>
      </div>
    `;
  }
};
window.confirmDelete = async function (id) {
  const confirm = await Swal.fire({
    title: 'Delete Item?',
    text: 'Are you sure you want to remove this item from the cart?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
  });

  if (confirm.isConfirmed) {
    await deleteCartItem(id);
  }
};
window.deleteCartItem = async function (id) {
  await deleteDoc(doc(db, "Carts", id));
  readCartItems();
};

window.addtocart = async function (id, name, price, des, image) {
  await addDoc(collection(db, "Carts"), {
    id,
    name,
    price,
    description: des,
    image,
    Quantity: 1
  });
  Swal.fire("Added", `${name} added to cart`, "success");
  readCartItems();
};



window.updateQuantity = async function (id, qty) {
  if (qty < 1) {
    await deleteDoc(doc(db, "Carts", id));
    Swal.fire("Removed", "Item removed from cart", "info");
  } else {
    await updateDoc(doc(db, "Carts", id), { Quantity: qty });
  }
  readCartItems();
};





window.deleteCartItem = async function (id) {
  await deleteDoc(doc(db, "Carts", id));
  readCartItems();
};

// Admin Product Panel
window.saveProduct = async function () {
  const name = document.getElementById("p-name").value;
  const description = document.getElementById("p-desc").value;
  const price = document.getElementById("p-price").value;
  const image = document.getElementById("p-img").value;
  const productIdEdit = document.getElementById("productIdEdit").value;

  if (productIdEdit) {
    await updateDoc(doc(db, "Products", productIdEdit), { name, description, price, image });
    Swal.fire("Updated", "Product updated", "success");
  } else {
    await addDoc(collection(db, "Products"), { name, description, price, image });
    Swal.fire("Created", "Product added", "success");
  }

  ["p-name", "p-desc", "p-price", "p-img", "productIdEdit"].forEach(id => document.getElementById(id).value = "");
  const modal = bootstrap.Modal.getInstance(document.getElementById("addProductModal"));
  modal.hide();
  getProductList();
};

window.getProductList = async function () {
  const list = document.getElementById("product-list");
  if (!list) return;
  list.innerHTML = "";
  const snapshot = await getDocs(collection(db, "Products"));
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    list.innerHTML += `
      <div class="col-md-4">
        <div class="card mb-3">
          <img src="${d.image}" class="card-img-top" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <h5>${d.name}</h5>
            <p>${d.description}</p>
            <p><strong>Rs. ${d.price}</strong></p>
            <button class="btn btn-warning btn-sm" onclick="editProduct('${docSnap.id}', '${d.name}', '${d.description}', '${d.price}', '${d.image}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${docSnap.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  });
};
getProductList();

window.editProduct = function (id, name, desc, price, img) {
  document.getElementById("productIdEdit").value = id;
  document.getElementById("p-name").value = name;
  document.getElementById("p-desc").value = desc;
  document.getElementById("p-price").value = price;
  document.getElementById("p-img").value = img;
  new bootstrap.Modal(document.getElementById("addProductModal")).show();
};

window.deleteProduct = async function (id) {
  await deleteDoc(doc(db, "Products", id));
  Swal.fire("Deleted", "Product removed", "success");
  getProductList();
};


window.addtocart = async function (id, name, price, des, image) {
  const user = auth.currentUser;
  if (!user) return Swal.fire("Error", "User not logged in", "error");

  const q = query(collection(db, "Carts"), where("uid", "==", user.uid), where("id", "==", id));
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(collection(db, "Carts"), {
      uid: user.uid,
      id,
      name,
      price,
      description: des,
      image,
      Quantity: 1
    });
    Swal.fire("Added", `${name} added to cart`, "success");
  } else {
    const existing = snap.docs[0];
    const currentQty = existing.data().Quantity || 1;
    await updateDoc(doc(db, "Carts", existing.id), { Quantity: currentQty + 1 });
    Swal.fire("Updated", `Increased quantity of ${name}`, "success");
  }

  readCartItems();
};


window.readCartItems = async function () {
  if (!showCart && !cartBadge) return;

  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "Carts"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  let cartCount = 0;
  if (showCart) showCart.innerHTML = "";

  snapshot.forEach((doc) => {
    const d = doc.data();
    cartCount += d.Quantity || 1;
    if (showCart) {
      showCart.innerHTML += `
        <div class="card m-2 shadow" style="width: 22rem;">
          <img src="${d.image}" class="card-img-top">
          <div class="card-body">
            <h5>${d.name}</h5>
            <p>${d.description}</p>
            <h6>Rs. ${d.price}</h6>
            <div>Qty:
              <button class="btn btn-sm btn-warning" onclick="updateQuantity('${doc.id}', ${d.Quantity - 1})">-</button>
              ${d.Quantity}
              <button class="btn btn-sm btn-success" onclick="updateQuantity('${doc.id}', ${d.Quantity + 1})">+</button>
            </div>
            <button class="btn btn-danger mt-2" onclick="deleteCartItem('${doc.id}')">Remove</button>
          </div>
        </div>`;
    }
  });

  if (cartBadge) {
    cartBadge.classList.remove("visually-hidden");
    cartBadge.innerHTML = cartCount;
  }
};

window.logoutAdmin = function () {
  signOut(auth)
    .then(() => {
      Swal.fire("Logged Out", "You have been logged out successfully.", "success").then(() => {
        window.location.href = "login.html";
      });
    })
    .catch((error) => {
      Swal.fire("Logout Error", error.message, "error");
    });
};

window.removeFromCartByProductId = async function (productId) {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "Carts"), where("uid", "==", user.uid), where("id", "==", productId));
  const snap = await getDocs(q);
  snap.forEach(async (docSnap) => {
    const data = docSnap.data();
    if (data.Quantity > 1) {
      await updateDoc(doc(db, "Carts", docSnap.id), {
        Quantity: data.Quantity - 1
      });
    } else {
      await deleteDoc(doc(db, "Carts", docSnap.id));
    }
  });

  readCartItems();
};
