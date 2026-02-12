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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Determine the correct path to the login page based on current location
        const path = window.location.pathname.includes('/krechi/') || window.location.pathname.includes('/taminat/') || window.location.pathname.includes('/contracts/') ? '../index.html' : './index.html';
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
    const path = window.location.pathname.includes('/krechi/') || window.location.pathname.includes('/taminat/') || window.location.pathname.includes('/contracts/') ? '../index.html' : './index.html';
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
});