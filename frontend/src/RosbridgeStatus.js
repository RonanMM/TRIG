

import React, {useState, useEffect} from 'react';

import ROSLIB from 'roslib';
import './RosbridgeStatus.css';

const RosbridgeStatus = () => {
    const [allStats, setAllStats] = useState('disconnected')
    const [roslibStatus, setRoslibStatus] = useState('disconnected');
    const [rosbridgeStatus, setRosbridgeStatus] = useState('disconnected');
    const [rosMapStatus, setRosMapStatus ] = useState('disconnected')

    useEffect(() => {
        const ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });

        ros.on('connection', () => {
            setRoslibStatus('connected');
            setRosbridgeStatus('connected');
        });

        ros.on('error', (error) => {
            console.error('Error connecting to websocket server: ', error);
            setRoslibStatus('error');
            setRosbridgeStatus('error');
        });

        ros.on('close', () => {
            setRoslibStatus('disconnected');
            setRosbridgeStatus('disconnected');
        });
        
        if (roslibStatus == 'disconnected'){
            setAllStats('disconnected');
        }
        if (rosbridgeStatus == 'disconnected'){
            setAllStats('disconnected');
        }
        if (rosMapStatus ==  'disconnected'){
            setAllStats('disconnected');
        }
        else {
            setAllStats('All services up and running ')
        }
                

        


        return () => ros.close();
    }, []);



    return (
        <div>
            <h1>Tiago Interface Server Status</h1>
            <div className={`status-header ${allStats}`}>
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
            <div className="status-container">
                <div className={`status-indicator ${rosMapStatus}`}></div>
                <span className="status-label">Ros Map component</span>
            </div>
        </div>
    );
};

export default RosbridgeStatus;