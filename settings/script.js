import { supabase } from '../shared.js';

// Elements
const fullNameInput = document.getElementById('settings-fullname');
const emailInput = document.getElementById('settings-email');
const saveProfileBtn = document.getElementById('save-profile-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const oldPassInput = document.getElementById('old-password');
const newPassInput = document.getElementById('new-password');
const confirmPassInput = document.getElementById('confirm-password');
const showPassCheckbox = document.getElementById('show-pass-checkbox');
const updatePassBtn = document.getElementById('update-pass-btn');
const rentNotifyToggle = document.getElementById('rent-notify-toggle');

// Load User Data
async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        emailInput.value = user.email;
        fullNameInput.value = user.user_metadata?.full_name || '';
    }
}

// Update Profile
saveProfileBtn.addEventListener('click', async () => {
    const newName = fullNameInput.value.trim();
    if (!newName) return alert('تکایە ناوێک بنووسە');

    saveProfileBtn.textContent = '...';
    saveProfileBtn.disabled = true;

    const { error } = await supabase.auth.updateUser({
        data: { full_name: newName }
    });

    if (error) {
        alert('هەڵە: ' + error.message);
    } else {
        alert('زانیارییەکان بە سەرکەوتوویی نوێکرانەوە');
        // Update the header name immediately
        const userEmailDisplay = document.getElementById('user-email');
        if(userEmailDisplay) userEmailDisplay.textContent = newName;
    }

    saveProfileBtn.textContent = 'تۆمارکردنی گۆڕانکارییەکان';
    saveProfileBtn.disabled = false;
});

// Clear Cache
clearCacheBtn.addEventListener('click', () => {
    if (confirm('ئایا دڵنیایت دەتەوێت هەموو داتا پاشەکەوتکراوەکان (Cache) بسڕیتەوە؟ ئەمە وادەکات داتاکان جارێکی تر لە سێرڤەرەوە باربکرێنەوە.')) {
        // Clear specific keys related to the app
        localStorage.removeItem('cached_tenants');
        localStorage.removeItem('cached_deposits');
        localStorage.removeItem('cached_deposit_holders');
        localStorage.removeItem('seenTenantNotifications_DH');
        localStorage.removeItem('sentEmails_DH');
        
        alert('کاش بە سەرکەوتوویی پاککرایەوە. لاپەڕەکە نوێ دەبێتەوە.');
        window.location.reload();
    }
});

// Update Password
if (updatePassBtn) {
    updatePassBtn.addEventListener('click', async () => {
        const oldPass = oldPassInput.value;
        const newPass = newPassInput.value;
        const confirmPass = confirmPassInput.value;

        if (!oldPass || !newPass || !confirmPass) {
            return alert('تکایە هەموو خانەکان پڕبکەرەوە');
        }
        
        if (newPass.length < 6) {
            return alert('وشەی نهێنی نوێ دەبێت لانی کەم ٦ پیت بێت');
        }

        if (newPass !== confirmPass) {
            return alert('وشەی نهێنی نوێ و دڵنیابوونەوەکەی وەک یەک نین');
        }

        const originalBtnText = updatePassBtn.textContent;
        updatePassBtn.textContent = '...';
        updatePassBtn.disabled = true;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('تکایە دووبارە بچۆ ژوورەوە');
            
            // 1. Verify old password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPass
            });
            
            if (signInError) {
                if (signInError.message.includes('Invalid login credentials')) {
                    throw new Error('وشەی نهێنی کۆن هەڵەیە');
                }
                throw new Error('هەڵە لە پەیوەندی: ' + signInError.message);
            }

            // 2. Update password
            const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
            if (updateError) throw updateError;

            alert('وشەی نهێنی بە سەرکەوتوویی گۆڕدرا');
            oldPassInput.value = '';
            newPassInput.value = '';
            confirmPassInput.value = '';
        } catch (error) {
            alert(error.message);
        } finally {
            updatePassBtn.textContent = originalBtnText;
            updatePassBtn.disabled = false;
        }
    });
}

// Toggle Password Visibility
if (showPassCheckbox) {
    showPassCheckbox.addEventListener('change', () => {
        const type = showPassCheckbox.checked ? 'text' : 'password';
        oldPassInput.type = type;
        newPassInput.type = type;
        confirmPassInput.type = type;
    });
}

// Notification Settings
if (rentNotifyToggle) {
    // Load saved preference (default true if not set)
    const enabled = localStorage.getItem('rent_notifications_enabled') !== 'false';
    rentNotifyToggle.checked = enabled;

    rentNotifyToggle.addEventListener('change', () => {
        localStorage.setItem('rent_notifications_enabled', rentNotifyToggle.checked);
    });
}

// Get App Version
async function getAppVersion() {
    const versionDisplay = document.getElementById('app-version-display');
    if(!versionDisplay) return;

    try {
        const response = await fetch('../sw.js');
        const text = await response.text();
        const match = text.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
        
        if (match && match[1]) {
            // Extract version (e.g. v6.8) from 'dashti-hewler-cache-v6.8'
            const version = match[1].split('-').pop();
            versionDisplay.textContent = version.toUpperCase().replace('V', 'V ');
        }
    } catch (e) {
        console.error('Error fetching version:', e);
        versionDisplay.textContent = 'V 1.0';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    getAppVersion();
});