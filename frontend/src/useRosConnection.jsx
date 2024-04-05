

import { useEffect } from 'react';
import ROSLIB from 'roslib';
import { getRotationFromQuaternion } from './utils';

const useRosConnection = (viewer, setAspectRatio, setRobotPose, setIsHovering) => {
    useEffect(() => {
        const ros = new ROSLIB.Ros({
            url: 'ws://localhost:9090'
        });

        ros.on('connection', () => console.log('Connected to ROS bridge.'));
        ros.on('error', (error) => console.error('Error connecting to ROS bridge:', error));
        ros.on('close', () => console.log('Connection to ROS bridge closed.'));

        const mapTopic = new ROSLIB.Topic({
            ros,
            name: '/map',
            messageType: 'nav_msgs/OccupancyGrid'
        });

        const amclPoseTopic = new ROSLIB.Topic({
            ros,
            name: '/amcl_pose',
            messageType: 'geometry_msgs/PoseWithCovarianceStamped'
        });

        mapTopic.subscribe((message) => {
            console.log('Received map data:', message);
            setAspectRatio(message.info.width / message.info.height);

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
                    //viewer.current.scene.update();
                });
            }

        });

        amclPoseTopic.subscribe((message) => {
            console.log('Received amcl pose data:', message);
            const pose = message.pose.pose;
            const newPosition = {
                x: pose.position.x,
                y: pose.position.y,
                rotation: getRotationFromQuaternion(pose.orientation),
            };
            setRobotPose(newPosition);
        });

        return () => {
            mapTopic.unsubscribe();
            amclPoseTopic.unsubscribe();
            ros.close();
        };
    }, [viewer, setAspectRatio, setRobotPose, setIsHovering]);
};

export default useRosConnection;
