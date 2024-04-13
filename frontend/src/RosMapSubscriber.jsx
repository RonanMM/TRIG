

import React, { useRef, useState, useEffect } from 'react';
import useStableRosConnection from './useStableRosConnection';
import useRosTopics from './useRosTopics';
import useMapEventListeners from './useMapEventListeners';
import { addGoalMarker } from './utils';
import jsyaml from 'js-yaml';
import './RosMapSubscriber.css';

const RosMapSubscriber = () => {
    const viewer = useRef(null);
    const pathShape = useRef(null); 
    const robotMarker = useRef(null);
    const noGoZoneShapes = useRef([]);
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
    const [yamlLog, setYamlLog] = useState([]);

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
        noGoZones,
        setNoGoZones,
        setPolygonMarkers,
        yamlLog,
        setYamlLog
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


    }, [viewer, robotPose, path, viewer, goalPose]);

    useEffect(() => {
        if (yamlLog.length >0) { 
            try {
                const newYamlObject = jsyaml.load(yamlLog);
                const newNoGoZones = [];
    
                Object.values(newYamlObject.vo).forEach(voEntry => {
                    const submap = voEntry.submap_0; 
                    const x1 = submap.table0, y1 = submap.table1;
                    const x2 = submap.table2, y2 = submap.table3;
                    const points = [];
    
                    
                    points.push({ x: x1, y: y1, z: 0 }); 
                    points.push({ x: x2, y: y1, z: 0 }); 
                    points.push({ x: x2, y: y2, z: 0 }); 
                    points.push({ x: x1, y: y2, z: 0 }); 
    
                    newNoGoZones.push({ points });
                });
    
                setNoGoZones(newNoGoZones);
                console.log("New no go zones:", newNoGoZones);
            } catch (error) {
                console.error('Failed to parse YAML:', error);
            }
        }
    }, [yamlLog]);


    useEffect(() => {


        if (viewer.current && window.ROS2D && noGoZones.length > 0) {

            noGoZoneShapes.current.forEach(shape => viewer.current.scene.removeChild(shape));
            noGoZoneShapes.current = [];

            noGoZones.forEach(zone => {
                const noGoZoneShape = new window.ROS2D.PolygonMarker({
                    lineSize: 0.05,
                    lineColor: window.createjs.Graphics.getRGB(255, 0, 0),
                    pointSize: 0.05,
                    pointColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.3),
                });

                zone.points.forEach(point => {
                    noGoZoneShape.addPoint(new window.ROSLIB.Vector3({ x: point.x, y: point.y }));
                });

                viewer.current.scene.addChild(noGoZoneShape);
                noGoZoneShapes.current.push(noGoZoneShape); 
            });

            console.log('Drawing no go zones:', noGoZones);
        }
    }, [noGoZones, viewer]);


    return (
        <div>
        
            <div className="info-section">
                <div>Robot Coordinates: X: {robotPose.x.toFixed(2)}, Y: {robotPose.y.toFixed(2)}</div>
                <div>Goal Coordinates: X: {goalPose.x ? goalPose.x.toFixed(2) : 'Not set'}, Y: {goalPose.y ? goalPose.y.toFixed(2) : 'Not set'}</div>
            </div>
            <div className="container">

                <div className="left-section">
                    
                    <div className="button-container">
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
                    <textarea
                        className="yaml-input"
                        value={yamlLog || ''}
                        onChange={(e) => setYamlLog([e.target.value])} 
                        rows="10"
                        cols="50"
                    />
                </div>
                <div className="right-section">
                    <div id="mapView" style={{}}></div>
                </div>
            </div>
        </div>
    );
};

export default RosMapSubscriber;
