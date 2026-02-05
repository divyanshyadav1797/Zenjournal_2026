    // Important Dates Sidebar Toggle Functionality

// Initialize sidebar state
let datesSidebarOpen = false;

/**
 * Toggle the Important Dates sidebar
 * Slides in from the right when opened, slides out when closed
 */
function toggleDatesSidebar() {
    const sidebar = document.getElementById('dates-sidebar');
    const overlay = document.getElementById('dates-sidebar-overlay');
    const toggleButton = document.querySelector('[onclick="toggleDatesSidebar()"]');
    
    if (!sidebar) {
        console.error('dates-sidebar element not found');
        return;
    }
    
    datesSidebarOpen = !datesSidebarOpen;
    
    if (datesSidebarOpen) {
        // Show sidebar - slide in from right
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
        
        // Show overlay on mobile
        if (overlay && window.innerWidth < 1024) {
            overlay.classList.add('active');
        }
        
        // Trigger reflow for animation
        setTimeout(() => {
            sidebar.classList.add('sidebar-open');
        }, 10);
        
        // Update button appearance
        if (toggleButton) {
            toggleButton.classList.add('active-highlight');
        }
    } else {
        // Hide sidebar - slide out to right
        sidebar.classList.remove('sidebar-open');
        
        // Hide overlay
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            sidebar.classList.remove('flex');
            sidebar.classList.add('hidden');
        }, 400); // Match the CSS transition duration
        
        // Update button appearance
        if (toggleButton) {
            toggleButton.classList.remove('active-highlight');
        }
    }
}

/**
 * Close the Important Dates sidebar if clicking outside of it
 * Optional: Uncomment this if you want click-outside-to-close functionality
 */
function handleClickOutside(event) {
    if (!datesSidebarOpen) return;
    
    const sidebar = document.getElementById('dates-sidebar');
    const toggleButton = document.querySelector('[onclick="toggleDatesSidebar()"]');
    
    // Check if click is outside sidebar and toggle button
    if (sidebar && 
        !sidebar.contains(event.target) && 
        toggleButton && 
        !toggleButton.contains(event.target)) {
        toggleDatesSidebar();
    }
}

// Optional: Add click-outside-to-close functionality
// Uncomment the line below to enable this feature
// document.addEventListener('click', handleClickOutside);

/**
 * Close sidebar when pressing Escape key
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape' && datesSidebarOpen) {
        toggleDatesSidebar();
    }
}

// Add escape key listener
document.addEventListener('keydown', handleEscapeKey);

/**
 * Optional: Auto-close on mobile when screen is too small
 */
function handleResize() {
    const sidebar = document.getElementById('dates-sidebar');
    if (window.innerWidth < 1024 && datesSidebarOpen) {
        // On smaller screens, close the sidebar
        toggleDatesSidebar();
    }
}

// Optional: Add resize listener
// window.addEventListener('resize', handleResize);

// Console log to confirm script is loaded
console.log('Important Dates Sidebar toggle functionality loaded');