import {
    getFirestore,
    getDocs,
    collection
  } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
  import {
    initializeApp
  } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
  import {
    getAuth,
    signOut
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
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  window.showAllRestaurants = async function () {
    const list = document.getElementById("restaurant-list");
    list.innerHTML = "";
  
    const querySnapshot = await getDocs(collection(db, "restaurants"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
  
      list.innerHTML += `
        <div class="col-md-4 mb-4">
          <div class="card restaurant-card">
            <img src="${data.image || 'https://via.placeholder.com/300'}" class="card-img-top restaurant-img" />
            <div class="card-body">
              <h5 class="card-title">${data.name}</h5>
              <p class="card-text">${data.address || "No address provided"}</p>
              <a href="userSelectorItems.html?id=${doc.id}" class="btn btn-outline-danger">View Menu</a>
            </div>
          </div>
        </div>
      `;
    });
  };
  
  window.logoutUser = async function () {
    await signOut(auth);
    Swal.fire("Logged out", "You have been logged out successfully.", "success").then(() => {
      window.location.href = "index.html";
    });
  };
  