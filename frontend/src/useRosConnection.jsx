

// import { useEffect } from 'react';
// import ROSLIB from 'roslib';
// import { getRotationFromQuaternion } from './utils';

// const useRosConnection = (viewer, setAspectRatio, setRobotPose) => {
//     useEffect(() => {
//         const ros = new ROSLIB.Ros({
//             url: 'ws://localhost:9090'
//         });

//         ros.on('connection', () => console.log('Connected to ROS bridge.'));
//         ros.on('error', (error) => console.error('Error connecting to ROS bridge:', error));
//         ros.on('close', () => console.log('Connection to ROS bridge closed.'));

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
//             setAspectRatio(message.info.width / message.info.height);

//             if (window.ROS2D && !viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
//                     divID: 'mapView',
//                     width: 600,
//                     height: 600 / (message.info.width / message.info.height),
//                 });
//                 console.log("Viewer initialized", viewer.current);

//                 const gridClient = new window.ROS2D.OccupancyGridClient({
//                     ros: ros,
//                     rootObject: viewer.current.scene,
//                     continuous: true,
//                 });

//                 gridClient.on('change', () => {
//                     console.log("Grid client received new data");
//                     viewer.current.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//                     viewer.current.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
//                     //viewer.current.scene.update();
//                 });
//             }

//         });

//         amclPoseTopic.subscribe((message) => {
//             console.log('Received amcl pose data:', message);
//             const pose = message.pose.pose;
//             const newPosition = {
//                 x: pose.position.x,
//                 y: pose.position.y,
//                 rotation: getRotationFromQuaternion(pose.orientation),
//             };
//             setRobotPose(newPosition);
//         });


//         return () => {
//             mapTopic.unsubscribe();
//             amclPoseTopic.unsubscribe();
//             ros.close();
//         };
//     }, [viewer, setAspectRatio, setRobotPose]);
// };

// export default useRosConnection;

// import { useEffect, useRef } from 'react';
// import ROSLIB from 'roslib';
// import { getRotationFromQuaternion } from './utils';

// const useRosConnection = (viewer, setAspectRatio, setRobotPose, setIsHovering) => {
//     const gridClient = useRef(null);

//     useEffect(() => {
//         const ros = new ROSLIB.Ros({
//             url: 'ws://localhost:9090'
//         });

//         ros.on('connection', () => console.log('Connected to ROS bridge.'));
//         ros.on('error', (error) => console.error('Error connecting to ROS bridge:', error));
//         ros.on('close', () => console.log('Connection to ROS bridge closed.'));

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
//             if (!message.info || !message.info.origin || !message.info.origin.position) {
//                 console.error("Map data is missing 'info.origin.position' required for grid client initialization.");
//                 console.log("Detailed Info Object:", message.info); // Add this to log the info object
//                 return;
//             }

//             setAspectRatio(message.info.width / message.info.height);

//             if (!viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
//                     divID: 'mapView',
//                     width: 600,
//                     height: 600 / (message.info.width / message.info.height),
//                 });
//             }
//             // Ensure map message includes required pose information
//             if (!message.info || !message.info.origin || !message.info.origin.position) {
//                 console.error("Map data is missing 'info.origin.position' required for grid client initialization.");
//                 return; // Stop further processing if critical info is missing
//             }

//             // Remove existing GridClient from the scene if it exists
//             if (gridClient.current && viewer.current && viewer.current.scene) {
//                 viewer.current.scene.removeChild(gridClient.current.rootObject);
//             }

//             // Reinitialize the GridClient
//             // Initialize or reinitialize the GridClient
//             gridClient.current = new window.ROS2D.OccupancyGridClient({
//                 ros: ros,
//                 rootObject: viewer.current.scene,
//                 continuous: true,
//                 topic: '/map',
//                 tfClient: new window.ROSLIB.TFClient({ros: ros, fixedFrame: '/map', angularThres: 0.01, transThres: 0.01}),
//             });


//             gridClient.current.on('change', () => {
//                 console.log("Grid client received new data");
//                 viewer.current.scaleToDimensions(gridClient.current.currentGrid.width, gridClient.current.currentGrid.height);
//                 viewer.current.shift(gridClient.current.currentGrid.pose.position.x, gridClient.current.currentGrid.pose.position.y);
//             });
//         });

//         amclPoseTopic.subscribe((message) => {
//             console.log('Received amcl pose data:', message);
//             const pose = message.pose.pose;
//             const newPosition = {
//                 x: pose.position.x,
//                 y: pose.position.y,
//                 rotation: getRotationFromQuaternion(pose.orientation),
//             };
//             setRobotPose(newPosition);
//         });

//         return () => {
//             mapTopic.unsubscribe();
//             amclPoseTopic.unsubscribe();
//             if (gridClient.current && viewer.current && viewer.current.scene) {
//                 viewer.current.scene.removeChild(gridClient.current.rootObject);
//             }
//             ros.close();
//         };
//     }, [viewer, setAspectRatio, setRobotPose, setIsHovering]);

//     return null; // Since this is a hook, no JSX is returned.
// };

// export default useRosConnection;



// import { useEffect } from 'react';
// import ROSLIB from 'roslib';
// import { getRotationFromQuaternion } from './utils';

// const useRosConnection = (viewer, setAspectRatio, setRobotPose) => {
//     const ros = new ROSLIB.Ros({
//         url: 'ws://localhost:9090'
//     });

//     useEffect(() => {
//         ros.on('connection', () => console.log('Connected to ROS bridge.'));
//         ros.on('error', (error) => console.error('Error connecting to ROS bridge:', error));
//         ros.on('close', () => console.log('Connection to ROS bridge closed.'));

//         const mapTopic = new ROSLIB.Topic({
//             ros,
//             name: '/map',
//             messageType: 'nav_msgs/OccupancyGrid'
//         });

//         mapTopic.subscribe((message) => {
//             console.log('Received map data:', message);
//             setAspectRatio(message.info.width / message.info.height);

//             if (window.ROS2D && !viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
//                     divID: 'mapView',
//                     width: 600,
//                     height: 600 / (message.info.width / message.info.height),
//                 });
//                 console.log("Viewer initialized", viewer.current);

//                 const gridClient = new window.ROS2D.OccupancyGridClient({
//                     ros: ros,
//                     rootObject: viewer.current.scene,
//                     continuous: true,
//                 });

//                 gridClient.on('change', () => {
//                     console.log("Grid client received new data");
//                     viewer.current.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//                     viewer.current.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
//                 });
//             }
//         });

//         return () => {
//             mapTopic.unsubscribe();
//             ros.close();
//         };
//     }, [viewer, setAspectRatio]); 

//     useEffect(() => {
//         const amclPoseTopic = new ROSLIB.Topic({
//             ros,
//             name: '/amcl_pose',
//             messageType: 'geometry_msgs/PoseWithCovarianceStamped'
//         });

//         amclPoseTopic.subscribe((message) => {
//             console.log('Received amcl pose data:', message);
//             const pose = message.pose.pose;
//             const newPosition = {
//                 x: pose.position.x,
//                 y: pose.position.y,
//                 rotation: getRotationFromQuaternion(pose.orientation),
//             };
//             setRobotPose(newPosition);
//         });

//         return () => {
//             amclPoseTopic.unsubscribe();
//         };
//     }, [setRobotPose]); // Dependencies related only to robot pose updates

//     return null; // Since this is a hook, no JSX is returned.
// };

// export default useRosConnection;

import { useEffect, useRef } from 'react';
import ROSLIB from 'roslib';
import { getRotationFromQuaternion } from './utils';

const useRosConnection = (viewer, setAspectRatio, setRobotPose, setIsHovering) => {
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

    useEffect(() => {
        const mapTopic = new ROSLIB.Topic({
            ros,
            name: '/map',
            messageType: 'nav_msgs/OccupancyGrid'
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
                });
            }

        });
    
        return () => {
            mapTopic.unsubscribe();
            console.log("Unsubscribed from map topic");
        };
    }, [ros, viewer, setAspectRatio]); // Added setAspectRatio to dependencies to ensure re-subscription if it changes
    
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

                // const poseCallback = (message) => {
        //     console.log('Received AMCL pose data:', message);
        //     const pose = message.pose.pose;
        //     const newPosition = {
        //         x: pose.position.x,
        //         y: pose.position.y,
        //         rotation: getRotationFromQuaternion(pose.orientation),
        //     };
        //     console.log('Updating robot pose:', newPosition);
        //     setRobotPose(newPosition);
        // };
    
        // amclPoseTopic.subscribe(poseCallback);

        
        
    
        return () => {
            console.log('Unsubscribing from AMCL pose data.');
            amclPoseTopic.unsubscribe();
        };
    }, [ros, viewer, setRobotPose]); // Include dependencies properly
    
    return null; // Since this is a hook, no JSX is returned.
};

export default useRosConnection;
