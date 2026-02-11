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
            userEmailDisplay.textContent = session.user.email;
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