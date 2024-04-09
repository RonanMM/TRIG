

import React, { useRef, useState, useEffect } from 'react';
import useStableRosConnection from './useStableRosConnection';
import useRosTopics from './useRosTopics';
import useMapEventListeners from './useMapEventListeners';
import { addGoalMarker } from './utils';

const RosMapSubscriber = () => {
    const viewer = useRef(null);
    const pathShape = useRef(null); 
    const [mapData, setMapData] = useState({});
    const [interactionMode, setInteractionMode] = useState('PANNING');
    const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
    const [goalPose, setGoalPose] = useState({ x: null, y: null });
    const robotMarker = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(1);
    const [currentPan, setCurrentPan] = useState({ x: 0, y: 0 });
    const [goalPublisher, setGoalPublisher] = useState(null);
    const [path, setPath] = useState(null);

    const ros = useStableRosConnection('ws://localhost:9090');

    useRosTopics(
        ros,
        viewer,
        setMapData,
        setRobotPose,
        setIsHovering,
        setGoalPublisher,
        setPath
    );

    useMapEventListeners(
        viewer,
        mapData,
        isHovering,
        setIsHovering,
        setCurrentZoom,
        setCurrentPan,
        interactionMode,
        goalPublisher,
        setGoalPose,
        setPath
    );

    useEffect(() => {
        if (viewer.current && goalPose.x !== null && goalPose.y !== null) {
            addGoalMarker(viewer.current, goalPose.x, goalPose.y);
        }
    }, [goalPose]);

    useEffect(() => {
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

        if (viewer.current && window.ROS2D && path) {
            if (!pathShape.current) {
                pathShape.current = new window.ROS2D.PathShape({
                    strokeSize: 0.05,
                    strokeColor: window.createjs.Graphics.getRGB(255, 165, 0)
                });
                viewer.current.scene.addChild(pathShape.current);
            }
            pathShape.current.setPath(path);
        } else if (pathShape.current) {
            viewer.current.scene.removeChild(pathShape.current);
            pathShape.current = null; // Ensure to reset the reference
        }
    }, [robotPose, path, viewer.current]);

    const toggleInteractionMode = () => {
        setInteractionMode(prevMode => prevMode === 'PANNING' ? 'SETTING_GOAL' : 'PANNING');
    };

    return (
        <div>
            <h1>Tiago Map Data</h1>
            <div>Robot Coordinates: X: {robotPose.x.toFixed(2)}, Y: {robotPose.y.toFixed(2)}</div>
            <div>Goal Coordinates: X: {goalPose.x ? goalPose.x.toFixed(2) : 'Not set'}, Y: {goalPose.y ? goalPose.y.toFixed(2) : 'Not set'}</div>
            <button onClick={toggleInteractionMode}>
                {interactionMode === 'PANNING' ? 'Switch to Setting Goal' : 'Switch to Panning'}
            </button>
            <div id="mapView" style={{ width: 600, height: 600 / (mapData.aspectRatio || 1), display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}></div>
        </div>
    );
};

export default RosMapSubscriber;
