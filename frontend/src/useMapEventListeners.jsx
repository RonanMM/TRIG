



import { useEffect, useRef } from 'react';
import ROSLIB from 'roslib';
import { screenToMapCoordinates } from './utils';

const useMapEventListeners = (
    viewerRef, 
    mapData, 
    isHovering, 
    setIsHovering, 
    //currentPan,
    //currentZoom,
    setCurrentZoom,
    setCurrentPan, 
    interactionMode, 
    goalPublisher,
    setGoalPose

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

    
        const goal = new ROSLIB.Message({
            header: { stamp: { secs: 0, nsecs: 0 }, frame_id: 'map' },
            pose: { position: { x: localCoords.x, y: localCoords.y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } }
        });
    
        goalPublisher.publish(goal);
        setGoalPose({ x: localCoords.x, y: localCoords.y });
        console.log(`Setting goal at (${localCoords.x}, ${localCoords.y})`);
    };

        mapViewElement.addEventListener('wheel', handleZoom);
        mapViewElement.addEventListener('mousedown', startPan);
        mapViewElement.addEventListener('mousemove', pan);
        mapViewElement.addEventListener('mouseup', endPan);
        mapViewElement.addEventListener('mouseleave', endPan);
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
        //currentPan,
        //currentZoom,
        setCurrentZoom, 
        setCurrentPan, 
        interactionMode, 
        goalPublisher, 
        setGoalPose]);
};

export default useMapEventListeners;

// import { useEffect, useRef } from 'react';
// import ROSLIB from 'roslib';
// import { screenToMapCoordinates,addGoalMarker,updateMarkerInteraction } from './utils';

// const useMapEventListeners = (
//     viewerRef, 
//     mapData, 
//     isHovering, 
//     setIsHovering, 
//     setCurrentZoom,
//     setCurrentPan, 
//     interactionMode, 
//     goalPublisher,
//     mapViewElement,
//     setGoalPose

//     ) => {



//     useEffect(() => {
        

//         if (!mapViewElement) {
//             console.error('Map view element not found');
//             return;
//         }

//         const handleZoom = (event) => {
//             event.preventDefault();
//             const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
//             if (viewerRef.current && viewerRef.current.scene) {
//                 const scale = viewerRef.current.scene.scaleX * zoomFactor;
//                 viewerRef.current.scene.scaleX = viewerRef.current.scene.scaleY = scale;
//                 viewerRef.current.scene.update();

//                 setCurrentZoom(scale);
//             }
//         };

//         let isPanning = false;
//         let startingPosition = { x: 0, y: 0 };

//         const startPan = (event) => {
//             if (interactionMode !== 'PANNING' || !isHovering) return;
//             isPanning = true;
//             startingPosition = { x: event.clientX, y: event.clientY };
//             event.preventDefault();
//         };

//         const pan = (event) => {
//             if (!isPanning || !viewerRef.current || !viewerRef.current.scene) return;
//             const dx = event.clientX - startingPosition.x;
//             const dy = event.clientY - startingPosition.y;
//             viewerRef.current.scene.x += dx;
//             viewerRef.current.scene.y += dy;
//             viewerRef.current.scene.update();

//             setCurrentPan({ x: viewerRef.current.scene.x, y: viewerRef.current.scene.y });

//             startingPosition = { x: event.clientX, y: event.clientY };
//         };

//         const endPan = () => {
//             isPanning = false;
//         };

//         const handleGoalSetting = (event) => {
//             if (interactionMode !== 'SETTING_GOAL') return;
//             if (!goalPublisher || !mapData.resolution) return;

//             const rect = mapViewElement.getBoundingClientRect();

//             const pixelX = event.clientX - rect.left;
//             const pixelY = event.clientY - rect.top;

//             const localCoords = viewerRef.current.scene.globalToRos(pixelX, pixelY);

//             console.log(`Received pixels: (${pixelX}, ${pixelY}), Origin: (${mapData.origin.x}, ${mapData.origin.y}), Resolution: ${mapData.resolution}`);

//             const goal = new ROSLIB.Message({
//                 header: { stamp: { secs: 0, nsecs: 0 }, frame_id: 'map' },
//                 pose: { position: { x: localCoords.x, y: localCoords.y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } }
//             });
    
//             goalPublisher.publish(goal);
//             setGoalPose({ x: localCoords.x, y: localCoords.y });
//             console.log(`Setting goal at (${localCoords.x}, ${localCoords.y})`);
//         };

//         updateMarkerInteraction(interactionMode === 'SETTING_GOAL');

//         mapViewElement.addEventListener('wheel', handleZoom);
//         mapViewElement.addEventListener('mousedown', startPan);
//         mapViewElement.addEventListener('mousemove', pan);
//         mapViewElement.addEventListener('mouseup', endPan);
//         mapViewElement.addEventListener('mouseleave', endPan);
//         mapViewElement.addEventListener('click', handleGoalSetting);

//         mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
//         mapViewElement.addEventListener('mouseleave', () => {
//             setIsHovering(false);
//             endPan();
//         });

//         return () => {
//             mapViewElement.removeEventListener('wheel', handleZoom);
//             mapViewElement.removeEventListener('mousedown', startPan);
//             mapViewElement.removeEventListener('mousemove', pan);
//             mapViewElement.removeEventListener('mouseup', endPan);
//             mapViewElement.removeEventListener('mouseleave', endPan);
//             mapViewElement.removeEventListener('click', handleGoalSetting);

//             mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
//             mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
//         };
//     }, [
//         viewerRef,
//         mapData, 
//         isHovering, 
//         setIsHovering, 
//         //currentPan,
//         //currentZoom,
//         setCurrentZoom, 
//         setCurrentPan, 
//         interactionMode, 
//         goalPublisher, 
//         setGoalPose
//     ]);
// };

// export default useMapEventListeners;

// import ROSLIB from 'roslib';
// import { useEffect } from 'react';
// import { screenToMapCoordinates, addGoalMarker, updateMarkerInteraction } from './utils';

// const useMapEventListeners = (
//     viewerRef,
//     mapData,
//     isHovering,
//     setIsHovering,
//     setCurrentZoom,
//     setCurrentPan,
//     interactionMode,
//     goalPublisher,
//     mapViewElement,
//     setGoalPose
// ) => {
//     useEffect(() => {
//         if (!mapViewElement) {
//             console.error('Map view element not found');
//             return;
//         }

//         const handleZoom = (event) => {
//             event.preventDefault();
//             const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
//             if (viewerRef.current && viewerRef.current.scene) {
//                 const scale = viewerRef.current.scene.scaleX * zoomFactor;
//                 viewerRef.current.scene.scaleX = viewerRef.current.scene.scaleY = scale;
//                 viewerRef.current.scene.update();
//                 setCurrentZoom(scale);
//             }
//         };

//         let isPanning = false;
//         let startingPosition = { x: 0, y: 0 };

//         const startPan = (event) => {
//             if (interactionMode !== 'PANNING' || !isHovering) return;
//             isPanning = true;
//             startingPosition = { x: event.clientX, y: event.clientY };
//             event.preventDefault();
//         };

//         const pan = (event) => {
//             if (!isPanning || !viewerRef.current || !viewerRef.current.scene) return;
//             const dx = event.clientX - startingPosition.x;
//             const dy = event.clientY - startingPosition.y;
//             viewerRef.current.scene.x += dx;
//             viewerRef.current.scene.y += dy;
//             viewerRef.current.scene.update();
//             setCurrentPan({ x: viewerRef.current.scene.x, y: viewerRef.current.scene.y });
//             startingPosition = { x: event.clientX, y: event.clientY };
//         };

//         const endPan = () => isPanning = false;

//         const handleGoalSetting = (event) => {
//             if (interactionMode !== 'SETTING_GOAL' || !goalPublisher) return;
//             const rect = mapViewElement.getBoundingClientRect();
//             const pixelX = event.clientX - rect.left;
//             const pixelY = event.clientY - rect.top;
//             const { x, y } = screenToMapCoordinates(pixelX, pixelY, mapData.origin.x, mapData.origin.y, mapData.resolution);
//             const goal = new ROSLIB.Message({
//                 header: { stamp: { secs: 0, nsecs: 0 }, frame_id: 'map' },
//                 pose: { position: { x, y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } }
//             });
//             goalPublisher.publish(goal);
//             setGoalPose({ x, y });
//             addGoalMarker(viewerRef.current, x, y);
//         };

//         mapViewElement.addEventListener('wheel', handleZoom);
//         mapViewElement.addEventListener('mousedown', startPan);
//         mapViewElement.addEventListener('mousemove', pan);
//         mapViewElement.addEventListener('mouseup', endPan);
//         mapViewElement.addEventListener('mouseleave', endPan);
//         mapViewElement.addEventListener('click', handleGoalSetting);
//         mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
//         mapViewElement.addEventListener('mouseleave', () => {
//             setIsHovering(false);
//             endPan();
//         });

//         return () => {
//             mapViewElement.removeEventListener('wheel', handleZoom);
//             mapViewElement.removeEventListener('mousedown', startPan);
//             mapViewElement.removeEventListener('mousemove', pan);
//             mapViewElement.removeEventListener('mouseup', endPan);
//             mapViewElement.removeEventListener('mouseleave', endPan);
//             mapViewElement.removeEventListener('click', handleGoalSetting);
//             mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
//             mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
//         };
//     }, [
//         viewerRef,
//         mapData,
//         isHovering,
//         setIsHovering,
//         setCurrentZoom,
//         setCurrentPan,
//         interactionMode,
//         goalPublisher,
//         mapViewElement,
//         setGoalPose
//     ]);
// };

// export default useMapEventListeners;