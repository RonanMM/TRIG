



import { useEffect, useState } from 'react';
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
    setYamlLog,
    endPolygonState,
    setEndPolygonState
) => {

    const [currentPoints, setCurrentPoints] = useState([]);

    const [polygonCounter, setPolygonCounter] = useState(0);



    useEffect(() => {
        if (endPolygonState) {
            finalizePolygon();
            setEndPolygonState(false); 
        }
    }, [endPolygonState, currentPoints, yamlLog, polygonCounter]);

        
    const finalizePolygon = () => {
        setCurrentPoints(currentPoints => {
            updateYAML(currentPoints, true);  
            return [];  
        });
    };


    const updateYAML = (points) => {
        let existingData = jsyaml.load(yamlLog) || { numberOfSubMaps: 1, vo: { submap_0: {} } };
        
        setYamlLog(jsyaml.dump(existingData));
    };

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

        const handleGoalSetting = (event) => {
            if (interactionMode !== 'SETTING_GOAL') return;
            const rect = mapViewElement.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const coords = viewerRef.current.scene.globalToRos(pixelX, pixelY);
            const goal = new window.ROSLIB.Message({
                header: { stamp: { secs: 0, nsecs: 0 }, frame_id: 'map' },
                pose: { position: { x: coords.x, y: coords.y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } }
            });
            goalPublisher.publish(goal);
            setGoalPose({ x: coords.x, y: coords.y });
            setPath(null);
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


        const startPolygon = (event) => {
            if (interactionMode !== 'DRAWING_POLYGON' || !isHovering) return;
            const rect = mapViewElement.getBoundingClientRect();
            const pixelX = event.clientX - rect.left;
            const pixelY = event.clientY - rect.top;
            const coords = viewerRef.current.scene.globalToRos(pixelX, pixelY);
        
            setCurrentPoints(currentPoints => {
                const updatedPoints = [...currentPoints, coords];
                updateYAML(updatedPoints, false);  
                return updatedPoints;
            });
        };

        const updateYAML = (points, finalize) => {
            let existingData = {};
            try {
                existingData = jsyaml.load(yamlLog) || { numberOfSubMaps: 1, vo: { submap_0: {} } };
            } catch (error) {
                console.error("Error parsing YAML", error);
                existingData = { numberOfSubMaps: 1, vo: { submap_0: {} } };
            }
        
            if (finalize) {

                polygonCounter++; 
            } else {

                const obstacleKey = `obstacle${polygonCounter}`;
                points.forEach((point, index) => {
                    const key = `vo_${polygonCounter * 1000 + index}`;
                    existingData.vo.submap_0[key] = ["submap_0", obstacleKey, point.x, point.y, 0.0];
                });
                console.log("Temporary polygon points", points);
            }
        
            setYamlLog(jsyaml.dump(existingData));
        };

        mapViewElement.addEventListener('wheel', handleZoom);
        mapViewElement.addEventListener('click', handleGoalSetting);
        mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
        mapViewElement.addEventListener('mouseleave', () => {
            setIsHovering(false);
            endPan();

        });

        if (interactionMode === 'PANNING') {
            mapViewElement.addEventListener('mousedown', startPan);
            mapViewElement.addEventListener('mousemove', pan);
            mapViewElement.addEventListener('mouseup', endPan);
            mapViewElement.addEventListener('mouseleave', endPan);
        } else if (interactionMode === 'DRAWING_POLYGON') {
            mapViewElement.addEventListener('mousedown', startPolygon);

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
        setYamlLog,
        polygonCounter, 
        setPolygonCounter,
        endPolygonState,
        setEndPolygonState
    ]);

    useEffect(() => {
        if (endPolygonState) {
            setPolygonCounter(polygonCounter + 1); 

            setEndPolygonState(false); 
        }
    }, [endPolygonState, polygonCounter, setEndPolygonState]);
};

export default useMapEventListeners;

