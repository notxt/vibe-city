/**
 * Money Icon Component
 * SVG web component for currency/dollar icon
 */
class MoneyIcon extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="3"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
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

customElements.define('money-icon', MoneyIcon);

export { MoneyIcon };