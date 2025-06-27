/**
 * Commercial Shop Icon Component
 * SVG web component for retail shop building icon
 */
class ShopIcon extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="8" width="16" height="14" rx="1"/>
                <path d="M2 8l2-6h16l2 6"/>
                <rect x="7" y="12" width="4" height="6"/>
                <rect x="13" y="12" width="4" height="6"/>
                <path d="M9 15h2"/>
                <path d="M15 15h2"/>
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

customElements.define('shop-icon', ShopIcon);

export { ShopIcon };