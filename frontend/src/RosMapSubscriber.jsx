

import React, { useRef, useState, useEffect } from 'react';
import useStableRosConnection from './useStableRosConnection';
import useRosTopics from './useRosTopics';
import useMapEventListeners from './useMapEventListeners';
import { addGoalMarker } from './utils';
import './RosMapSubscriber.css';

const RosMapSubscriber = () => {
    const viewer = useRef(null);
    const pathShape = useRef(null); 
    const robotMarker = useRef(null);
    const [mapData, setMapData] = useState({});
    const [interactionMode, setInteractionMode] = useState('PANNING');
    const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
    const [goalPose, setGoalPose] = useState({ x: null, y: null });
    const [isHovering, setIsHovering] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(1);
    const [currentPan, setCurrentPan] = useState({ x: 0, y: 0 });
    const [goalPublisher, setGoalPublisher] = useState(null);
    const [path, setPath] = useState(null);
    const [noGoZones, setNoGoZones] = useState([]);
    const [polygonMarkers, setPolygonMarkers] = useState([]);

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
        setPath,
        setNoGoZones,
        setPolygonMarkers
    );

    useEffect(() => {
        if (viewer.current && window.ROS2D && robotPose) {
            if (!robotMarker.current) {
                robotMarker.current = new window.ROS2D.NavigationArrow({
                    size: 0.5,
                    strokeSize: 0.05,
                    fillColor: window.createjs.Graphics.getRGB(59, 51, 85, 0.8),
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
            pathShape.current = null;
        }

        if (viewer.current && goalPose.x !== null && goalPose.y !== null) {
            addGoalMarker(viewer.current, goalPose.x, goalPose.y);
        }

        console.log('noGoZones updated:', noGoZones);




    }, [viewer, robotPose, path, viewer, goalPose]);

    useEffect(() => {

        if (viewer.current && window.ROS2D && noGoZones.length > 0) {
            console.log('Drawing no go zones');
            console.log(noGoZones);

            const lastNoGoZone = noGoZones[noGoZones.length - 1];
            const noGoZoneShape = new window.ROS2D.PolygonMarker({
                lineSize: 0.05,
                lineColor: window.createjs.Graphics.getRGB(255, 0, 0),
                pointSize: 0.05,
                pointColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.3),
            });
            lastNoGoZone.points.forEach(point => {
                noGoZoneShape.addPoint(new window.ROSLIB.Vector3({ x: point.x, y: point.y }));
            }
            );

            viewer.current.scene.addChild(noGoZoneShape);
        }

    }, [noGoZones, viewer]);


    return (
        <div>
            <div className="info-section">
                <div>Robot Coordinates: X: {robotPose.x.toFixed(2)}, Y: {robotPose.y.toFixed(2)}</div>
                <div>Goal Coordinates: X: {goalPose.x ? goalPose.x.toFixed(2) : 'Not set'}, Y: {goalPose.y ? goalPose.y.toFixed(2) : 'Not set'}</div>
            </div>
            <div>
                <button className={`button ${interactionMode === 'PANNING' ? 'active' : ''}`} onClick={() => setInteractionMode('PANNING')}>
                    ✥ Panning
                </button>
                <button className={`button ${interactionMode === 'SETTING_GOAL' ? 'active' : ''}`} onClick={() => setInteractionMode('SETTING_GOAL')}>
                    🎯 Set Goal
                </button>
                <button className={`button ${interactionMode === 'DRAWING_POLYGON' ? 'active' : ''}`} onClick={() => setInteractionMode('DRAWING_POLYGON')}>
                    🖍 Draw Polygon
                </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div id="mapView" style={{ width: 500, height: 500 / (mapData.aspectRatio || 1), overflow: 'hidden' }}></div>
            </div>
        </div>
    );
};

export default RosMapSubscriber;
