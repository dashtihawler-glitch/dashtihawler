import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// 1. Supabase Client Initialization (Exported)
const supabaseUrl = 'https://nfrebhlhndgfxbqxoxzx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmViaGxobmRnZnhicXhveHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE0MTIsImV4cCI6MjA4NjMwNzQxMn0.QnSC5bN_k8vy71_xmaTMWFQGM2PY9qZCpJyLStdDcbs'
export const supabase = createClient(supabaseUrl, supabaseKey)

// 2. Shared Functions
/**
 * Checks if a user is logged in. If not, redirects to the login page.
 * Otherwise, displays the user's email.
 */
async function checkUserSession() {
    // ئەگەر لە لاپەڕەی لاگین بووین، پشکنین مەکە (بۆ ڕێگری لە Loop)
    if (document.querySelector('.login-page')) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Determine the correct path to the login page based on current location
        const isSubFolder = window.location.pathname.includes('/krechi/') || window.location.pathname.includes('/taminat/') || window.location.pathname.includes('/contracts/') || window.location.pathname.includes('/archive/');
        const path = isSubFolder ? '../index.html' : './index.html';
        window.location.href = path;
    } else {
        const userEmailDisplay = document.getElementById('user-email');
        if (userEmailDisplay) {
            const fullName = session.user.user_metadata?.full_name;
            userEmailDisplay.textContent = fullName || session.user.email;
            
            // زیادکردنی تایبەتمەندی گۆڕینی ناو بە کلیک کردن
            userEmailDisplay.style.cursor = 'pointer';
            userEmailDisplay.title = 'کلیک بکە بۆ گۆڕینی ناو';
            userEmailDisplay.onclick = () => {
                // دروستکردنی مۆداڵ بە شێوەی داینامیکی
                const existingModal = document.getElementById('name-update-modal');
                if(existingModal) existingModal.remove();

                const modalHTML = `
                    <div id="name-update-modal" class="modal visible">
                        <div class="modal-content" style="max-width: 400px; text-align: center;">
                            <span class="close-modal">&times;</span>
                            <h3 style="margin-bottom: 20px; color: var(--primary-color);">گۆڕینی ناو</h3>
                            <div class="input-group">
                                <label style="text-align: right;">ناوی سیانی</label>
                                <input type="text" id="new-name-input" value="${fullName || ''}" placeholder="ناوی سیانی بنووسە" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font-family: inherit;">
                            </div>
                            <button id="save-name-btn" class="btn-login" style="margin-top: 20px;">تۆمارکردن</button>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                const modal = document.getElementById('name-update-modal');
                const closeBtn = modal.querySelector('.close-modal');
                const saveBtn = document.getElementById('save-name-btn');
                const input = document.getElementById('new-name-input');

                const closeModal = () => modal.remove();
                closeBtn.onclick = closeModal;
                modal.onclick = (e) => { if(e.target === modal) closeModal(); };

                saveBtn.onclick = async () => {
                    const newName = input.value.trim();
                    if (!newName) return;
                    saveBtn.textContent = '...';
                    const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });
                    if (!error) { userEmailDisplay.textContent = newName; closeModal(); }
                    else { alert('هەڵە: ' + error.message); saveBtn.textContent = 'تۆمارکردن'; }
                };
            };
        }
    }
}

/**
 * Handles the user logout process.
 */
async function handleLogout(event) {
    event.preventDefault();
    await supabase.auth.signOut();
    const isSubFolder = window.location.pathname.includes('/krechi/') || window.location.pathname.includes('/taminat/') || window.location.pathname.includes('/contracts/') || window.location.pathname.includes('/archive/');
    const path = isSubFolder ? '../index.html' : './index.html';
    window.location.href = path;
}

/**
 * Handles the toggling of the sidebar on mobile and desktop.
 */
function handleSidebarToggle() {
    const body = document.body;
    const isMobile = window.innerWidth <= 768;
    body.classList.toggle(isMobile ? 'sidebar-open' : 'sidebar-closed');
}

// 3. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check user session on every page load
    checkUserSession();

    // Attach event listeners if the elements exist
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', handleSidebarToggle);
    }

    // داخستنی سایدبار کاتێک کلیک لە دەرەوە دەکرێت (بۆ مۆبایل)
    document.addEventListener('click', (e) => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && document.body.classList.contains('sidebar-open')) {
            if (!e.target.closest('#sidebar') && !e.target.closest('#sidebar-toggle')) {
                document.body.classList.remove('sidebar-open');
            }
        }
    });
        
    // --- PWA Installation Logic ---

    // دیاریکردنی ڕێڕەوی دروست بەپێی شوێنی فایلەکە
    const isSubFolder = window.location.pathname.includes('/krechi/') || window.location.pathname.includes('/taminat/') || window.location.pathname.includes('/contracts/') || window.location.pathname.includes('/archive/');
    const iconPath = isSubFolder ? '../assets/icon.png' : './assets/icon.png';
    const swPath = isSubFolder ? '../sw.js' : './sw.js';

    // پشکنین بۆ ئەوەی بزانین ئایا پێشتر داخراوە؟
    const dismissedTime = localStorage.getItem('pwa_dismissed_time');
    // ئەگەر کەمتر لە ٧ ڕۆژ تێپەڕیوە، کۆدەکە ڕابگرە
    if (dismissedTime && (Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000)) {
        return;
    }

    // 1. Inject the install banner HTML into the body
    const bannerHTML = `
        <div id="install-banner">
            <div class="install-banner-card">
                <div class="install-banner-content">
                    <img src="${iconPath}" alt="App Icon" class="install-banner-icon">
                    <div class="install-banner-text">
                        <h4>ئەپەکە دابەزێنە</h4>
                        <p>بۆ ئەزموونێکی باشتر و خێراتر، وێبسایتەکە وەک ئەپ دابەزێنە ناو مۆبایلەکەت.</p>
                    </div>
                </div>
                
                <!-- ڕێنمایی تایبەت بە ئایفۆن -->
                <div id="ios-instructions" class="ios-guide">
                    <p>بۆ دابەزاندن لە ئایفۆن:</p>
                    <div class="ios-step">
                        <span>١. کلیک لە</span>
                        <i class='bx bx-share bx-tada' style="color: #007aff;"></i>
                        <span>بکە (Share)</span>
                    </div>
                    <div class="ios-step">
                        <span>٢. پاشان</span>
                        <strong>Add to Home Screen</strong>
                        <i class='bx bx-plus-square' style="color: #333;"></i>
                        <span>هەڵبژێرە</span>
                    </div>
                </div>

                <div class="install-banner-actions">
                    <button id="install-btn">دابەزاندن</button>
                    <button id="dismiss-install-btn">سوپاس، نەخێر</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', bannerHTML);

    // 2. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(swPath).then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // پشکنین بۆ وەشانێکی نوێ
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker == null) return;
                    
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // وەشانێکی نوێ دۆزرایەوە
                                showUpdateToast();
                            }
                        }
                    };
                };
            }).catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // 3. Handle Install Prompt
    let deferredPrompt;
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');
    const dismissBtn = document.getElementById('dismiss-install-btn');
    const iosInstructions = document.getElementById('ios-instructions');

    // پشکنین بۆ ئایفۆن (iOS)
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIos && !isInStandaloneMode) {
        // ئەگەر ئایفۆن بوو، بانەرەکە پیشان بدە بەڵام دوگمەی دابەزاندن بشارەوە
        if (installBanner) {
            installBanner.style.display = 'flex';
            if (installBtn) installBtn.style.display = 'none'; // دوگمەکە لە ئایفۆن کار ناکات
            if (iosInstructions) iosInstructions.style.display = 'block'; // ڕێنماییەکان پیشان بدە
        }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // تەنها ئەگەر ئایفۆن نەبوو (واتا ئەندرۆید یان دەسکتۆپ) لێرەوە پیشانی بدە
        if (installBanner && !isIos && window.matchMedia('(display-mode: browser)').matches) {
            installBanner.style.display = 'flex';
        }
    });

    // زیادکردنی پەیامی پیرۆزبایی دوای دابەزاندن
    window.addEventListener('appinstalled', () => {
        if (installBanner) installBanner.style.display = 'none';
        
        const successHTML = `
            <div id="pwa-success-modal" class="modal visible" style="z-index: 9999;">
                <div class="modal-content" style="text-align: center; max-width: 320px; padding: 30px; font-family: 'Noto Kufi Arabic', sans-serif;">
                    <div style="font-size: 4rem; color: #00b894; margin-bottom: 15px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                        <i class='bx bxs-check-circle'></i>
                    </div>
                    <h3 style="margin-bottom: 10px; color: #333;">پیرۆزە!</h3>
                    <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">ئەپەکە بە سەرکەوتوویی دابەزێنرا.</p>
                    <button id="close-success-btn" style="background: linear-gradient(135deg, #00b894, #00cec9); color: white; border: none; padding: 12px 30px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: inherit; box-shadow: 0 5px 15px rgba(0, 184, 148, 0.3);">
                        باشە، سوپاس
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', successHTML);

        const closeBtn = document.getElementById('close-success-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('pwa-success-modal');
                if (modal) modal.remove();
            });
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            if (installBanner) installBanner.style.display = 'none';
        });
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (installBanner) installBanner.style.display = 'none';
            // تۆمارکردنی کاتی داخستن بۆ ئەوەی تا هەفتەیەک دەرنەکەوێتەوە
            localStorage.setItem('pwa_dismissed_time', Date.now().toString());
        });
    }

    // زیادکردنی تایبەتمەندی Swipe بۆ کردنەوە و داخستنی سایدبار
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;

        const swipeThreshold = 50; // کەمترین مەودا بۆ جوڵە
        const edgeThreshold = 50; // مەودای لێوار بۆ کردنەوە (لە لای ڕاستەوە)

        // کردنەوە: لە ڕاستەوە بۆ چەپ (چونکە سایدبار لە لای ڕاستە)
        if (touchStartX - touchEndX > swipeThreshold && touchStartX > window.innerWidth - edgeThreshold) {
            document.body.classList.add('sidebar-open');
        }

        // داخستن: لە چەپەوە بۆ ڕاست
        if (touchEndX - touchStartX > swipeThreshold && document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
        }
    }

    // --- Online/Offline Status Logic ---
    function updateOnlineStatus() {
        const userInfo = document.getElementById('user-display');
        
        if (navigator.onLine) {
            if (userInfo) userInfo.classList.remove('offline');
            const offlineToast = document.getElementById('offline-toast');
            if (offlineToast) {
                offlineToast.style.animation = 'slideDownFade 0.5s ease-in forwards';
                setTimeout(() => offlineToast.remove(), 500);
                showOnlineToast();
            }
        } else {
            if (userInfo) userInfo.classList.add('offline');
            showOfflineToast();
        }
    }

    function showOfflineToast() {
        if (document.getElementById('offline-toast')) return;

        const toastHTML = `
            <div id="offline-toast" style="
                position: fixed; 
                bottom: 20px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: rgba(178, 31, 31, 0.95); 
                color: white; 
                padding: 15px 20px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                z-index: 10000; 
                display: flex; 
                align-items: center; 
                gap: 15px; 
                font-family: 'Noto Kufi Arabic', sans-serif; 
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.1);
                animation: slideUpFade 0.5s ease-out;
                direction: rtl;
                width: 90%;
                max-width: 400px;
                justify-content: center;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class='bx bx-wifi-off' style="font-size: 1.8rem;"></i>
                    <span style="font-size: 0.9rem; line-height: 1.5;">پەیوەندی ئینتەرنێت نییە</span>
                </div>
            </div>
            <style>
                @keyframes slideUpFade {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes slideDownFade {
                    from { transform: translate(-50%, 0); opacity: 1; }
                    to { transform: translate(-50%, 100%); opacity: 0; }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    function showOnlineToast() {
        if (document.getElementById('online-toast')) return;

        const toastHTML = `
            <div id="online-toast" style="
                position: fixed; 
                bottom: 20px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: rgba(39, 174, 96, 0.95); 
                color: white; 
                padding: 15px 20px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                z-index: 10000; 
                display: flex; 
                align-items: center; 
                gap: 15px; 
                font-family: 'Noto Kufi Arabic', sans-serif; 
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.1);
                animation: slideUpFade 0.5s ease-out;
                direction: rtl;
                width: 90%;
                max-width: 400px;
                justify-content: center;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class='bx bx-wifi' style="font-size: 1.8rem;"></i>
                    <span style="font-size: 0.9rem; line-height: 1.5;">پەیوەندی ئینتەرنێت گەڕایەوە</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);

        setTimeout(() => {
            const toast = document.getElementById('online-toast');
            if (toast) {
                toast.style.animation = 'slideDownFade 0.5s ease-in forwards';
                setTimeout(() => toast.remove(), 500);
            }
            processOfflineQueue(); // ناردنی داتاکانی پاشەکەوتکراو
        }, 3000);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();

    // فەنکشن بۆ پیشاندانی پەیامی نوێکردنەوە
    function showUpdateToast() {
        if (document.getElementById('update-toast')) return;
        
        const toastHTML = `
            <div id="update-toast" style="
                position: fixed; 
                bottom: 20px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: rgba(26, 42, 108, 0.95); 
                color: white; 
                padding: 15px 20px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
                z-index: 10000; 
                display: flex; 
                align-items: center; 
                gap: 15px; 
                font-family: 'Noto Kufi Arabic', sans-serif; 
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.1);
                animation: slideUpFade 0.5s ease-out;
                direction: rtl;
                width: 90%;
                max-width: 400px;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class='bx bx-refresh' style="font-size: 1.8rem; color: #00b894;"></i>
                    <span style="font-size: 0.9rem; line-height: 1.5;">وەشانێکی نوێ بەردەستە، تکایە نوێی بکەرەوە</span>
                </div>
                <button id="reload-btn" style="
                    background: #00b894; 
                    color: white; 
                    border: none; 
                    padding: 8px 15px; 
                    border-radius: 10px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    font-family: inherit;
                    white-space: nowrap;
                    box-shadow: 0 4px 10px rgba(0, 184, 148, 0.3);
                ">نوێکردنەوە</button>
            </div>
            <style>
                @keyframes slideUpFade {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        
        document.getElementById('reload-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }
});

// --- Offline Data Synchronization ---

// فەنکشن بۆ پاشەکەوتکردنی داتا کاتێک ئینتەرنێت نییە
export async function saveOfflineAction(table, action, data, id = null) {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    queue.push({ table, action, data, id, timestamp: Date.now() });
    localStorage.setItem('offline_queue', JSON.stringify(queue));
    
    // پیشاندانی پەیام
    const toastHTML = `
        <div id="save-offline-toast" style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #e67e22; color: white; padding: 12px 20px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 10000; font-family: 'Noto Kufi Arabic', sans-serif; display: flex; align-items: center; gap: 10px; animation: slideUpFade 0.5s ease-out;">
            <i class='bx bx-cloud-download' style="font-size: 1.5rem;"></i>
            <span>داتا لە مۆبایل پاشەکەوت کرا و کاتێک هێڵ هات دەنێردرێت.</span>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    setTimeout(() => {
        const t = document.getElementById('save-offline-toast');
        if(t) t.remove();
    }, 4000);
}

// فەنکشن بۆ ناردنی داتاکان کاتێک ئینتەرنێت دەگەڕێتەوە
async function processOfflineQueue() {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    if (queue.length === 0) return;

    // نیشاندانی پەیامی ناردن
    const toastHTML = `
        <div id="sync-toast" style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #3498db; color: white; padding: 12px 20px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 10000; font-family: 'Noto Kufi Arabic', sans-serif; display: flex; align-items: center; gap: 10px; animation: slideUpFade 0.5s ease-out;">
            <i class='bx bx-cloud-upload bx-flashing' style="font-size: 1.5rem;"></i>
            <span>ناردنی داتاکانی پاشەکەوتکراو...</span>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHTML);

    for (const item of queue) {
        try {
            if (item.action === 'insert') {
                await supabase.from(item.table).insert([item.data]);
            } else if (item.action === 'update') {
                await supabase.from(item.table).update(item.data).eq('id', item.id);
            } else if (item.action === 'delete') {
                await supabase.from(item.table).delete().eq('id', item.id);
            }
        } catch (err) {
            console.error('Error syncing item:', err);
        }
    }

    localStorage.removeItem('offline_queue');
    const t = document.getElementById('sync-toast');
    if(t) t.remove();
}