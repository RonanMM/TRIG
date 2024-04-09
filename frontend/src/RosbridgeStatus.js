

import React, { useState, useEffect, useCallback } from 'react';
import ROSLIB from 'roslib';
import './RosbridgeStatus.css';

const RosbridgeStatus = () => {
    const [roslibStatus, setRoslibStatus] = useState('Disconnected');
    const [rosbridgeStatus, setRosbridgeStatus] = useState('Disconnected');
    const [amclDataStatus, setAmclDataStatus] = useState('Not receiving');
    const [mapDataStatus, setMapDataStatus] = useState('Not receiving');
    const [goalDataStatus, setGoalDataStatus] = useState('Not receiving');
    const [pathDataStatus, setPathDataStatus] = useState('Not receiving'); 
    const [networkLatency, setNetworkLatency] = useState('N/A');
    const [allServicesUp, setAllServicesUp] = useState(false);

    const checkStatus = useCallback(() => {
        const ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });

        ros.on('connection', () => {
            console.log('Connected to ROS bridge.');
            setRoslibStatus('Connected');
            setRosbridgeStatus('Connected');
            measureLatency(ros);
        });

        ros.on('error', (error) => {
            console.error('Error connecting to websocket server:', error);
            setRoslibStatus('Error');
            setRosbridgeStatus('Error');
            setAmclDataStatus('Error');
            setMapDataStatus('Error');
            setGoalDataStatus('Error');
            setPathDataStatus('Error'); 
        });

        ros.on('close', () => {
            console.log('Connection to ROS bridge closed.');
            setRoslibStatus('Disconnected');
            setRosbridgeStatus('Disconnected');
            setAmclDataStatus('Disconnected');
            setMapDataStatus('Disconnected');
            setGoalDataStatus('Disconnected');
            setPathDataStatus('Disconnected'); 
        });

        const amclTopic = new ROSLIB.Topic({
            ros,
            name: '/amcl_pose',
            messageType: 'geometry_msgs/PoseWithCovarianceStamped'
        });

        const mapTopic = new ROSLIB.Topic({
            ros,
            name: '/map',
            messageType: 'nav_msgs/OccupancyGrid'
        });

        const goalTopic = new ROSLIB.Topic({
            ros,
            name: '/move_base_simple/goal',
            messageType: 'geometry_msgs/PoseStamped'
        });

        const pathTopic = new ROSLIB.Topic({
            ros,
            name: '/move_base/GlobalPlanner/plan', 
            messageType: 'nav_msgs/Path'
        });

        amclTopic.subscribe(() => {
            setAmclDataStatus('Receiving data');
        });

        mapTopic.subscribe(() => {
            setMapDataStatus('Receiving data');
        });

        goalTopic.subscribe(() => {
            setGoalDataStatus('Receiving data');
        });

        pathTopic.subscribe(() => {
            setPathDataStatus('Receiving data'); 
        });

        return () => {
            amclTopic.unsubscribe();
            mapTopic.unsubscribe();
            goalTopic.unsubscribe();
            pathTopic.unsubscribe();
            ros.close();
        };
    }, []);

    useEffect(() => {
        checkStatus(); 
    }, [checkStatus]);

    useEffect(() => {
        if (roslibStatus === 'Connected' && rosbridgeStatus === 'Connected' &&
            amclDataStatus === 'Receiving data' && mapDataStatus === 'Receiving data' 
            // && goalDataStatus === 'Receiving data' && pathDataStatus === 'Receiving data'
        ) {
            setAllServicesUp(true);
        } else {
            setAllServicesUp(false);
        }
    }, [roslibStatus, rosbridgeStatus, amclDataStatus, mapDataStatus, goalDataStatus, pathDataStatus]);

    const measureLatency = (ros) => {
        const startTime = Date.now();
        ros.getParams(() => {
            const latency = Date.now() - startTime;
            setNetworkLatency(`${latency} ms`);
        });
    };

    return (
        <div>
            <h1>Tiago Interface Server Status</h1>
            <div className="latency-display">
                <span>Network Latency: {networkLatency}</span>
            </div>
            <div className={`status-header ${allServicesUp ? 'connected' : 'disconnected'}`}>
                <span>All Services Status: {allServicesUp ? 'Up and Running' : 'Issues Detected'}</span>
            </div>
            {renderStatusIndicator(roslibStatus, "ROSLIB.js Status")}
            {renderStatusIndicator(rosbridgeStatus, "Rosbridge Connection")}
            {renderStatusIndicator(amclDataStatus, "AMCL Data Reception")}
            {renderStatusIndicator(mapDataStatus, "Map Data Reception")}
            {renderStatusIndicator(goalDataStatus, "Goal Data Reception")}
            {renderStatusIndicator(pathDataStatus, "Path Data Reception")}

        </div>
    );
};

function renderStatusIndicator(status, label) {
    const statusClass = status === 'Receiving data' ? 'connected' :
                        status.includes('Not receiving') ? 'not-receiving' :
                        status.toLowerCase();
    return (
        <div className="status-container">
            <div className={`status-indicator ${statusClass}`}></div>
            <span className="status-label">{label}: {status}</span>
        </div>
    );
}

export default RosbridgeStatus;
