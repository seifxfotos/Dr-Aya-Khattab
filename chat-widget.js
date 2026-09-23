(function () {
    // 1. تحميل مكتبات الفايربيس تلقائياً في الخلفية بأمان تان
    function loadFirebaseSDK(callback) {
        if (typeof firebase !== 'undefined') {
            callback();
            return;
        }
        const scriptApp = document.createElement('script');
        scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
        scriptApp.onload = function() {
            const scriptDb = document.createElement('script');
            scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
            scriptDb.onload = callback;
            document.head.appendChild(scriptDb);
        };
        document.head.appendChild(scriptApp);
    }

    loadFirebaseSDK(function() {
        // 2. إضافة تصميم الشات (CSS) إذا لم يكن موجوداً
        if (!document.getElementById('clinic-chat-styles')) {
            const style = document.createElement('style');
            style.id = 'clinic-chat-styles';
            style.innerHTML = `
                .chat-toggle-btn { position: fixed; bottom: 25px; right: 25px; z-index: 99999; background: linear-gradient(135deg, var(--primary-blue, #0093D0), var(--primary-green, #8CC63F)); color: white; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; box-shadow: 0 5px 20px rgba(0,0,0,0.2); font-size: 24px; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
                .chat-toggle-btn:hover { transform: scale(1.1); }
                .chat-badge { position: absolute; top: -5px; right: -5px; background-color: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; font-weight: 800; display: none; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); animation: pulseBadge 1.5s infinite; }
                @keyframes pulseBadge { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }

                .chat-box-wrapper { position: fixed; bottom: 95px; right: 25px; width: 380px; max-width: 90vw; height: 500px; background: var(--chat-bg, #e5ded8); border: 1px solid var(--glass-border, rgba(255,255,255,0.5)); border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); z-index: 99999; display: none; flex-direction: column; overflow: hidden; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: bottom right; }
                :root[data-theme="dark"] .chat-box-wrapper { --chat-bg: #0b141a; }
                .chat-box-wrapper.fullscreen { bottom: 0 !important; right: 0 !important; width: 100vw !important; height: 100vh !important; max-width: 100vw !important; border-radius: 0; z-index: 999999; }
                .chat-box-wrapper.fullscreen .chat-messages { padding: 30px 10vw; }
                .chat-box-wrapper.fullscreen .msg-text-content { font-size: 17px; }
                .chat-box-wrapper.fullscreen .message-content { padding: 12px 18px; }
                
                .chat-header { background: var(--primary-blue, #0093D0); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 10; }
                .header-controls { display: flex; align-items: center; gap: 10px; }
                .chat-header select { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); color: white; padding: 4px 10px; border-radius: 8px; font-family: 'Cairo'; font-size: 13px; font-weight: 600; outline: none; cursor: pointer; transition: 0.3s; }
                .chat-header select option { background: var(--card-bg, #fff); color: var(--text-dark, #333); }
                .icon-btn { background: rgba(255,255,255,0.15); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.3s; }
                .icon-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }

                .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; scroll-behavior: smooth;}
                .message-row { display: flex; flex-direction: column; margin-bottom: 15px; width: 100%; position: relative; }
                .message-row.doctor { align-items: flex-start; } 
                .message-row.reception { align-items: flex-end; } 
                .msg-flex { display: flex; align-items: center; gap: 8px; max-width: 85%; }
                .msg-flex.reception { flex-direction: row-reverse; } 

                .message-content { padding: 8px 14px; border-radius: 12px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
                .message-content::before { content: ""; position: absolute; top: 0; border: 10px solid transparent; }
                .message-content.doctor { background: var(--primary-blue, #0093D0); color: white; border-top-right-radius: 0; }
                .message-content.doctor::before { right: -10px; border-top-color: var(--primary-blue, #0093D0); border-left-color: var(--primary-blue, #0093D0); }
                .message-content.reception { background: var(--primary-green, #8CC63F); color: white; border-top-left-radius: 0; }
                .message-content.reception::before { left: -10px; border-top-color: var(--primary-green, #8CC63F); border-right-color: var(--primary-green, #8CC63F); }

                .sender-name { font-size: 11px; font-weight: 800; margin-bottom: 2px; opacity: 0.9; }
                .msg-text-content { font-size: 14.5px; line-height: 1.5; word-break: break-word; }
                .msg-edited-tag { font-size: 10px; opacity: 0.7; font-style: italic; margin-right: 6px; }

                .msg-actions { display: flex; gap: 5px; opacity: 0; visibility: hidden; transition: 0.2s ease; }
                .msg-flex:hover .msg-actions { opacity: 1; visibility: visible; }
                .msg-actions button { background: var(--card-bg, #fff); color: var(--text-dark, #333); border: 1px solid var(--glass-border, #ccc); width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 11px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: 0.2s; }
                .msg-actions button:hover { background: var(--primary-blue, #0093D0); color: white; transform: scale(1.1); border-color: transparent;}
                .msg-actions button.delete-btn:hover { background: #e74c3c; color: white; }

                .message-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; margin-top: 4px; opacity: 0.6; padding: 0 5px; color: var(--text-dark, #333); font-weight: 600;}
                .msg-status i { font-size: 13px; }
                .msg-status i.fa-check-double { color: #3498db; opacity: 1; text-shadow: 0 0 1px rgba(0,0,0,0.1); }
                .msg-status i.fa-check { opacity: 0.8; }

                .chat-input-area { padding: 12px 15px; background: var(--card-bg, #fff); display: flex; gap: 10px; border-top: 1px solid var(--glass-border, #ccc); align-items: center; position: relative; z-index: 10; }
                .chat-input-area input { flex: 1; padding: 12px 20px; border: 1px solid var(--glass-border, #ccc); border-radius: 25px; font-family: 'Cairo'; font-size: 14.5px; outline: none; background: var(--bg-color, #f4f7f6); color: var(--text-dark, #333); box-shadow: inset 0 2px 5px rgba(0,0,0,0.02); transition: 0.3s; }
                .chat-input-area input:focus { border-color: var(--primary-blue, #0093D0); box-shadow: 0 0 8px rgba(0, 147, 208, 0.2); }
                .send-btn { background: linear-gradient(135deg, var(--primary-blue, #0093D0), var(--primary-green, #8CC63F)); color: white; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 16px; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
                .send-btn:hover { transform: scale(1.08) rotate(-10deg); }
                .send-btn.edit-mode { background: #f39c12; transform: none; }
                .cancel-edit-btn { position: absolute; top: -35px; right: 15px; background: #e74c3c; color: white; border: none; border-radius: 12px; padding: 5px 12px; font-family: 'Cairo'; font-size: 12px; font-weight: 700; cursor: pointer; display: none; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.2s; }
                .cancel-edit-btn:hover { transform: translateY(-2px); }
            `;
            document.head.appendChild(style);
        }

        // 3. إضافة هيكل الشات (HTML) إذا لم يكن موجوداً
        if (!document.getElementById('chatBox')) {
            const chatHTML = `
                <button class="chat-toggle-btn" onclick="toggleChat()" title="محادثة عيادة د.آية">
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
                            <select id="userRole" onchange="changeUserRole()">
                                <option value="reception">الريسبشن</option>
                                <option value="doctor">د. آية خطاب</option>
                            </select>
                            <button class="icon-btn" onclick="toggleFullScreen()" title="تكبير/تصغير الشات">
                                <i id="fullscreenIcon" class="fa-solid fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <div style="text-align:center; opacity:0.5; margin-top:80px; font-weight: bold;">جاري الاتصال بالسيرفر...</div>
                    </div>
                    <div class="chat-input-area">
                        <button class="cancel-edit-btn" id="cancelEditBtn" onclick="cancelEdit()"><i class="fa-solid fa-xmark"></i> إلغاء التعديل</button>
                        <input type="text" id="chatInput" placeholder="اكتب رسالتك هنا..." onkeypress="handleKeyPress(event)">
                        <button class="send-btn" id="sendBtn" onclick="sendMessage()" title="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            `;
            const div = document.createElement('div');
            div.innerHTML = chatHTML;
            document.body.appendChild(div);
        }

        // 4. إعدادات الفايربيس والمنطق البرمجي العام
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

        window.playNotificationSound = function() {
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
        };

        window.chatMessagesData = window.chatMessagesData || [];
        window.editingMsgId = window.editingMsgId || null;
        let isWindowFocused = document.hasFocus();
        let initialLoadDone = false;

        window.addEventListener('focus', () => { isWindowFocused = true; checkAndMarkSeen(); });
        window.addEventListener('blur', () => { isWindowFocused = false; });

        window.toggleFullScreen = function() {
            const chatBox = document.getElementById('chatBox');
            const icon = document.getElementById('fullscreenIcon');
            if(!chatBox) return;
            chatBox.classList.toggle('fullscreen');
            if (chatBox.classList.contains('fullscreen')) {
                icon.classList.replace('fa-expand', 'fa-compress');
            } else {
                icon.classList.replace('fa-compress', 'fa-expand');
            }
            setTimeout(scrollToBottom, 300);
        };

        window.toggleChat = function() {
            const box = document.getElementById('chatBox');
            if(!box) return;
            const isHidden = box.style.display !== 'flex';
            box.style.display = isHidden ? 'flex' : 'none';
            if(isHidden) {
                const badge = document.getElementById('chatBadge');
                if(badge) badge.style.display = 'none';
                localStorage.setItem('last_seen_msg_count', window.chatMessagesData.length);
                scrollToBottom();
                checkAndMarkSeen();
            }
        };

        window.changeUserRole = function() {
            const roleElem = document.getElementById('userRole');
            if(roleElem) {
                localStorage.setItem('chat_current_role', roleElem.value);
                renderMessages(window.chatMessagesData);
            }
        };

        if (!window.chatListenerActive) {
            window.chatListenerActive = true;
            let savedRole = localStorage.getItem('chat_current_role') || 'reception';
            const roleSelect = document.getElementById('userRole');
            if(roleSelect) roleSelect.value = savedRole;

            chatRef.on('value', (snapshot) => {
                const data = snapshot.val();
                let newMessages = [];
                for (let key in data) { newMessages.push({ id: key, ...data[key] }); }

                if (initialLoadDone && newMessages.length > window.chatMessagesData.length) {
                    let lastMsg = newMessages[newMessages.length - 1];
                    let currentRole = roleSelect ? roleSelect.value : 'reception';
                    if (lastMsg && lastMsg.role !== currentRole) {
                        if (typeof window.playNotificationSound === 'function') window.playNotificationSound();
                    }
                }

                window.chatMessagesData = newMessages;
                initialLoadDone = true;
                renderMessages(window.chatMessagesData);
                checkAndMarkSeen();
            });
        }

        function checkAndMarkSeen() {
            const isBoxOpen = document.getElementById('chatBox')?.style.display === 'flex';
            const currentRole = document.getElementById('userRole')?.value || 'reception';
            if (isBoxOpen && isWindowFocused && window.chatMessagesData.length > 0) {
                let updates = {};
                let hasUpdates = false;
                window.chatMessagesData.forEach(msg => {
                    if (msg.role !== currentRole && msg.status !== 'seen') {
                        updates[`${msg.id}/status`] = 'seen';
                        hasUpdates = true;
                    }
                });
                if (hasUpdates) chatRef.update(updates);
            }
        }

        function renderMessages(messages) {
            const container = document.getElementById('chatMessages');
            if(!container) return;
            let isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 80;
            const currentRole = document.getElementById('userRole')?.value || 'reception';
            const isBoxOpen = document.getElementById('chatBox')?.style.display === 'flex';

            container.innerHTML = '';
            if(messages.length === 0) {
                container.innerHTML = '<div style="text-align:center; opacity:0.5; margin-top:80px; font-weight:bold;">رسايل العيادة هتبدأ هنا.. صباح الخير! <i class="fa-solid fa-mug-hot"></i></div>';
                return;
            }

            messages.forEach(msg => {
                let isMe = msg.role === currentRole;
                let senderTitle = msg.role === 'doctor' ? 'د. آية خطاب' : 'الريسبشن';
                let statusIcon = isMe ? (msg.status === 'seen' ? '<i class="fa-solid fa-check-double"></i>' : '<i class="fa-solid fa-check"></i>') : '';
                let statusClass = msg.status === 'seen' ? 'seen' : '';
                let actionsHtml = isMe ? `<div class="msg-actions"><button onclick="startEdit('${msg.id}', '${(msg.text || '').replace(/'/g, "\\'")}')" title="تعديل"><i class="fa-solid fa-pen"></i></button><button class="delete-btn" onclick="deleteMessage('${msg.id}')" title="حذف"><i class="fa-solid fa-trash"></i></button></div>` : '';
                let editedTag = msg.edited ? '<span class="msg-edited-tag">(معدلة)</span>' : '';

                let div = document.createElement('div');
                div.className = `message-row ${msg.role}`;
                div.innerHTML = `
                    <div class="msg-flex ${msg.role}">
                        <div class="message-content ${msg.role}">
                            <div class="sender-name">${senderTitle}</div>
                            <div class="msg-text-content">${msg.text}</div> ${editedTag}
                        </div>
                        ${actionsHtml}
                    </div>
                    <div class="message-meta">
                        <span class="msg-time">${msg.time || ''}</span>
                        <span class="msg-status ${statusClass}">${statusIcon}</span>
                    </div>
                `;
                container.appendChild(div);
            });

            let lastSeenCount = parseInt(localStorage.getItem('last_seen_msg_count') || '0');
            const badge = document.getElementById('chatBadge');

            if (badge && !isBoxOpen && messages.length > lastSeenCount) {
                let lastMsg = messages[messages.length - 1];
                if (lastMsg && lastMsg.role !== currentRole) {
                    let newUnreadCount = messages.length - lastSeenCount;
                    badge.innerText = newUnreadCount > 9 ? '9+' : newUnreadCount;
                    badge.style.display = 'flex';
                }
            } else if (badge && isBoxOpen) {
                badge.style.display = 'none';
                localStorage.setItem('last_seen_msg_count', messages.length);
            }

            if (isAtBottom) scrollToBottom();
        }

        window.sendMessage = function() {
            const input = document.getElementById('chatInput');
            if(!input) return;
            const text = input.value.trim();
            if(!text) return;
            const role = document.getElementById('userRole')?.value || 'reception';
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            input.value = '';

            if (window.editingMsgId) {
                chatRef.child(window.editingMsgId).update({ text: text, edited: true });
                window.cancelEdit(); 
            } else {
                const newMsgRef = chatRef.push();
                newMsgRef.set({ role: role, time: timeStr, text: text, status: 'sent', edited: false, timestamp: firebase.database.ServerValue.TIMESTAMP });
            }
            scrollToBottom();
        };

        window.startEdit = function(id, oldText) {
            window.editingMsgId = id;
            const input = document.getElementById('chatInput');
            if(!input) return;
            input.value = oldText; input.focus();
            const sendBtn = document.getElementById('sendBtn');
            if(sendBtn) {
                sendBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; 
                sendBtn.classList.add('edit-mode');
            }
            const cancelBtn = document.getElementById('cancelEditBtn');
            if(cancelBtn) cancelBtn.style.display = 'block';
        };

        window.cancelEdit = function() {
            window.editingMsgId = null; 
            const input = document.getElementById('chatInput');
            if(input) input.value = '';
            const sendBtn = document.getElementById('sendBtn');
            if(sendBtn) {
                sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; 
                sendBtn.classList.remove('edit-mode');
            }
            const cancelBtn = document.getElementById('cancelEditBtn');
            if(cancelBtn) cancelBtn.style.display = 'none';
        };

        window.deleteMessage = function(id) { if (confirm('هل أنت متأكد من مسح هذه الرسالة للطرفين؟')) chatRef.child(id).remove(); };
        window.handleKeyPress = function(e) { if (e.key === 'Enter') window.sendMessage(); };
        window.scrollToBottom = function() { 
            const container = document.getElementById('chatMessages'); 
            if(container) container.scrollTop = container.scrollHeight; 
        };
    });
})();
