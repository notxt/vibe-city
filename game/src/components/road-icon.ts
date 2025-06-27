/**
 * Road Icon Component
 * SVG web component for road infrastructure icon
 */
class RoadIcon extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 12h20"/>
                <path d="M2 8h20"/>
                <path d="M2 16h20"/>
                <circle cx="7" cy="12" r="1" fill="currentColor"/>
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                <circle cx="17" cy="12" r="1" fill="currentColor"/>
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

customElements.define('road-icon', RoadIcon);

export { RoadIcon };