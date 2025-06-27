/**
 * Bulldozer Icon Component
 * SVG web component for bulldoze/demolition icon
 */
class BulldozerIcon extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="10" width="14" height="6" rx="1"/>
                <rect x="4" y="6" width="6" height="4" rx="1"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="12" cy="18" r="2"/>
                <path d="M16 13l6-3v6l-6-3z"/>
                <line x1="2" y1="13" x2="1" y2="13"/>
            </svg>
        `;
        
        // Apply default styling
        const svg = this.querySelector('svg');
        if (svg) {
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.display = 'block';
        }
    }
}

customElements.define('bulldozer-icon', BulldozerIcon);

export { BulldozerIcon };