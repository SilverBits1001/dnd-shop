import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js';
import { getFirestore, doc, collection, onSnapshot, updateDoc, setDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyClYQkzN0P-IfNmNWsxqGQgdIBKTByp4OA',
  authDomain: 'dnd-shop-9f8b5.firebaseapp.com',
  projectId: 'dnd-shop-9f8b5',
  storageBucket: 'dnd-shop-9f8b5.appspot.com',
  messagingSenderId: '521946542888',
  appId: '1:521946542888:web:94c9dc19f0dc480bdf1ba5'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const state = {
  uid: null,
  campaignId: null,
  members: [],
  characters: [],
  notes: [],
  carts: {}
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    state.uid = user.uid;
  } else {
    await signInAnonymously(auth);
  }
});

async function joinCampaign() {
  const id = document.getElementById('campaign-id-input').value.trim();
  if (!id || !state.uid) return;
  state.campaignId = id;
  document.getElementById('join-campaign').classList.add('hidden');
  document.getElementById('campaign-view').classList.remove('hidden');

  const memberRef = doc(db, 'campaigns', id, 'members', state.uid);
  await setDoc(memberRef, { displayName: 'Anon', online: true, lastActive: serverTimestamp() }, { merge: true });
  window.addEventListener('beforeunload', () => {
    updateDoc(memberRef, { online: false, lastActive: serverTimestamp() });
  });

  onSnapshot(doc(db, 'campaigns', id), (snap) => {
    if (snap.exists()) {
      document.getElementById('campaign-name').textContent = snap.data().name || 'Untitled';
    }
  });

  onSnapshot(collection(db, 'campaigns', id, 'members'), (snap) => {
    state.members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMembers();
  });

  onSnapshot(collection(db, 'campaigns', id, 'characters'), (snap) => {
    state.characters = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCharacters();
  });

  onSnapshot(collection(db, 'campaigns', id, 'notes'), (snap) => {
    state.notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderNotes();
  });

  onSnapshot(collection(db, 'campaigns', id, 'carts'), (snap) => {
    state.carts = {};
    snap.forEach(docSnap => state.carts[docSnap.id] = docSnap.data());
    renderCarts();
  });
}

document.getElementById('join-btn').addEventListener('click', joinCampaign);

document.getElementById('add-note-btn').addEventListener('click', async () => {
  if (!state.campaignId) return;
  const notesCol = collection(db, 'campaigns', state.campaignId, 'notes');
  await addDoc(notesCol, { title: 'New Note', md: '', visibleTo: [], authorUid: state.uid, createdAt: serverTimestamp() });
});

function renderMembers() {
  const ul = document.getElementById('members-list');
  ul.innerHTML = '';
  state.members.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m.displayName || m.id;
    li.className = m.online ? '' : 'text-gray-400';
    ul.appendChild(li);
  });
}

function renderCharacters() {
  const container = document.getElementById('characters-list');
  container.innerHTML = '';
  state.characters.forEach(ch => {
    const div = document.createElement('div');
    div.className = 'border p-2 mb-2';
    const hp = ch.stats?.hp ?? 0;
    div.innerHTML = `
      <div class="font-bold">${ch.name || 'Unnamed'}</div>
      <label class="text-sm">HP: <input type="number" class="hp-input border p-1" data-id="${ch.id}" value="${hp}"></label>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('.hp-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const value = parseInt(e.target.value, 10);
      const charRef = doc(db, 'campaigns', state.campaignId, 'characters', id);
      await updateDoc(charRef, { 'stats.hp': value });
    });
  });
}

let noteTimers = {};
function renderNotes() {
  const container = document.getElementById('notes-list');
  container.innerHTML = '';
  state.notes.forEach(n => {
    const div = document.createElement('div');
    div.className = 'border p-2 mb-2';
    div.innerHTML = `
      <input type="text" class="note-title border p-1 w-full mb-1" data-id="${n.id}" value="${n.title || ''}">
      <textarea class="note-md border p-1 w-full" data-id="${n.id}">${n.md || ''}</textarea>
      <div class="text-xs text-gray-500 mt-1" id="status-${n.id}">Saved</div>
    `;
    container.appendChild(div);
  });
  container.querySelectorAll('.note-title, .note-md').forEach(el => {
    el.addEventListener('input', handleNoteInput);
  });
}

function handleNoteInput(e) {
  const id = e.target.dataset.id;
  const statusEl = document.getElementById(`status-${id}`);
  statusEl.textContent = 'Saving...';
  clearTimeout(noteTimers[id]);
  noteTimers[id] = setTimeout(async () => {
    const title = document.querySelector(`.note-title[data-id="${id}"]`).value;
    const md = document.querySelector(`.note-md[data-id="${id}"]`).value;
    const noteRef = doc(db, 'campaigns', state.campaignId, 'notes', id);
    await setDoc(noteRef, { title, md, authorUid: state.uid, updatedAt: serverTimestamp() }, { merge: true });
    statusEl.textContent = navigator.onLine ? 'Saved' : 'Offline';
  }, 500);
}

function renderCarts() {
  const container = document.getElementById('carts-summary');
  container.innerHTML = '';
  Object.entries(state.carts).forEach(([uid, cart]) => {
    const div = document.createElement('div');
    const items = (cart.items || []).map(it => `${it.shopItemId} x${it.qty}`).join(', ');
    div.textContent = `${uid}: ${items}`;
    container.appendChild(div);
  });
}

export {}
