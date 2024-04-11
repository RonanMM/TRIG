


// import React, { useEffect, useRef, useState } from 'react';
// import ROSLIB from 'roslib';

// const RosMapSubscriber = () => {
//     const viewer = useRef(null);
//     const mapViewer = useRef(null);
//     const [mapResolution, setMapResolution] = useState(null);
//     const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
//     const robotMarker = useRef(null);
//     const [isHovering, setIsHovering] = useState(false); 
//     const [aspectRatio, setAspectRatio] = useState(1);

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
//             setMapResolution(message.info.resolution);

//             const mapWidth = message.info.width;
//             const mapHeight = message.info.height;
//             const aspect = mapWidth / mapHeight;

//             if (window.ROS2D && !viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
//                     divID: 'mapView',
//                     width: 600,
//                     height: 600 / aspect,
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
//             setAspectRatio(aspect)
//         });

//         const mapViewElement = document.getElementById('mapView');

//         const handleZoom = (event) => {
//             if (!isHovering) return; 
//             event.preventDefault();
//             const zoomFactor = 1.01;
//             const direction = event.deltaY < 0 ? 1 : -1;
//             if (viewer.current) {
//                 viewer.current.scaleToDimensions(viewer.current.scene.scaleX * (direction > 0 ? zoomFactor : 1 / zoomFactor), viewer.current.scene.scaleY * (direction > 0 ? zoomFactor : 1 / zoomFactor));
//             }
//         };

//         mapViewElement.addEventListener('wheel', handleZoom);

//         let isPanning = false;
//         let startingPosition = { x: 0, y: 0 };

//         const startPan = (event) => {
//             if (!isHovering) return; 
//             isPanning = true;
//             startingPosition = { x: event.clientX, y: event.clientY };
//             event.preventDefault();
//         };

//         const pan = (event) => {
//             if (!isPanning || !viewer.current || !isHovering) return; 
//             const dx = event.clientX - startingPosition.x;
//             const dy = event.clientY - startingPosition.y;
//             viewer.current.scene.x += dx;
//             viewer.current.scene.y += dy;
//             viewer.current.scene.update();
//             startingPosition = { x: event.clientX, y: event.clientY };
//         };

//         const endPan = () => {
//             isPanning = false;
//         };


//         mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
//         mapViewElement.addEventListener('mouseleave', () => {
//             setIsHovering(false);
//             endPan(); 
//         });

//         mapViewElement.addEventListener('mousedown', startPan);
//         mapViewElement.addEventListener('mousemove', pan);
//         mapViewElement.addEventListener('mouseup', endPan);
//         mapViewElement.addEventListener('mouseleave', endPan);

//         amclPoseTopic.subscribe((message) => {
//             console.log('Received amcl pose data:', message);
//             const pose = message.pose.pose;
//             const newPosition = {
//                 x: pose.position.x, 
//                 y: pose.position.y, 
//                 rotation: getRotationfromQuaternion(pose.orientation),
//             };
//             console.log("New robot pose calculated:", newPosition);
//             setRobotPose(newPosition);
//             viewer.current.scene.update();
//         });

//         return () => {
//             mapViewElement.removeEventListener('wheel', handleZoom);
//             mapViewElement.removeEventListener('mouseenter', () => setIsHovering(false));
//             mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
//             mapViewElement.removeEventListener('mousedown', startPan);
//             mapViewElement.removeEventListener('mousemove', pan);
//             mapViewElement.removeEventListener('mouseup', endPan);
//             mapViewElement.removeEventListener('mouseleave', endPan);
//             mapTopic.unsubscribe();
//             amclPoseTopic.unsubscribe();
//             ros.close();
//         };
//     }, [isHovering]);

//     useEffect(() => {
//         if (viewer.current && window.ROS2D && robotPose) {
//             if (!robotMarker.current) {
//                 robotMarker.current = new window.ROS2D.NavigationArrow({
//                     size: 0.5,
//                     strokeSize: 0.05,
//                     fillColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.66),
//                     pulse: true,
//                 });
//                 viewer.current.scene.addChild(robotMarker.current);
//             }

//             robotMarker.current.x = robotPose.x;
//             robotMarker.current.y = -robotPose.y;
//             robotMarker.current.rotation = robotPose.rotation;
//         }
//     }, [robotPose]);

//     function getRotationfromQuaternion(q) {
//         const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
//         return 360 - (yaw * (180 / Math.PI));
//     }

//     return (
//         <div>
//             <h1>ROS Map Data</h1>
//             <div
//                 style={{
//                     width: 600,
//                     height:  600/aspectRatio,

//                     display: 'flex',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                     overflow: 'hidden',
//                 }}
//                 id="mapView"
//                 ref={mapViewer}
//             ></div>
//         </div>
//     );
// };

// export default RosMapSubscriber;

// import React, { useEffect, useRef, useState } from 'react';
// import ROSLIB from 'roslib';

// const RosMapSubscriber = () => {
//     const viewer = useRef(null);
//     const mapViewer = useRef(null); // Reference to the map container
//     const [mapResolution, setMapResolution] = useState(null);
//     const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
//     const robotMarker = useRef(null);
//     const [isHovering, setIsHovering] = useState(false); // State to track hover status

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
//             setMapResolution(message.info.resolution);

//             const mapWidth = message.info.width;
//             const mapHeight = message.info.height;
//             const aspectRatio = mapWidth / mapHeight;

//             if (window.ROS2D && !viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
//                     divID: 'mapView',
//                     width: 600,
//                     height: 600 / aspectRatio,
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

//         // CHANGED: Moved the event listener setup to a new useEffect to depend on mapViewer.current
//     }, []); // Dependencies removed to ensure this effect only runs once

//     // NEW useEffect for handling interaction setup
//     useEffect(() => {
//         if (!mapViewer.current) return; // Exit if the ref isn't set yet

//         const mapViewElement = mapViewer.current; // Use the ref directly

//         const handleZoom = (event) => {
//             if (!isHovering) return;
//             event.preventDefault();
//             const zoomFactor = 1.1;
//             const direction = event.deltaY < 0 ? 1 : -1;
//             if (viewer.current) {
//                 viewer.current.scaleToDimensions(viewer.current.scene.scaleX * (direction > 0 ? zoomFactor : 1 / zoomFactor), viewer.current.scene.scaleY * (direction > 0 ? zoomFactor : 1 / zoomFactor));
//             }
//         };

//         let isPanning = false;
//         let startingPosition = { x: 0, y: 0 };

//         const startPan = (event) => {
//             if (!isHovering) return;
//             isPanning = true;
//             startingPosition = { x: event.clientX, y: event.clientY };
//             event.preventDefault();
//         };

//         const pan = (event) => {
//             if (!isPanning || !viewer.current || !isHovering) return;
//             const dx = event.clientX - startingPosition.x;
//             const dy = event.clientY - startingPosition.y;
//             viewer.current.scene.x += dx;
//             viewer.current.scene.y += dy;
//             viewer.current.scene.update();
//             startingPosition = { x: event.clientX, y: event.clientY };
//         };

//         const endPan = () => {
//             isPanning = false;
//         };

//         // Setup interaction event listeners
//         mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
//         mapViewElement.addEventListener('mouseleave', () => {
//             setIsHovering(false);
//             endPan();
//         });

//         mapViewElement.addEventListener('mousedown', startPan);
//         mapViewElement.addEventListener('mousemove', pan);
//         mapViewElement.addEventListener('mouseup', endPan);
//         mapViewElement.addEventListener('mouseleave', endPan);

//         return () => {
//             // Cleanup interaction event listeners
//             mapViewElement.removeEventListener('wheel', handleZoom);
//             mapViewElement.removeEventListener('mouseenter', () => setIsHovering(true));
//             mapViewElement.removeEventListener('mouseleave', () => setIsHovering(false));
//             mapViewElement.removeEventListener('mousedown', startPan);
//             mapViewElement.removeEventListener('mousemove', pan);
//             mapViewElement.removeEventListener('mouseup', endPan);
//             mapViewElement.removeEventListener('mouseleave', endPan);
//         };
//     }, [mapViewer.current]); // This effect depends on mapViewer.current being set

//     useEffect(() => {
//         // Robot marker update logic remains the same
//     }, [robotPose]);

//     function getRotationfromQuaternion(q) {
//         // Quaternion to rotation conversion logic remains the same
//     }

//     return (
//         <div>
//             <h1>ROS Map Data</h1>
//             <div
//                 style={{
//                     display: 'flex',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                     overflow: 'hidden',
//                 }}
//                 id="mapView"
//                 ref={mapViewer} // Use this ref for attaching event listeners
//             ></div>
//         </div>
//     );
// };

// export default RosMapSubscriber;




// import React, { useEffect, useRef, useState } from 'react';
// import ROSLIB from 'roslib';

// const RosMapSubscriber = () => {
//     const viewer = useRef(null);
//     const mapViewer = useRef(null);
//     const [mapResolution, setMapResolution] = useState(null);
//     const [robotPose, setRobotPose] = useState({ x: 0, y: 0, rotation: 0 });
//     const robotMarker = useRef(null);
//     const [isHovering, setIsHovering] = useState(false);

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
//             setMapResolution(message.info.resolution);

//             const mapWidth = message.info.width;
//             const mapHeight = message.info.height;
//             const aspecRatio = mapWidth / mapHeight;


//             if (window.ROS2D && !viewer.current) {
//                 viewer.current = new window.ROS2D.Viewer({
//                     divID: 'mapView', // Ensure this ID matches the div below
//                     width: 600,
//                     height:600/aspecRatio,
//                 });

//                 // This initialization ensures the map is displayed
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

//         const mapViewElement = document.getElementById('mapView');


//         const handleZoom = (event) => {
//             if (!isHovering) return;
//             event.preventDefault();
//             const zoomFactor = 1.1;
//             const direction = event.deltaY < 0 ? 1 : -1;
//             if (viewer.current) {
//                 viewer.current.scaleToDimensions(viewer.current.scene.scaleX * (direction > 0 ? zoomFactor : 1 / zoomFactor), viewer.current.scene.scaleY * (direction > 0 ? zoomFactor : 1 / zoomFactor));
//             }
//         };

//         mapViewElement.addEventListener('wheel', handleZoom);

//         let isPanning = false;
//         let startingPosition = { x: 0, y: 0 };

//         const startPan = (event) => {
//             if (!isHovering) return;
//             isPanning = true;

//             if (isPanning && viewer.current) {
//                 const dx = event.clientX - startingPosition.x;
//                 const dy = event.clientY - startingPosition.y;
//                 viewer.current.scene.x += dx;
//                 viewer.current.scene.y += dy;
//                 viewer.current.scene.update();
//                 startingPosition = { x: event.clientX, y: event.clientY };
//             }
//         };

//         const endPan = () => {
//             isPanning = false;
//         };

//         mapViewElement.addEventListener('mouseenter', () => setIsHovering(true));
//         mapViewElement.addEventListener('mouseleave', () => {
//             setIsHovering(false); 
//             endPan();
//             console.log('Mouse left the map area');
//         });



//         mapViewElement.addEventListener('mousedown', startPan);
//         mapViewElement.addEventListener('mousemove', pan);
//         mapViewElement.addEventListener('mouseup', endPan);
//         mapViewElement.addEventListener('mouseleave', endPan);






//         amclPoseTopic.subscribe((message) => {
//             console.log('Received amcl pose data:', message);
//             const pose = message.pose.pose;
//             const newPosition = {
//                 x: (pose.position.x), // Adjusted to include map offset
//                 y: (pose.position.y), // Adjusted to include map offset
//                 rotation: getRotationfromQuaternion(pose.orientation),
//             };
//             console.log("New robot pose calculated:", newPosition);
//             setRobotPose(newPosition);
//             viewer.current.scene.update();
//         });

//         return () => {
//             mapViewElement.removeEventListener('wheel', handleZoom);
//             mapViewElement.removeEventListener('mousedown', startPan);
//             mapViewElement.removeEventListener('mousemove', pan);
//             mapViewElement.removeEventListener('mouseup', endPan);
//             mapViewElement.removeEventListener('mouseleave', endPan);
//             mapTopic.unsubscribe();
//             amclPoseTopic.unsubscribe();
//             ros.close();
//         };
//     }, []); // Removed [mapResolution] to ensure it's not causing re-subscriptions

//     useEffect(() => {
//         if (viewer.current && window.ROS2D && robotPose) {
//             if (!robotMarker.current) {
//                 robotMarker.current = new window.ROS2D.NavigationArrow({
//                     size: 0.5, // Adjust size for better visibility
//                     strokeSize: 0.05,
//                     fillColor: window.createjs.Graphics.getRGB(255, 0, 0, 0.66),
//                     pulse: true,
//                 });
//                 viewer.current.scene.addChild(robotMarker.current);
//             }

//             // Update the marker's position and rotation
//             robotMarker.current.x = robotPose.x;
//             robotMarker.current.y = -robotPose.y;
//             robotMarker.current.rotation = robotPose.rotation;

//             // viewer.current.scene.update(); // Updated to draw() based on library version
//         }
//     }, [robotPose]);


//     function getRotationfromQuaternion(q) {
//         const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
        
//         return 360-(yaw * (180 / Math.PI));
//     }

//     return (
//         <div>
//             <h1>ROS Map Data</h1>
//             <div
//                 style={{
//                     display: 'flex',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                     overflow: 'hidden',
//                 }}
//                 id="mapView"
//                 ref={mapViewer}
//             ></div>
//         </div>
//     );
// };

// export default RosMapSubscriber;