

import { useEffect, useRef } from 'react';
import ROSLIB from 'roslib';
import { getRotationFromQuaternion } from './utils';

const useRosConnection = (viewer,setMapData, setRobotPose, setIsHovering, setGoalPublisher) => {
    const ros = useRef(new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    })).current;

    useEffect(() => {
        const onConnection = () => console.log('Connected to ROS bridge.');
        const onError = (error) => console.error('Error connecting to ROS bridge:', error);
        const onClose = () => console.log('Connection to ROS bridge closed.');

        ros.on('connection', onConnection);
        ros.on('error', onError);
        ros.on('close', onClose);

        return () => {
            ros.off('connection', onConnection);
            ros.off('error', onError);
            ros.off('close', onClose);
        };
    }, [ros]);


///map topic
    useEffect(() => {
        const mapTopic = new ROSLIB.Topic({
            ros,
            name: '/map',
            messageType: 'nav_msgs/OccupancyGrid'
        });
    
        mapTopic.subscribe((message) => {
            console.log('Received map data:', message);
            setMapData({
                aspectRatio : message.info.width / message.info.height,
                resolution: message.info.resolution,
                origin: {
                    x: message.info.origin.position.x,
                    y: message.info.origin.position.y,
                },
            })

            if (window.ROS2D && !viewer.current) {
                viewer.current = new window.ROS2D.Viewer({
                    divID: 'mapView',
                    width: 600,
                    height: 600 / (message.info.width / message.info.height),
                });
                console.log("Viewer initialized", viewer.current);

                const gridClient = new window.ROS2D.OccupancyGridClient({
                    ros: ros,
                    rootObject: viewer.current.scene,
                    continuous: true,
                });

                gridClient.on('change', () => {
                    console.log("Grid client received new data");
                    viewer.current.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
                    viewer.current.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
                });
            }

        });
    
        return () => {
            mapTopic.unsubscribe();
            console.log("Unsubscribed from map topic");
        };
    }, [ros, viewer, setMapData]); 
    


///amcl pose topic
    useEffect(() => {
        const amclPoseTopic = new ROSLIB.Topic({
            ros,
            name: '/amcl_pose',
            messageType: 'geometry_msgs/PoseWithCovarianceStamped'
        });
    

        amclPoseTopic.subscribe((message) => {
            console.log('Received AMCL pose data:', message);
            const pose = message.pose.pose;
            const newPosition = {
                x: pose.position.x,
                y: pose.position.y,
                rotation: getRotationFromQuaternion(pose.orientation),
            };
            setRobotPose(newPosition);
        }
        );
    
        return () => {
            console.log('Unsubscribing from AMCL pose data.');
            amclPoseTopic.unsubscribe();
        };
    }, [ros, viewer, setRobotPose]); 



///goal publisher
    useEffect(() => {
        const onConnection = () => console.log('Connected to ROS bridge.');
        const onError = (error) => console.error('Error connecting to ROS bridge:', error);
        const onClose = () => console.log('Connection to ROS bridge closed.');

        ros.on('connection', onConnection);
        ros.on('error', onError);
        ros.on('close', onClose);

        const goalPublisher = new ROSLIB.Topic({
            ros,
            name: '/move_base_simple/goal',
            messageType: 'geometry_msgs/PoseStamped'
        });
        setGoalPublisher(goalPublisher);

        return () => {
            ros.off('connection', onConnection);
            ros.off('error', onError);
            ros.off('close', onClose);
            goalPublisher.unadvertise();
        };
    }, [setGoalPublisher]);

    return null; 
};

export default useRosConnection;
