

import React, { useRef, useState, useEffect } from 'react';
import useRosConnection from './useRosConnection';
import useMapEventListeners from './useMapEventListeners';


const RosMapSubscriber = () => {
    const viewer = useRef(null);
    const [mapData, setMapData] = useState({});
    const [interactionMode, setInteractionMode] = useState('PANNING');
    const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
    const robotMarker = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(1);
    const [currentPan, setCurrentPan] = useState({ x: 0, y: 0 });
    const [goalPublisher, setGoalPublisher] = useState(null);

    useRosConnection(viewer, setMapData, setRobotPose, setIsHovering, setGoalPublisher);
    useMapEventListeners(viewer, mapData, isHovering, setIsHovering, setCurrentZoom, setCurrentPan, interactionMode, goalPublisher);

    

    useEffect(() => {
        console.log("Robot pose updated:", robotPose);
        if (viewer.current && window.ROS2D && robotPose) {
            if (!robotMarker.current) {
                robotMarker.current = new window.ROS2D.NavigationArrow({
                    size: 0.5,
                    strokeSize: 0.05,
                    fillColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.66),
                    pulse: true,
                });
                viewer.current.scene.addChild(robotMarker.current);
            }

            robotMarker.current.x = robotPose.x;
            robotMarker.current.y = -robotPose.y;
            robotMarker.current.rotation = robotPose.rotation;

        }
    }, [robotPose, viewer.current, currentZoom, currentPan]);

    const toggleInteractionMode = () => {
        setInteractionMode(prevMode => prevMode === 'PANNING' ? 'SETTING_GOAL' : 'PANNING');
    };

    return (
        <div>
            <h1>ROS Map Data</h1>
            <button onClick={toggleInteractionMode}>
                {interactionMode === 'PANNING' ? 'Switch to Setting Goal' : 'Switch to Panning'}
            </button>
            <div
                style={{ width: 600, height: 600 / (mapData.aspectRatio), display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
                id="mapView"
            ></div>
        </div>
    );
};

export default RosMapSubscriber;

