/**
 * Population Icon Component
 * SVG web component for population/user icon
 */
class PopulationIcon extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
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

customElements.define('population-icon', PopulationIcon);

export { PopulationIcon };