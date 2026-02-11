import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// زانیارییەکانی سوپابەیس
const supabaseUrl = 'https://nfrebhlhndgfxbqxoxzx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmViaGxobmRnZnhicXhveHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE0MTIsImV4cCI6MjA4NjMwNzQxMn0.QnSC5bN_k8vy71_xmaTMWFQGM2PY9qZCpJyLStdDcbs'
const supabase = createClient(supabaseUrl, supabaseKey)

// دەستگرتن بەسەر ئێلێمێنتەکانی فۆڕمەکە
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // ڕێگری لە ناردنی فۆڕمەکە بە شێوازی ئاسایی

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    // چوونەژوورەوە بە بەکارهێنانی سوپابەیس
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        // پیشاندانی هەڵە ئەگەر هەبوو
        errorMessage.textContent = 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.';
        errorMessage.classList.remove('hidden');
    } else {
        // ئەگەر سەرکەوتوو بوو، بەڕێکردن بۆ داشبۆرد
        window.location.href = 'dashboard.html';
    }
});

// کارکردنی دوگمەی پیشاندان/شاردنەوەی وشەی نهێنی
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });
}