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
const notifyDaysSelect = document.getElementById('notify-days-before');
const exportDataBtn = document.getElementById('export-data-btn');
const exportModal = document.getElementById('exportModal');
const closeExportModalBtn = document.getElementById('close-export-modal');
const confirmExportBtn = document.getElementById('confirm-export-btn');
const formatOptions = document.querySelectorAll('.radio-card');
const importDataBtn = document.getElementById('import-data-btn');
const importModal = document.getElementById('importModal');
const closeImportModalBtn = document.getElementById('close-import-modal');
const confirmImportBtn = document.getElementById('confirm-import-btn');
const importFileInput = document.getElementById('import-file-input');
const fileDropArea = document.getElementById('file-drop-area');
const importFileInfo = document.getElementById('import-file-info');
const saveDefaultsBtn = document.getElementById('save-defaults-btn');
const defaultCurrencySelect = document.getElementById('default-currency');
const defaultLawyerInput = document.getElementById('default-lawyer');
const defaultLawyerMobileInput = document.getElementById('default-lawyer-mobile');
const factoryResetBtn = document.getElementById('factory-reset-btn');
const checkUpdateBtn = document.getElementById('check-update-btn');

// Load User Data
async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        emailInput.value = user.email;
        fullNameInput.value = user.user_metadata?.full_name || '';
    }
    
    // Load Defaults
    if(defaultCurrencySelect) defaultCurrencySelect.value = localStorage.getItem('default_currency') || '';
    if(defaultLawyerInput) defaultLawyerInput.value = localStorage.getItem('default_lawyer') || '';
    if(defaultLawyerMobileInput) defaultLawyerMobileInput.value = localStorage.getItem('default_lawyer_mobile') || '';
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

if (notifyDaysSelect) {
    const savedDays = localStorage.getItem('notify_days_before') || '0';
    notifyDaysSelect.value = savedDays;

    notifyDaysSelect.addEventListener('change', () => {
        localStorage.setItem('notify_days_before', notifyDaysSelect.value);
    });
}

// Export Data Logic
let selectedFormat = 'excel';

// Handle Format Selection UI
formatOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        formatOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedFormat = opt.dataset.format;
    });
});

// Open Modal
if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
        if (exportModal) {
            exportModal.classList.add('visible');
        }
    });
}

// Close Modal
if (closeExportModalBtn) {
    closeExportModalBtn.addEventListener('click', () => {
        exportModal.classList.remove('visible');
    });
}

// Confirm Export
if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', async () => {
        const source = document.getElementById('export-source').value;
        const originalText = confirmExportBtn.innerHTML;
        
        confirmExportBtn.textContent = '...ئامادەکردن';
        confirmExportBtn.disabled = true;

        try {
            let rawData = [];
            let headers = [];
            let fileName = `${source}_export`;

            // Fetch Data based on source
            if (source === 'tenants') {
                const { data: res, error } = await supabase.from('tenants').select('*');
                if (error) throw error;
                rawData = res;
                headers = ['ID', 'Name', 'Phone', 'Property Type', 'Property Number', 'Rent', 'Currency', 'Date', 'Paid'];
            } 
            else if (source === 'deposits') {
                const { data: res, error } = await supabase.from('deposits').select('*, deposit_holders(name)');
                if (error) throw error;
                rawData = res;
                headers = ['ID', 'Name', 'Phone', 'Property Type', 'Property Number', 'Amount', 'Currency', 'Holder', 'Date'];
            }
            else if (source === 'archives') {
                const { data: res, error } = await supabase.from('archives').select('*');
                if (error) throw error;
                rawData = res;
                headers = ['ID', 'Type', 'Date', 'Seller Name', 'Seller Phone', 'Buyer Name', 'Buyer Phone', 'Property Type', 'Property Number'];
            }

            if (!rawData || rawData.length === 0) {
                alert('هیچ داتایەک نییە بۆ هەناردەکردن');
                confirmExportBtn.innerHTML = originalText;
                confirmExportBtn.disabled = false;
                return;
            }

            if (selectedFormat === 'excel') {
                // Prepare data for XLSX (without quotes)
                const dataForXlsx = rawData.map(item => {
                    if (source === 'tenants') return [item.id, item.full_name, item.phone_number, item.property_type, item.property_number, item.monthly_rent, item.currency, item.registration_date, item.is_paid ? 'Yes' : 'No'];
                    if (source === 'deposits') return [item.id, item.full_name, item.phone_number, item.property_type, item.property_number, item.amount, item.currency, item.deposit_holders?.name, item.deposit_date];
                    if (source === 'archives') return [item.id, item.contract_type, item.contract_date, item.seller_name, item.seller_phone, item.buyer_name, item.buyer_phone, item.property_type, item.property_number];
                    return [];
                });

                const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataForXlsx]);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
                
                const fileNameXLSX = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(workbook, fileNameXLSX);

            } else { // CSV format
                // Prepare data for CSV (with quotes for names/phones)
                const dataForCsv = rawData.map(item => {
                    if (source === 'tenants') return [item.id, `"${item.full_name || ''}"`, `"${item.phone_number || ''}"`, item.property_type, item.property_number, item.monthly_rent, item.currency, item.registration_date, item.is_paid ? 'Yes' : 'No'];
                    if (source === 'deposits') return [item.id, `"${item.full_name || ''}"`, `"${item.phone_number || ''}"`, item.property_type, item.property_number, item.amount, item.currency, `"${item.deposit_holders?.name || ''}"`, item.deposit_date];
                    if (source === 'archives') return [item.id, item.contract_type, item.contract_date, `"${item.seller_name || ''}"`, `"${item.seller_phone || ''}"`, `"${item.buyer_name || ''}"`, `"${item.buyer_phone || ''}"`, item.property_type, item.property_number];
                    return [];
                });

                const csvContent = [
                    headers.join(','),
                    ...dataForCsv.map(row => row.join(','))
                ].join('\n');

                // Create Blob (Add BOM for Excel support)
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                
                const extension = 'csv';
                link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.${extension}`);
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            exportModal.classList.remove('visible');

        } catch (error) {
            alert('هەڵە: ' + error.message);
        } finally {
            confirmExportBtn.innerHTML = originalText;
            confirmExportBtn.disabled = false;
        }
    });
}

// --- Import Logic ---
let selectedFile = null;

// Open Import Modal
if (importDataBtn) {
    importDataBtn.addEventListener('click', () => {
        if (importModal) {
            importModal.classList.add('visible');
            // Reset state
            selectedFile = null;
            importFileInput.value = '';
            importFileInfo.textContent = '';
            confirmImportBtn.disabled = true;
        }
    });
}

// Close Import Modal
if (closeImportModalBtn) {
    closeImportModalBtn.addEventListener('click', () => {
        if (importModal) importModal.classList.remove('visible');
    });
}

// Handle File Selection
if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            importFileInfo.textContent = `فایلی هەڵبژێردراو: ${selectedFile.name}`;
            confirmImportBtn.disabled = false;
        }
    });
}

// Handle Drag and Drop
if (fileDropArea) {
    fileDropArea.addEventListener('click', () => importFileInput.click());
    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.classList.add('dragover');
    });
    fileDropArea.addEventListener('dragleave', () => {
        fileDropArea.classList.remove('dragover');
    });
    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            importFileInput.files = e.dataTransfer.files;
            const changeEvent = new Event('change');
            importFileInput.dispatchEvent(changeEvent);
        }
    });
}

// Confirm Import
if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            alert('تکایە فایلێک هەڵبژێرە');
            return;
        }

        const source = document.getElementById('import-source').value;
        const originalText = confirmImportBtn.innerHTML;
        confirmImportBtn.innerHTML = `<span>...بارکردن</span>`;
        confirmImportBtn.disabled = true;

        try {
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
                        const sheetName = workbook.SheetNames[0];
                        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                        resolve(jsonData);
                    } catch (err) {
                        reject(new Error('نەتوانرا فایلەکە بخوێنرێتەوە. دڵنیابە فایلی Excel یان CSV یە.'));
                    }
                };
                reader.onerror = () => reject(new Error('هەڵە لە خوێندنەوەی فایل.'));
                reader.readAsBinaryString(selectedFile);
            });

            if (!data || data.length === 0) throw new Error('فایلەکە بەتاڵە یان داتای تێدا نییە.');

            let mappedData = [];
            let holderMap = {};

            if (source === 'deposits') {
                const { data: holders, error } = await supabase.from('deposit_holders').select('id, name');
                if (error) throw error;
                holders.forEach(h => { holderMap[h.name.trim().toLowerCase()] = h.id; });
            }

            mappedData = data.map(row => {
                delete row.ID; // Ignore ID column for insertion

                if (source === 'tenants') {
                    return {
                        full_name: row.Name, phone_number: row.Phone, property_type: row['Property Type'],
                        property_number: row['Property Number'], monthly_rent: parseFloat(row.Rent) || 0, currency: row.Currency,
                        registration_date: row.Date instanceof Date ? row.Date.toISOString().split('T')[0] : row.Date,
                        is_paid: ['yes', 'true', 'بەڵێ'].includes(String(row.Paid).toLowerCase())
                    };
                }
                if (source === 'deposits') {
                    const holderId = holderMap[(row.Holder || '').trim().toLowerCase()];
                    if (!holderId) { console.warn(`Holder not found for row: ${row.Name}. Skipping.`); return null; }
                    return {
                        full_name: row.Name, phone_number: row.Phone, property_type: row['Property Type'],
                        property_number: row['Property Number'], amount: parseFloat(row.Amount) || 0, currency: row.Currency,
                        deposit_date: row.Date instanceof Date ? row.Date.toISOString().split('T')[0] : row.Date,
                        holder_id: holderId
                    };
                }
                if (source === 'archives') {
                    return {
                        contract_type: row.Type, contract_date: row.Date instanceof Date ? row.Date.toISOString().split('T')[0] : row.Date,
                        seller_name: row['Seller Name'], seller_phone: row['Seller Phone'], buyer_name: row['Buyer Name'],
                        buyer_phone: row['Buyer Phone'], property_type: row['Property Type'], property_number: row['Property Number']
                    };
                }
                return null;
            }).filter(Boolean);

            if (mappedData.length === 0) throw new Error('هیچ داتایەکی گونجاو نەدۆزرایەوە بۆ بارکردن.');

            const { error } = await supabase.from(source).insert(mappedData);
            if (error) throw error;

            alert(`${mappedData.length} تۆمار بە سەرکەوتوویی بارکرا. تکایە لاپەڕەکە نوێ بکەرەوە بۆ بینینی گۆڕانکارییەکان.`);
            if (importModal) importModal.classList.remove('visible');

        } catch (error) {
            alert('هەڵە لە کاتی بارکردن: ' + error.message);
        } finally {
            confirmImportBtn.innerHTML = originalText;
            confirmImportBtn.disabled = false;
        }
    });
}

// Save Defaults
if (saveDefaultsBtn) {
    saveDefaultsBtn.addEventListener('click', () => {
        const currency = defaultCurrencySelect.value;
        const lawyer = defaultLawyerInput.value;
        const lawyerMobile = defaultLawyerMobileInput.value;
        
        localStorage.setItem('default_currency', currency);
        localStorage.setItem('default_lawyer', lawyer);
        localStorage.setItem('default_lawyer_mobile', lawyerMobile);
        
        alert('بەها بنەڕەتییەکان بە سەرکەوتوویی تۆمارکران.');
    });
}

// Factory Reset
if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', async () => {
        if (confirm('ئاگاداربە! ئەم کردارە هەموو داتا پاشەکەوتکراوەکانی ناو مۆبایلەکەت دەسڕێتەوە و لە ئەکاونتەکەت دەچێتە دەرەوە. ئایا دڵنیایت؟')) {
            factoryResetBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> ...";
            factoryResetBtn.disabled = true;

            // 1. Sign out first (هەوڵدان بۆ دەرچوون پێش سڕینەوەی داتا)
            try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
            
            // 2. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            
            // 3. Clear Caches (سڕینەوەی کاشی وێبسایتەکە)
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // 4. Clear LocalStorage
            localStorage.clear();
            
            alert('ئەپڵیکەیشنەکە ڕیسێت کرا.');
            window.location.href = '../index.html';
        }
    });
}

// Check for Updates
if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
            checkUpdateBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
            navigator.serviceWorker.ready.then(registration => {
                registration.update().then(() => {
                    setTimeout(() => {
                        checkUpdateBtn.innerHTML = "<i class='bx bx-check'></i>";
                        setTimeout(() => checkUpdateBtn.innerHTML = "<i class='bx bx-refresh'></i>", 2000);
                        // If update found, the SW lifecycle will handle it (showing toast from shared.js)
                    }, 1000);
                });
            });
        } else {
            alert('خزمەتگوزاری Service Worker چالاک نییە.');
        }
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