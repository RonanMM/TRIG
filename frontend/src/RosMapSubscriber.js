

import React, { useEffect, useRef, useState } from 'react';
import ROSLIB from 'roslib';

const RosMapSubscriber = () => {
    const viewer = useRef(null);
    const mapViewer = useRef(null);
    const [mapResolution, setMapResolution] = useState(null);
    const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
    const robotMarker = useRef(null);

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
            setMapResolution(message.info.resolution);

            const mapWidth = message.info.width;
            const mapHeight = message.info.height;
            const aspecRatio = mapWidth / mapHeight;


            if (window.ROS2D && !viewer.current) {
                viewer.current = new window.ROS2D.Viewer({
                    divID: 'mapView', // Ensure this ID matches the div below
                    width: 600,
                    height:600/aspecRatio,
                });

                // This initialization ensures the map is displayed
                const gridClient = new window.ROS2D.OccupancyGridClient({
                    ros: ros,
                    rootObject: viewer.current.scene,
                    continuous: true,
                });

                gridClient.on('change', () => {
                    viewer.current.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
                    viewer.current.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);

                });

            }
        });

        amclPoseTopic.subscribe((message) => {
            console.log('Received amcl pose data:', message);
            const pose = message.pose.pose;
            const newPosition = {
                x: (pose.position.x), // Adjusted to include map offset
                y: (pose.position.y), // Adjusted to include map offset
                rotation: getRotationfromQuaternion(pose.orientation),
            };
            console.log("New robot pose calculated:", newPosition);
            setRobotPose(newPosition);
            viewer.current.scene.update();
        });

        return () => {
            mapTopic.unsubscribe();
            amclPoseTopic.unsubscribe();
            ros.close();
        };
    }, []); // Removed [mapResolution] to ensure it's not causing re-subscriptions

    useEffect(() => {
        if (viewer.current && window.ROS2D && robotPose) {
            if (!robotMarker.current) {
                robotMarker.current = new window.ROS2D.NavigationArrow({
                    size: 1, // Adjust size for better visibility
                    strokeSize: 0.1,
                    fillColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.66),
                    pulse: true,
                });
                viewer.current.scene.addChild(robotMarker.current);
            }

            // Update the marker's position and rotation
            robotMarker.current.x = robotPose.x;
            robotMarker.current.y = -robotPose.y;
            robotMarker.current.rotation = robotPose.rotation;

            // viewer.current.scene.update(); // Updated to draw() based on library version
        }
    }, [robotPose]);


    function getRotationfromQuaternion(q) {
        const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
        
        return 360-(yaw * (180 / Math.PI));
    }

    return (
        <div>
            <h1>ROS Map Data</h1>
            <div id="mapView" ref={mapViewer} style={{ width: 'auto', height: 'auto', color: 'black' }}></div>
        </div>
    );
};

export default RosMapSubscriber;


// import React, { useEffect, useRef, useState } from 'react';
// import ROSLIB from 'roslib';

// const RosMapSubscriber = () => {
//     const viewer = useRef(null);
//     const mapViewer = useRef(null);
//     const [mapResolution, setMapResolution] = useState(null);
//     const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 })
//     const robotMarker = useRef(null);

//     useEffect(() => {
//         const ros = new ROSLIB.Ros({
//             url: 'ws://localhost:9090'
//         });

//         ros.on('connection', () => {
//             console.log('Connected to ROS bridge.');
//         });

//         ros.on('error', (error) => {
//             console.error('Error connecting to ROS bridge:', error);
//         });

//         ros.on('close', () => {
//             console.log('Connection to ROS bridge closed.');
//         });

//         const mapTopic = new ROSLIB.Topic({
//             ros,
//             name: '/map',
//             messageType: 'nav_msgs/OccupancyGrid'
//         });

//         const amclPoseTopic = new ROSLIB.Topic({
//             ros,
//             name: '/amcl_pose',
//             messageType: 'geometry_msgs/PoseWithCovarianceStamped'
//         });

//         mapTopic.subscribe((message) => {
//             console.log('Received map data:', message);
//             setMapResolution(message.info.resolution);

//             if (window.ROS2D && !viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
                    
//                     divID: mapViewer.current.id,
//                     width: 1000,
//                     height: 800,
//                 });

//                 const gridClient = new window.ROS2D.OccupancyGridClient({
//                     ros: ros,
//                     rootObject: viewer.current.scene,
//                     continuous: true,
//                 });
            
//                 gridClient.on('change', () => {
//                     viewer.current.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//                     viewer.current.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
//                 });
//             }
//         });

//         amclPoseTopic.subscribe((message) => {
//             console.log('Received amcl pose data:', message);
//             if (mapResolution) {
//                 const pose = message.pose.pose;
//                 const newPosition = {
//                     x: pose.position.x * mapResolution,
//                     y: -pose.position.y * mapResolution,
//                     rotation: getRotationfromQuaternion(pose.orientation),
//                 };
//                 console.log("New robot pose calculated:", newPosition);
//                 setRobotPose(newPosition);
//             }
//         });

//         return () => {
//             mapTopic.unsubscribe();
//             amclPoseTopic.unsubscribe();
//             ros.close();
//         };
//     }, [mapResolution]); // Depend on mapResolution to ensure it's set before calculating poses

//     useEffect(() => {
//         if (viewer.current && window.ROS2D && robotPose) {
//             if (!robotMarker.current) {
//                 robotMarker.current = new window.ROS2D.NavigationArrow({
//                     size: 10, // Adjust size for better visibility
//                     strokeSize: 0.5,
//                     fillColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.66),
//                     pulse: true,
//                 });
//                 viewer.current.scene.addChild(robotMarker.current);
//             }

//             robotMarker.current.x = robotPose.x * mapResolution;
//             robotMarker.current.y = robotPose.y * mapResolution;
//             robotMarker.current.rotation = robotPose.rotation;

//             viewer.current.scene.update();
//         }
//     }, [robotPose]); // Re-run when robotPose updates

//     function getRotationfromQuaternion(q) {
//         const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
//         return yaw * (180 / Math.PI);
//     }

//     return (
//         <div>
//             <h1>ROS Map Data</h1>
//             <div id="mapView" ref={mapViewer} style={{ width: '1000px', height: '800px', border: '2px solid black' }}></div>
//         </div>
//     );
// };

// export default RosMapSubscriber;border: '2px solid black'