/**
 * Industrial Factory Icon Component
 * SVG web component for factory building icon
 */
class FactoryIcon extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="14" width="20" height="8"/>
                <rect x="6" y="10" width="4" height="4"/>
                <rect x="14" y="6" width="4" height="8"/>
                <path d="M10 2v6l2-2 2 2V2"/>
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

customElements.define('factory-icon', FactoryIcon);

export { FactoryIcon };