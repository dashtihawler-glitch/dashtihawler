import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { saveOfflineAction } from '../shared.js';

const supabaseUrl = 'https://nfrebhlhndgfxbqxoxzx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmViaGxobmRnZnhicXhveHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE0MTIsImV4cCI6MjA4NjMwNzQxMn0.QnSC5bN_k8vy71_xmaTMWFQGM2PY9qZCpJyLStdDcbs'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM Elements
const modal = document.getElementById('depositModal');
const deleteModal = document.getElementById('deleteModal');
const pdfViewerModal = document.getElementById('pdf-viewer-modal');
const form = document.getElementById('deposit-form');
const modalTitle = document.getElementById('modal-title');
const depositsContainer = document.getElementById('deposits-container');
const summaryContainer = document.getElementById('summary-container');
const submitBtnText = document.getElementById('submit-btn-text');
const submitLoader = document.getElementById('submit-loader');
const fileInput = document.getElementById('receipt_file');
const fileInfo = document.getElementById('file-info');
// Mobile controls
const toggleSummaryBtn = document.getElementById('toggle-summary-btn');
const toggleListBtn = document.getElementById('toggle-list-btn');
const mobileAddBtn = document.getElementById('mobile-add-btn');


let depositToDelete = null;
let allDeposits = [];
let currentPdfObjectUrl = null;

// --- Functions ---

const showSubmitLoader = (isLoading) => {
    submitLoader.style.display = isLoading ? 'block' : 'none';
    submitBtnText.style.display = isLoading ? 'none' : 'inline';
    form.querySelector('button[type="submit"]').disabled = isLoading;
};

async function fetchDeposits() {
    // پشکنینی داتای پاشەکەوتکراو
    const cachedData = localStorage.getItem('cached_deposits');
    if (cachedData) {
        allDeposits = JSON.parse(cachedData);
        renderDeposits(allDeposits);
        calculateAndRenderTotals();
    } else {
        depositsContainer.innerHTML = `<div class="loader" style="margin: 50px auto; grid-column: 1 / -1;"></div>`;
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase
        .from('deposits')
        .select(`
            *,
            deposit_holders (name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching deposits:', error);
        depositsContainer.innerHTML = `<p style="text-align: center; padding: 20px; color: #d63031; grid-column: 1 / -1;">هەڵەیەک لەکاتی هێنانی داتاکان ڕوویدا.</p>`;
        alert('هەڵەیەک لەکاتی هێنانی داتاکان ڕوویدا: ' + error.message);
        return;
    }
    
    // بەراوردکردنی داتای نوێ لەگەڵ داتای کۆن بۆ ڕێگری لە دووبارەبوونەوەی ئەنیمەیشن
    if (JSON.stringify(data) !== JSON.stringify(allDeposits)) {
        allDeposits = data;
        localStorage.setItem('cached_deposits', JSON.stringify(data)); // پاشەکەوتکردن
        renderDeposits(allDeposits);
        calculateAndRenderTotals();
    }
}

async function fetchDepositHolders() {
    // پشکنینی داتای پاشەکەوتکراو بۆ خاوەن پارەکان
    const cachedHolders = localStorage.getItem('cached_deposit_holders');
    if (cachedHolders) {
        renderHoldersList(JSON.parse(cachedHolders));
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase.from('deposit_holders').select('*');
    if (error) {
        console.error('Error fetching holders:', error);
        return;
    }
    localStorage.setItem('cached_deposit_holders', JSON.stringify(data));
    renderHoldersList(data);
}

function renderHoldersList(data) {
    const holderSelect = document.getElementById('holder_id');
    holderSelect.innerHTML = '<option value="">هەڵبژێرە...</option>';
    data.forEach(holder => {
        holderSelect.innerHTML += `<option value="${holder.id}">${holder.name}</option>`;
    });
}

function createDepositCard(deposit) {
    const card = document.createElement('div');
    card.className = 'deposit-card collapsed';
    card.id = `deposit-card-${deposit.id}`;
    card.innerHTML = `
        <div class="card-header">
            <div class="deposit-name">
                <i class='bx bxs-user-circle'></i>
                <h4>${deposit.full_name}</h4>
            </div>
            <div class="header-actions">
                <button class="action-btn btn-view collapsed-view-btn" onclick="viewReceipt('${deposit.receipt_url}', '${deposit.full_name}')" title="بینینی پسوولە"><i class='bx bx-show'></i></button>
                <button class="toggle-details-btn" onclick="toggleDepositDetails(${deposit.id})" title="پیشاندان/شاردنەوە">
                    <i class='bx bx-chevron-up'></i>
                </button>
            </div>
        </div>
        <div class="card-body">
            <div class="info-item">
                <i class='bx bx-phone'></i>
                <span>${deposit.phone_number || 'نەزانراو'}</span>
            </div>
            <div class="info-item">
                <i class='bx bx-home-alt'></i>
                <span>موڵکی ${deposit.property_number} (${deposit.property_type})</span>
            </div>
            <div class="info-item">
                <i class='bx bx-wallet'></i>
                <span class="amount-display">${Number(deposit.amount).toLocaleString()} ${deposit.currency}</span>
            </div>
            <div class="info-item">
                <i class='bx bxs-user-pin'></i>
                <span>لای: ${deposit.deposit_holders.name}</span>
            </div>
            <div class="info-item">
                <i class='bx bx-calendar-check'></i>
                <span>مێژووی دانان: ${deposit.deposit_date}</span>
            </div>
        </div>
        <div class="card-footer">
            <!-- دوگمەی بینین لێرەشە بۆ کاتی کراوەیی -->
            <button class="action-btn btn-view" onclick="viewReceipt('${deposit.receipt_url}', '${deposit.full_name}')" title="بینینی پسوولە"><i class='bx bx-show'></i></button>
            <button class="action-btn btn-edit" onclick="editDeposit(${deposit.id})" title="دەستکاری"><i class='bx bx-edit-alt'></i></button>
            <button class="action-btn btn-delete" onclick="deleteDeposit(${deposit.id}, '${deposit.receipt_url}')" title="سڕینەوە"><i class='bx bxs-trash-alt'></i></button>
        </div>
    `;
    return card;
}

window.toggleDepositDetails = (id) => {
    const card = document.getElementById(`deposit-card-${id}`);
    if (card) {
        card.classList.toggle('collapsed');
    }
};

window.filterDeposits = () => {
    const searchTerm = document.getElementById('search-deposit').value.toLowerCase();
    const filtered = allDeposits.filter(d => 
        d.full_name.toLowerCase().includes(searchTerm) ||
        (d.phone_number && d.phone_number.includes(searchTerm)) ||
        (d.property_number && d.property_number.toLowerCase().includes(searchTerm))
    );
    renderDeposits(filtered);
};

function renderDeposits(deposits) {
    depositsContainer.innerHTML = '';
    if (deposits.length === 0) {
        depositsContainer.innerHTML = '<p style="text-align: center; padding: 20px; grid-column: 1 / -1;">هیچ تۆمارێک نەدۆزرایەوە.</p>';
        return;
    }
    deposits.forEach(deposit => {
        const card = createDepositCard(deposit);
        depositsContainer.appendChild(card);
    });
}

function calculateAndRenderTotals() {
    const totals = allDeposits.reduce((acc, deposit) => {
        // دڵنیابوونەوە لەوەی کەسێک دیاری کراوە بۆ ئەوەی هەڵە نەدات
        if (!deposit.deposit_holders) return acc;

        const holderName = deposit.deposit_holders.name;
        
        if (!acc[holderName]) {
            acc[holderName] = { 'د.ع': 0, '$': 0 };
        }
        
        const currency = deposit.currency;
        const amount = Number(deposit.amount) || 0;

        if (acc[holderName][currency] !== undefined) {
            acc[holderName][currency] += amount;
        }
        
        return acc;
    }, {});

    summaryContainer.innerHTML = '';
    
    if (Object.keys(totals).length === 0) {
        return; 
    }

    const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9', '#8b5cf6', '#3b82f6', '#ec4899'];
    let colorIndex = 0;

    for (const holder in totals) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        
        const color = colors[colorIndex % colors.length];
        card.style.setProperty('--card-color', color);
        colorIndex++;

        const iqdAmount = totals[holder]['د.ع'];
        const usdAmount = totals[holder]['$'];

        card.innerHTML = `
            <h4><i class='bx bxs-user-pin'></i> ${holder}</h4>
            <div class="total-row">
                <div class="currency-info">
                    <div class="currency-icon iqd-icon"><i class='bx bx-money'></i></div>
                    <span class="currency-name">دیناری عێراقی</span>
                </div>
                <span class="amount iqd">${Number(iqdAmount).toLocaleString()}</span>
            </div>
            <div class="total-row">
                <div class="currency-info">
                    <div class="currency-icon usd-icon"><i class='bx bx-dollar'></i></div>
                    <span class="currency-name">دۆلاری ئەمریکی</span>
                </div>
                <span class="amount usd">${Number(usdAmount).toLocaleString()}</span>
            </div>
        `;
        summaryContainer.appendChild(card);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showSubmitLoader(true);

    const id = document.getElementById('deposit-id').value;
    const file = fileInput.files[0];
    let receiptUrl = document.getElementById('file-info').dataset.existingUrl || null;

    if (!navigator.onLine && file) {
        alert('ببورە، لەکاتی نەبوونی ئینتەرنێت ناتوانیت فایل بار بکەیت. تکایە فایلەکە لاببە یان چاوەڕێی ئینتەرنێت بکە.');
        showSubmitLoader(false);
        return;
    }

    // 1. Upload file if a new one is selected
    if (file) {
        // Sanitize filename to avoid issues with non-ASCII characters
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(filePath, file);

        if (uploadError) {
            alert('هەڵەیەک لەکاتی بارکردنی فایل ڕوویدا: ' + uploadError.message);
            showSubmitLoader(false);
            return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;

        // If updating, delete the old file
        const oldUrl = document.getElementById('file-info').dataset.existingUrl;
        if (id && oldUrl) {
            const oldFileName = oldUrl.split('/').pop();
            await supabase.storage.from('receipts').remove([`public/${oldFileName}`]);
        }
    }

    // 2. Prepare data for DB
    const depositData = {
        full_name: document.getElementById('full_name').value,
        phone_number: document.getElementById('phone_number').value,
        property_type: document.getElementById('property_type').value,
        property_number: document.getElementById('property_number').value,
        amount: document.getElementById('amount').value,
        currency: document.getElementById('currency').value,
        holder_id: document.getElementById('holder_id').value,
        deposit_date: document.getElementById('deposit_date').value,
        receipt_url: receiptUrl,
    };

    // Offline Handling
    if (!navigator.onLine) {
        const action = id ? 'update' : 'insert';
        saveOfflineAction('deposits', action, depositData, id);
        
        // Optimistic UI
        const fakeData = { ...depositData, id: id || Date.now(), deposit_holders: { name: '...' } }; // Holder name is tricky offline
        if (id) {
            const index = allDeposits.findIndex(d => d.id === Number(id));
            if (index !== -1) allDeposits[index] = fakeData;
            const oldCard = document.getElementById(`deposit-card-${id}`);
            const newCard = createDepositCard(fakeData);
            if (oldCard) oldCard.replaceWith(newCard);
        } else {
            allDeposits.unshift(fakeData);
            depositsContainer.prepend(createDepositCard(fakeData));
        }
        showSubmitLoader(false);
        closeModal();
        form.reset();
        return;
    }

    // 3. Insert or Update in DB
    let result;
    if (id) {
        result = await supabase.from('deposits').update(depositData).eq('id', id).select('*, deposit_holders(name)').single();
    } else {
        result = await supabase.from('deposits').insert([depositData]).select('*, deposit_holders(name)').single();
    }

    showSubmitLoader(false);

    const { data, error } = result;

    if (error) {
        alert('هەڵەیەک لەکاتی تۆمارکردنی داتا ڕوویدا: ' + error.message);
    } else {
        closeModal();
        // Optimistic UI update
        const newCard = createDepositCard(data);
        if (id) {
            const index = allDeposits.findIndex(d => d.id === Number(id));
            if (index !== -1) allDeposits[index] = data;
            const oldCard = document.getElementById(`deposit-card-${id}`);
            if (oldCard) oldCard.replaceWith(newCard);
        } else {
            allDeposits.unshift(data);
            newCard.classList.add('card-enter-active');
            depositsContainer.prepend(newCard);
        }
        calculateAndRenderTotals();
        form.reset();
    }
});

window.openModal = () => {
    form.reset();
    document.getElementById('deposit-id').value = '';
    modalTitle.textContent = 'زیادکردنی تۆماری نوێ';
    fileInfo.textContent = '';
    fileInfo.dataset.existingUrl = '';
    modal.classList.add('visible');
};

window.closeModal = () => {
    modal.classList.remove('visible');
};

window.editDeposit = (id) => {
    const deposit = allDeposits.find(d => d.id === id);
    if (!deposit) return;

    document.getElementById('deposit-id').value = deposit.id;
    document.getElementById('full_name').value = deposit.full_name;
    document.getElementById('phone_number').value = deposit.phone_number;
    document.getElementById('property_type').value = deposit.property_type;
    document.getElementById('property_number').value = deposit.property_number;
    document.getElementById('amount').value = deposit.amount;
    document.getElementById('currency').value = deposit.currency;
    document.getElementById('holder_id').value = deposit.holder_id;
    document.getElementById('deposit_date').value = deposit.deposit_date;
    
    if (deposit.receipt_url) {
        const fileName = deposit.receipt_url.split('/').pop();
        fileInfo.innerHTML = `فایلی ئێستا: <a href="${deposit.receipt_url}" target="_blank">${fileName.substring(14)}</a>`;
        fileInfo.dataset.existingUrl = deposit.receipt_url;
    } else {
        fileInfo.innerHTML = '';
        fileInfo.dataset.existingUrl = '';
    }

    modalTitle.textContent = 'دەستکاریکردنی تۆمار';
    modal.classList.add('visible');
};

window.deleteDeposit = (id, receiptUrl) => {
    depositToDelete = { id, receiptUrl };
    deleteModal.classList.add('visible');
};

window.closeDeleteModal = () => {
    deleteModal.classList.remove('visible');
    depositToDelete = null;
};

window.confirmDelete = async () => {
    if (!depositToDelete) return;

    if (!navigator.onLine) {
        saveOfflineAction('deposits', 'delete', {}, depositToDelete.id);
        allDeposits = allDeposits.filter(d => d.id !== depositToDelete.id);
        const cardToRemove = document.getElementById(`deposit-card-${depositToDelete.id}`);
        if (cardToRemove) {
            cardToRemove.classList.add('card-exit-active');
            setTimeout(() => cardToRemove.remove(), 400);
        }
        closeDeleteModal();
        return;
    }

    // 1. Delete from DB
    const { error: dbError } = await supabase
        .from('deposits')
        .delete()
        .eq('id', depositToDelete.id);

    if (dbError) {
        alert('هەڵەیەک لەکاتی سڕینەوەی داتا ڕوویدا: ' + dbError.message);
        closeDeleteModal();
        return;
    }

    // 2. Delete file from storage
    if (depositToDelete.receiptUrl) {
        const fileName = depositToDelete.receiptUrl.split('/').pop();
        const { error: storageError } = await supabase.storage
            .from('receipts')
            .remove([`public/${fileName}`]);
        
        if (storageError) {
            console.error('Could not delete file from storage:', storageError.message);
            // We don't alert the user here as the main record is deleted.
        }
    }

    closeDeleteModal();
    
    // Optimistic UI update
    allDeposits = allDeposits.filter(d => d.id !== depositToDelete.id);
    const cardToRemove = document.getElementById(`deposit-card-${depositToDelete.id}`);
    if (cardToRemove) {
        cardToRemove.classList.add('card-exit-active');
        setTimeout(() => cardToRemove.remove(), 400);
    }
    calculateAndRenderTotals();
    depositToDelete = null;
};

window.viewReceipt = async (url, name) => {
    if (!url) {
        alert('هیچ پسوولەیەک بۆ ئەم تۆمارە بارنەکراوە.');
        return;
    }
    const pdfViewer = document.getElementById('pdf-viewer');
    const downloadBtn = document.getElementById('download-pdf-btn');
    const printBtn = document.getElementById('print-pdf-btn');
    const pdfTitle = document.getElementById('pdf-title');
    
    // پیشاندانی دۆخی بارکردن
    pdfTitle.textContent = '...بارکردنی پسوولە';
    pdfViewer.src = 'about:blank';
    pdfViewerModal.classList.add('visible');

    try {
        // هێنانی PDF وەک blob
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob();

        // سڕینەوەی URLی کۆن ئەگەر هەبێت
        if (currentPdfObjectUrl) {
            URL.revokeObjectURL(currentPdfObjectUrl);
        }

        // دروستکردنی URLی نوێی ناوخۆیی
        currentPdfObjectUrl = URL.createObjectURL(blob);

        // نوێکردنەوەی UI
        pdfTitle.textContent = `پسوولەی: ${name}`;
        pdfViewer.src = currentPdfObjectUrl;
        downloadBtn.href = currentPdfObjectUrl;
        downloadBtn.download = `پسوولەی-${name}.pdf`;

        printBtn.onclick = () => {
            pdfViewer.contentWindow.print();
        };

    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('هەڵەیەک لەکاتی بارکردنی PDF ڕوویدا.');
        closePdfViewer();
    }
};

window.closePdfViewer = () => {
    document.getElementById('pdf-viewer').src = 'about:blank';
    pdfViewerModal.classList.remove('visible');
    // لابردنی URLـەکە لە یادگە بۆ ڕێگری لە بەکارهێنانی زیادەی میمۆری
    if (currentPdfObjectUrl) {
        URL.revokeObjectURL(currentPdfObjectUrl);
        currentPdfObjectUrl = null;
    }
};

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileInfo.textContent = `فایلی هەڵبژێردراو: ${fileInput.files[0].name}`;
    } else {
        fileInfo.textContent = '';
    }
});

// --- Mobile Controls Logic ---
if (toggleSummaryBtn) {
    toggleSummaryBtn.addEventListener('click', () => {
        toggleSummaryBtn.classList.toggle('active');
        const summarySection = document.getElementById('summary-container');
        if (summarySection.style.maxHeight) {
            summarySection.style.maxHeight = null;
            summarySection.style.marginBottom = '0';
        } else {
            summarySection.style.maxHeight = summarySection.scrollHeight + "px";
            summarySection.style.marginBottom = '20px';
        }
    });
}
if (toggleListBtn) {
    toggleListBtn.addEventListener('click', () => {
        toggleListBtn.classList.toggle('active');
        const listSection = document.getElementById('deposits-container');
        if (listSection.style.maxHeight) {
            listSection.style.maxHeight = null;
        } else {
            listSection.style.maxHeight = listSection.scrollHeight + "px";
        }
    });
}
if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', openModal);
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    fetchDeposits();
    fetchDepositHolders();
});

// نوێکردنەوەی داتاکان کاتێک ئینتەرنێت دەگەڕێتەوە
window.addEventListener('online', () => {
    fetchDeposits();
    fetchDepositHolders();
});