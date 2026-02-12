import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { saveOfflineAction } from './shared.js';

// زانیارییەکانی سوپابەیس (هەمان زانیاری پڕۆژەکەت)
const supabaseUrl = 'https://nfrebhlhndgfxbqxoxzx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmViaGxobmRnZnhicXhveHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE0MTIsImV4cCI6MjA4NjMwNzQxMn0.QnSC5bN_k8vy71_xmaTMWFQGM2PY9qZCpJyLStdDcbs'
const supabase = createClient(supabaseUrl, supabaseKey)

// گۆڕاوەکان
const tenantsContainer = document.getElementById('tenants-container');
const modal = document.getElementById('tenantModal');
const deleteModal = document.getElementById('deleteModal');
const renewModal = document.getElementById('renewModal');
const form = document.getElementById('tenant-form');
const modalTitle = document.getElementById('modal-title');
const logoutButton = document.getElementById('logout-btn');
const sidebarToggle = document.getElementById('sidebar-toggle');
const userEmailDisplay = document.getElementById('user-email');
const notificationBtn = document.getElementById('notification-btn');
const notificationBadge = document.getElementById('notification-badge');
const notificationDropdown = document.getElementById('notification-dropdown');
const notificationList = document.getElementById('notification-list');
const notificationOverlay = document.getElementById('notification-overlay');
const closeNotificationBtn = document.getElementById('close-notification-btn');
const body = document.body;
let tenantToDeleteId = null;
let tenantToRenew = null;
let allTenants = [];

// پشکنینی چوونەژوورەوە
async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '../index.html';
    } else {
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

// هێنانی داتاکان لە سوپابەیس
async function fetchTenants() {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tenants:', error);
        return;
    }
    allTenants = data;
    checkNotifications();
    filterTenants();
}

// فلتەرکردنی کرێچییەکان
window.filterTenants = () => {
    const showUnpaidOnly = document.getElementById('filter-unpaid').checked;
    const searchTerm = document.getElementById('search-tenant').value.toLowerCase();

    const filtered = allTenants.filter(t => {
        const matchesStatus = showUnpaidOnly ? !t.is_paid : true;
        const matchesSearch = t.full_name.toLowerCase().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });
    renderTenants(filtered);
};

// پشکنینی ئاگادارییەکان
function checkNotifications() {
    const today = new Date();
    const todayDay = today.getDate();
    const todayDateString = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    // دۆزینەوەی ئەو کرێچیانەی ئەمڕۆ کاتی کرێدانیانە و پارەیان نەداوە
    const dueTenants = allTenants.filter(tenant => {
        if (tenant.is_paid) return false;
        const registrationDay = new Date(tenant.registration_date).getDate();
        return registrationDay === todayDay;
    });

    // وەرگرتنی داتای ئاگادارییەکان لە localStorage
    let notificationData = JSON.parse(localStorage.getItem('seenTenantNotifications_DH') || '{}');

    // ئەگەر بەرواری تۆمارکراو هی ئەمڕۆ نەبوو، ڕیسیتی بکە
    if (notificationData.date !== todayDateString) {
        notificationData = { date: todayDateString, seenIds: [] };
        localStorage.setItem('seenTenantNotifications_DH', JSON.stringify(notificationData));
    }

    // دۆزینەوەی ئاگادارییە نوێیەکان (کاتیان هاتووە بەڵام نەبینراون)
    const newNotifications = dueTenants.filter(t => !notificationData.seenIds.includes(t.id));

    // نوێکردنەوەی لیستی ئاگادارییەکان
    notificationList.innerHTML = '';

    if (dueTenants.length > 0) {
        dueTenants.forEach(tenant => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <div class="icon"><i class='bx bxs-time-five'></i></div>
                <div class="content">
                    <p>ئەمڕۆ کاتی کرێدانی <strong>${tenant.full_name}</strong> هاتووە.</p>
                </div>
            `;
            notificationList.appendChild(item);
        });
    } else {
        notificationList.innerHTML = '<p class="no-notification">هیچ ئاگادارییەکی نوێ نییە.</p>';
    }

    // پیشاندان یان شاردنەوەی نیشانەی ئاگاداری
    if (newNotifications.length > 0) {
        notificationBadge.classList.remove('hidden');
        notificationBtn.classList.add('has-notifications');
    } else {
        notificationBadge.classList.add('hidden');
        notificationBtn.classList.remove('has-notifications');
    }

    // بەشی ناردنی ئیمەیڵ بۆ بەکارهێنەران (ئۆتۆماتیکی)
    let emailData = JSON.parse(localStorage.getItem('sentEmails_DH') || '{}');
    
    // ئەگەر بەروارەکە هی ئەمڕۆ نەبوو، پاکی بکەرەوە (ڕۆژانە نوێ دەبێتەوە)
    if (emailData.date !== todayDateString) {
        emailData = { date: todayDateString, sentIds: [] };
    }

    const tenantsToEmail = dueTenants.filter(t => !emailData.sentIds.includes(t.id));

    if (tenantsToEmail.length > 0) {
        tenantsToEmail.forEach(tenant => {
            sendEmailToUsers(tenant);
            emailData.sentIds.push(tenant.id);
        });
        localStorage.setItem('sentEmails_DH', JSON.stringify(emailData));
    }
}

// فەنکشن بۆ هەژمارکردنی ڕۆژە ماوەکان بۆ کۆتایی مانگ
function getDaysRemaining(dateStr) {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // وەرگرتنی ڕۆژی تۆمارکردن
    const parts = dateStr.split('-');
    const dayOfMonth = parseInt(parts[2], 10);
    
    let nextDue = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    
    // ئەگەر بەروارەکە تێپەڕی بوو یان هەمان ڕۆژ بوو، دەچێتە مانگی داهاتوو
    if (nextDue <= today) {
        nextDue.setMonth(nextDue.getMonth() + 1);
    }
    
    const diffTime = Math.abs(nextDue - today);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// فەنکشن بۆ ناردنی ئیمەیڵ بۆ هەموو بەکارهێنەرانی سوپابەیس
async function sendEmailToUsers(tenant) {
    try {
        // بانگکردنی Edge Function بۆ ناردنی ئیمەیڵ
        // تێبینی: پێویستە لە سوپابەیس Edge Function ێک دروست بکەیت بە ناوی 'send-rent-notification'
        const { data, error } = await supabase.functions.invoke('send-rent-notification', {
            body: { 
                tenant_name: tenant.full_name,
                amount: tenant.monthly_rent,
                currency: tenant.currency,
                property: `${tenant.property_type} ${tenant.property_number}`
            }
        });
        if (error) console.error('Error sending email:', error);
        else console.log('Email notification sent for:', tenant.full_name);
    } catch (err) {
        console.error('Failed to invoke email function:', err);
    }
}

// دروستکردنی کارتی کرێچی
function createTenantCard(tenant) {
    const isPaid = tenant.is_paid;
    const daysRemaining = getDaysRemaining(tenant.registration_date);
    const dueSoonClass = daysRemaining <= 5 ? 'due-soon' : '';
    
    const card = document.createElement('div');
    card.className = 'tenant-card collapsed';
    card.id = `tenant-card-${tenant.id}`; // زیادکردنی ID بۆ دۆزینەوەی ئاسان
    card.innerHTML = `
            <div class="card-header" onclick="toggleCardDetails(${tenant.id})">
                <div class="tenant-name">
                    <i class='bx bxs-user-circle'></i>
                    <h4>${tenant.full_name}</h4>
                </div>
                <button class="toggle-details-btn" title="پیشاندان/شاردنەوە">
                    <i class='bx bx-chevron-up'></i>
                </button>
            </div>
            <div class="card-body">
                <div class="info-item">
                    <i class='bx bx-phone'></i>
                    <span>${tenant.phone_number || 'نەزانراو'}</span>
                </div>
                <div class="info-item">
                    <i class='bx bx-home-alt'></i>
                    <span>موڵکی ${tenant.property_number} (${tenant.property_type})</span>
                </div>
                <div class="info-item">
                    <i class='bx bx-wallet'></i>
                    <span>${Number(tenant.monthly_rent).toLocaleString()} ${tenant.currency || 'د.ع'}</span>
                </div>
                <div class="info-item">
                    <i class='bx bx-calendar-check'></i>
                    <span>مێژووی تۆمار: ${tenant.registration_date}</span>
                </div>
                <div class="info-item ${dueSoonClass}">
                    <i class='bx bx-timer'></i>
                    <span>${daysRemaining} ڕۆژی ماوە بۆ کۆتایی مانگ</span>
                </div>
            </div>
            <div class="card-footer">
                <div class="payment-status">
                    <span>دۆخی پارەدان:</span>
                    <label class="status-switch">
                        <input type="checkbox" ${isPaid ? 'checked' : ''} onchange="toggleStatus(${tenant.id}, this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <!-- کاتی ماوە (تەنها کاتێک کارتەکە داخراوە دەردەکەوێت) -->
                <span class="collapsed-info ${dueSoonClass}">
                    <i class='bx bx-timer'></i> ${daysRemaining} ڕۆژ
                </span>
                <div class="card-actions">
                    <button class="action-btn btn-edit" onclick="editTenant(${tenant.id})"><i class='bx bx-edit-alt'></i></button>
                    <button class="action-btn btn-delete" onclick="deleteTenant(${tenant.id})"><i class='bx bxs-trash-alt'></i></button>
                </div>
            </div>
        `;
    return card;
}

// پیشاندانی داتاکان
function renderTenants(tenants) {
    tenantsContainer.innerHTML = '';
    tenants.forEach((tenant, index) => {
        const card = createTenantCard(tenant);
        card.classList.add('staggered-card');
        card.style.animationDelay = `${index * 0.1}s`;
        tenantsContainer.appendChild(card);
    });
}

// زیادکردن یان نوێکردنەوەی کرێچی
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tenant-id').value;
    const tenantData = {
        full_name: document.getElementById('full_name').value,
        phone_number: document.getElementById('phone_number').value,
        property_number: document.getElementById('property_number').value,
        property_type: document.getElementById('property_type').value,
        monthly_rent: document.getElementById('monthly_rent').value,
        currency: document.getElementById('currency').value,
        registration_date: document.getElementById('registration_date').value,
        is_paid: document.getElementById('is_paid').checked
    };

    // پشکنینی ئۆفلاین
    if (!navigator.onLine) {
        const action = id ? 'update' : 'insert';
        saveOfflineAction('tenants', action, tenantData, id);
        
        // نوێکردنەوەی ڕووکەش (Optimistic UI)
        const fakeData = { ...tenantData, id: id || Date.now(), created_at: new Date().toISOString() };
        if (id) {
            const index = allTenants.findIndex(t => t.id == id);
            if (index !== -1) allTenants[index] = fakeData;
            const oldCard = document.getElementById(`tenant-card-${id}`);
            const newCard = createTenantCard(fakeData);
            if (oldCard) oldCard.replaceWith(newCard);
        } else {
            allTenants.unshift(fakeData);
            const newCard = createTenantCard(fakeData);
            tenantsContainer.prepend(newCard);
        }
        closeModal();
        form.reset();
        return;
    }

    let result;
    if (id) {
        // نوێکردنەوە (Update)
        result = await supabase
            .from('tenants')
            .update(tenantData)
            .eq('id', id)
            .select()
            .single();
    } else {
        // زیادکردن (Insert)
        result = await supabase
            .from('tenants')
            .insert([tenantData])
            .select()
            .single();
    }

    const { data, error } = result;

    if (!error && data) {
        closeModal();
        
        // نوێکردنەوەی داتای ناوخۆیی
        if (id) {
            const index = allTenants.findIndex(t => t.id == id);
            if (index !== -1) allTenants[index] = data;
        } else {
            allTenants.unshift(data);
        }

        // پشکنین بۆ ئەوەی بزانین ئایا دەبێت لەم فلتەرەدا دەربکەوێت یان نا
        const showUnpaidOnly = document.getElementById('filter-unpaid').checked;
        const isVisible = !showUnpaidOnly || !data.is_paid;

        if (isVisible) {
            const newCard = createTenantCard(data);
            if (id) {
                const oldCard = document.getElementById(`tenant-card-${id}`);
                if (oldCard) oldCard.replaceWith(newCard);
            } else {
                newCard.classList.add('card-enter-active');
                tenantsContainer.prepend(newCard);
            }
        } else if (id) {
            // ئەگەر دەستکاری کرا و چیتر مەرجی فلتەرەکەی تێدا نەما، لایبە
            const oldCard = document.getElementById(`tenant-card-${id}`);
            if (oldCard) oldCard.remove();
        }
        form.reset();
    } else {
        alert('هەڵەیەک ڕوویدا: ' + error.message);
    }
});

// گۆڕینی دۆخی پارەدان (سویچەکە)
window.toggleStatus = async (id, status) => {
    // ئەگەر کرێچییەکە پارەی دا (status == true)
    if (status === true) {
        const tenant = allTenants.find(t => t.id === id);
        if (tenant) {
            // مۆداڵی پرسیارکردن نیشان بدە
            tenantToRenew = { id, status };
            renewModal.classList.add('visible');
        }
    } else {
        // ئەگەر سویچەکە کرایە سوور (پارەی نەدا)
        // تەنها دۆخەکە نوێ بکەرەوە بەبێ پرسیار
        await updatePaymentStatus(id, status);
    }
};

// فەنکشنە نوێیەکان بۆ مۆداڵی نوێکردنەوە
window.closeRenewModal = () => {
    renewModal.classList.remove('visible');
    tenantToRenew = null;
};

// داخستنی مۆداڵی نوێکردنەوە و گەڕاندنەوەی دۆخەکە
window.cancelRenew = () => {
    closeRenewModal();
    fetchTenants(); // گەڕاندنەوەی سویچەکە بۆ دۆخی پێشوو
};

// کاتێک بەکارهێنەر دوگمەی "بەڵێ، نوێی بکەرەوە" دادەگرێت
window.confirmRenew = async () => {
    if (!tenantToRenew) return;
    const { id } = tenantToRenew;
    const tenant = allTenants.find(t => t.id === id);
    if (!tenant) return;

    // هەژمارکردنی بەرواری مانگی داهاتوو
    const currentDate = new Date(tenant.registration_date);
    const originalDay = currentDate.getDate();
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (currentDate.getDate() !== originalDay) {
        currentDate.setDate(0);
    }
    const nextDateStr = currentDate.toISOString().split('T')[0];

    // پشکنینی ئۆفلاین
    if (!navigator.onLine) {
        const updateData = { is_paid: false, registration_date: nextDateStr };
        saveOfflineAction('tenants', 'update', updateData, id);
        
        // UI Update
        tenant.is_paid = false;
        tenant.registration_date = nextDateStr;
        const oldCard = document.getElementById(`tenant-card-${id}`);
        const newCard = createTenantCard(tenant);
        if (oldCard) oldCard.replaceWith(newCard);
        
        closeRenewModal();
        return;
    }

    // نوێکردنەوەی داتا: بەرواری نوێ + گەڕانەوە بۆ دۆخی پارەنەدان (سوور)
    const { data, error } = await supabase
        .from('tenants')
        .update({ 
            is_paid: false, 
            registration_date: nextDateStr 
        })
        .eq('id', id)
        .select()
        .single();

    closeRenewModal();

    if (error) {
        alert('هەڵەیەک ڕوویدا: ' + error.message);
        fetchTenants(); // Reload all on error
    } else {
        // نوێکردنەوەی کاردەکە
        const index = allTenants.findIndex(t => t.id == id);
        if (index !== -1) allTenants[index] = data;
        
        const oldCard = document.getElementById(`tenant-card-${id}`);
        const newCard = createTenantCard(data);
        if (oldCard) oldCard.replaceWith(newCard);
    }
};

// کاتێک بەکارهێنەر دوگمەی "نەخێر، تەنها تۆماری بکە" دادەگرێت
window.justRecordPayment = async () => {
    if (!tenantToRenew) return;
    const { id, status } = tenantToRenew;
    
    closeRenewModal();
    await updatePaymentStatus(id, status);
};

// فەنکشنێکی یارمەتیدەر بۆ نوێکردنەوەی دۆخی پارەدان
async function updatePaymentStatus(id, status) {
    if (!navigator.onLine) {
        saveOfflineAction('tenants', 'update', { is_paid: status }, id);
        const tenant = allTenants.find(t => t.id === id);
        if (tenant) tenant.is_paid = status;
        
        // UI Update logic for filter
        const showUnpaidOnly = document.getElementById('filter-unpaid').checked;
        if (showUnpaidOnly && status === true) {
            const card = document.getElementById(`tenant-card-${id}`);
            if (card) card.remove();
        }
        return;
    }

    const { error } = await supabase
        .from('tenants')
        .update({ is_paid: status })
        .eq('id', id);
    
    if (error) {
        alert('نەتوانرا دۆخەکە بگۆڕدرێت');
        fetchTenants(); // گەڕاندنەوە بۆ دۆخی پێشوو
    } else {
        // نوێکردنەوەی داتای ناوخۆیی
        const tenant = allTenants.find(t => t.id === id);
        if (tenant) tenant.is_paid = status;

        // ئەگەر فلتەری قەرزدارەکان چالاک بێت و پارەی دا، با ون بێت
        const showUnpaidOnly = document.getElementById('filter-unpaid').checked;
        if (showUnpaidOnly && status === true) {
            const card = document.getElementById(`tenant-card-${id}`);
            if (card) {
                card.classList.add('card-exit-active');
                setTimeout(() => card.remove(), 400);
            }
        }
    }
};

// پیشاندان یان شاردنەوەی زانیارییەکانی کارت
window.toggleCardDetails = (id) => {
    const card = document.getElementById(`tenant-card-${id}`);
    if (card) {
        card.classList.toggle('collapsed');
    }
};

// سڕینەوەی کرێچی
window.deleteTenant = (id) => {
    tenantToDeleteId = id;
    deleteModal.classList.add('visible');
};

window.closeDeleteModal = () => {
    deleteModal.classList.remove('visible');
    tenantToDeleteId = null;
};

window.confirmDelete = async () => {
    if (tenantToDeleteId) {
        if (!navigator.onLine) {
            saveOfflineAction('tenants', 'delete', {}, tenantToDeleteId);
            allTenants = allTenants.filter(t => t.id !== tenantToDeleteId);
            const cardToRemove = document.getElementById(`tenant-card-${tenantToDeleteId}`);
            if (cardToRemove) {
                cardToRemove.classList.add('card-exit-active');
                setTimeout(() => cardToRemove.remove(), 400);
            }
            closeDeleteModal();
            return;
        }

        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenantToDeleteId);
        
        if (!error) {
            allTenants = allTenants.filter(t => t.id !== tenantToDeleteId);
            // لەجیاتی ڕیفرێش، کارتەکە لە لیستەکە لادەبەین
            const cardToRemove = document.getElementById(`tenant-card-${tenantToDeleteId}`);
            if (cardToRemove) {
                cardToRemove.classList.add('card-exit-active');
                setTimeout(() => {
                    cardToRemove.remove();
                }, 400); // 400ms is the duration of the animation
            }
            closeDeleteModal();
        } else {
            alert('هەڵەیەک ڕوویدا: ' + error.message);
        }
    }
};

// ئامادەکردنی فۆڕم بۆ دەستکاری (Edit)
window.editTenant = async (id) => {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();
        
    if (data) {
        document.getElementById('tenant-id').value = data.id;
        document.getElementById('full_name').value = data.full_name;
        document.getElementById('phone_number').value = data.phone_number;
        document.getElementById('property_number').value = data.property_number;
        document.getElementById('property_type').value = data.property_type;
        document.getElementById('monthly_rent').value = data.monthly_rent;
        document.getElementById('currency').value = data.currency || 'د.ع';
        document.getElementById('registration_date').value = data.registration_date;
        document.getElementById('is_paid').checked = data.is_paid;
        
        modalTitle.textContent = 'دەستکاریکردنی کرێچی';
        openModal();
    }
};

// فەنکشنەکانی مۆداڵ
window.openModal = () => {
    modal.classList.add('visible');
    if (!document.getElementById('tenant-id').value) {
        form.reset();
        modalTitle.textContent = 'زیادکردنی کرێچی نوێ';
    }
};

window.closeModal = () => {
    modal.classList.remove('visible');
    document.getElementById('tenant-id').value = '';
};

// کارکردنی دوگمەی چوونەدەرەوە
if (logoutButton) {
    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const { error } = await supabase.auth.signOut();
        window.location.href = '../index.html';
    });
}

// کارکردنی دوگمەی سایدبار
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 768;
        body.classList.toggle(isMobile ? 'sidebar-open' : 'sidebar-closed');
    });
}

// کارکردنی دوگمەی ئاگادارییەکان
if (notificationBtn) {
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('visible');
        if (notificationOverlay) notificationOverlay.classList.toggle('visible');

        // ئەگەر لیستەکە کرایەوە، ئاگادارییەکان وەک بینراو تۆمار بکە
        if (notificationDropdown.classList.contains('visible')) {
            const today = new Date();
            const todayDay = today.getDate();
            const todayDateString = today.toISOString().split('T')[0];

            const dueTenants = allTenants.filter(tenant => {
                const registrationDay = new Date(tenant.registration_date).getDate();
                return registrationDay === todayDay && !tenant.is_paid;
            });

            const dueTenantIds = dueTenants.map(t => t.id);
            
            // تۆمارکردنی ئایدیەکان لەگەڵ بەرواری ئەمڕۆ
            const notificationData = { date: todayDateString, seenIds: dueTenantIds };
            localStorage.setItem('seenTenantNotifications_DH', JSON.stringify(notificationData));

            // شاردنەوەی نیشانەکە
            notificationBadge.classList.add('hidden');
            notificationBtn.classList.remove('has-notifications');
        }
    });

    document.addEventListener('click', (e) => {
        // داخستن ئەگەر کلیک لە دەرەوە کرا یان لەسەر دوگمەی داخستن یان لایەرەکە
        const isCloseBtn = closeNotificationBtn && closeNotificationBtn.contains(e.target);
        const isOverlay = e.target === notificationOverlay;
        
        if ((!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) || isCloseBtn || isOverlay) {
            notificationDropdown.classList.remove('visible');
            if (notificationOverlay) notificationOverlay.classList.remove('visible');
        }
    });
}

// داخستنی سایدبار کاتێک کلیک لە دەرەوە دەکرێت (بۆ مۆبایل)
document.addEventListener('click', (e) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && document.body.classList.contains('sidebar-open')) {
        // بەکارهێنانی closest بۆ دڵنیابوونەوە لەوەی کلیکەکە لەناو سایدبار یان دوگمەکە نییە
        if (!e.target.closest('#sidebar') && !e.target.closest('#sidebar-toggle')) {
            document.body.classList.remove('sidebar-open');
        }
    }
});

// دەستپێکردن
checkUser();
fetchTenants();