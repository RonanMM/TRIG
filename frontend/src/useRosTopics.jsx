

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
    const amclPoseTopic = new window.ROSLIB.Topic({
      ros,
      name: '/amcl_pose',
      messageType: 'geometry_msgs/PoseWithCovarianceStamped'
    });

    amclPoseTopic.subscribe((message) => {
      console.log('Received AMCL pose data:', message);
      const pose = message.pose.pose;
      setRobotPose({
        x: pose.position.x,
        y: pose.position.y,
        rotation: getRotationFromQuaternion(pose.orientation),
      });
    });

    return () => {
      amclPoseTopic.unsubscribe();
      console.log('Unsubscribing from AMCL pose data.');
    };
  }, [setRobotPose, ros]);

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
