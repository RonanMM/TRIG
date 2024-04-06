

import React, { useRef, useState, useEffect } from 'react';
import useRosConnection from './useRosConnection';
import useMapEventListeners from './useMapEventListeners';


const RosMapSubscriber = () => {
    const viewer = useRef(null);
    const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
    const robotMarker = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(1);
    const [currentZoom, setCurrentZoom] = useState(1);
    const [currentPan, setCurrentPan] = useState({ x: 0, y: 0 });

    useRosConnection(viewer, setAspectRatio, setRobotPose, setIsHovering);
    useMapEventListeners(viewer, isHovering, setIsHovering, setCurrentZoom, setCurrentPan);

    

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

            if (viewer.current && viewer.current.scene) {
                viewer.current.scene.scaleX = viewer.current.scene.scaleY = currentZoom;
                viewer.current.scene.x = currentPan.x;
                viewer.current.scene.y = currentPan.y;
                viewer.current.scene.update();
            }
        }
    }, [robotPose, currentZoom, currentPan]);

    return (
        <div>
            <h1>ROS Map Data</h1>
            <div
                style={{ width: 600, height: 600 / aspectRatio, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
                id="mapView"
            ></div>
        </div>
    );
};

export default RosMapSubscriber;

