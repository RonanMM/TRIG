


import { useEffect } from 'react';
import jsyaml from 'js-yaml';

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
    noGoZones,
    setNoGoZones,
    setPolygonMarkers,
    yamlLog,
    setYamlLog
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
            const goal = new window.ROSLIB.Message({
                header: { stamp: { secs: 0, nsecs: 0 }, frame_id: 'map' },
                pose: { position: { x: localCoords.x, y: localCoords.y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } }
            });

            goalPublisher.publish(goal);
            setGoalPose({ x: localCoords.x, y: localCoords.y });
            setPath(null);
        };





        let isDrawingPolygon = false;
        let polygonPoints = [];
        let polygonPointsCopy = [];

        const startPolygon = (event) => {
            if (interactionMode !== 'DRAWING_POLYGON' || !isHovering) return;
            isDrawingPolygon = true;

            const rect = mapViewElement.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const startCoords = viewerRef.current.scene.globalToRos(pixelX, pixelY);
            polygonPoints = [new window.ROSLIB.Vector3({ x: startCoords.x, y: startCoords.y, z: 0 })];
            polygonPointsCopy = [startCoords];

            console.log('Starting polygon:', polygonPoints);

            event.preventDefault();
        };

        const endPolygon = (event) => {
            if (!isDrawingPolygon) return;
            const rect = mapViewElement.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const endCoords = viewerRef.current.scene.globalToRos(pixelX, pixelY);
            polygonPointsCopy.push(endCoords);

            polygonPoints.push(new window.ROSLIB.Vector3({ x: polygonPointsCopy[0].x, y: polygonPointsCopy[1].y, z: 0 }));

            polygonPoints.push(new window.ROSLIB.Vector3({ x: endCoords.x, y: endCoords.y, z: 0 }));

            polygonPoints.push(new window.ROSLIB.Vector3({ x: polygonPointsCopy[1].x, y: polygonPointsCopy[0].y, z: 0 }));

            const newEntry = {
                table0: polygonPointsCopy[0].x,
                table1: polygonPointsCopy[0].y,
                table2: endCoords.x,
                table3: endCoords.y,
            };
        
            let existingData = {};
            try {
                existingData = jsyaml.load(yamlLog) || { number_of_sub_maps: 0, vo: {} };
            } catch (error) {
                console.error("Error loading YAML:", error);
                existingData = { number_of_sub_maps: 0, vo: {} }; 
            }
        
            const newKey = `vo_${existingData.number_of_sub_maps}`;
            existingData.vo[newKey] = { submap_0: newEntry };
            existingData.number_of_sub_maps += 1;
        

            try {
                const updatedYaml = jsyaml.dump(existingData);
                setYamlLog(updatedYaml);
            } catch (error) {
                console.error('Failed to update YAML:', error);
            }
            
        
            isDrawingPolygon = false;
            polygonPoints = [];
            polygonPointsCopy = [];

        };
        



        

        mapViewElement.addEventListener('wheel', handleZoom);
        mapViewElement.addEventListener('click', handleGoalSetting);
        mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
        mapViewElement.addEventListener('mouseleave', () => {
            setIsHovering(false);
            endPan();
            endPolygon();
        });

        if (interactionMode === 'PANNING') {
            mapViewElement.addEventListener('mousedown', startPan);
            mapViewElement.addEventListener('mousemove', pan);
            mapViewElement.addEventListener('mouseup', endPan);
            mapViewElement.addEventListener('mouseleave', endPan);
        } else if (interactionMode === 'DRAWING_POLYGON') {
            mapViewElement.addEventListener('mousedown', startPolygon);
            mapViewElement.addEventListener('mouseup', endPolygon);
            mapViewElement.addEventListener('mouseleave', endPolygon);
        }

        return () => {
            mapViewElement.removeEventListener('wheel', handleZoom);
            mapViewElement.removeEventListener('click', handleGoalSetting);
            mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
            mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
            mapViewElement.removeEventListener('mousedown', startPan);
            mapViewElement.removeEventListener('mousemove', pan);
            mapViewElement.removeEventListener('mouseup', endPan);
            mapViewElement.removeEventListener('mouseleave', endPan);
            mapViewElement.removeEventListener('mousedown', startPolygon);
            mapViewElement.removeEventListener('mouseup', endPolygon);
            mapViewElement.removeEventListener('mouseleave', endPolygon);
        }
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
        noGoZones,
        setNoGoZones,
        setPolygonMarkers,
        yamlLog,
        setYamlLog
    ]);
};

export default useMapEventListeners;
