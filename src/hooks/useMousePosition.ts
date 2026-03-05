import { useState, useEffect } from 'react';

/**
 * Hook que rastreia a posição do mouse na página.
 * Evita duplicar a lógica de event listener em cada componente.
 *
 * @returns {{ x: number, y: number }} Coordenadas atuais do mouse
 */
export function useMousePosition() {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    return position;
}
