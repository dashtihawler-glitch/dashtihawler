import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// زانیارییەکانی سوپابەیس
const supabaseUrl = 'https://nfrebhlhndgfxbqxoxzx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmViaGxobmRnZnhicXhveHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE0MTIsImV4cCI6MjA4NjMwNzQxMn0.QnSC5bN_k8vy71_xmaTMWFQGM2PY9qZCpJyLStdDcbs'
const supabase = createClient(supabaseUrl, supabaseKey)

const logoutButton = document.getElementById('logout-btn');
const sidebarToggle = document.getElementById('sidebar-toggle');
const body = document.body;
const userEmailDisplay = document.getElementById('user-email');

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
        if (userEmailDisplay) userEmailDisplay.textContent = session.user.email;
        
        // پڕکردنەوەی ئۆتۆماتیکی ئیمەیڵی کارمەند لە فۆڕمی پسولەدا
        const employeeEmailInput = document.getElementById('employeeEmail');
        if (employeeEmailInput) {
            employeeEmailInput.value = session.user.email;
        }
    }
}

// کاتێک لاپەڕەکە بار دەبێت، دڵنیاببەوە لە بەکارهێنەر
document.addEventListener('DOMContentLoaded', () => {
    checkUser();
});

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