

import React, { useState, useEffect, useCallback } from 'react';
import ROSLIB from 'roslib';
import './RosbridgeStatus.css';

const RosbridgeStatus = () => {
    const [allStats, setAllStats] = useState('disconnected');
    const [roslibStatus, setRoslibStatus] = useState('disconnected');
    const [rosbridgeStatus, setRosbridgeStatus] = useState('disconnected');
    const [rosMapStatus, setRosMapStatus] = useState('disconnected');
    const [amclDataStatus, setAmclDataStatus] = useState('disconnected');
    const [mapDataStatus, setMapDataStatus] = useState('disconnected');
    const [mapInitialized, setMapInitialized] = useState(false);

    const checkStatus= useCallback(()  => {
        const ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });

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

        ros.on('connection', () => {
            setRoslibStatus('connected');
            setRosbridgeStatus('connected');
            amclTopic.subscribe(() => {
                setAmclDataStatus('receiving');
            });
            mapTopic.subscribe(() => {
                setMapDataStatus('receiving');
                setMapInitialized(true); 
            });
        });

        ros.on('error', (error) => {
            console.error('Error connecting to websocket server:', error);
            setRoslibStatus('error');
            setRosbridgeStatus('error');
            setAmclDataStatus('error');
            setMapDataStatus('error');
        });

        ros.on('close', () => {
            setRoslibStatus('disconnected');
            setRosbridgeStatus('disconnected');
            setAmclDataStatus('disconnected');
            setMapDataStatus('disconnected');
            setMapInitialized(false);
        });

        return () => {
            ros.close();
            amclTopic.unsubscribe();
            mapTopic.unsubscribe();
        };
    }, []);

    useEffect(() => {
        return checkStatus(); 
    }, [checkStatus]);

    useEffect(() => {
        if (roslibStatus === 'connected' && rosbridgeStatus === 'connected' && amclDataStatus === 'receiving' && mapDataStatus === 'receiving') {
            setAllStats('All services up and running');
        } else {
            setAllStats('disconnected');
        }
    }, [roslibStatus, rosbridgeStatus, amclDataStatus, mapDataStatus]);

    return (
        <div>
            <h1>Tiago Interface Server Status</h1>
            <div className={`status-header ${allStats === 'All services up and running' ? 'connected' : 'disconnected'}`}>
                <span>{allStats}</span>
            </div>
            <div className="status-container">
                <div className={`status-indicator ${roslibStatus}`}></div>
                <span className="status-label">ROSLIB.js Status</span>
            </div>
            <div className="status-container">
                <div className={`status-indicator ${rosbridgeStatus}`}></div>
                <span className="status-label">rosbridge Connection</span>
            </div>
            {/* <div className="status-container">
                <div className={`status-indicator ${rosMapStatus}`}></div>
                <span className="status-label">Ros Map Component</span>
            </div> */}
            <div className="status-container">
                <div className={`status-indicator ${amclDataStatus}`}></div>
                <span className="status-label">AMCL Data Reception</span>
            </div>
            <div className="status-container">
                <div className={`status-indicator ${mapDataStatus}`}></div>
                <span className="status-label">Map Data Reception</span>
            </div>
            <div className="status-container">
                <div className={`status-indicator ${mapInitialized ? 'connected' : 'disconnected'}`}></div>
                <span className="status-label">Map Initialization</span>
            </div>
            <button onClick={checkStatus}>Refresh Status</button>
        </div>
    );
};

export default RosbridgeStatus;
