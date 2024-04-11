

import { useEffect } from 'react';

const useMapEventListeners = (
    viewerRef, 
    mapData, 
    isHovering, 
    setIsHovering, 
    setCurrentZoom, 

    setCurrentPan, 

    interactionMode, 
    goalPublisher,
    setGoalPose,
    setPath,
    setNoGoZones

) => {
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
            if (interactionMode !== 'PANNING' || !isHovering) return;
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


        const handleGoalSetting = (event) => {
            if (interactionMode !== 'SETTING_GOAL') return;
            if (!goalPublisher || !mapData.resolution) return;
            const rect = mapViewElement.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const localCoords = viewerRef.current.scene.globalToRos(pixelX, pixelY);
            console.log(`Received pixels: (${pixelX}, ${pixelY}), Origin: (${mapData.origin.x}, ${mapData.origin.y}), Resolution: ${mapData.resolution}`);

            const goal = new window.ROSLIB.Message({
                header: { stamp: { secs: 0, nsecs: 0 }, frame_id: 'map' },
                pose: { position: { x: localCoords.x, y: localCoords.y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } }
            });

            goalPublisher.publish(goal);
            setGoalPose({ x: localCoords.x, y: localCoords.y });
            console.log(`Setting goal at (${localCoords.x}, ${localCoords.y})`);
            setPath(null);
        };

        let isDragging = false;
        let startDragPosition = { x: 0, y: 0 };
        let currentRectangle = null;

        const startDrag = (event) => {
            if (interactionMode !== 'DRAWING_RECTANGLE' || !isHovering) return;
            isDragging = true;
            startDragPosition = { x: event.clientX, y: event.clientY };
            event.preventDefault();
        }

        const drag = (event) => {
            if (interactionMode !== 'DRAWING_RECTANGLE' || !isHovering) return;
            isDragging = true;
            const rect = mapViewElement.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const dragCoords = viewerRef.current.scene.globalToRos(pixelX, pixelY);
            startDragPosition = {
                x: dragCoords.x,
                y: dragCoords.y
            };
            currentRectangle = { start: startDragPosition, end: startDragPosition };
            event.preventDefault();
        };

        const endDrag = () => {
            if (!isDragging || interactionMode !== 'DRAWING_RECTANGLE') return;
            setNoGoZones(zones => [...zones, currentRectangle]);
            console.log('Rectangle:', currentRectangle);
            isDragging = false;
            currentRectangle = null
 

            // send the rectangle to the backend
            // currentRectangle.start and currentRectangle.end
        }

        mapViewElement.addEventListener('wheel', handleZoom);
        mapViewElement.addEventListener('mousedown', (event) => {
            startPan(event);
            startDrag(event);
        });
        mapViewElement.addEventListener('mousemove', (event) => {
            pan(event);
            drag(event);
        });
        mapViewElement.addEventListener('mouseup', (event) => {
            endPan();
            endDrag();
        });
        mapViewElement.addEventListener('mouseleave', (event) => {
            endPan();
            endDrag();
        });
        
        mapViewElement.addEventListener('click', handleGoalSetting);
        
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
            mapViewElement.removeEventListener('click', handleGoalSetting);
            mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
            mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
        };
    }, [
        viewerRef,
        mapData, 
        isHovering, 
        setIsHovering, 
        setCurrentZoom, 

        setCurrentPan, 

        interactionMode, 
        goalPublisher, 
        setGoalPose,
        setPath,
        setNoGoZones

    ]);
};

export default useMapEventListeners;
