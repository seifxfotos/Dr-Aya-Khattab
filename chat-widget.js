(function() {
    function loadScript(url, callback) {
        if (document.querySelector(`script[src="${url}"]`)) {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }

    loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js", function() {
        loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js", function() {
            initChatWidget();
        });
    });

    function initChatWidget() {
        try {
            // إنشاء صندوق عزل تام (Shadow DOM) عشان الشات ما يأثرش على أي حاجة في الصفحة
            const host = document.createElement('div');
            host.id = 'clinic-chat-widget-host';
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });

            // حقن الأيقونات والخطوط جوه العزل
            const fontAwesomeLink = document.createElement('link');
            fontAwesomeLink.rel = 'stylesheet';
            fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            shadow.appendChild(fontAwesomeLink);

            const fontCairo = document.createElement('link');
            fontCairo.rel = 'stylesheet';
            fontCairo.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';
            shadow.appendChild(fontCairo);

            const container = document.createElement('div');
            container.innerHTML = `
                <style>
                    * { font-family: 'Cairo', sans-serif; box-sizing: border-box; }
                    .chat-toggle-btn { position: fixed; bottom: 25px; right: 25px; z-index: 10000; background: linear-gradient(135deg, #0093D0, #8CC63F); color: white; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; box-shadow: 0 5px 20px rgba(0,0,0,0.2); font-size: 24px; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
                    .chat-toggle-btn:hover { transform: scale(1.1); }
                    .chat-badge { position: absolute; top: -5px; right: -5px; background-color: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; font-weight: 800; display: none; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); animation: pulseBadge 1.5s infinite; }
                    @keyframes pulseBadge { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }

                    .chat-box-wrapper { position: fixed; bottom: 95px; right: 25px; width: 380px; max-width: 90vw; height: 500px; background: #e5ded8; border: 1px solid rgba(255,255,255,0.5); border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); z-index: 10000; display: none; flex-direction: column; overflow: hidden; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: bottom right; }
                    .chat-box-wrapper.fullscreen { bottom: 0 !important; right: 0 !important; width: 100vw !important; height: 100vh !important; max-width: 100vw !important; border-radius: 0; z-index: 99999; }
                    .chat-box-wrapper.fullscreen .chat-messages { padding: 30px 10vw; }
                    .chat-box-wrapper.fullscreen .msg-text-content { font-size: 17px; }
                    .chat-box-wrapper.fullscreen .message-content { padding: 12px 18px; }
                    
                    .chat-header { background: #0093D0; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 10; }
                    .header-controls { display: flex; align-items: center; gap: 10px; }
                    .chat-header select { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); color: white; padding: 4px 10px; border-radius: 8px; font-family: 'Cairo'; font-size: 13px; font-weight: 600; outline: none; cursor: pointer; transition: 0.3s; }
                    .chat-header select option { background: #fff; color: #333; }
                    .icon-btn { background: rgba(255,255,255,0.15); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.3s; }
                    .icon-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }

                    .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; scroll-behavior: smooth; background: inherit; }
                    .message-row { display: flex; flex-direction: column; margin-bottom: 15px; width: 100%; position: relative; }
                    .message-row.doctor { align-items: flex-start; } 
                    .message-row.reception { align-items: flex-end; } 
                    .msg-flex { display: flex; align-items: center; gap: 8px; max-width: 85%; }
                    .msg-flex.reception { flex-direction: row-reverse; } 

                    .message-content { padding: 8px 14px; border-radius: 12px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
                    .message-content::before { content: ""; position: absolute; top: 0; border: 10px solid transparent; }
                    .message-content.doctor { background: #0093D0; color: white; border-top-right-radius: 0; }
                    .message-content.doctor::before { right: -10px; border-top-color: #0093D0; border-left-color: #0093D0; }
                    .message-content.reception { background: #8CC63F; color: white; border-top-left-radius: 0; }
                    .message-content.reception::before { left: -10px; border-top-color: #8CC63F; border-right-color: #8CC63F; }

                    .sender-name { font-size: 11px; font-weight: 800; margin-bottom: 2px; opacity: 0.9; }
                    .msg-text-content { font-size: 14.5px; line-height: 1.5; word-break: break-word; }
                    .msg-edited-tag { font-size: 10px; opacity: 0.7; font-style: italic; margin-right: 6px; }

                    .msg-actions { display: flex; gap: 5px; opacity: 0; visibility: hidden; transition: 0.2s ease; }
                    .msg-flex:hover .msg-actions { opacity: 1; visibility: visible; }
                    .msg-actions button { background: #fff; color: #333; border: 1px solid #ccc; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 11px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: 0.2s; }
                    .msg-actions button:hover { background: #0093D0; color: white; transform: scale(1.1); border-color: transparent;}
                    .msg-actions button.delete-btn:hover { background: #e74c3c; color: white; }

                    .message-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; margin-top: 4px; opacity: 0.6; padding: 0 5px; color: #333; font-weight: 600;}
                    .msg-status i { font-size: 13px; }
                    .msg-status i.fa-check-double { color: #3498db; opacity: 1; text-shadow: 0 0 1px rgba(0,0,0,0.1); }
                    .msg-status i.fa-check { opacity: 0.8; }

                    .chat-input-area { padding: 12px 15px; background: #fff; display: flex; gap: 10px; border-top: 1px solid #ccc; align-items: center; position: relative; z-index: 10; }
                    .chat-input-area input { flex: 1; padding: 12px 20px; border: 1px solid #ccc; border-radius: 25px; font-family: 'Cairo'; font-size: 14.5px; outline: none; background: #f4f7f6; color: #333; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02); transition: 0.3s; }
                    .chat-input-area input:focus { border-color: #0093D0; box-shadow: 0 0 8px rgba(0, 147, 208, 0.2); }
                    .send-btn { background: linear-gradient(135deg, #0093D0, #8CC63F); color: white; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 16px; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
                    .send-btn:hover { transform: scale(1.08) rotate(-10deg); }
                    .send-btn.edit-mode { background: #f39c12; transform: none; }
                    .cancel-edit-btn { position: absolute; top: -35px; right: 15px; background: #e74c3c; color: white; border: none; border-radius: 12px; padding: 5px 12px; font-family: 'Cairo'; font-size: 12px; font-weight: 700; cursor: pointer; display: none; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.2s; }
                    .cancel-edit-btn:hover { transform: translateY(-2px); }
                </style>
                <button class="chat-toggle-btn" id="toggleBtn" title="محادثة عيادة د.آية">
                    <i class="fa-solid fa-comments"></i>
                    <span class="chat-badge" id="chatBadge">0</span>
                </button>

                <div class="chat-box-wrapper" id="chatBox">
                    <div class="chat-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid fa-clinic-medical" style="font-size: 18px;"></i>
                            <span>محادثة العيادة</span>
                        </div>
                        <div class="header-controls">
                            <select id="userRole">
                                <option value="reception">الريسبشن</option>
                                <option value="doctor">د. آية خطاب</option>
                            </select>
                            <button class="icon-btn" id="fullscreenBtn" title="تكبير/تصغير الشات">
                                <i id="fullscreenIcon" class="fa-solid fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <div style="text-align:center; opacity:0.5; margin-top:80px; font-weight: bold;">جاري الاتصال بالسيرفر...</div>
                    </div>
                    <div class="chat-input-area">
                        <button class="cancel-edit-btn" id="cancelEditBtn"><i class="fa-solid fa-xmark"></i> إلغاء التعديل</button>
                        <input type="text" id="chatInput" placeholder="اكتب رسالتك هنا...">
                        <button class="send-btn" id="sendBtn" title="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            `;
            shadow.appendChild(container);

            const toggleBtn = shadow.getElementById('toggleBtn');
            const chatBox = shadow.getElementById('chatBox');
            const fullscreenBtn = shadow.getElementById('fullscreenBtn');
            const fullscreenIcon = shadow.getElementById('fullscreenIcon');
            const userRoleSelect = shadow.getElementById('userRole');
            const chatInput = shadow.getElementById('chatInput');
            const sendBtn = shadow.getElementById('sendBtn');
            const cancelEditBtn = shadow.getElementById('cancelEditBtn');
            const chatBadge = shadow.getElementById('chatBadge');
            const chatMessages = shadow.getElementById('chatMessages');

            let savedRole = localStorage.getItem('chat_current_role') || 'reception';
            userRoleSelect.value = savedRole;

            userRoleSelect.addEventListener('change', () => {
                localStorage.setItem('chat_current_role', userRoleSelect.value);
                renderMessages(chatMessagesData);
            });

            toggleBtn.addEventListener('click', () => {
                const isHidden = chatBox.style.display !== 'flex';
                chatBox.style.display = isHidden ? 'flex' : 'none';
                if (isHidden) {
                    chatBadge.style.display = 'none';
                    localStorage.setItem('last_seen_msg_count', chatMessagesData.length);
                    scrollToBottom();
                    checkAndMarkSeen();
                }
            });

            fullscreenBtn.addEventListener('click', () => {
                chatBox.classList.toggle('fullscreen');
                if (chatBox.classList.contains('fullscreen')) {
                    fullscreenIcon.classList.replace('fa-expand', 'fa-compress');
                } else {
                    fullscreenIcon.classList.replace('fa-compress', 'fa-expand');
                }
                setTimeout(scrollToBottom, 300);
            });

            cancelEditBtn.addEventListener('click', () => {
                cancelEdit();
            });

            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });

            sendBtn.addEventListener('click', () => {
                sendMessage();
            });

            const firebaseConfig = {
                apiKey: "AIzaSyBqKz2ZljT1UYoLArN3bBjvVbODTWAkIy0",
                authDomain: "clinic-system-fe2e4.firebaseapp.com",
                databaseURL: "https://clinic-system-fe2e4-default-rtdb.firebaseio.com",
                projectId: "clinic-system-fe2e4",
                storageBucket: "clinic-system-fe2e4.firebasestorage.app",
                messagingSenderId: "528745148277",
                appId: "1:528745148277:web:7bc9ccee83463163a52d3c"
            };

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            const database = firebase.database();
            const chatRef = database.ref('clinic_chat');

            function playNotificationSound() {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
                    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.3);
                } catch (e) { }
            }

            let chatMessagesData = [];
            let editingMsgId = null;
            let isWindowFocused = document.hasFocus();
            let initialLoadDone = false;

            window.addEventListener('focus', () => { isWindowFocused = true; checkAndMarkSeen(); });
            window.addEventListener('blur', () => { isWindowFocused = false; });

            chatRef.on('value', (snapshot) => {
                const data = snapshot.val();
                let newMessages = [];
                for (let key in data) { newMessages.push({ id: key, ...data[key] }); }

                if (initialLoadDone && newMessages.length > chatMessagesData.length) {
                    let lastMsg = newMessages[newMessages.length - 1];
                    let currentRole = userRoleSelect.value;
                    if (lastMsg && lastMsg.role !== currentRole) playNotificationSound();
                }

                chatMessagesData = newMessages;
                initialLoadDone = true;
                renderMessages(chatMessagesData);
                checkAndMarkSeen();
            });

            function checkAndMarkSeen() {
                const isBoxOpen = chatBox.style.display === 'flex';
                const currentRole = userRoleSelect.value;
                if (isBoxOpen && isWindowFocused && chatMessagesData.length > 0) {
                    let updates = {};
                    let hasUpdates = false;
                    chatMessagesData.forEach(msg => {
                        if (msg.role !== currentRole && msg.status !== 'seen') {
                            updates[`${msg.id}/status`] = 'seen';
                            hasUpdates = true;
                        }
                    });
                    if (hasUpdates) chatRef.update(updates);
                }
            }

            function renderMessages(messages) {
                let isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 80;
                const currentRole = userRoleSelect.value;
                const isBoxOpen = chatBox.style.display === 'flex';

                chatMessages.innerHTML = '';
                if(messages.length === 0) {
                    chatMessages.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:80px; font-weight:bold;">رسايل العيادة هتبدأ هنا.. صباح الخير! <i class="fa-solid fa-mug-hot"></i></div>';
                    return;
                }

                messages.forEach(msg => {
                    let isMe = msg.role === currentRole;
                    let senderTitle = msg.role === 'doctor' ? 'د. آية خطاب' : 'الريسبشن';
                    let statusIcon = isMe ? (msg.status === 'seen' ? '<i class="fa-solid fa-check-double"></i>' : '<i class="fa-solid fa-check"></i>') : '';
                    let statusClass = msg.status === 'seen' ? 'seen' : '';
                    
                    let div = document.createElement('div');
                    div.className = `message-row ${msg.role}`;
                    
                    let flexDiv = document.createElement('div');
                    flexDiv.className = `msg-flex ${msg.role}`;

                    let contentDiv = document.createElement('div');
                    contentDiv.className = `message-content ${msg.role}`;
                    contentDiv.innerHTML = `
                        <div class="sender-name">${senderTitle}</div>
                        <div class="msg-text-content">${msg.text}</div> ${msg.edited ? '<span class="msg-edited-tag">(معدلة)</span>' : ''}
                    `;
                    flexDiv.appendChild(contentDiv);

                    if (isMe) {
                        let actionsDiv = document.createElement('div');
                        actionsDiv.className = 'msg-actions';
                        
                        let editBtn = document.createElement('button');
                        editBtn.title = 'تعديل';
                        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                        editBtn.addEventListener('click', () => startEdit(msg.id, msg.text));
                        
                        let delBtn = document.createElement('button');
                        delBtn.className = 'delete-btn';
                        delBtn.title = 'حذف';
                        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                        delBtn.addEventListener('click', () => deleteMessage(msg.id));

                        actionsDiv.appendChild(editBtn);
                        actionsDiv.appendChild(delBtn);
                        flexDiv.appendChild(actionsDiv);
                    }

                    div.appendChild(flexDiv);

                    let metaDiv = document.createElement('div');
                    metaDiv.className = 'message-meta';
                    metaDiv.innerHTML = `
                        <span class="msg-time">${msg.time || ''}</span>
                        <span class="msg-status ${statusClass}">${statusIcon}</span>
                    `;
                    div.appendChild(metaDiv);

                    chatMessages.appendChild(div);
                });

                let lastSeenCount = parseInt(localStorage.getItem('last_seen_msg_count') || '0');

                if (!isBoxOpen && messages.length > lastSeenCount) {
                    let lastMsg = messages[messages.length - 1];
                    if (lastMsg && lastMsg.role !== currentRole) {
                        let newUnreadCount = messages.length - lastSeenCount;
                        chatBadge.innerText = newUnreadCount > 9 ? '9+' : newUnreadCount;
                        chatBadge.style.display = 'flex';
                    }
                } else if (isBoxOpen) {
                    chatBadge.style.display = 'none';
                    localStorage.setItem('last_seen_msg_count', messages.length);
                }

                if (isAtBottom) scrollToBottom();
            }

            function sendMessage() {
                const text = chatInput.value.trim();
                if(!text) return;
                const role = userRoleSelect.value;
                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                chatInput.value = '';

                if (editingMsgId) {
                    chatRef.child(editingMsgId).update({ text: text, edited: true });
                    cancelEdit(); 
                } else {
                    const newMsgRef = chatRef.push();
                    newMsgRef.set({ role: role, time: timeStr, text: text, status: 'sent', edited: false, timestamp: firebase.database.ServerValue.TIMESTAMP });
                }
                scrollToBottom();
            }

            function startEdit(id, oldText) {
                editingMsgId = id;
                chatInput.value = oldText; 
                chatInput.focus();
                sendBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; 
                sendBtn.classList.add('edit-mode');
                cancelEditBtn.style.display = 'block';
            }

            function cancelEdit() {
                editingMsgId = null; 
                chatInput.value = '';
                sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
                sendBtn.classList.remove('edit-mode');
                cancelEditBtn.style.display = 'none';
            }

            function deleteMessage(id) { 
                if (confirm('هل أنت متأكد من مسح هذه الرسالة للطرفين؟')) chatRef.child(id).remove(); 
            }

            function scrollToBottom() { 
                chatMessages.scrollTop = chatMessages.scrollHeight; 
            }
        } catch(err) {
            console.error("Chat Widget ShadowDOM Error:", err);
        }
    })();
