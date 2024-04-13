

import { useEffect } from 'react';
// import ROSLIB from 'roslib';
import { getRotationFromQuaternion } from './utils';

const useRosTopics = (ros, viewer, setMapData, setRobotPose, setIsHovering, setGoalPublisher, setPath) => {
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
    const mapTopic = new window.ROSLIB.Topic({
      ros,
      name: '/map',
      messageType: 'nav_msgs/OccupancyGrid'
    });

    const pathTopic = new window.ROSLIB.Topic({
      ros,
      name: '/move_base/GlobalPlanner/plan',
      messageType: 'nav_msgs/Path'
    });

    mapTopic.subscribe((message) => {
      console.log('Received map data:', message);
      setMapData({
        aspectRatio: message.info.width / message.info.height,
        resolution: message.info.resolution,
        origin: {
          x: message.info.origin.position.x,
          y: message.info.origin.position.y,
        },
      });

      if (window.ROS2D && !viewer.current) {
        viewer.current = new window.ROS2D.Viewer({
          divID: 'mapView',
          width: 800,
          height: 800 / (message.info.width / message.info.height),
        });

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

    pathTopic.subscribe((message) => {
      if (!message || !message.pose) {
          console.error("Received undefined or incorrect path data:", message);
          setPath(message);
          return;
      }
      console.log("Received valid path data:", message);
      setPath(message);
  });

    return () => {
      mapTopic.unsubscribe();
      pathTopic.unsubscribe();
      console.log("Unsubscribed from map and path topics");
    };
  }, [viewer, setMapData, ros, setPath]);


  useEffect(() => {
    let lastUpdateTime = Date.now();
    let activeTopic = null;

    const amclPoseTopic = new window.ROSLIB.Topic({
        ros: ros,
        name: '/amcl_pose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
    });

    const robotPoseTopic = new window.ROSLIB.Topic({
        ros: ros,
        name: '/robot_pose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
    });

    const handlePoseMessage = (topic) => (message) => {
        if (!message.pose || !message.pose.pose) return; 

        if (!activeTopic) {

            activeTopic = topic;
            console.log(`Active topic set to ${topic}`);
        }

        if (activeTopic !== topic) return; 

        const now = Date.now();

        
        if (topic === '/robot_pose' && (now - lastUpdateTime < 700)) {  
          console.log('Update from robot_pose skipped due to throttle');
          return;
      }

        lastUpdateTime = now;
        requestAnimationFrame(() => {
            const { position, orientation } = message.pose.pose;
            const rotation = getRotationFromQuaternion(orientation);
            setRobotPose({
                x: position.x,
                y: position.y,
                rotation: rotation
            });
            console.log(`Pose updated from ${topic}:`, message);
        });
    };


    amclPoseTopic.subscribe(handlePoseMessage('/amcl_pose'));
    robotPoseTopic.subscribe(handlePoseMessage('/robot_pose'));

    return () => {

        amclPoseTopic.unsubscribe();
        robotPoseTopic.unsubscribe();
        console.log('Unsubscribed from both pose topics.');
    };

}, [ros, setRobotPose]);

  


  useEffect(() => {
    const goalPublisher = new window.ROSLIB.Topic({
      ros,
      name: '/move_base_simple/goal',
      messageType: 'geometry_msgs/PoseStamped'
    });
    setGoalPublisher(goalPublisher);

    return () => {
      goalPublisher.unadvertise();
    };
  }, [setGoalPublisher, ros]);
};

export default useRosTopics;
