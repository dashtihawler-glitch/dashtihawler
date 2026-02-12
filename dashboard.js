import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// زانیارییەکانی سوپابەیس
const supabaseUrl = 'https://nfrebhlhndgfxbqxoxzx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmViaGxobmRnZnhicXhveHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE0MTIsImV4cCI6MjA4NjMwNzQxMn0.QnSC5bN_k8vy71_xmaTMWFQGM2PY9qZCpJyLStdDcbs'
const supabase = createClient(supabaseUrl, supabaseKey)

// دڵنیابوونەوە لەوەی بەکارهێنەر چۆتە ژوورەوە
async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // ئەگەر بەکارهێنەر لاگین نەبووبوو، بینێرەوە بۆ لاپەڕەی چوونەژوورەوە
        // پشکنین بۆ ئەوەی بزانین لەناو فۆڵدەری contracts ین یان نا
        const isContracts = window.location.pathname.includes('/contracts/');
        window.location.href = isContracts ? '../index.html' : 'index.html';
    } else {
        // پیشاندانی ئیمەیڵی بەکارهێنەر
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
        
        // پڕکردنەوەی ئۆتۆماتیکی ئیمەیڵی کارمەند لە فۆڕمی پسولەدا
        const employeeEmailInput = document.getElementById('employeeEmail');
        if (employeeEmailInput) {
            employeeEmailInput.value = session.user.email;
        }
    }
}

function initDashboard() {
    const logoutButton = document.getElementById('logout-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const body = document.body;

    checkUser();

    // کارکردنی دوگمەی چوونەدەرەوە
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const { error } = await supabase.auth.signOut();
            // دوای چوونەدەرەوە، بینێرەوە بۆ لاپەڕەی چوونەژوورەوە
            const isContracts = window.location.pathname.includes('/contracts/');
            window.location.href = isContracts ? '../index.html' : 'index.html';
        });
    }

    // کارکردنی دوگمەی سایدبار
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            // ئەگەر لە مۆبایل بوو کلاسەکە sidebar-open دەبێت، ئەگەر نا sidebar-closed
            const isMobile = window.innerWidth <= 768;
            body.classList.toggle(isMobile ? 'sidebar-open' : 'sidebar-closed');
        });
    }
}

// دڵنیابوونەوە لەوەی DOM ئامادەیە پێش جێبەجێکردنی کۆدەکە
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}