

import { useEffect } from 'react';

const useMapEventListeners = (viewerRef, isHovering, setIsHovering, setCurrentZoom, setCurrentPan) => {
    useEffect(() => {
        const mapViewElement = document.getElementById('mapView');

        if (!mapViewElement) {
            console.error('Map view element not found');
            return;
        }

        const handleZoom = (event) => {
            event.preventDefault();
            const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
            if (viewerRef.current && viewerRef.current.scene) {
                const scale = viewerRef.current.scene.scaleX * zoomFactor;
                viewerRef.current.scene.scaleX = viewerRef.current.scene.scaleY = scale;
                viewerRef.current.scene.update();

                setCurrentZoom(scale);
            }
        };

        let isPanning = false;
        let startingPosition = { x: 0, y: 0 };

        const startPan = (event) => {
            if (!isHovering) return;
            isPanning = true;
            startingPosition = { x: event.clientX, y: event.clientY };
            event.preventDefault();
        };

        const pan = (event) => {
            if (!isPanning || !viewerRef.current || !viewerRef.current.scene) return;
            const dx = event.clientX - startingPosition.x;
            const dy = event.clientY - startingPosition.y;
            viewerRef.current.scene.x += dx;
            viewerRef.current.scene.y += dy;
            viewerRef.current.scene.update();

            setCurrentPan({ x: viewerRef.current.scene.x, y: viewerRef.current.scene.y });

            startingPosition = { x: event.clientX, y: event.clientY };
        };

        const endPan = () => {
            isPanning = false;
        };

        mapViewElement.addEventListener('wheel', handleZoom);
        mapViewElement.addEventListener('mousedown', startPan);
        mapViewElement.addEventListener('mousemove', pan);
        mapViewElement.addEventListener('mouseup', endPan);
        mapViewElement.addEventListener('mouseleave', endPan);

        mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
        mapViewElement.addEventListener('mouseleave', () => {
            setIsHovering(false);
            endPan();
        });

        return () => {
            mapViewElement.removeEventListener('wheel', handleZoom);
            mapViewElement.removeEventListener('mousedown', startPan);
            mapViewElement.removeEventListener('mousemove', pan);
            mapViewElement.removeEventListener('mouseup', endPan);
            mapViewElement.removeEventListener('mouseleave', endPan);

            mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
            mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
        };
    }, [viewerRef, isHovering, setIsHovering, setCurrentZoom, setCurrentPan]);
};

export default useMapEventListeners;
