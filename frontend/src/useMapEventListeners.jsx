

import { useEffect } from 'react';

const useMapEventListeners = (isHovering, viewer, setIsHovering) => {
    useEffect(() => {
        const mapViewElement = document.getElementById('mapView');
        if (!mapViewElement || !viewer.current) return;

        const handleZoom = (event) => {
            if (!isHovering) return;
            event.preventDefault();
            const zoomFactor = 1.01;
            const direction = event.deltaY < 0 ? 1 : -1;
            viewer.current.scaleToDimensions(
                viewer.current.scene.scaleX * (direction > 0 ? zoomFactor : 1 / zoomFactor),
                viewer.current.scene.scaleY * (direction > 0 ? zoomFactor : 1 / zoomFactor)
            );
        };

        mapViewElement.addEventListener('wheel', handleZoom);
        mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
        mapViewElement.addEventListener('mouseleave', () => setIsHovering(false));

        return () => {
            mapViewElement.removeEventListener('wheel', handleZoom);
            mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
            mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
        };
    }, [isHovering, viewer, setIsHovering]);
};

export default useMapEventListeners;
