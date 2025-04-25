import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const views = {
  waiting: document.getElementById("waiting-room"),
  form: document.getElementById("form-view"),
  chat: document.getElementById("chat-view")
};

function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  views[viewName].classList.add("active");
}

let currentTicketId = null;
let currentTicket = null;

function showChat() {
  const chatLog = document.getElementById("chat-log");
  chatLog.innerHTML = "";
  for (const key in currentTicket) {
    if (key !== "messages") {
      const msg = document.createElement("div");
      msg.textContent = `${key}: ${currentTicket[key]}`;
      chatLog.appendChild(msg);
    }
  }
  showView("chat");
}

function loadChat(id, data) {
  currentTicketId = id;
  currentTicket = data;
  showChat();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("user-name").textContent = user.email;

  const tickets = await getDocs(collection(db, "users", user.uid, "tickets"));
  const list = document.getElementById("ticket-list");
  list.innerHTML = "";
  tickets.forEach(doc => {
    const btn = document.createElement("button");
    btn.className = "ticket-button";
    btn.textContent = doc.data().idea;
    btn.onclick = () => loadChat(doc.id, doc.data());
    list.appendChild(btn);
  });

  document.getElementById("new-ticket-btn").onclick = () => {
    showView("form");
  };
});

document.getElementById("logout-btn").onclick = () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

document.getElementById("tattoo-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    idea: form.idea.value,
    placement: form.placement.value,
    size: form.size.value,
    appointment: form.appointment.value,
    messages: []
  };

  const user = auth.currentUser;
  const docRef = await addDoc(collection(db, "users", user.uid, "tickets"), data);
  currentTicketId = docRef.id;
  currentTicket = data;
  showChat();
});

document.getElementById("chat-send").onclick = async () => {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const msg = document.createElement("div");
  msg.textContent = text;
  document.getElementById("chat-log").appendChild(msg);

  const user = auth.currentUser;
  await setDoc(doc(db, "users", user.uid, "tickets", currentTicketId), {
    ...currentTicket,
    messages: [...(currentTicket.messages || []), { text }]
  });
  input.value = "";
};

document.getElementById("back-btn").onclick = () => {
  window.location.reload();
};
